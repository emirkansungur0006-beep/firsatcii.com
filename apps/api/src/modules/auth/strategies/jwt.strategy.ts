// apps/api/src/modules/auth/strategies/jwt.strategy.ts
// Passport JWT stratejisi.
// HttpOnly cookie'den access token'ı okur ve doğrular.
// Geçerli token → kullanıcıyı veritabanından çek → request'e ekle.

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

// JWT payload yapısı (token içindeki veri)
export interface JwtPayload {
  sub: string;   // Kullanıcı UUID'si
  email: string;
  role: string;
  iat?: number;  // Oluşturulma zamanı
  exp?: number;  // Son kullanma zamanı
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // Token'ı HttpOnly cookie'den oku (LocalStorage'dan değil!)
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Cookie adı: 'access_token'
          return request?.cookies?.['access_token'] || null;
        },
      ]),
      ignoreExpiration: false, // Süresi dolmuş token'ları reddet
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // Token geçerliyse bu metod çağrılır
  // Döndürülen değer request.user'a eklenir
  async validate(payload: JwtPayload) {
    // Kullanıcıyı veritabanından taze olarak çek
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isSuspended: true,
        leaderScore: true,
        completedJobs: true,
        profilePicture: true,
        permissions: true,
      },
    });

    if (user) {
      try {
        (user as any).subscription = await (this.prisma as any).userSubscription.findUnique({
          where: { userId: user.id },
          include: { plan: true }
        });
      } catch (e) {
        (user as any).subscription = null;
      }
    }

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.');
    }

    if (user.isSuspended) {
      throw new UnauthorizedException('Hesabınız askıya alınmıştır.');
    }

    return user;
  }
}
