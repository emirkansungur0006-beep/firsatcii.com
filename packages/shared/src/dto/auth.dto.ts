// packages/shared/src/dto/auth.dto.ts
// Kimlik doğrulama işlemleri için DTO (Data Transfer Object) tipleri.
// Backend validation ve frontend form tipleri bu dosyadan import eder.

export interface RegisterDto {
  firstName: string;    // Ad
  lastName: string;     // Soyad
  tckn: string;         // TC Kimlik Numarası (11 hane)
  phone: string;        // Telefon numarası
  email: string;        // E-posta adresi
  password: string;     // Şifre (min 8 karakter)
  role: 'WORKER' | 'EMPLOYER'; // Kullanıcının seçtiği rol
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    leaderScore: number;
    completedJobs: number;
  };
  // JWT cookie olarak dönülür, response body'de token yok
  message: string;
}

export interface RefreshTokenDto {
  // Refresh token cookie'den okunur, body'de gönderilmez
}
