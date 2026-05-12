'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { SOCKET_URL, SOCKET_OPTIONS } from '../lib/socket';

interface NotificationProviderProps {
  children: React.ReactNode;
}

interface NotificationContextType {
  sendPushTest: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  
  // Ekranda gösterilecek anlık popup listesi
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

  const addToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);

    // 5 saniye sonra ekrandan kaldır
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    // Yalnızca kullanıcı giriş yapmışsa websocket bağlantısı kur
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    socketRef.current = io(SOCKET_URL, SOCKET_OPTIONS);

    socketRef.current.on('connect', () => {
      console.log('✅ Real-time Notification Engine Connected!');
    });

    // SUNUCUDAN GELEN ANLIK İHALE BİLDİRİMİ
    socketRef.current.on('new_job_opportunity', (payload: { message: string }) => {
      addToast(payload.message || 'Size yakın bölgede bir fırsat doğdu, hemen teklifinizi verin!');
    });

    // SUNUCUDAN GELEN KAZANMA BİLDİRİMİ
    socketRef.current.on('auction_won', (payload: { message: string }) => {
      addToast(payload.message || 'Katılım sağladığınız ihaleyi siz kazandınız!');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, addToast]);

  const sendPushTest = useCallback(() => {
    addToast('Size yakın bölgede bir fırsat doğdu, hemen teklifinizi verin!');
  }, [addToast]);

  return (
    <NotificationContext.Provider value={{ sendPushTest }}>
      {children}

      {/* Kırmızı & Neon Toast Konteyneri (Ekranın sağ üst köşesi) */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{
            background: 'linear-gradient(135deg, #FF1E1E, #990000)',
            color: '#ffffff',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 0 20px rgba(255, 30, 30, 0.6), 0 4px 6px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideInRight 0.3s ease forwards',
            fontWeight: 600,
            fontSize: '15px',
            border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer'
          }}
          onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          >
            <span style={{ fontSize: '1.5rem' }}>🔥</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}} />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
