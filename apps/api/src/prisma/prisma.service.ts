// apps/api/src/prisma/prisma.service.ts
// Prisma veritabanı bağlantısını yöneten servis.
// Uygulama başlayınca bağlanır, kapanınca bağlantıyı keser.
// Tüm modüller bu servis üzerinden veritabanına erişir.

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']  // Geliştirmede tüm sorgular loglanır
        : ['error'],                   // Üretimde sadece hatalar
    });
  }

  // Uygulama modülü başladığında veritabanına bağlan
  async onModuleInit() {
    await this.$connect();
    console.log('📦 PostgreSQL bağlantısı kuruldu.');
  }

  // Uygulama kapanırken bağlantıyı temizle
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('📦 PostgreSQL bağlantısı kapatıldı.');
  }
}
