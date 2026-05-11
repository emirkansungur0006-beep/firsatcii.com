import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const user = this.config.get<string>('GMAIL_USER');
    const pass = this.config.get<string>('GMAIL_PASS');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: user,
          pass: pass,
        },
      });
      this.logger.log('Nodemailer Gmail servisi basariyla kuruldu.');
    } else {
      this.logger.warn('GMAIL_USER veya GMAIL_PASS eksik. Email servisi kullanilamiyor.');
    }
  }

  async sendOtpEmail(email: string, code: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email servisi kurulu degil, simulasyon modunda gonderiliyor.');
      console.log(`[EMAIL SIMULASYON] ${email} -> Kod: ${code}`);
      return true;
    }

    try {
      const mailOptions = {
        from: '"Fırsatçı" <' + this.config.get<string>('GMAIL_USER') + '>',
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
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`E-posta basariyla gonderildi: ${email}`);
      return true;
    } catch (error) {
      this.logger.error('Email gönderilirken hata oluştu:', error);
      return false;
    }
  }
}
