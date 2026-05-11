// apps/api/src/modules/auth/dto/login.dto.ts
// Giriş endpoint'i için doğrulama DTO'su.

import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin.' })
  email: string;

  @IsString({ message: 'Şifre zorunludur.' })
  @MinLength(1, { message: 'Şifre boş olamaz.' })
  password: string;
}
