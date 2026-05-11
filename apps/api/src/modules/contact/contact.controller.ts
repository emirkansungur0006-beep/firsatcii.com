import { Controller, Post, Body, Get } from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('send-to-admin')
  async sendToAdmin(@Body() body: { email: string; message: string }) {
    return this.contactService.sendToAdmin(body.email, body.message);
  }

  @Get('test')
  test() {
    return { status: 'Contact API is working' };
  }
}
