import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JobsCronService {
  private readonly logger = new Logger(JobsCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAntiSniperLock() {
    this.logger.debug('Anti-sniper kilit kontrolü çalışıyor...');

    const now = new Date();
    const tenMinutesLater = new Date(now.getTime() + 10 * 60000);

    // Bitişine 10 dakika veya daha az kalan VE AKTİF olan ihaleleri bul
    const expiringJobs = await this.prisma.job.findMany({
      where: {
        status: 'ACTIVE',
        isAntiSniperActive: false,
        auctionEnd: {
          lte: tenMinutesLater,
          gt: now // Henüz süresi tam bitmemiş olanlar (son düzlük)
        }
      }
    });

    for (const job of expiringJobs) {
      await this.prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'LOCKED',
          isAntiSniperActive: true
        }
      });
      
      this.logger.log(`İhale kilitlendi (Anti-Sniper): JobID ${job.id}`);

      // Gerekirse WebSocket notification tetiklenebilir
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAuctionEnded() {
    const now = new Date();

    // Bitiş süresi geçmiş ve hala LOCKED veya ACTIVE olan ihaleler
    const endedJobs = await this.prisma.job.findMany({
      where: {
        status: { in: ['ACTIVE', 'LOCKED'] },
        auctionEnd: { lte: now }
      }
    });

    for (const job of endedJobs) {
      // 2026 GÜNCELLEMESİ: İhaleyi kesin olarak kilitle ki yeni teklif hiç gelemesin
      await this.prisma.job.update({
        where: { id: job.id },
        data: { status: 'LOCKED' }
      });
      
      const existingNotification = await this.prisma.notification.findFirst({
        where: { jobId: job.id, type: 'AUCTION_ENDED' }
      });

      if (!existingNotification) {
        await this.prisma.notification.create({
          data: {
            userId: job.employerId,
            type: 'AUCTION_ENDED',
            title: 'İhale Süresi Doldu 🏁',
            message: `"${job.title}" ihaleniz sona erdi. Gelen teklifleri değerlendirip bir usta seçmek için 24 saatiniz var.`,
            jobId: job.id,
          }
        });
        this.logger.log(`İhale süresi doldu, işverene aksiyon bildirimi gönderildi: JobID ${job.id}`);
      }
    }
  }
}
