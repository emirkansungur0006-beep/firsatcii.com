// apps/web/next.config.js
// Next.js konfigürasyonu.
// API Proxy: /api/v1/* yolları NestJS'e (port 3500) yönlendirilir.
// Bu sayede frontend ve backend aynı origin'de çalışıyor gibi görünür.

/** @type {import('next').NextConfig} */
const nextConfig = {
  // API isteklerini NestJS backend'e proxy'le
  // CORS sorunu olmaz, cookie'ler sorunsuz çalışır
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:3500/api/v1/:path*',
      },
      {
        source: '/socket-proxy',
        destination: 'http://localhost:3500/socket.io/',
      },
      {
        source: '/socket-proxy/:path*',
        destination: 'http://localhost:3500/socket.io/:path*',
      },
    ];
  },

  // WebSocket bağlantıları için header ayarı
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
