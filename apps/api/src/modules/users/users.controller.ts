// apps/api/src/modules/users/users.controller.ts
import { Controller, Get, UseGuards, Put, Post, Body, Query, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateWorkerProfileDto } from './dto/update-worker-profile.dto';

import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permission.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-role')
  async switchRole(@CurrentUser('id') userId: string) {
    return this.usersService.switchRole(userId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('view_profile')
  @Put('worker-profile')
  updateWorkerProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWorkerProfileDto,
  ) {
    return this.usersService.updateWorkerProfile(userId, dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('view_profile')
  @Put('profile')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('workers')
  getWorkers(
    @Query('categoryId') categoryId?: string,
    @Query('cityId') cityId?: string,
    @Query('districtId') districtId?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAllWorkers({
      categoryId,
      cityId,
      districtId,
      search,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('workers/:id')
  getWorkerById(
    @Param('id') workerId: string,
    @CurrentUser('id') observerId: string,
  ) {
    return this.usersService.findWorkerById(workerId, observerId);
  }

  // --- GELİR PANELİ ---
  @UseGuards(JwtAuthGuard)
  @Get('revenue')
  getRevenue(@CurrentUser('id') userId: string) {
    return this.usersService.getWorkerRevenue(userId);
  }

  // --- ADMİN PANELİ: KULLANICI YÖNETİMİ ---
  @UseGuards(JwtAuthGuard) // Gerçekte AdminGuard eklenmeli, şimdilik böyle
  @Get('admin/list')
  adminList(@Query() filters: any) {
    return this.usersService.getAllUsers(filters);
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/:id/revenue-panel')
  adminUpdateRevenuePanel(@Param('id') id: string, @Body('status') status: boolean) {
    return this.usersService.updateRevenuePanelStatus(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/:id/permissions')
  adminUpdatePermissions(@Param('id') id: string, @Body() permissions: any) {
    return this.usersService.updatePermissions(id, permissions);
  }
}
