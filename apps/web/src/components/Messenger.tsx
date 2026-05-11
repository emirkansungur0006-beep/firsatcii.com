'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: { firstName: string, lastName: string };
}

export default function Messenger() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<{ id: string, name: string, jobId?: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const activeChatRef = useRef<any>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // activeChat state'ini ref ile takip et (socket listener içinde güncel kalması için)
  useEffect(() => {
    activeChatRef.current = activeChat;
    if (activeChat && isOpen) {
      // Sohbet açıldığında mesajları çek ve okundu olarak işaretle
      fetchMessages();
    }
  }, [activeChat, isOpen]);

  const fetchMessages = () => {
    if (!activeChat || !user) return;
    fetch(`/api/v1/messages/conversation/${activeChat.id}${activeChat.jobId ? `?jobId=${activeChat.jobId}` : ''}`, { credentials: 'include' })
      .then(res => res.json())
      .then(setMessages)
      .catch(console.error);
    
    // Okundu işaretle
    fetch(`/api/v1/messages/read/${activeChat.id}${activeChat.jobId ? `?jobId=${activeChat.jobId}` : ''}`, { 
      method: 'POST',
      credentials: 'include' 
    }).catch(() => {});
  };

  // Soket Bağlantısı (Sadece bir kez bağlan)
  useEffect(() => {
    if (!user) return;

    const socketUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:2500';
    
    console.log('📡 Soket bağlantısı kuruluyor (Proxy-Safe):', socketUrl);
 
    const socketInstance = io(socketUrl, {
      path: '/socket-proxy',
      query: { userId: user.id },
      transports: ['polling', 'websocket'],
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Soket Bağlandı! ID:', socketInstance.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('❌ Soket Bağlantı Hatası Detayı:', err);
      // Hata durumunda polling'i tekrar zorla
      if (socketInstance.io.opts.transports) {
        socketInstance.io.opts.transports = ['polling', 'websocket'];
      }
    });

    socketInstance.on('new_message', (msg: Message) => {
      console.log('📩 Yeni mesaj alındı:', msg);
      // Her durumda global bir event fırlat (Menüdeki butonu yakmak için)
      window.dispatchEvent(new CustomEvent('new_message_received', { detail: msg }));

      // Bildirim sesi NotificationHandler tarafından çalınıyor (Merkezi yönetim)
      
      // Eğer bu mesaj şu an açık olan sohbete aitse ekrana ekle
      const currentChat = activeChatRef.current;
      if (currentChat && msg.senderId === currentChat.id) {
        setMessages(prev => {
          // Mükerrer mesaj kontrolü
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    socketRef.current = socketInstance;
    return () => { socketInstance.disconnect(); };
  }, [user]);

  // Otomatik aşağı kaydır
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Mesaj gönder
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !socketRef.current || !user) return;

    const payload = {
      senderId: user.id,
      receiverId: activeChat.id,
      content: newMessage,
      jobId: activeChat.jobId
    };

    socketRef.current.emit('send_message', payload);
    window.dispatchEvent(new CustomEvent('message_sent'));
    
    // Kendi ekranımıza anında ekleyelim (ID geçici)
    const tempMsg: any = {
      id: 'temp-' + Date.now(),
      content: newMessage,
      senderId: user.id,
      createdAt: new Date().toISOString(),
      sender: { firstName: user.firstName, lastName: user.lastName }
    };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
  };

  // Global Event Listener
  useEffect(() => {
    const startChat = (e: any) => {
      setActiveChat(e.detail);
      setIsOpen(true);
    };
    window.addEventListener('start_chat', startChat);
    return () => window.removeEventListener('start_chat', startChat);
  }, []);

  if (!user) return null;

  return (
    <div className={`messenger-container ${isOpen ? 'open' : ''}`}>
      <style jsx>{`
        .messenger-container {
          position: fixed;
          bottom: 0;
          right: 20px;
          width: 380px;
          height: 500px;
          background: white;
          border-radius: 16px 16px 0 0;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          transform: translateY(calc(100% - 56px));
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 1px solid #e2e8f0;
          z-index: 9999;
        }
        .messenger-container.open {
          transform: translateY(0);
        }
        .chat-header {
          padding: 16px 20px;
          background: #0f172a;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-weight: 700;
          border-radius: 16px 16px 0 0;
        }
        .chat-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #fdfdfd;
          scroll-behavior: smooth;
        }
        .msg {
          max-width: 85%;
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 0.95rem;
          line-height: 1.5;
          position: relative;
          word-break: break-word;
        }
        .msg-sent {
          align-self: flex-end;
          background: #fbbf24;
          color: #0f172a;
          border-bottom-right-radius: 4px;
        }
        .msg-received {
          align-self: flex-start;
          background: #f1f5f9;
          color: #334155;
          border-bottom-left-radius: 4px;
        }
        .chat-footer {
          padding: 15px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          gap: 10px;
          align-items: center;
          background: white;
        }
        .chat-input {
          flex: 1;
          padding: 12px 18px;
          border: 1px solid #e2e8f0;
          border-radius: 25px;
          outline: none;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        .chat-input:focus {
          border-color: #fbbf24;
        }
        .chat-send {
          background: #0f172a;
          color: white;
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          transition: transform 0.2s;
        }
        .chat-send:hover {
          transform: scale(1.05);
        }

        /* MOBIL UYUMLULUK */
        @media (max-width: 768px) {
          .messenger-container {
            right: 0;
            width: 100%;
            height: 100%;
            border-radius: 0;
            bottom: 0;
            transform: translateY(calc(100% - 56px));
          }
          .messenger-container.open {
            transform: translateY(0);
          }
          .chat-header {
            border-radius: 0;
            padding: 20px;
          }
          .chat-body {
            padding: 15px;
          }
          .chat-footer {
            padding-bottom: 30px; /* Safe area for mobile */
          }
        }
      `}</style>

      <div className="chat-header" onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>💬</span>
          <span>{activeChat ? activeChat.name : 'Mesajlaşma'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {activeChat && (
            <span onClick={(e) => { e.stopPropagation(); setActiveChat(null); setMessages([]); }} style={{ opacity: 0.6, fontSize: '0.8rem' }}>Sohbeti Kapat</span>
          )}
          <span>{isOpen ? '▼' : '▲'}</span>
        </div>
      </div>

      {activeChat ? (
        <>
          <div className="chat-body" ref={scrollRef}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: '30%', padding: '0 20px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👋</div>
                <b>{activeChat.name}</b> ile sohbeti başlatın. Mesajlarınız anlık olarak iletilecektir.
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`msg ${msg.senderId === user.id ? 'msg-sent' : 'msg-received'}`}>
                {msg.content}
                <div style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '5px', textAlign: 'right' }}>
                  {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>

          <form className="chat-footer" onSubmit={handleSend}>
            <input 
              type="text" 
              className="chat-input" 
              placeholder="Mesajınızı buraya yazın..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onFocus={() => {
                // Mobilde klavye açıldığında yukarı kaydır
                setTimeout(() => {
                  if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }, 300);
              }}
            />
            <button type="submit" className="chat-send">🚀</button>
          </form>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', opacity: 0.5 }}>📩</div>
          <h4 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>Henüz Bir Sohbet Seçilmedi</h4>
          <p style={{ fontSize: '0.9rem' }}>İhale detaylarından veya "Mesajlarım" sayfasından bir sohbet başlatabilirsiniz.</p>
        </div>
      )}
    </div>
  );
}
