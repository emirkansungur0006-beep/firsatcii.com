// apps/api/src/modules/jobs/jobs.gateway.ts
// WebSocket Gateway - Canlı İhale Sistemi
//
// Bağlantı: ws://localhost:3500
// Namespace: /auctions
//
// Olaylar:
// client → server: 'join_auction' (jobId)     - Odaya katıl
// client → server: 'place_bid' (amount, jobId) - Teklif ver
// server → client: 'new_bid' (PublicBidDto)    - Yeni teklif geldi
// server → client: 'auction_locked' (jobId)    - Anti-sniper kilidi
// server → client: 'auction_ended' (jobId)     - İhale bitti

import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, forwardRef, Inject } from '@nestjs/common';
import { BidsService } from '../bids/bids.service';
import { JobsService } from './jobs.service';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

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
  namespace: '/auctions',
  transports: ['polling', 'websocket'],
})
export class JobsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => BidsService))
    private bidsService: BidsService,
    @Inject(forwardRef(() => JobsService))
    private jobsService: JobsService,
  ) {}

  // İstemci bağlandı
  handleConnection(client: Socket) {
    console.log(`🔌 WS Bağlantı: ${client.id}`);
  }

  // İstemci bağlantıyı kesti
  handleDisconnect(client: Socket) {
    console.log(`🔌 WS Koptu: ${client.id}`);
  }

  // ------------------------------------------
  // İHALE ODASINA KATIL
  // Kullanıcı ihale sayfasını açtığında bu odaya katılır
  // ------------------------------------------
  @SubscribeMessage('join_auction')
  handleJoinAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId?: string; userId?: string },
  ) {
    if (data.jobId) {
      client.join(`auction:${data.jobId}`);
      client.emit('joined', { jobId: data.jobId, message: 'İhaleye bağlandınız.' });
    }
    
    // Kullanıcıya özel bildirim odası
    if (data.userId) {
      client.join(`user:${data.userId}`);
      console.log(`👤 Kullanıcı ${data.userId} kendi bildirim odasına katıldı: user:${data.userId}`);
      client.emit('joined_global', { userId: data.userId, message: 'Bildirim sistemine bağlandınız.' });
    }
  }

  // ------------------------------------------
  // GLOBAL BİLDİRİM GÖNDER
  // Herhangi bir servisten (JobsService, NotificationsService vb.) tetiklenebilir
  // ------------------------------------------
  notifyUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  notifySector(sectorId: number, data: any) {
    // Sektör odası mantığı için kullanıcılar girişte sektörlerine göre de odaya alınabilir
    // Şimdilik basitlik adına global veya kullanıcı bazlı ilerliyoruz
    this.server.to(`sector:${sectorId}`).emit('new_job_alert', data);
  }

  // ------------------------------------------
  // TEKLİF VER
  // Tüm oda üyelerine anlık bildirim gönderilir
  // Kimlik maskelenir: sadece tutar görünür
  // ------------------------------------------
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('place_bid')
  async handlePlaceBid(
    @ConnectedSocket() client: any,
    @MessageBody() data: { jobId: string; amount: number },
  ) {
    try {
      // GÜVENLİK: workerId client'tan değil, authenticated session'dan alınır
      const workerId = client.user.id;

      // Teklifi veritabanına kaydet (BidsService)
      const bid = await this.bidsService.createFromWebSocket(
        data.jobId,
        workerId,
        data.amount,
      );

      // İhale odasındaki herkese yayınla
      // KİMLİK GİZLEME: workerId ve isim gönderilmez
      this.server.to(`auction:${data.jobId}`).emit('new_bid', {
        amount: bid.amount,
        bidCount: bid.bidCount,
        lowestBid: bid.lowestBid,
        timestamp: new Date().toISOString(),
      });

      // Sadece teklif veren kişiye onay gönder
      client.emit('bid_confirmed', {
        success: true,
        message: 'Teklifiniz alındı!',
        bidId: bid.id,
      });

    } catch (error) {
      client.emit('bid_error', {
        success: false,
        message: error.message || 'Teklif gönderilemedi.',
      });
    }
  }

  // ------------------------------------------
  // ANTI-SNIPER: İHALEYİ KİLİTLE
  // JobsService'den tetiklenir (cron veya scheduler)
  // ------------------------------------------
  emitAuctionLocked(jobId: string) {
    this.server.to(`auction:${jobId}`).emit('auction_locked', {
      jobId,
      message: '⚠️ Teklifler Kilitlendi! Son 10 dakika, yeni teklif verilemiyor.',
      lockedAt: new Date().toISOString(),
    });
  }

  // ------------------------------------------
  // İHALE TAMAMLANDI
  // ------------------------------------------
  emitAuctionCompleted(jobId: string) {
    this.server.to(`auction:${jobId}`).emit('auction_ended', {
      jobId,
      message: '🏆 İhale tamamlandı! Kazanan belirlendi.',
      endedAt: new Date().toISOString(),
    });
  }

  // ------------------------------------------
  // ABONELİK PAKETLERİ GÜNCELLENDİ
  // ------------------------------------------
  emitPlansUpdated() {
    this.server.emit('subscription_plans_updated');
  }
}
