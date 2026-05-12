import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:2500',
      'http://127.0.0.1:2500',
      'https://firsatcii.com',
      'https://www.firsatcii.com',
      process.env.CORS_ORIGIN || '',
    ].filter(Boolean),
    credentials: true,
  },
  transports: ['polling', 'websocket'],
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(`user_${userId}`);
      console.log(`💬 Mesajlaşma Soketi: Kullanıcı odaya katıldı user_${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    // Socket.io odalardan otomatik ayrılır
  }

  @SubscribeMessage('send_message')
  async handleMessage(client: Socket, payload: { receiverId: string, content: string, jobId?: string, senderId: string }) {
    const message = await this.messagesService.create(payload.senderId, payload.receiverId, payload.content, payload.jobId);
    
    // Alıcıya gönder (Odadaki tüm socket'lerine)
    this.server.to(`user_${payload.receiverId}`).emit('new_message', message);

    // Gönderene onayla
    client.emit('message_sent', message);
  }
}
