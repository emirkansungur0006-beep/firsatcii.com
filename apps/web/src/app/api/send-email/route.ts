import { NextResponse } from 'next/server';
import * as nodemailer from 'nodemailer';

// Render'in engelledigi SMTP portlarini asmak icin e-postalari Vercel uzerinden gonderiyoruz.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user, pass, to, subject, html } = body;

    if (!user || !pass || !to) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass,
      },
    });

    const mailOptions = {
      from: `"Fırsatçı" <${user}>`,
      to: to,
      subject: subject,
      html: html,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Email basariyla gonderildi.' });
  } catch (error: any) {
    console.error('Vercel Mail API Hatasi:', error);
    return NextResponse.json({ error: error.message || 'Bilinmeyen Hata' }, { status: 500 });
  }
}
