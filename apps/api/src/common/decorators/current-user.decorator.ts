// apps/api/src/common/decorators/current-user.decorator.ts
// Request object'inden mevcut kullanıcıyı çıkarmak için decorator.
// JWT Guard tarafından eklenen kullanıcı bilgisini alır.
// Kullanım: @CurrentUser() user: User

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    // Belirli bir alan istenmişse onu döndür, yoksa tüm user'ı
    return data ? user?.[data] : user;
  },
);
