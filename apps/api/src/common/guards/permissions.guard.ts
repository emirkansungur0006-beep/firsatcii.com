import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.get<string>('permission', context.getHandler());
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;
    if (user.role === 'ADMIN') return true; // Admin her şeyi yapabilir

    const permissions = user.permissions || {};
    
    // Eğer yetki tanımlanmışsa ve false ise engelle
    // Eğer yetki hiç tanımlanmamışsa varsayılan olarak true (veya false) kabul edebiliriz.
    // Burada adminin "Aç/Kapat" mantığına göre, eğer anahtar varsa ve false ise kilitliyoruz.
    if (permissions[requiredPermission] === false) {
      throw new ForbiddenException(`Bu işlem için yetkiniz kısıtlanmıştır: ${requiredPermission}`);
    }

    return true;
  }
}
