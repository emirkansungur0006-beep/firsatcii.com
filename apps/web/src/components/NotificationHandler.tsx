'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { SOCKET_URL, SOCKET_PATH } from '@/lib/socket';

export default function NotificationHandler() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [packageUnreadCount, setPackageUnreadCount] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  const msgReminderRef = useRef<NodeJS.Timeout | null>(null);
  const pkgReminderRef = useRef<NodeJS.Timeout | null>(null);
  const genReminderRef = useRef<NodeJS.Timeout | null>(null);

  // Kurumsal Bildirim Sesi (Sana bir fırsat doğdu tınısı)
  const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
  const fallbackSound = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
  
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  // 1. SES SİSTEMİNİ HAZIRLA VE ÖN YÜKLEME YAP
  useEffect(() => {
    const initAudio = () => {
      try {
        if (!notificationAudioRef.current) {
          const audio = new Audio();
          audio.src = NOTIFICATION_SOUND;
          audio.crossOrigin = 'anonymous'; // Güvenlik engellerini aş
          audio.preload = 'auto';
          notificationAudioRef.current = audio;
        }

        const audio = notificationAudioRef.current;
        if (audio) {
          audio.volume = 0;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              audio.pause();
              audio.volume = 0.9;
              setIsAudioInitialized(true);
              console.log('✅ Bildirim ses sistemi aktif.');
            }).catch(e => {
              console.warn('⚠️ Ses etkileşim bekliyor:', e);
              // Hata durumunda yedek sesi yükle
              audio.src = fallbackSound;
              audio.load();
            });
          }
        }
      } catch (e) {
        console.error('❌ Ses sistemi hatası:', e);
      }
    };

    const events = ['click', 'touchstart', 'mousedown', 'keydown'];
    events.forEach(ev => window.addEventListener(ev, initAudio, { once: true }));
    return () => events.forEach(ev => window.removeEventListener(ev, initAudio));
  }, []);

  // Yardımcı Oynatma Fonksiyonu
  const safePlay = (volume = 0.9) => {
    console.log('🔔 Ses tetiklendi, çalınıyor...');
    const audio = notificationAudioRef.current;
    if (!audio) {
      // Audio objesi yoksa anında oluştur ve çalmayı dene
      const a = new Audio(NOTIFICATION_SOUND);
      a.volume = volume;
      a.play().catch(() => {});
      return;
    }
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = volume;
      const p = audio.play();
      if (p !== undefined) p.catch(e => console.error('🔊 Oynatma hatası:', e));
    } catch (e) {
      console.error('🔊 Ses hatası:', e);
    }
  };

  // Tüm bildirim tipleri artık aynı STANDART sesi kullanıyor
  const playNotificationSound = () => safePlay(0.9);
  const playFlashSound = () => safePlay(0.9);
  const playCorporateSound = () => safePlay(0.9);
  const playMessageSound = () => safePlay(0.9);
  const playSentSound = () => safePlay(0.9);
  const playMoneySound = () => safePlay(0.9);

  // Bildirimleri çek ve kategorize et
  const fetchCounts = () => {
    if (!user) return;
    fetch('/api/v1/notifications', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const notifications = data || [];
        const unread = notifications.filter((n: any) => !n.isRead);
        setUnreadCount(unread.length);
        setMessageUnreadCount(unread.filter((n: any) => n.type === 'NEW_MESSAGE').length);
        setPackageUnreadCount(unread.filter((n: any) => n.type === 'PACKAGE_PURCHASE_REQUEST').length);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchCounts();
  }, [user]);

  // Akıllı Hatırlatıcılar
  useEffect(() => {
    if (messageUnreadCount > 0) {
      if (!msgReminderRef.current) msgReminderRef.current = setInterval(() => playMessageSound(), 45000);
    } else {
      if (msgReminderRef.current) { clearInterval(msgReminderRef.current); msgReminderRef.current = null; }
    }
    if (packageUnreadCount > 0) {
      if (!pkgReminderRef.current) pkgReminderRef.current = setInterval(() => playMoneySound(), 60000);
    } else {
      if (pkgReminderRef.current) { clearInterval(pkgReminderRef.current); pkgReminderRef.current = null; }
    }
    if (unreadCount > (messageUnreadCount + packageUnreadCount)) {
      if (!genReminderRef.current) genReminderRef.current = setInterval(() => playCorporateSound(), 90000);
    } else {
      if (genReminderRef.current) { clearInterval(genReminderRef.current); genReminderRef.current = null; }
    }
    return () => {
      [msgReminderRef, pkgReminderRef, genReminderRef].forEach(ref => {
        if (ref.current) { clearInterval(ref.current); ref.current = null; }
      });
    };
  }, [unreadCount, messageUnreadCount, packageUnreadCount]);

  // Global Listenerlar
  useEffect(() => {
    const handleRead = () => fetchCounts();
    const handleSent = () => playSentSound();
    const handleNewMessage = () => playMessageSound();
    
    window.addEventListener('notifications_read', handleRead);
    window.addEventListener('new_notification', handleRead); 
    window.addEventListener('message_sent', handleSent);
    window.addEventListener('new_message_received', handleNewMessage);
    
    return () => {
      window.removeEventListener('notifications_read', handleRead);
      window.removeEventListener('new_notification', handleRead);
      window.removeEventListener('message_sent', handleSent);
      window.removeEventListener('new_message_received', handleNewMessage);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const socketInstance = io(`${SOCKET_URL}/auctions`, { 
      path: SOCKET_PATH,
      withCredentials: true, 
      transports: ['polling', 'websocket']
    });

    socketInstance.on('connect', () => {
      socketInstance.emit('join_auction', { userId: user.id });
    });

    socketInstance.on('notification', (data) => {
      setUnreadCount(prev => prev + 1);
      if (data.type === 'NEW_MESSAGE') setMessageUnreadCount(prev => prev + 1);
      if (data.type === 'PACKAGE_PURCHASE_REQUEST') setPackageUnreadCount(prev => prev + 1);
      
      // TÜM BİLDİRİMLER TEK VE AYNI SESİ ÇALAR (STANDARTLAŞTIRILDI)
      playCorporateSound();
      
      showToast(data.title, data.message, data.type === 'FLASH_AUCTION', data);
      window.dispatchEvent(new CustomEvent('new_notification', { detail: data }));
    });

    socketInstance.on('new_job_opportunity', () => {
      playCorporateSound();
    });

    setSocket(socketInstance);
    return () => { socketInstance.disconnect(); };
  }, [user]);

  const showToast = (title: string, message: string, isFlash: boolean = false, data?: any) => {
    const toast = document.createElement('div');
    toast.className = 'toast-popup';
    const icon = isFlash ? '🚨' : '🔔';
    const borderColor = isFlash ? '#e11d48' : 'var(--color-gold)';
    const bgColor = isFlash ? '#fff1f2' : 'white';
    toast.innerHTML = `<div style="font-weight: 800; color: ${isFlash ? '#e11d48' : 'var(--color-navy)'}; margin-bottom: 4px;">${icon} ${title}</div><div style="font-size: 0.85rem; color: #475569;">${message}</div>`;
    Object.assign(toast.style, { position: 'fixed', top: '20px', right: '20px', background: bgColor, borderLeft: `5px solid ${borderColor}`, padding: '16px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: '9999', minWidth: '280px', animation: 'slideIn 0.3s ease-out forwards', border: isFlash ? '1px solid #fb7185' : 'none', borderLeftWidth: '5px', cursor: 'pointer' });
    toast.onclick = () => {
      if (data?.type === 'PACKAGE_PURCHASE_ACCEPTED' && data.metadata?.workerId) window.dispatchEvent(new CustomEvent('start_chat', { detail: { id: data.metadata.workerId, name: data.metadata.workerName || 'Usta' } }));
      if (data?.type === 'NEW_MESSAGE' && data.metadata?.senderId) window.dispatchEvent(new CustomEvent('start_chat', { detail: { id: data.metadata.senderId, name: 'Sohbet' } }));
      toast.remove();
    };
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideOut 0.3s ease-in forwards'; setTimeout(() => toast.remove(), 300); }, isFlash ? 10000 : 5000);
  };

  return null;
}
