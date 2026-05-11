import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { JobsGateway } from '../jobs/jobs.gateway';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class PackagesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private jobsGateway: JobsGateway,
    private messagesService: MessagesService,
  ) {}

  async createPackage(workerId: string, dto: CreatePackageDto) {
    try {
      return await this.prisma.servicePackage.create({
        data: {
          title: dto.title,
          description: dto.description,
          price: dto.price,
          sectorId: dto.sectorId ? Number(dto.sectorId) : null,
          categoryId: dto.categoryId ? Number(dto.categoryId) : null,
          cityId: dto.cityId ? Number(dto.cityId) : null,
          districtId: dto.districtId ? Number(dto.districtId) : null,
          workerId,
        },
      });
    } catch (error) {
      console.error('❌ Paket Oluşturma Hatası:', error);
      throw error;
    }
  }

  async getAllPackages() {
    return this.prisma.servicePackage.findMany({
      where: { isActive: true },
      include: {
        worker: {
          select: { id: true, firstName: true, lastName: true, leaderScore: true }
        },
        sector: true,
        category: true,
        city: true,
        district: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyPackages(workerId: string) {
    return this.prisma.servicePackage.findMany({
      where: { workerId },
      include: { sector: true, category: true, city: true, district: true },
    });
  }

  async buyPackage(packageId: string, employerId: string) {
    const pkg = await this.prisma.servicePackage.findUnique({
      where: { id: packageId },
      include: { worker: true },
    });

    if (!pkg) throw new NotFoundException('Paket bulunamadı.');

    const order = await this.prisma.packageOrder.create({
      data: {
        packageId,
        employerId,
        status: 'PENDING',
      },
      include: {
        employer: true,
        package: true,
      }
    });

    // Notify Worker (Persistent & Real-time)
    await this.notificationsService.createNotification({
      userId: pkg.workerId,
      type: 'PACKAGE_PURCHASE_REQUEST',
      title: 'Yeni Paket Satın Alma İsteği! 💰',
      message: `${order.employer.firstName} ${order.employer.lastName}, "${pkg.title}" paketinizi satın almak istiyor.`,
      metadata: { orderId: order.id },
    });

    return order;
  }

  async respondToOrder(orderId: string, workerId: string, status: any) {
    const order = await this.prisma.packageOrder.findUnique({
      where: { id: orderId },
      include: { package: true, employer: true },
    });

    if (!order || order.package.workerId !== workerId) {
      throw new Error('Bu siparişe yanıt verme yetkiniz yok.');
    }

    const updatedOrder = await this.prisma.packageOrder.update({
      where: { id: orderId },
      data: { status },
    });

    if (status === 'ACCEPTED') {
      // Find worker name
      const worker = await this.prisma.user.findUnique({ where: { id: workerId } });
      const workerName = worker ? `${worker.firstName} ${worker.lastName}` : 'Usta';

      // Notify Employer
      const notification = await this.notificationsService.createNotification({
        userId: order.employerId,
        type: 'PACKAGE_PURCHASE_ACCEPTED',
        title: 'Hizmet Satın Alındı! ✅',
        message: `"${order.package.title}" paketi için usta onay verdi. Mesajlar kısmından iletişime geçebilirsiniz.`,
        metadata: { orderId: order.id, workerId: workerId, workerName },
      });

      // Real-time
      this.jobsGateway.notifyUser(order.employerId, 'notification', notification);

      // Create Initial Message to start the conversation
      await this.messagesService.create(
        workerId, 
        order.employerId, 
        `Merhaba ${order.employer.firstName}, "${order.package.title}" paketiniz için satın alma isteğinizi onayladım. Buradan detayları konuşabiliriz.`
      );
    }

    return updatedOrder;
  }

  async getMyOrders(userId: string, role: string) {
     if (role === 'WORKER') {
        return this.prisma.packageOrder.findMany({
          where: { package: { workerId: userId } },
          include: { package: true, employer: true },
          orderBy: { createdAt: 'desc' }
        });
     } else {
        return this.prisma.packageOrder.findMany({
          where: { employerId: userId },
          include: { package: { include: { worker: true } } },
          orderBy: { createdAt: 'desc' }
        });
     }
  }
}
