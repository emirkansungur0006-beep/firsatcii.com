// apps/api/src/modules/auth/auth.controller.ts
// Kimlik doğrulama HTTP endpoint'leri.
// POST /api/v1/auth/register  → Kayıt
// POST /api/v1/auth/login     → Giriş
// POST /api/v1/auth/refresh   → Token yenile
// POST /api/v1/auth/logout    → Çıkış
// GET  /api/v1/auth/me        → Mevcut kullanıcı bilgisi

import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // --- KAYIT ---
  // Rate limit: 5 dakikada 5 istek (brute force koruması)
  @Throttle({ default: { ttl: 300000, limit: 5 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // --- OTP GÖNDER ---
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body('phone') phone: string, @Body('email') email?: string) {
    return this.authService.sendOtp(phone, email);
  }

  // --- GİRİŞ ---
  // Rate limit: 5 dakikada 10 istek
  @Throttle({ default: { ttl: 300000, limit: 10 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, res);
  }

  // --- TOKEN YENİLE ---
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Refresh token HttpOnly cookie'den okunur
    const refreshToken = req.cookies?.['refresh_token'];
    return this.authService.refreshTokens(refreshToken, res);
  }

  // --- ÇIKIŞ ---
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    return this.authService.logout(userId, refreshToken, res);
  }

  // --- MEVCUt KULLANICI BİLGİSİ ---
  // Frontend'in oturum durumunu kontrol etmek için kullanır
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return { user };
  }
}
