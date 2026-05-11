import { forwardRef, Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobsGateway } from './jobs.gateway';
import { JobsCronService } from './jobs.cron';
import { BidsModule } from '../bids/bids.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule,
    BidsModule,
    forwardRef(() => NotificationsModule),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobsGateway, JobsCronService],
  exports: [JobsService, JobsGateway],
})
export class JobsModule {}
