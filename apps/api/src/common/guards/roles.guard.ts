// apps/api/src/common/guards/roles.guard.ts
// RBAC (Role-Based Access Control) guard'ı.
// @Roles(Role.ADMIN) decorator'ı ile işaretlenmiş endpoint'leri korur.
// Kullanıcının rolü yetersizse 403 Forbidden döner.

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@firsatci/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Endpoint'te hangi roller gerekiyor?
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Rol kısıtlaması yoksa izin ver
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // JWT Guard'dan gelen kullanıcı nesnesini al
    const { user } = context.switchToHttp().getRequest();

    // Kullanıcı gerekli rollerden birine sahip mi?
    const hasRole = requiredRoles.some((role) => user?.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Bu işlem için yetkiniz yok. Gerekli rol: ${requiredRoles.join(', ')}`,
      );
    }

    // Askıya alınmış kullanıcı kontrol
    if (user?.isSuspended) {
      throw new ForbiddenException(
        'Hesabınız askıya alınmıştır. Destek için iletişime geçin.',
      );
    }

    return true;
  }
}
