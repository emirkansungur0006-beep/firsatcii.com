import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  // PLANS (ADMIN)
  async createPlan(data: { name: string, description?: string, price: number, features: string[], durationDays?: number }) {
    return (this.prisma.subscriptionPlan as any).create({
      data: {
        ...data,
        features: data.features as any,
        isActive: true,
      },
    });
  }

  async getAllPlans() {
    return (this.prisma.subscriptionPlan as any).findMany({
      orderBy: { price: 'asc' },
    });
  }

  async updatePlan(id: number, data: any) {
    return (this.prisma.subscriptionPlan as any).update({
      where: { id },
      data,
    });
  }

  // USER SUBSCRIPTIONS
  async subscribe(userId: string, planId: number) {
    const plan = await (this.prisma.subscriptionPlan as any).findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan bulunamadı.');

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    return (this.prisma.userSubscription as any).upsert({
      where: { userId },
      update: {
        planId,
        startDate: new Date(),
        endDate,
        isActive: true,
      },
      create: {
        userId,
        planId,
        endDate,
        isActive: true,
      },
    });
  }

  async getUserSubscription(userId: string) {
    return (this.prisma.userSubscription as any).findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  async getActiveSubscribers() {
    return (this.prisma.userSubscription as any).findMany({
      where: { 
        isActive: true,
        endDate: { gte: new Date() }
      },
      include: { 
        user: { select: { firstName: true, lastName: true, email: true } },
        plan: true 
      }
    });
  }
}
