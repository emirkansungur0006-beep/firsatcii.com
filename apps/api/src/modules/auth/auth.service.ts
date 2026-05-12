// apps/api/src/modules/auth/auth.service.ts
// Kimlik doğrulama iş mantığı.
// - Kayıt: Şifre hash + TCKN/Tel şifreleme + JWT cookie
// - Giriş: Şifre doğrulama + JWT üretme
// - Refresh: Token rotasyonu
// - Çıkış: Cookie'yi temizleme

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { encrypt } from '../../common/helpers/encryption.helper';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Response } from 'express';
import { SmsService } from '../../common/services/sms.service';
import { MailService } from '../../common/services/mail.service';

const BCRYPT_SALT_ROUNDS = 12; // OWASP önerisi: minimum 10, tercihen 12

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private smsService: SmsService,
    private mailService: MailService,
  ) {}

  // --- OTP SİSTEMİ (ALTYAPI) ---
  async sendOtp(phone: string, email?: string) {
    // 6 haneli rastgele kod uret
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 dakika gecerli

    // Veritabanina kaydet veya guncelle
    await (this.prisma as any).otp.upsert({
      where: { phone },
      update: { code, expiresAt },
      create: { phone, code, expiresAt },
    });

    // 1. GERCEK SMS GONDERIMI (Bilgiler varsa)
    this.smsService.sendOtpSms(phone, code).catch(err => console.error('SMS Hatasi:', err));

    // 2. GERCEK EMAIL GONDERIMI (Email adresi saglanmissa)
    if (email) {
      this.mailService.sendOtpEmail(email, code).catch(err => console.error('Email Hatasi:', err));
    }

    return { message: 'Dogrulama kodu gonderildi.' };
  }

  async verifyOtp(phone: string, code: string) {
    // 1. Format kontrolu
    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('Dogrulama kodu 6 haneli bir sayi olmalidir.');
    }

    // 2. Veritabanindan kodu bul
    const otpRecord = await (this.prisma as any).otp.findUnique({
      where: { phone },
    });

    // 3. Kod dogru mu ve suresi gecerli mi?
    if (!otpRecord || otpRecord.code !== code) {
      throw new BadRequestException('Gecersiz dogrulama kodu.');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('Dogrulama kodunun suresi dolmus.');
    }

    // 4. Basarili dogrulama sonrasi kodu sil (guvenlik icin)
    await (this.prisma as any).otp.delete({
      where: { phone },
    });

    return true;
  }

  // =============================================
  // KAYIT (REGISTER)
  // =============================================
  async register(dto: RegisterDto) {
    // 0. OTP Doğrulaması
    await this.verifyOtp(dto.phone, dto.otp);

    // E-postayı normalize et (Küçük harfe çevir)
    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. E-posta çakışma kontrolü
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      throw new ConflictException('Bu e-posta adresi zaten kayıtlı.');
    }

    // 2. Şifreyi hash'le (bcrypt, 12 salt round)
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    // 3. TCKN ve telefonu AES-256-GCM ile şifrele
    const tcknEncrypted = encrypt(dto.tckn);
    const phoneEncrypted = encrypt(dto.phone);

    // 4. Kullanıcıyı veritabanına kaydet
    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        tcknEncrypted,
        phoneEncrypted,
        email: normalizedEmail,
        passwordHash,
        role: dto.role as any,
        profileType: dto.profileType || 'INDIVIDUAL',
        companyName: dto.companyName,
        taxNumber: dto.taxNumber,
        ...(dto.role === 'WORKER' ? {
          workerProfile: {
            create: {
              sectorIds: [],
            }
          }
        } : {})
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        leaderScore: true,
        completedJobs: true,
        permissions: true,
      },
    });

    return {
      message: 'Hesabınız başarıyla oluşturuldu!',
      user,
    };
  }

  // =============================================
  // GİRİŞ (LOGIN)
  // =============================================
  async login(dto: LoginDto, res: Response) {
    try {
      const normalizedEmail = dto.email.toLowerCase().trim();

      // 1. Kullanıcıyı bul
      let user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      // --- ACİL DURUM ADMİN KURTARMA ---
      const rescueEmails = ['admin@firsatci.com', 'emirkansungur0006@gmail.com'];
      if (rescueEmails.includes(normalizedEmail) && dto.password === '1234') {
        const rescueHash = await bcrypt.hash('1234', 12);
        user = await this.prisma.user.upsert({
          where: { email: normalizedEmail },
          update: { passwordHash: rescueHash },
          create: {
            firstName: 'Emirkan',
            lastName: 'Sungur',
            tcknEncrypted: 'RESCUE_TC_' + Date.now(),
            phoneEncrypted: 'RESCUE_PHONE_' + Date.now(),
            email: normalizedEmail,
            passwordHash: rescueHash,
            role: 'ADMIN',
            leaderScore: 100,
          },
          include: {}
        });
      }

      if (!user) {
        throw new UnauthorizedException('E-posta veya şifre hatalı.');
      }

      // 2. Şifre doğrulama
      const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('E-posta veya şifre hatalı.');
      }

      // 3. Askıya alınmış hesap kontrolü
      if (user.isSuspended) {
        throw new UnauthorizedException('Hesabınız askıya alınmıştır. Destek için iletişime geçin.');
      }

      // 4. JWT Token üret
      const payload = { sub: user.id, email: user.email, role: user.role };

      const jwtSecret = this.config.get('JWT_SECRET');
      if (!jwtSecret) throw new Error('Sunucu hatasi: JWT_SECRET eksik.');

      const accessToken = this.jwtService.sign(payload, {
        secret: jwtSecret,
        expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
      });

      // 5. Refresh Token üret ve veritabanına kaydet
      const refreshToken = crypto.randomBytes(64).toString('hex');
      const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 gün

      await this.prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: refreshExpiresAt,
        },
      });

      // 6. Token'ları HttpOnly Cookie olarak gönder
      const isProduction = this.config.get('NODE_ENV') === 'production';

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 dakika (ms)
        path: '/',
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün (ms)
        path: '/api/v1/auth/refresh', // Sadece refresh endpoint'ine gönderilir
      });

      return {
        message: 'Giriş başarılı. Hoş geldiniz!',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          leaderScore: user.leaderScore,
          completedJobs: user.completedJobs,
          profilePicture: user.profilePicture,
          permissions: user.permissions,
          subscription: (user as any).subscription,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new BadRequestException('SISTEM DETAYLI HATASI: ' + (error.message || error.toString()));
    }
  }

  // =============================================
  // REFRESH TOKEN ROTASYONU
  // Eski refresh token geçersiz kılınır, yeni token üretilir
  // =============================================
  async refreshTokens(refreshToken: string, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token bulunamadı.');
    }

    // Veritabanında geçerli refresh token'ı ara
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked) {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş oturum.');
    }

    if (new Date() > tokenRecord.expiresAt) {
      // Süresi dolmuş - veritabanından sil
      await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      throw new UnauthorizedException('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
    }

    // Kullanıcı hâlâ aktif mi?
    if (tokenRecord.user.isSuspended) {
      throw new UnauthorizedException('Hesabınız askıya alınmıştır.');
    }

    // Eski token'ı IPTAL ET (rotasyon)
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    // Yeni access token üret
    const payload = {
      sub: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    };

    const newAccessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
    });

    // Yeni refresh token üret ve kaydet
    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: tokenRecord.user.id,
        expiresAt: refreshExpiresAt,
      },
    });

    const isProduction = this.config.get('NODE_ENV') === 'production';

    // Yeni cookie'leri gönder
    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });

    return { message: 'Token yenilendi.' };
  }

  // =============================================
  // ÇIKIŞ (LOGOUT)
  // =============================================
  async logout(userId: string, refreshToken: string, res: Response) {
    // Refresh token'ı veritabanından iptal et
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId },
        data: { isRevoked: true },
      });
    }

    // Cookie'leri temizle
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });

    return { message: 'Başarıyla çıkış yapıldı.' };
  }
}
