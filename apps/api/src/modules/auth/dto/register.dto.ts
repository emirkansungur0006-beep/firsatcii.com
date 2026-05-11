// apps/api/src/modules/auth/dto/register.dto.ts
// Kayıt endpoint'i için giriş doğrulama DTO'su.
// class-validator ile tüm alanlar sunucu tarafında doğrulanır.

import {
  IsEmail,
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Ad zorunludur.' })
  @MinLength(2, { message: 'Ad en az 2 karakter olmalıdır.' })
  @MaxLength(50, { message: 'Ad en fazla 50 karakter olabilir.' })
  firstName: string;

  @IsString({ message: 'Soyad zorunludur.' })
  @MinLength(2, { message: 'Soyad en az 2 karakter olmalıdır.' })
  @MaxLength(50, { message: 'Soyad en fazla 50 karakter olabilir.' })
  lastName: string;

  @IsString({ message: 'TCKN zorunludur.' })
  @Matches(/^\d{11}$/, { message: 'TCKN 11 haneli sayıdan oluşmalıdır.' })
  tckn: string;

  @IsString({ message: 'Telefon numarası zorunludur.' })
  @Matches(/^(\+90|0)?[0-9]{10}$/, {
    message: 'Geçerli bir Türkiye telefon numarası girin. Örn: 05551234567',
  })
  phone: string;

  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin.' })
  email: string;

  @IsString({ message: 'Şifre zorunludur.' })
  @MinLength(4, { message: 'Şifre en az 4 karakter olmalıdır.' })
  password: string;

  @IsEnum(['WORKER', 'EMPLOYER'], {
    message: "Rol 'WORKER' (İşçi) veya 'EMPLOYER' (İşveren) olmalıdır.",
  })
  role: 'WORKER' | 'EMPLOYER';

  @IsOptional()
  @IsEnum(['INDIVIDUAL', 'CORPORATE'])
  profileType?: 'INDIVIDUAL' | 'CORPORATE';

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsString({ message: 'Doğrulama kodu zorunludur.' })
  @Matches(/^\d{6}$/, { message: 'Doğrulama kodu 6 haneli olmalıdır.' })
  otp: string;
}
