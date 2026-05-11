// apps/api/src/modules/admin/admin.controller.ts
// Admin paneli endpoint'leri - Sadece ADMIN rolü erişebilir.
// IP adresi tüm işlemlerde Audit Log'a kaydedilir.

import {
  Controller, Get, Post, Delete, Patch, Param, Query,
  UseGuards, Body, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@firsatci/shared';

// Tüm admin endpoint'leri JWT + ADMIN rolü gerektirir
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Sistem istatistikleri
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // Kullanıcı listesi
  @Get('users')
  listUsers(@Query() filters: any) {
    return this.adminService.listUsers(filters);
  }

  // Kullanıcı askıya al
  @Patch('users/:id/suspend')
  suspendUser(
    @Param('id') targetId: string,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return this.adminService.toggleSuspend(targetId, true, adminId, ip);
  }

  // Kullanıcı askıdan kaldır
  @Patch('users/:id/unsuspend')
  unsuspendUser(
    @Param('id') targetId: string,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return this.adminService.toggleSuspend(targetId, false, adminId, ip);
  }

  // Rol değiştir
  @Patch('users/:id/role')
  changeRole(
    @Param('id') targetId: string,
    @Body('role') newRole: string,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return this.adminService.changeRole(targetId, newRole, adminId, ip);
  }

  // Kullanıcı sil
  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  deleteUser(
    @Param('id') targetId: string,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return this.adminService.deleteUser(targetId, adminId, ip);
  }

  // Audit log listesi
  @Get('audit-logs')
  getAuditLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.adminService.getAuditLogs(page, limit);
  }
}
