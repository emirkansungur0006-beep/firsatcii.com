'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { io } from 'socket.io-client';

export default function MesajlarPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    if (user) {
      const fetchChats = () => {
        fetch('/api/v1/messages/recent', { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            setChats(data);
            setLoading(false);
          })
          .catch(err => {
            console.error(err);
            setLoading(false);
          });
      };

      fetchChats();

      // Soket üzerinden anlık güncelleme
      const socketUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:2500';
      const socketInstance = io(socketUrl, {
        path: '/socket-proxy',
        query: { userId: user.id },
        transports: ['polling', 'websocket'],
        withCredentials: true
      });

      socketInstance.on('new_message', () => {
        // Yeni mesaj geldiğinde listeyi yenile
        fetchChats();
      });

      setSocket(socketInstance);
      return () => { socketInstance.disconnect(); };
    }
  }, [user]);

  // Import io
  // ... (Adding import at the top)

  const openChat = (chat: any) => {
    window.dispatchEvent(new CustomEvent('start_chat', { 
      detail: { 
        id: chat.otherUser.id, 
        name: `${chat.otherUser.firstName} ${chat.otherUser.lastName}`, 
        jobId: chat.job?.id 
      } 
    }));
  };

  if (loading) return <div style={{ padding: '2rem' }}>Mesajlar yükleniyor...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', color: 'var(--color-navy)', fontWeight: 800, marginBottom: '2rem' }}>Mesajlarım</h1>

      {chats.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✉️</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.5rem' }}>Henüz Mesajınız Yok</h3>
          <p style={{ color: '#6b7280' }}>İş ilanları veya teklifler üzerinden iletişime geçebilirsiniz.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {chats.map((chat, idx) => (
            <div 
              key={idx} 
              onClick={() => openChat(chat)}
              style={{ 
                background: '#fff', 
                padding: '1.5rem', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.5rem',
                cursor: 'pointer',
                border: chat.isRead ? 'none' : '2px solid var(--color-gold)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                background: '#f1f5f9', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                👤
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-navy)' }}>
                    {chat.otherUser.firstName} {chat.otherUser.lastName}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {new Date(chat.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                
                {chat.job && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-gold)', fontWeight: 700, marginBottom: '4px' }}>
                    📌 İhale: {chat.job.title}
                  </div>
                )}
                
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                  {chat.lastMessage}
                </p>
              </div>

              {!chat.isRead && (
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-gold)' }}></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
