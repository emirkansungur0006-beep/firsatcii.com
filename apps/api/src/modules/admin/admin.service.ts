// apps/api/src/modules/admin/admin.service.ts
// Admin paneli iş mantığı.
// Tüm admin işlemleri Audit Log tablosuna kaydedilir.

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // =============================================
  // KULLANICILARI LİSTELE (Sayfalama + Arama)
  // =============================================
  async listUsers(filters: {
    search?: string;
    role?: string;
    isSuspended?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.role) where.role = filters.role;
    if (filters.isSuspended !== undefined) where.isSuspended = filters.isSuspended;

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isSuspended: true,
          leaderScore: true,
          completedJobs: true,
          createdAt: true,
          _count: { select: { jobsPosted: true, bids: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // =============================================
  // KULLANICI ASKIYA AL / AKTİFLEŞTİR
  // =============================================
  async toggleSuspend(
    targetUserId: string,
    suspend: boolean,
    adminId: string,
    ipAddress: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    // Admin kendisini askıya alamaz
    if (targetUserId === adminId) {
      throw new ForbiddenException('Kendi hesabınızı askıya alamazsınız.');
    }

    // Kullanıcıyı güncelle
    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isSuspended: suspend },
      select: { id: true, email: true, isSuspended: true },
    });

    // AUDİT LOG: Geri alınamaz kayıt
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: suspend ? 'USER_BANNED' : 'USER_UNBANNED',
        targetType: 'USER',
        targetId: targetUserId,
        details: { email: user.email, previousState: user.isSuspended },
        ipAddress,
      },
    });

    return {
      message: suspend
        ? 'Kullanıcı askıya alındı.'
        : 'Kullanıcı aktifleştirildi.',
      user: updatedUser,
    };
  }

  // =============================================
  // ROL DEĞİŞTİR
  // =============================================
  async changeRole(
    targetUserId: string,
    newRole: string,
    adminId: string,
    ipAddress: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole as any },
      select: { id: true, email: true, role: true },
    });

    // AUDİT LOG
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'USER_ROLE_CHANGED',
        targetType: 'USER',
        targetId: targetUserId,
        details: { oldRole: user.role, newRole, email: user.email },
        ipAddress,
      },
    });

    return { message: 'Kullanıcı rolü değiştirildi.', user: updatedUser };
  }

  // =============================================
  // KULLANICI SİL (Yumuşak silme yerine kalıcı)
  // =============================================
  async deleteUser(
    targetUserId: string,
    adminId: string,
    ipAddress: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
    if (targetUserId === adminId) {
      throw new ForbiddenException('Kendi hesabınızı silemezsiniz.');
    }

    // Önce audit log yaz (kullanıcı silinince foreign key hatası olmasın)
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'USER_DELETED',
        targetType: 'USER',
        targetId: targetUserId,
        details: { email: user.email, role: user.role },
        ipAddress,
      },
    });

    await this.prisma.user.delete({ where: { id: targetUserId } });

    return { message: 'Kullanıcı kalıcı olarak silindi.' };
  }

  // =============================================
  // DENETİM GÜNLÜĞÜ (AUDIT LOG) LİSTELE
  // =============================================
  async getAuditLogs(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // =============================================
  // SİSTEM İSTATİSTİKLERİ
  // =============================================
  async getStats() {
    const [totalUsers, totalJobs, totalBids, activeJobs] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.job.count(),
      this.prisma.bid.count(),
      this.prisma.job.count({ where: { status: 'ACTIVE' } }),
    ]);

    const roleStats = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    return {
      totalUsers,
      totalJobs,
      totalBids,
      activeJobs,
      roleStats: roleStats.map(r => ({
        role: r.role,
        count: r._count.id,
      })),
    };
  }
}
