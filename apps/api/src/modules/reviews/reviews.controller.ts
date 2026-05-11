import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createReview(
    @CurrentUser('id') fromId: string,
    @Body() body: { jobId: string; toId: string; rating: number; comment?: string },
  ) {
    return this.reviewsService.createReview({
      ...body,
      fromId,
    });
  }

  @Get('user/:userId')
  async getReviews(@Param('userId') userId: string) {
    return this.reviewsService.getReviewsForUser(userId);
  }
}
