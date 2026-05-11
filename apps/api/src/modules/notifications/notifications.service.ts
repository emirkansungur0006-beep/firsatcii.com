import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsGateway } from '../jobs/jobs.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => JobsGateway))
    private jobsGateway: JobsGateway,
  ) {}

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    jobId?: string;
    metadata?: any;
  }) {
    const notification = await this.prisma.notification.create({ data });
    
    // ANLIK BİLDİRİM GÖNDER (WebSocket)
    this.jobsGateway.notifyUser(data.userId, 'notification', {
      ...notification,
      sound: true // Ses çalınması için frontend'e ipucu
    });

    return notification;
  }

  async markByTypeAsRead(userId: string, type: string) {
    return this.prisma.notification.updateMany({
      where: { userId, type, isRead: false },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
