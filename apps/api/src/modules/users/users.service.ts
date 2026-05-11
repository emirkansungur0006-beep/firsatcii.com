import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { decrypt, encrypt } from '../../common/helpers/encryption.helper';
import { UpdateWorkerProfileDto } from './dto/update-worker-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    try {
      const user = await (this.prisma.user as any).findUnique({
        where: { id: userId },
        select: {
          id: true, firstName: true, lastName: true, email: true,
          phoneEncrypted: true,
          role: true, leaderScore: true, completedJobs: true,
          isSuspended: true, cityId: true, districtId: true,
          profileType: true, companyName: true, taxNumber: true,
          city: { select: { name: true } },
          district: { select: { name: true } },
          workerProfile: true,
          permissions: true,
          createdAt: true,
        },
      });

      if (user) {
        // Abonelik bilgisini ayrı bir sorgu ile "güvenli" şekilde ekleyelim
        try {
          (user as any).subscription = await (this.prisma as any).userSubscription.findUnique({
            where: { userId },
            include: { plan: true }
          });
        } catch (e) {
          (user as any).subscription = null;
        }

        const profile: any = { ...user };
        if (user.phoneEncrypted) {
          profile.phone = decrypt(user.phoneEncrypted);
        }
        delete profile.phoneEncrypted;
        return profile;
      }

      throw new NotFoundException('Kullanıcı bulunamadı.');
    } catch (error) {
      console.error('getProfile hatası:', error);
      throw error;
    }
  }

  async updateWorkerProfile(userId: string, dto: UpdateWorkerProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'WORKER') {
      throw new BadRequestException('Sadece işçiler profil güncelleyebilir.');
    }

    // Kullanıcının temel bilgilerini User tablosundan güncelliyoruz
    const userDataToUpdate: any = {};
    if (dto.firstName) userDataToUpdate.firstName = dto.firstName;
    if (dto.lastName) userDataToUpdate.lastName = dto.lastName;
    if (dto.email) userDataToUpdate.email = dto.email;
    if (dto.phone) userDataToUpdate.phoneEncrypted = encrypt(dto.phone);
    if (dto.cityId) userDataToUpdate.cityId = dto.cityId;
    if (dto.districtId) userDataToUpdate.districtId = dto.districtId;
    if (dto.profilePicture && dto.profilePicture.trim() !== '') {
      userDataToUpdate.profilePicture = dto.profilePicture;
    }

    if (Object.keys(userDataToUpdate).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: userDataToUpdate
      });
    }

    // Diğer tüm özellikleri WorkerProfile tablosuna upsert ediyoruz
    const workerProfile = await this.prisma.workerProfile.upsert({
      where: { userId },
      update: {
        aboutMe: dto.aboutMe,
        education: dto.education,
        jobHistory: dto.jobHistory,
        references: dto.references,
        experiences: dto.experiences,
        university: dto.university,
        socialMedia: dto.socialMedia,
        skills: dto.skills,
        portfolio: dto.portfolio,
        ...(dto.sectorIds && { sectorIds: dto.sectorIds }),
      },
      create: {
        userId,
        aboutMe: dto.aboutMe,
        education: dto.education,
        jobHistory: dto.jobHistory || [],
        references: dto.references || [],
        experiences: dto.experiences || [],
        university: dto.university || '',
        socialMedia: dto.socialMedia || {},
        skills: dto.skills || [],
        portfolio: dto.portfolio || [],
        sectorIds: dto.sectorIds || [],
      }
    });

    return { message: 'Profil güncellendi', workerProfile };
  }

  async updateProfile(userId: string, dto: any) {
    const data: any = {};
    
    if (dto.firstName) data.firstName = dto.firstName;
    if (dto.lastName) data.lastName = dto.lastName;
    if (dto.email) data.email = dto.email;
    if (dto.phone) data.phoneEncrypted = encrypt(dto.phone);
    if (dto.profileType) data.profileType = dto.profileType;
    if (dto.companyName !== undefined) data.companyName = dto.companyName;
    if (dto.taxNumber !== undefined) data.taxNumber = dto.taxNumber;
    if (dto.profilePicture && dto.profilePicture.trim() !== '') {
      data.profilePicture = dto.profilePicture;
    }
    if (dto.cityId) data.cityId = dto.cityId;
    if (dto.districtId) data.districtId = dto.districtId;

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return { message: 'Profil güncellendi' };
  }

  // =============================================
  // FIRSATÇI 2026: USTA ARAMA/LISTELEME
  // =============================================
  async findAllWorkers(filters: { categoryId?: string; cityId?: string; districtId?: string; search?: string }) {
    console.log('🔍 [WorkersSearch] Filtreler Uygulanıyor:', filters);

    const where: any = {
      workerProfile: { isNot: null },
      isSuspended: false,
      NOT: {
        email: { in: ['ahmet@usta.com', 'mehmet@usta.com', 'can@usta.com'] }
      }
    };

    if (filters.cityId) where.cityId = parseInt(filters.cityId as any);
    if (filters.districtId) where.districtId = parseInt(filters.districtId as any);
    
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.categoryId) {
      where.workerProfile = {
        ...where.workerProfile,
        sectorIds: { has: parseInt(filters.categoryId as any) }
      };
    }

    const workers = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        city: { select: { name: true } },
        workerProfile: {
          select: {
            aboutMe: true,
            university: true,
            avgRating: true,
            reviewCount: true,
            skills: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`✅ [WorkersSearch] Toplam Bulunan İşçi: ${workers.length}`);
    return workers;
  }

  // =============================================
  // FIRSATÇI 2026: DETAYLI USTA PROFİLİ
  // Parametre: observerId (Görüntüleyen kişinin ID'si - Gizlilik kontrolü için)
  // =============================================
  async findWorkerById(workerId: string, observerId?: string) {
    const worker = await this.prisma.user.findUnique({
      where: { id: workerId },
      include: {
        city: true,
        district: true,
        workerProfile: true,
        // İşçi ile gözlemci (işveren) arasındaki aktif/onaylı işleri bul
        jobsWon: {
          where: {
            employerId: observerId,
            status: 'COMPLETED',
          },
        },
      },
    });

    if (!worker || !worker.workerProfile) {
      throw new NotFoundException('Usta bulunamadı.');
    }

    // GİZLİLİK MANTIĞI:
    // Sadece teklifi onaylanmış işverenler gerçek iletişim bilgilerini görebilir.
    // Diğerleri için maskelenmiş veri döner.
    const isAuthorized = worker.jobsWon.length > 0 || worker.id === observerId;

    const profile: any = {
      id: worker.id,
      firstName: worker.firstName,
      lastName: worker.lastName,
      profilePicture: worker.profilePicture,
      city: worker.city,
      district: worker.district,
      workerProfile: worker.workerProfile,
      role: worker.role,
    };

    if (isAuthorized) {
      profile.email = worker.email;
      // Not: phoneEncrypted servis tarafında decrypt edilmelidir -> ÇÖZÜLDÜ
      profile.phone = worker.phoneEncrypted ? decrypt(worker.phoneEncrypted) : null; 
    } else {
      profile.email = '*******@****.com';
      profile.phone = '05** *** ** **';
      // Sosyal medya linklerini de maskele
      if (profile.workerProfile?.socialMedia) {
        profile.workerProfile.socialMedia = {
          instagram: 'Kilitli',
          linkedin: 'Kilitli',
          website: 'Kilitli',
        };
      }
    }

    return profile;
  }

  // =============================================
  // ADMİN PANELİ: KULLANICI YÖNETİMİ
  // =============================================
  async getAllUsers(filters: any) {
    const where: any = {};
    if (filters.role) where.role = filters.role;
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true, email: true,
        role: true, isSuspended: true, permissions: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePermissions(userId: string, permissions: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { permissions },
    });
  }

  async updatePermissionsBulk(userIds: string[], permissions: any) {
    // Mevcut izinlerle birleştirmek yerine üzerine yazıyoruz (admin isteği bu yönde)
    return this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { permissions },
    });
  }

  async updatePermissionsByRole(role: string, permissions: any) {
    return this.prisma.user.updateMany({
      where: { role: role as any },
      data: { permissions },
    });
  }

  async updateStatusBulk(userIds: string[], isSuspended: boolean) {
    return this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { isSuspended },
    });
  }

  // =============================================
  // GELİR PANELİ MANTIĞI
  // =============================================
  async getWorkerRevenue(userId: string) {
    const user = await (this.prisma.user as any).findUnique({
      where: { id: userId },
      select: { showRevenuePanel: true }
    });

    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    // Tamamlanmış işleri bul (winnerId === userId ve status === COMPLETED)
    const completedJobs = await this.prisma.job.findMany({
      where: {
        winnerId: userId,
        status: 'COMPLETED'
      },
      include: {
        bids: {
          where: { workerId: userId, status: 'ACCEPTED' }
        }
      }
    });

    // Toplam kazanç: Kabul edilen teklif tutarlarının toplamı
    const totalEarnings = completedJobs.reduce((sum, job) => {
      const acceptedBid = job.bids[0];
      return sum + (acceptedBid ? Number(acceptedBid.amount) : 0);
    }, 0);

    // Platform harcaması (Simüle edilmiş: Teklif başına 10 TL gibi bir maliyet)
    const totalBidsCount = await this.prisma.bid.count({ where: { workerId: userId } });
    const estimateSpending = totalBidsCount * 10; 

    return {
      totalEarnings,
      estimateSpending,
      completedJobsCount: completedJobs.length,
      totalBidsCount,
      showRevenuePanel: (user as any).showRevenuePanel
    };
  }

  async updateRevenuePanelStatus(userId: string, status: boolean) {
    return (this.prisma.user as any).update({
      where: { id: userId },
      data: { showRevenuePanel: status }
    });
  }

  async switchRole(userId: string) {
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      include: { workerProfile: true } 
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
    if (user.role === 'ADMIN') throw new BadRequestException('Admin rolü değiştirilemez.');

    const newRole = user.role === 'WORKER' ? 'EMPLOYER' : 'WORKER';

    // Eğer işçi moduna geçiliyorsa ve profil yoksa oluştur
    if (newRole === 'WORKER' && !user.workerProfile) {
      await this.prisma.workerProfile.create({
        data: {
          userId,
          sectorIds: [],
        }
      });
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole as any },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      }
    });
  }
}

