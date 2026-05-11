import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(data: {
    jobId: string;
    fromId: string;
    toId: string;
    rating: number;
    comment?: string;
  }) {
    // 1. İşin bittiğinden emin ol
    const job = await this.prisma.job.findUnique({
      where: { id: data.jobId },
    });

    if (!job || job.status !== 'COMPLETED') {
      throw new BadRequestException('Sadece tamamlanmış işlere yorum yapılabilir.');
    }

    // 2. Yorumu kaydet
    const review = await this.prisma.review.create({
      data: {
        jobId: data.jobId,
        fromId: data.fromId,
        toId: data.toId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    // 3. HEDEF KULLANICININ PUANLARINI GÜNCELLE (2026 Otomasyonu)
    await this.updateUserRating(data.toId);

    return review;
  }

  async updateUserRating(userId: string) {
    // Tüm yorumları çek
    const reviews = await this.prisma.review.findMany({
      where: { toId: userId },
      select: { rating: true },
    });

    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / reviews.length;

    // WorkerProfile tablosunu güncelle
    await this.prisma.workerProfile.update({
      where: { userId },
      data: {
        avgRating,
        reviewCount: reviews.length,
      },
    });
    
    // User tablosundaki leaderScore'u da etkileyebilir (opsiyonel 2026 vizyonu)
    const leaderScore = Math.min(100, (avgRating * 20)); // Örn: 5 yıldız = 100 puan
    await this.prisma.user.update({
      where: { id: userId },
      data: { leaderScore },
    });
  }

  async getReviewsForUser(userId: string) {
    return this.prisma.review.findMany({
      where: { toId: userId },
      include: {
        from: {
          select: {
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
