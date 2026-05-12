// apps/api/src/main.ts
// NestJS uygulamasının giriş noktası.
// Port: 3500 (Next.js 2500'deki istekleri buraya proxy'ler)
//
// Güvenlik Önlemleri:
// - Helmet.js: HTTP header güvenliği
// - CORS: Sadece localhost:2500'den gelen istekler kabul edilir
// - Cookie Parser: HttpOnly cookie'leri okumak için
// - Global Validation Pipe: DTO validasyonu
// - Rate Limiting: DDoS koruması

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import helmet from 'helmet';

import { execSync } from 'child_process';

async function bootstrap() {
  // Veritabanı tohumlaması artık otonom olarak PrismaService.onModuleInit içinde çalışıyor.
  // Burada yapılan dış script çalıştırmaları tamamen kaldırıldı çünkü veritabanını sıfırlıyordu.

  const app = await NestFactory.create(AppModule);

  // --- GÜVENLİK: Helmet HTTP Header Koruması ---
  // X-XSS-Protection, X-Frame-Options, Content-Security-Policy vb. header'ları ekler
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // --- CORS Ayarları ---
  // Sadece Next.js frontend'ine izin verilir
  // credentials: true → cookie'lerin cross-origin gönderimini sağlar
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:2500',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // --- Cookie Parser ---
  // HttpOnly cookie'leri req.cookies ile okumak için gerekli
  app.use(cookieParser());

  // --- Beden Boyutu Sınırı (Body Limit) ---
  // Base64 fotoğraflar büyük olabileceği için sınırı 50MB yapıyoruz
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- Global Validation Pipe ---
  // DTO'lara gelen tüm veriler otomatik doğrulanır
  // whitelist: true → DTO'da tanımlı olmayan alanlar otomatik silinir
  // forbidNonWhitelisted: true → Bilinmeyen alanlar hata fırlatır
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // --- API Prefix ---
  // Tüm endpoint'ler /api/v1/ ile başlar
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || process.env.API_PORT || 3500;
  await app.listen(port, '0.0.0.0');
  
  console.log(`\n🚀 Fırsatçı API çalışıyor: http://localhost:${port}/api/v1`);
  console.log(`🔌 WebSocket: ws://localhost:${port}`);
  console.log(`🌐 Frontend: http://localhost:2500\n`);
}

bootstrap();
