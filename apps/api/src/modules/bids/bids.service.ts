// apps/api/src/modules/bids/bids.service.ts
// Teklif iş mantığı:
// - Teklif verme (anti-sniper kontrolü dahil)
// - Teklif güncelleme
// - İşveren için detaylı liste, işçi için anonim liste

import { forwardRef, Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobStatus } from '@firsatci/shared';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BidsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  // =============================================
  // TEKLİF VER (İşçi)
  // =============================================
  async create(jobId: string, workerId: string, amount: number, note?: string) {
    // İhaleyi kontrol et
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });

    if (!job) throw new NotFoundException('İhale bulunamadı.');

    // Anti-sniper: Kilitli ihalede teklif verilemez
    if (job.status === JobStatus.LOCKED) {
      throw new BadRequestException(
        '⚠️ Teklifler kilitlendi! İhalenin son 10 dakikasında yeni teklif verilemez.',
      );
    }

    if (job.status !== JobStatus.ACTIVE) {
      throw new BadRequestException('Bu ihale artık aktif değil.');
    }

    // İhale süresi dolmuş mu?
    if (new Date() > job.auctionEnd) {
      throw new BadRequestException('İhale süresi dolmuş.');
    }

    // İşveren kendi ihalesi için teklif veremez
    if (job.employerId === workerId) {
      throw new ForbiddenException('Kendi ihalenize teklif veremezsiniz.');
    }

    // --- ABONELİK VE TEKLİF HAKKI KONTROLÜ ---
    const user = await this.prisma.user.findUnique({
      where: { id: workerId },
      include: { subscription: true }
    });

    // --- TEKLİF HAKKI KONTROLÜ (HERKES İÇİN SABİT 3) ---
    const bidLimit = 3;

    const existingBid = await this.prisma.bid.findUnique({
      where: { jobId_workerId: { jobId, workerId } }
    });

    if (existingBid) {
      if (existingBid.updateCount >= bidLimit) {
        throw new BadRequestException(`⚠️ Bu ihale için 3 kez teklif verme hakkınız dolmuştur.`);
      }

      // Güncelle (Reddedilmiş olsa bile tekrar beklemede olur, ama hakkı gider!)
      const bid = await this.prisma.bid.update({
        where: { id: existingBid.id },
        data: { 
          amount, 
          note,
          status: 'PENDING',
          updateCount: { increment: 1 }
        },
      });

      return this.handleBidSuccess(job, bid, bidLimit);
    }

    // Yeni oluştur
    const bid = await this.prisma.bid.create({
      data: { jobId, workerId, amount, note, updateCount: 1 },
    });

    return this.handleBidSuccess(job, bid, bidLimit);
  }

  // Ortak başarı mantığı
  private async handleBidSuccess(job: any, bid: any, limit: number) {
    // --- İŞVERENE BİLDİRİM GÖNDER ---
    await this.notificationsService.createNotification({
      userId: job.employerId,
      type: 'NEW_BID',
      title: 'İhalenize Yeni Teklif!',
      message: `"${job.title}" içerikli ihaleniz için yeni bir teklif aldınız. Hemen inceleyin!`,
      jobId: job.id,
    });

    // İhale için güncel istatistikleri hesapla
    const stats = await this.prisma.bid.aggregate({
      where: { jobId: job.id },
      _count: { id: true },
      _min: { amount: true },
    });

    return {
      id: bid.id,
      amount: Number(bid.amount),
      bidCount: stats._count.id,
      lowestBid: Number(stats._min.amount),
      updateCount: bid.updateCount,
      remainingRights: limit - bid.updateCount
    };
  }

  // WebSocket'ten çağrılan wrapper
  async createFromWebSocket(jobId: string, workerId: string, amount: number) {
    return this.create(jobId, workerId, amount);
  }

  // =============================================
  // İŞVEREN İÇİN TEKLİF LİSTESİ (kimlik görünür)
  // =============================================
  async getJobBidsForEmployer(jobId: string, employerId: string) {
    // İhale bu işverene ait mi?
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, employerId },
    });
    if (!job) throw new ForbiddenException('Bu ihaleye erişim yetkiniz yok.');

    const bids = await this.prisma.bid.findMany({
      where: { jobId },
      orderBy: { amount: 'asc' }, // En düşük teklif önce
      include: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            leaderScore: true,
            completedJobs: true,
            city: { select: { name: true } },
          },
        },
      },
    });

    return bids;
  }

  // =============================================
  // İŞÇİ İÇİN ANONIM TEKLİF LİSTESİ (kimlik gizli)
  // =============================================
  async getJobBidsPublic(jobId: string, currentWorkerId?: string) {
    const bids = await this.prisma.bid.findMany({
      where: { jobId },
      orderBy: { amount: 'asc' },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        workerId: true,
        updateCount: true,
      },
    });

    // Kimliği maskele, sıralama numarası ekle
    return bids.map((bid, index) => ({
      id: bid.id,
      amount: Number(bid.amount),
      rank: index + 1,
      isOwn: bid.workerId === currentWorkerId,
      updateCount: bid.workerId === currentWorkerId ? bid.updateCount : undefined,
      createdAt: bid.createdAt,
    }));
  }

  // =============================================
  // TEKLİF GERİ ÇEK
  // =============================================
  async withdrawBid(bidId: string, workerId: string) {
    const bid = await this.prisma.bid.findFirst({
      where: { id: bidId, workerId },
      include: { job: true },
    });

    if (!bid) throw new NotFoundException('Teklif bulunamadı.');
    if (bid.job.status === JobStatus.LOCKED) {
      throw new BadRequestException('Kilitli ihalede teklif geri çekilemez.');
    }

    return this.prisma.bid.update({
      where: { id: bidId },
      data: { status: 'WITHDRAWN' },
    });
  }

  // =============================================
  // İŞÇİ KENDİ TEKLİFLERİNİ GÖRÜR
  // =============================================
  async getMyBids(workerId: string) {
    const bids = await this.prisma.bid.findMany({
      where: { workerId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            auctionEnd: true,
            status: true,
            _count: { select: { bids: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Her ihale için ek olarak o ihaleye verilmiş en düşük teklifi de çekip ekleyelim
    const bidsWithLowest = await Promise.all(bids.map(async (bid) => {
      const minBid = await this.prisma.bid.aggregate({
        where: { jobId: bid.jobId },
        _min: { amount: true }
      });

      return {
        ...bid,
        job: {
          ...bid.job,
          lowestBid: minBid._min.amount ? Number(minBid._min.amount) : null
        }
      };
    }));

    return bidsWithLowest;
  }

  // =============================================
  // TEKLİF KABUL ET (İşveren)
  // =============================================
  async acceptBid(bidId: string, employerId: string) {
    // Teklifi ve ilgili ihaleyi bul
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: { job: true },
    });

    if (!bid) throw new NotFoundException('Teklif bulunamadı.');
    
    // İhalenin bu işverene ait olup olmadığını kontrol et
    if (bid.job.employerId !== employerId) {
      throw new ForbiddenException('Bu teklifi kabul etme yetkiniz yok.');
    }

    // --- TRANSACTION: Veritabanı tutarlılığı için ---
    // 2026 GÜVENLİK GÜNCELLEMESİ: Yarış durumunu önlemek için durum kontrolü update içinde yapılır.
    const [acceptedBid, updatedJob] = await this.prisma.$transaction(async (tx) => {
      // 1. İhalenin hala aktif/kilitli olduğunu doğrula ve güncelle
      const job = await tx.job.findUnique({
        where: { id: bid.jobId },
      });

      if (!job || job.status === 'COMPLETED' || job.status === 'AWARDED') {
        throw new BadRequestException('Bu ihale zaten sonuçlanmış veya geçersiz.');
      }

      // 2. Seçilen teklifi kabul et
      const updatedBid = await tx.bid.update({
        where: { id: bidId },
        data: { status: 'ACCEPTED' },
      });

      // 3. Diğer teklifleri reddet
      await tx.bid.updateMany({
        where: { jobId: bid.jobId, NOT: { id: bidId } },
        data: { status: 'REJECTED' },
      });

      // 4. İhaleyi "Devam Ediyor" (IN_PROGRESS) yap, kazananı kaydet ve zamanlayıcıyı başlat!
      const finalizedJob = await (tx.job as any).update({
        where: { id: bid.jobId },
        data: { 
          status: 'IN_PROGRESS',
          winnerId: bid.workerId,
          acceptedBidId: bidId, // Arşiv için sakla
          actualStartDate: new Date(), // SÜRE ŞİMDİ BAŞLIYOR!
        },
      });

      return [updatedBid, finalizedJob];
    });

    // --- USTAYA BİLDİRİM GÖNDER ---
    await this.notificationsService.createNotification({
      userId: bid.workerId,
      type: 'BID_ACCEPTED',
      title: 'Tebrikler, İhaleyi Kazandınız! 🎉',
      message: 'Teklifiniz onaylandı, işe hemen başlayabilirsiniz! 🎉',
      jobId: bid.jobId,
      metadata: { sound: true }
    });

    return {
      message: 'Teklif başarıyla kabul edildi ve ihale sonuçlandı',
      bid: acceptedBid,
      job: updatedJob,
    };
  }

  async rejectBid(bidId: string, employerId: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: { job: true, worker: true },
    });

    if (!bid || bid.job.employerId !== employerId) {
      throw new Error('Yetkisiz işlem.');
    }

    const remainingRights = 3 - (bid.updateCount || 1);

    // USTAYA BİLDİRİM GÖNDER
    await this.notificationsService.createNotification({
      userId: bid.workerId,
      title: '🚫 Teklif Reddedildi',
      message: `Teklifiniz reddedildi, ${remainingRights} hakkınız kaldı.`,
      type: 'BID_REJECTED',
      jobId: bid.job.id,
      metadata: { 
        amount: bid.amount,
        remainingRights: remainingRights,
        sound: true
      }
    });

    // TEKLİFİ REDDEDİLDİ OLARAK İŞARETLE (SİLMİYORUZ, HAK GERİ VERİLMİYOR!)
    return this.prisma.bid.update({
      where: { id: bidId },
      data: { status: 'REJECTED' },
    });
  }
}
