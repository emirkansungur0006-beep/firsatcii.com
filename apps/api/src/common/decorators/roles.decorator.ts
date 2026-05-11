// apps/api/src/common/decorators/roles.decorator.ts
// Endpoint'lere rol kısıtlaması eklemek için özel decorator.
// Kullanım: @Roles(Role.ADMIN, Role.EMPLOYER)

import { SetMetadata } from '@nestjs/common';
import { Role } from '@firsatci/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
