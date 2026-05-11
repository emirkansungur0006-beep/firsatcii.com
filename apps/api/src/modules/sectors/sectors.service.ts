import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SectorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(parentId?: number, level?: number) {
    const where: any = {};
    if (parentId !== undefined) where.parentId = parentId;
    if (level !== undefined) where.level = level;

    return this.prisma.sector.findMany({
      where,
      orderBy: { code: 'asc' },
    });
  }

  async getHierarchy() {
    // Tüm hiyerarşiyi çekmek büyük veri setlerinde (2800+) performans sorunu yaratabilir.
    // Bu yüzden frontend'de seviye seviye çekilmesi (lazy loading) daha mantıklı.
    return this.prisma.sector.findMany({
      where: { level: 1 },
      include: {
        children: {
          include: {
            children: true
          }
        }
      }
    });
  }
}
