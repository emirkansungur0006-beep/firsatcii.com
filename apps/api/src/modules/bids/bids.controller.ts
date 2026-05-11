// apps/api/src/modules/bids/bids.controller.ts
import {
  Controller, Post, Get, Delete, Body, Param,
  UseGuards, Query, Patch,
} from '@nestjs/common';
import { BidsService } from './bids.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@firsatci/shared';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permission.decorator';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

class CreateBidDto {
  @IsUUID() jobId: string;
  @IsNumber() @Min(1) amount: number;
  @IsOptional() @IsString() note?: string;
}

@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  // Teklif ver (sadece İşçi)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.WORKER)
  @RequirePermission('view_active_jobs')
  @Post()
  create(@Body() dto: CreateBidDto, @CurrentUser('id') userId: string) {
    return this.bidsService.create(dto.jobId, userId, dto.amount, dto.note);
  }

  // İhale teklifleri - İşveren (kimlik görünür)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  @Get('job/:jobId/employer')
  getForEmployer(
    @Param('jobId') jobId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bidsService.getJobBidsForEmployer(jobId, userId);
  }

  // İhale teklifleri - Genel (kimlik gizli)
  @Get('job/:jobId')
  getPublic(
    @Param('jobId') jobId: string,
    @Query('workerId') workerId?: string,
  ) {
    return this.bidsService.getJobBidsPublic(jobId, workerId);
  }

  // Teklif geri çek
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WORKER)
  @Delete(':id')
  withdraw(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.bidsService.withdrawBid(id, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WORKER)
  @Get('my-bids')
  getMyBids(@CurrentUser('id') userId: string) {
    return this.bidsService.getMyBids(userId);
  }

  // Teklif kabul et (sadece İşveren)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  @Patch(':id/accept')
  accept(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.bidsService.acceptBid(id, userId);
  }

  // Teklif reddet (sadece İşveren)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  @Delete(':id/reject')
  reject(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.bidsService.rejectBid(id, userId);
  }
}
