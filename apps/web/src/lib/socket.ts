// apps/web/src/lib/socket.ts
// Merkezi WebSocket bağlantı ayarları.
// Production'da Vercel WebSocket desteklemediği için doğrudan Render'a bağlanır.
// Development'ta localhost proxy üzerinden çalışır.

const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

// Production'da doğrudan Render backend URL'sine bağlan
// Development'ta Next.js proxy kullan
export const SOCKET_URL = isProd
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://firsatcii-com.onrender.com')
  : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:2500');

// Production'da default /socket.io/ path kullan (doğrudan backend)
// Development'ta /socket-proxy path kullan (Next.js rewrite)
export const SOCKET_PATH = isProd ? '/socket.io/' : '/socket-proxy';

export const SOCKET_OPTIONS = {
  path: SOCKET_PATH,
  transports: ['polling', 'websocket'] as ('polling' | 'websocket')[],
  withCredentials: true,
};
