// apps/api/src/prisma/prisma.module.ts
// Prisma Service'i global olarak tüm modüllere sunar.

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Tüm modüllerde import etmeden kullanılabilir
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
