// apps/api/src/app.module.ts
// NestJS kök modül - tüm alt modülleri kayıt eder.
// ThrottlerModule: Rate limiting (DDoS koruması)
// ConfigModule: .env dosyasını yükler

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { BidsModule } from './modules/bids/bids.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { LocationsModule } from './modules/locations/locations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { MessagesModule } from './modules/messages/messages.module';
import { SectorsModule } from './modules/sectors/sectors.module';
import { PackagesModule } from './modules/packages/packages.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ContactModule } from './modules/contact/contact.module';

@Module({
  imports: [
    // --- Konfigürasyon ---
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),

    // --- Rate Limiting (DDoS Koruması) ---
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 600000, 
        limit: 100,  
      },
    ]),

    // --- Prisma (Veritabanı) ---
    PrismaModule,

    // --- Zamanlanmış Görevler (Cron) ---
    ScheduleModule.forRoot(),

    // --- Özellik Modülleri ---
    AuthModule,
    UsersModule,
    JobsModule,
    BidsModule,
    CategoriesModule,
    LocationsModule,
    NotificationsModule,
    AdminModule,
    ReviewsModule, // 2026 Vision: Otomatik puanlama modülü
    MessagesModule,
    SectorsModule,
    PackagesModule,
    SubscriptionsModule,
    ContactModule,
  ], // ContactModule eklendi - Rebuild zorlandı
})
export class AppModule {}
