// apps/api/src/modules/jobs/jobs.service.ts
// İhale iş mantığı:
// - İhale oluşturma (PostGIS ile konum kaydı)
// - İhale listeleme (PostGIS mesafe filtresi)
// - Anti-sniper mekanizması (cron/scheduler ile son 10 dk kilidi)
// - İhale sonuçlandırma

import { forwardRef, Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JobStatus } from '@firsatci/shared';

import { decrypt } from '../../common/helpers/encryption.helper';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  // =============================================
  // İŞ OLUŞTUR (İşveren)
  // =============================================
  async create(dto: CreateJobDto, employerId: string) {
    const publishDate = dto.publishDate ? new Date(dto.publishDate) : new Date();
    const workStartDate = dto.workStartDate ? new Date(dto.workStartDate) : null;
    
    // Flaş İhale Mantığı: 24 saat süre
    let auctionEnd = new Date(dto.auctionEnd);
    if (dto.isFlash) {
      auctionEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    // PostGIS için WKT (Well-Known Text) formatında nokta oluştur
    const jobData = await this.prisma.$queryRaw`
      INSERT INTO jobs (
        id, title, description, "categoryId", location, address,
        "cityId", "districtId", "neighborhoodId", status,
        "budgetMin", "budgetMax", "publishDate", "auctionEnd", "workStartDate", "employerId",
        "targetWorkerId", "isFlash", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        ${dto.title},
        ${dto.description},
        ${dto.categoryId},
        ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326),
        ${dto.address || null},
        ${dto.cityId || null},
        ${dto.districtId || null},
        ${dto.neighborhoodId || null},
        'ACTIVE',
        ${dto.budgetMin || null},
        ${dto.budgetMax || null},
        ${publishDate},
        ${auctionEnd},
        ${workStartDate},
        ${employerId},
        ${dto.targetWorkerId || null},
        ${dto.isFlash || false},
        NOW(),
        NOW()
      )
      RETURNING id, title, status, "auctionEnd", "createdAt", "targetWorkerId", "categoryId", "isFlash"
    `;

    const job = (jobData as any[])[0];

    // --- BİLDİRİM MANTIĞI ---
    if (job.targetWorkerId) {
      // 1. Durum: Kişiye Özel İhale (Direkt Usta Daveti)
      await this.notificationsService.createNotification({
        userId: job.targetWorkerId,
        type: 'NEW_AUCTION_PRIVATE',
        title: 'Size Özel Yeni Bir İş!',
        message: `${dto.title} işi için doğrudan size bir teklif isteği gönderildi.`,
        jobId: job.id,
      });
    } else {
      // 2. Durum: Genel İhale (İL BAZLI EŞLEŞTİRME - TÜM UZMANLIKLAR)
      // Şehirdeki TÜM aktif ve askıya alınmamış ustaları bul
      const jobCityId = parseInt(dto.cityId.toString());

      console.log(`[Notification] Finding all workers for City: ${jobCityId} (Flash: ${job.isFlash})`);

      const matchingWorkers = await this.prisma.user.findMany({
        where: {
          role: 'WORKER',
          isSuspended: false,
          cityId: jobCityId,
        },
        select: { id: true, email: true }
      });

      console.log(`[Notification] Found ${matchingWorkers.length} matching workers.`);

      for (const worker of matchingWorkers) {
        await this.notificationsService.createNotification({
          userId: worker.id,
          type: job.isFlash ? 'FLASH_AUCTION' : 'NEW_AUCTION',
          title: job.isFlash ? '🚨 ACİL İŞ FIRSATI! (24 Saat)' : 'Bölgende Yeni Bir İhale Açıldı! 📍',
          message: job.isFlash 
            ? `DİKKAT: ${dto.title} için acil usta aranıyor! Hemen teklif verin, süre azalıyor.`
            : `${dto.title} ilanına hemen teklifinizi verin. Şehrinizde yeni bir fırsat!`,
          jobId: job.id,
          metadata: { isFlash: job.isFlash }
        });
      }
    }

    return {
      message: job.isFlash ? 'Acil ihale başarıyla oluşturuldu! 24 saatlik geri sayım başladı.' : 'İhale başarıyla oluşturuldu!',
      job,
    };
  }

  // =============================================
  // İHALELERİ LİSTELE
  // =============================================
  async findAll(filters: {
    categoryId?: any;
    cityId?: any;
    districtId?: any;
    status?: string;
    employerId?: string;
    targetWorkerId?: string; // Filtreleme için eklendi
    currentUserId?: string;  // Yetki gizleme için eklendi
    page?: any;
    limit?: any;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    
    // 1. Yetki ve Görünürlük Mantığı (FIRSATÇI 2026 GİZLİLİK)
    // Eğer bir ihale "Kişiye Özel" ise, sadece o kişi veya sahibi görebilir.
    // Genel havuzda başkasının özel ihalesi görünmez.
    where.OR = [
      { targetWorkerId: null }, // Genel ihaleler
      { targetWorkerId: filters.currentUserId }, // Sadece bana özel olanlar
      { employerId: filters.currentUserId } // Benim açtıgım özel ihaleler
    ];

    // 2. Diğer Filtreler
    if (filters.categoryId && filters.categoryId !== '') {
      where.categoryId = parseInt(filters.categoryId.toString());
    }
    if (filters.cityId && filters.cityId !== '') {
      where.cityId = parseInt(filters.cityId.toString());
    }
    if (filters.districtId && filters.districtId !== '') {
      where.districtId = parseInt(filters.districtId.toString());
    }
    if (filters.status && filters.status !== '') {
      where.status = filters.status as JobStatus;
    }
    if (filters.employerId && filters.employerId !== '') {
      where.employerId = filters.employerId;
    }

    // Konsola filtreleri basarak debug yapalım
    console.log('[JobsService] Filtreler:', filters);
    console.log('[JobsService] Sorgu (where):', JSON.stringify(where, null, 2));

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, icon: true } },
          city: { select: { id: true, name: true } },
          district: { select: { id: true, name: true } },
          _count: { select: { bids: true } },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // =============================================
  // İŞÇİ İÇİN YAKIN İHALELER (PostGIS)
  // Belirtilen koordinata yakın aktif ihaleleri getirir
  // =============================================
  async findNearbyJobs(
    latitude: number,
    longitude: number,
    radiusKm: number = 25,
  ) {
    // ST_DWithin: İki geometry arasındaki mesafe testi
    // ST_Distance_Sphere: km cinsinden mesafe
    const jobs = await this.prisma.$queryRaw`
      SELECT 
        j.id, j.title, j.description, j.status,
        j."auctionEnd", j."budgetMin", j."budgetMax",
        j."createdAt", j."isFlash",
        c.name as "categoryName", c.icon as "categoryIcon",
        ci.name as "cityName", d.name as "districtName",
        ROUND(
          ST_Distance_Sphere(
            j.location::geometry,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
          ) / 1000
        ) as "distanceKm",
        (SELECT COUNT(*) FROM bids b WHERE b."jobId" = j.id) as "bidCount"
      FROM jobs j
      LEFT JOIN categories c ON j."categoryId" = c.id
      LEFT JOIN cities ci ON j."cityId" = ci.id
      LEFT JOIN districts d ON j."districtId" = d.id
      WHERE j.status = 'ACTIVE'
        AND ST_DWithin(
          j.location::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusKm * 1000}  -- metre cinsinden
        )
      ORDER BY "distanceKm" ASC
      LIMIT 50
    `;

    return jobs;
  }

  // =============================================
  // İHALE DETAYI
  // =============================================
  async findOne(id: string, currentUserId?: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        category: true,
        city: true,
        district: true,
        neighborhood: true,
        employer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneEncrypted: true,
            leaderScore: true,
            completedJobs: true,
          },
        },
        winner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneEncrypted: true,
          },
        },
        _count: { select: { bids: true } },
      },
    });

    if (!job) {
      throw new NotFoundException('İhale bulunamadı.');
    }

    // --- FIRSATÇI 2026: İLETİŞİM BİLGİLERİNİ AÇMA (REVELATION) ---
    // Sadece ihale TAMAMLANDIYSA ve bakan kişi tarafsa bilgileri çöz
    const isOwner = job.employerId === currentUserId;
    const isWinner = job.winnerId === currentUserId;

    const revealedData: any = { ...job };

    if (job.status === JobStatus.COMPLETED && (isOwner || isWinner)) {
      // 1. İşverenin bilgilerini çöz (İşçi görsün)
      if (job.employer.phoneEncrypted) {
        revealedData.employerPhone = decrypt(job.employer.phoneEncrypted);
      }
      revealedData.employerEmail = job.employer.email;

      // 2. Kazananın bilgilerini çöz (İşveren görsün)
      if (job.winner && job.winner.phoneEncrypted) {
        revealedData.winnerPhone = decrypt(job.winner.phoneEncrypted);
        revealedData.winnerEmail = job.winner.email;
      }
    } else {
      // Bilgileri gizle (API'den temizle)
      delete revealedData.employer.phoneEncrypted;
      delete revealedData.employer.email;
      if (revealedData.winner) {
        delete revealedData.winner.phoneEncrypted;
        delete revealedData.winner.email;
      }
    }

    return revealedData;
  }

  // =============================================
  // ANTİ-SNİPER: SON 10 DAKİKA KİLİDİ
  // Bu metod bir scheduler (cron) tarafından periyodik çağrılır
  // veya WebSocket gateway üzerinden tetiklenir
  // =============================================
  async checkAndLockAuctions() {
    const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);

    // Süresi 10 dakika içinde dolacak ACTIVE ihaleleri kilitle
    const lockedJobs = await this.prisma.job.updateMany({
      where: {
        status: JobStatus.ACTIVE,
        auctionEnd: { lte: tenMinutesFromNow },
      },
      data: {
        status: JobStatus.LOCKED,
        isAntiSniperActive: true,
      },
    });

    return lockedJobs.count;
  }



  // =============================================
  // İHALE İPTAL (Admin veya İşveren)
  // =============================================
  async cancelJob(id: string, userId: string, userRole: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });

    if (!job) throw new NotFoundException('İhale bulunamadı.');

    // Admin her şeyi iptal edebilir, işveren sadece kendi ihalelerini
    if (userRole !== 'ADMIN' && job.employerId !== userId) {
      throw new ForbiddenException('Bu ihaleyi iptal etme yetkiniz yok.');
    }

    return this.prisma.job.update({
      where: { id },
      data: { status: JobStatus.CANCELLED },
    });
  }

  // =============================================
  // İŞ AKIŞI MANTIĞI (BAŞLATMA / BİTİRME)
  // =============================================

  // 1. İşçi: İşi Başlatma İsteği Gönder
  async startJobRequest(jobId: string, workerId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.winnerId !== workerId) throw new Error('Bu işi başlatma yetkiniz yok.');
    if (job.status !== 'AWARDED') throw new Error('İhale henüz sonuçlanmamış veya zaten başlamış.');

    await this.notificationsService.createNotification({
      userId: job.employerId,
      type: 'JOB_START_REQUEST',
      title: 'Usta İşi Başlatmak İstiyor 🛠️',
      message: `"${job.title}" işi için usta işe başlamaya hazır olduğunu bildirdi. Lütfen onaylayın.`,
      jobId: job.id,
    });

    return { message: 'İş başlatma isteği işverene iletildi.' };
  }

  // 2. İşveren: İşe Başlama Onayı
  async confirmJobStart(jobId: string, employerId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.employerId !== employerId) throw new Error('Bu işlemi yapma yetkiniz yok.');
    if (job.status !== 'AWARDED') throw new Error('İş zaten başlamış veya uygun durumda değil.');

    const updatedJob = await (this.prisma.job as any).update({
      where: { id: jobId },
      data: {
        status: 'IN_PROGRESS',
        actualStartDate: new Date(),
      }
    });

    await this.notificationsService.createNotification({
      userId: job.winnerId!,
      type: 'JOB_STARTED',
      title: 'İş Başladı! ⏱️',
      message: `"${job.title}" işi için işveren onay verdi. Zamanlayıcı çalışıyor.`,
      jobId: job.id,
    });

    return updatedJob;
  }

  // 3. İşçi: İşi Bitirme İsteği (Süreyi Durdurur)
  async finishJobRequest(jobId: string, workerId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.winnerId !== workerId) throw new Error('Bu işlemi yapma yetkiniz yok.');
    if (job.status !== 'IN_PROGRESS') throw new Error('İş devam ediyor durumunda değil.');

    const now = new Date();
    const durationSeconds = Math.floor((now.getTime() - job.actualStartDate!.getTime()) / 1000);

    const updatedJob = await (this.prisma.job as any).update({
      where: { id: jobId },
      data: {
        status: 'FINISHED',
        actualEndDate: now,
        totalDurationSeconds: durationSeconds
      }
    });

    await this.notificationsService.createNotification({
      userId: job.employerId,
      type: 'JOB_FINISH_REQUEST',
      title: 'Usta İşi Bitirdi ✅',
      message: `"${job.title}" işi usta tarafından tamamlandı olarak işaretlendi. Lütfen son onayı verin.`,
      jobId: job.id,
    });

    return updatedJob;
  }

  // 4. İşveren: Son Onay (İşi Tamamen Kapatır)
  async confirmJobFinish(jobId: string, employerId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.employerId !== employerId) throw new Error('Bu işlemi yapma yetkiniz yok.');
    if (job.status !== 'FINISHED') throw new Error('İş henüz usta tarafından bitirilmemiş.');

    // Her iki tarafın da tamamlanan iş sayısını artır
    await this.prisma.user.update({
      where: { id: job.employerId },
      data: { completedJobs: { increment: 1 } }
    });

    if (job.winnerId) {
      await this.prisma.user.update({
        where: { id: job.winnerId },
        data: { completedJobs: { increment: 1 } }
      });
    }

    const updatedJob = await (this.prisma.job as any).update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
      }
    });

    await this.notificationsService.createNotification({
      userId: job.winnerId!,
      type: 'JOB_COMPLETED',
      title: 'İş Tamamlandı! 🏆',
      message: `"${job.title}" işi için işveren son onayı verdi. Kazancınız hesabınıza yansıdı.`,
      jobId: job.id,
    });

    return updatedJob;
  }
}
