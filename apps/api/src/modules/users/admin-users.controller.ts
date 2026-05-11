import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@firsatci/shared';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAllUsers(@Query() filters: any) {
    return this.usersService.getAllUsers(filters);
  }

  @Patch(':id/permissions')
  updatePermissions(
    @Param('id') userId: string,
    @Body('permissions') permissions: any,
  ) {
    return this.usersService.updatePermissions(userId, permissions);
  }

  @Post('bulk-permissions')
  updatePermissionsBulk(
    @Body('userIds') userIds: string[],
    @Body('permissions') permissions: any,
  ) {
    return this.usersService.updatePermissionsBulk(userIds, permissions);
  }

  @Post('role-permissions')
  updatePermissionsByRole(
    @Body('role') role: string,
    @Body('permissions') permissions: any,
  ) {
    return this.usersService.updatePermissionsByRole(role, permissions);
  }

  @Post('bulk-status')
  updateStatusBulk(
    @Body('userIds') userIds: string[],
    @Body('isSuspended') isSuspended: boolean,
  ) {
    return this.usersService.updateStatusBulk(userIds, isSuspended);
  }
}
