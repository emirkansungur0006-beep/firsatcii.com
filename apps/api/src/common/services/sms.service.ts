import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private config: ConfigService) {}

  async sendOtpSms(phone: string, code: string): Promise<boolean> {
    const user = this.config.get<string>('SMS_USER');
    const pass = this.config.get<string>('SMS_PASS');
    const header = this.config.get<string>('SMS_HEADER');

    if (!user || !pass) {
      this.logger.warn('SMS_USER veya SMS_PASS ayarlanmamis. SMS gonderimi simulasyon modunda.');
      console.log(`[SMS SIMULASYON] ${phone} -> Kod: ${code}`);
      return true;
    }

    try {
      // Netgsm OTP SMS API Formatı (XML)
      const xmlData = `
        <?xml version="1.0" encoding="UTF-8"?>
        <mainbody>
          <header>
            <usercode>${user}</usercode>
            <password>${pass}</password>
            <msgheader>${header}</msgheader>
          </header>
          <body>
            <msg><![CDATA[Firsatci.com onay kodunuz: ${code}]]></msg>
            <no>${phone}</no>
          </body>
        </mainbody>
      `;

      const response = await fetch('https://api.netgsm.com.tr/sms/send/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml' },
        body: xmlData,
      });

      const result = await response.text();
      this.logger.log(`Netgsm Cevabi: ${result}`);

      // Netgsm basarili gonderimde kodun basinda "00" veya "0" doner
      return result.startsWith('00') || result.startsWith('0');
    } catch (error) {
      this.logger.error('SMS gonderilirken hata olustu:', error);
      return false;
    }
  }
}
