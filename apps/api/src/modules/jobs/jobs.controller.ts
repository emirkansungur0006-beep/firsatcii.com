// apps/api/src/modules/jobs/jobs.controller.ts
import {
  Controller, Get, Post, Body, Param, Delete, Patch,
  UseGuards, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@firsatci/shared';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permission.decorator';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // İhale oluştur (sadece İşveren)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.EMPLOYER)
  @RequirePermission('view_create_job')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateJobDto, @CurrentUser('id') userId: string) {
    return this.jobsService.create(dto, userId);
  }

  // Tüm ihaleleri listele (herkese açık, ancak özel ihaleler gizlenir)
  @Get()
  findAll(
    @Query() filters: any,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.jobsService.findAll({ ...filters, currentUserId });
  }

  // Yakın ihaleleri listele (PostGIS - İşçi için)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WORKER)
  @Get('nearby')
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number,
  ) {
    return this.jobsService.findNearbyJobs(lat, lng, radius);
  }

  // İhale detayı
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.jobsService.findOne(id, userId);
  }



  // İhale iptal et
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER, Role.ADMIN)
  @Delete(':id')
  cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.jobsService.cancelJob(id, userId, role);
  }

  // --- İŞ AKIŞI ENDPOINT'LERİ ---

  // 1. İşçi: İşi Başlat İsteği
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WORKER)
  @Post(':id/start')
  startRequest(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.jobsService.startJobRequest(id, userId);
  }

  // 2. İşveren: İşe Başlama Onayı
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  @Post(':id/confirm-start')
  confirmStart(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.jobsService.confirmJobStart(id, userId);
  }

  // 3. İşçi: İşi Bitir İsteği
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WORKER)
  @Post(':id/finish')
  finishRequest(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.jobsService.finishJobRequest(id, userId);
  }

  // 4. İşveren: Son Onay
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  @Post(':id/confirm-finish')
  confirmFinish(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.jobsService.confirmJobFinish(id, userId);
  }
}
