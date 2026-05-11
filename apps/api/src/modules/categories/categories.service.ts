// apps/api/src/modules/categories/categories.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // Tüm kategorileri ağaç yapısıyla getir
  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null }, // Sadece üst kategoriler
      include: {
        children: true, // Alt kategoriler dahil
      },
      orderBy: { name: 'asc' },
    });
    return categories;
  }

  async findOne(id: number) {
    return this.prisma.category.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });
  }
}
