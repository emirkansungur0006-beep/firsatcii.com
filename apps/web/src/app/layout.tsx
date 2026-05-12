// apps/web/src/app/layout.tsx
// Next.js kök layout - Tüm sayfalara uygulanır.
// SEO meta tags, Google Font, global CSS dahil eder.

import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/components/NotificationProvider';

export const metadata: Metadata = {
  title: {
    default: 'Fırsatçı — Hizmet Pazar Yeri',
    template: '%s | Fırsatçı',
  },
  description:
    'Fırsatçı, hizmet verenler ile hizmet alanları buluşturan Türkiye\'nin en büyük tersine müzayede platformudur. En uygun fiyatı bul, hemen teklif ver.',
  keywords: [
    'hizmet pazar yeri', 'tersine müzayede', 'iş ilanı',
    'usta bul', 'temizlik', 'tadilat', 'nakliye', 'Türkiye',
  ],
  authors: [{ name: 'Fırsatçı' }],
  creator: 'Fırsatçı',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://firsatci.com',
    title: 'Fırsatçı — Hizmet Pazar Yeri',
    description: 'Hizmet verenler ile hizmet alanları buluşturan tersine müzayede platformu.',
    siteName: 'Fırsatçı',
  },
  icons: {
    icon: '/assets/logo.png',
    apple: '/assets/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        {/* Preconnect Google Fonts için performans optimizasyonu */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
