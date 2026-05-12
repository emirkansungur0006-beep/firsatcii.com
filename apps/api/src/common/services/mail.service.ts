import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {
    if (!this.config.get('GMAIL_USER') || !this.config.get('GMAIL_PASS')) {
      this.logger.warn('GMAIL_USER veya GMAIL_PASS eksik. Email servisi calismayacak.');
    }
  }

  async sendOtpEmail(email: string, code: string): Promise<boolean> {
    const user = this.config.get<string>('GMAIL_USER');
    const pass = this.config.get<string>('GMAIL_PASS');

    if (!user || !pass) {
      this.logger.warn('Email servisi kurulu degil, simulasyon modunda gonderiliyor.');
      console.log(`[EMAIL SIMULASYON] ${email} -> Kod: ${code}`);
      return true;
    }

    try {
      // Vercel uzerindeki API'mize HTTP POST atiyoruz.
      // Bu sayede Render'in SMTP (Port 465) engelini HTTPS (Port 443) kullanarak tamamen asiyoruz!
      const vercelUrl = this.config.get<string>('NODE_ENV') === 'production' 
        ? 'https://firsatcii.com/api/send-email'
        : 'http://localhost:2500/api/send-email';

      const response = await fetch(vercelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: user,
          pass: pass,
          to: email,
          subject: 'Doğrulama Kodunuz - Fırsatçı',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
              <h2 style="color: #f59e0b;">Fırsatçı Doğrulama</h2>
              <p>Merhaba,</p>
              <p>Hesabınızı onaylamak için kullanmanız gereken 6 haneli doğrulama kodunuz aşağıdadır:</p>
              <div style="background: #f1f5f9; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 10px; color: #1e293b; letter-spacing: 5px;">
                ${code}
              </div>
              <p style="margin-top: 20px; font-size: 14px; color: #64748b;">Bu kod 5 dakika boyunca geçerlidir. Eğer bu işlemi siz yapmadıysanız bu e-postayı dikkate almayın.</p>
            </div>
          `,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Vercel API Hatasi');
      }

      this.logger.log(`E-posta Vercel uzerinden basariyla gonderildi: ${email}`);
      return true;
    } catch (error) {
      this.logger.error('Email gönderilirken Vercel baglantisinda hata olustu:', error);
      return false;
    }
  }
}
