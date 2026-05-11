import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@firsatci/shared';
import { CreatePlanDto } from './dto/create-plan.dto';
import { JobsGateway } from '../jobs/jobs.gateway';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly jobsGateway: JobsGateway
  ) {}

  // PUBLIC/WORKER: Planları Listele
  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getAllPlans();
  }

  // WORKER: Kendi aboneliğini gör
  @Get('my')
  getMySubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.getUserSubscription(userId);
  }

  // WORKER: Plan satın al
  @Post('subscribe/:planId')
  subscribe(@CurrentUser('id') userId: string, @Param('planId') planId: string) {
    return this.subscriptionsService.subscribe(userId, parseInt(planId));
  }

  // ADMIN: Plan Yönetimi
  @Post('plans')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  async createPlan(@Body() data: CreatePlanDto) {
    const plan = await this.subscriptionsService.createPlan(data);
    this.jobsGateway.emitPlansUpdated();
    return plan;
  }

  @Patch('plans/:id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  async updatePlan(@Param('id') id: string, @Body() data: any) {
    const plan = await this.subscriptionsService.updatePlan(parseInt(id), data);
    this.jobsGateway.emitPlansUpdated();
    return plan;
  }

  // ADMIN: Aboneleri Listele
  @Get('subscribers')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  getSubscribers() {
    return this.subscriptionsService.getActiveSubscribers();
  }
}
