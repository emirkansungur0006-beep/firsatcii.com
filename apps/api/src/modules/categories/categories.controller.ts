// apps/api/src/modules/categories/categories.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly prisma: PrismaService
  ) {}

  @Get('force-seed')
  async forceSeed() {
    return await this.prisma.runAutoSeed(true);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }
}
