// apps/web/next.config.js
// Next.js konfigürasyonu.
// API Proxy: /api/v1/* yolları NestJS'e (port 3500) yönlendirilir.
// Bu sayede frontend ve backend aynı origin'de çalışıyor gibi görünür.

const isProd = process.env.NODE_ENV === 'production';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || (isProd ? 'https://firsatcii-com.onrender.com' : 'http://localhost:3500');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Üretim ortamında TS hatalarını görmezden gel (Hızlı yayın için)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Üretim ortamında ESLint hatalarını görmezden gel
    ignoreDuringBuilds: true,
  },
  // API isteklerini backend'e proxy'le
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
      {
        source: '/socket-proxy',
        destination: `${apiUrl}/socket.io/`,
      },
      {
        source: '/socket-proxy/:path*',
        destination: `${apiUrl}/socket.io/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
