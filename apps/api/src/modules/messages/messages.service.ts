import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(senderId: string, receiverId: string, content: string, jobId?: string) {
    // Mesaj gönderilebilir mi kontrol et (İhale tamamlanmış mı vb. - opsiyonel kısıtlama)
    const message = await this.prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
        jobId,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Bildirim gönder
    await this.notificationsService.createNotification({
      userId: receiverId,
      type: 'NEW_MESSAGE',
      title: 'Yeni Mesajınız Var 💬',
      message: content.length > 50 ? content.substring(0, 47) + '...' : content,
      jobId: jobId,
      metadata: { senderId }
    }).catch(err => console.error('Notification error:', err));

    return message;
  }

  async getConversation(userId: string, otherId: string, jobId?: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherId, jobId },
          { senderId: otherId, receiverId: userId, jobId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async markAsRead(userId: string, otherId: string, jobId?: string) {
    return this.prisma.message.updateMany({
      where: {
        receiverId: userId,
        senderId: otherId,
        jobId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.message.count({
      where: { receiverId: userId, isRead: false },
    });
  }

  async getRecentChats(userId: string) {
    // Bu basit bir gruplama örneğidir. Üretim bandında daha optimize SQL gerekebilir.
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
        job: { select: { id: true, title: true } },
      },
    });

    const chats = new Map();
    messages.forEach(msg => {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      const chatId = `${otherUser.id}-${msg.jobId || 'general'}`;
      
      if (!chats.has(chatId)) {
        chats.set(chatId, {
          otherUser,
          job: msg.job,
          lastMessage: msg.content,
          createdAt: msg.createdAt,
          isRead: msg.senderId === userId ? true : msg.isRead,
        });
      }
    });

    return Array.from(chats.values());
  }
}
