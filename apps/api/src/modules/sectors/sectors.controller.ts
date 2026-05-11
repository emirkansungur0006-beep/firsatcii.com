import { Controller, Get, Query } from '@nestjs/common';
import { SectorsService } from './sectors.service';

@Controller('sectors')
export class SectorsController {
  constructor(private readonly sectorsService: SectorsService) {}

  @Get()
  async getSectors(
    @Query('parentId') parentId?: string,
    @Query('level') level?: string
  ) {
    return this.sectorsService.findAll(
      parentId ? parseInt(parentId) : undefined,
      level ? parseInt(level) : undefined
    );
  }

  @Get('hierarchy')
  async getHierarchy() {
    return this.sectorsService.getHierarchy();
  }
}
