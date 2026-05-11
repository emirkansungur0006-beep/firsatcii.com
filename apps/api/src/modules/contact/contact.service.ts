import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class ContactService {
  constructor(
    private prisma: PrismaService,
    private messagesService: MessagesService,
  ) {}

  async sendToAdmin(email: string, messageContent: string) {
    // 1. Kullanıcıyı e-posta ile bul
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı. Lütfen önce sisteme kayıt olun.');
    }

    // 2. İlk Admin'i bul (Mesajların muhatabı)
    const admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      throw new BadRequestException('Sistemde aktif bir yönetici bulunamadı. Lütfen daha sonra tekrar deneyin.');
    }

    // 3. Mesajı oluştur ve bildirimi tetikle (MessagesService üzerinden)
    // admin.id alıcımız, user.id göndericimiz.
    return this.messagesService.create(user.id, admin.id, messageContent);
  }
}
