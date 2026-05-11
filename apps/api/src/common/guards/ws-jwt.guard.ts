import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const cookieString = client.handshake.headers.cookie;

    if (!cookieString) {
      throw new WsException('Yetkisiz erişim: Cookie bulunamadı.');
    }

    const token = this.extractTokenFromCookie(cookieString);

    if (!token) {
      throw new WsException('Yetkisiz erişim: Access token bulunamadı.');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        throw new WsException('Geçersiz kullanıcı.');
      }

      // Kullanıcıyı sokete ekle
      (client as any).user = user;
      return true;
    } catch (err) {
      this.logger.error('WS JWT Doğrulama Hatası:', err.message);
      throw new WsException('Oturum süresi dolmuş veya geçersiz token.');
    }
  }

  private extractTokenFromCookie(cookieString: string): string | null {
    const cookies = cookieString.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    return cookies['access_token'] || null;
  }
}
