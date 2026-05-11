import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {}

  async sendOtpEmail(email: string, code: string): Promise<boolean> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY ayarlanmamis. Email simulasyon modu devrede.');
      console.log(`[EMAIL SIMULASYON] ${email} -> Kod: ${code}`);
      return true;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: 'Firsatci <onboarding@resend.dev>',
          to: email,
          subject: 'Dogrulama Kodunuz - Firsatci.com',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
              <h2 style="color: #f59e0b;">Firsatci.com Dogrulama</h2>
              <p>Merhaba,</p>
              <p>Hesabınızı onaylamak için kullanmanız gereken 6 haneli doğrulama kodunuz aşağıdadır:</p>
              <div style="background: #f1f5f9; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 10px; color: #1e293b; letter-spacing: 5px;">
                ${code}
              </div>
              <p style="margin-top: 20px; font-size: 14px; color: #64748b;">Bu kod 5 dakika boyunca geçerlidir. Eğer bu işlemi siz yapmadıysanız bu e-postayı dikkate almayın.</p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        this.logger.error(`Resend API Hatası: ${errorData}`);
        return false;
      }

      this.logger.log(`Email başarıyla gönderildi: ${email}`);
      return true;
    } catch (error) {
      this.logger.error('Email gönderilirken hata oluştu:', error);
      return false;
    }
  }
}
