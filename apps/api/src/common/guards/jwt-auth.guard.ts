// apps/api/src/common/guards/jwt-auth.guard.ts
// JWT token doğrulama guard'ı.
// HttpOnly cookie'den token'ı okur ve doğrular.
// @UseGuards(JwtAuthGuard) ile korunan endpoint'lerde kullanılır.

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Passport JWT stratejisini çalıştır
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Token geçersiz veya eksikse hata fırlat
    if (err || !user) {
      throw err || new UnauthorizedException('Oturum açmanız gerekiyor. Lütfen giriş yapın.');
    }
    return user;
  }
}
