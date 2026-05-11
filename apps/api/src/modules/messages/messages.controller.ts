import { Controller, Get, Post, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permission.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('view_messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async send(@Req() req: any, @Body() body: { receiverId: string, content: string, jobId?: string }) {
    return this.messagesService.create(req.user.id, body.receiverId, body.content, body.jobId);
  }

  @Get('conversation/:otherId')
  async getConversation(
    @Req() req: any, 
    @Param('otherId') otherId: string, 
    @Query('jobId') jobId?: string
  ) {
    return this.messagesService.getConversation(req.user.id, otherId, jobId);
  }

  @Post('read/:otherId')
  async markAsRead(
    @Req() req: any, 
    @Param('otherId') otherId: string, 
    @Query('jobId') jobId?: string
  ) {
    return this.messagesService.markAsRead(req.user.id, otherId, jobId);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    return { count: await this.messagesService.getUnreadCount(req.user.id) };
  }

  @Get('recent')
  async getRecentChats(@Req() req: any) {
    return this.messagesService.getRecentChats(req.user.id);
  }
}
