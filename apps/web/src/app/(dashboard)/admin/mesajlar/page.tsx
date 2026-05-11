'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Chat {
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  lastMessage: string;
  createdAt: string;
  isRead: boolean;
}

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/messages/recent', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setChats(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'slideIn 0.4s ease-out' }}>
      {/* BAŞLIK */}
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title">Gelen Mesajlar</h1>
          <p style={{ color: 'var(--color-gray-500)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Kullanıcılardan gelen destek ve iletişim mesajlarını buradan yönetin.
          </p>
        </div>
        <div className="badge badge-gold" style={{ padding: '0.8rem 1.2rem', borderRadius: '12px' }}>
          💬 {chats.length} Aktif Konuşma
        </div>
      </div>

      {/* MESAJ LİSTESİ */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(0,31,63,0.08)' }}>
        {chats.length === 0 ? (
          <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--color-gray-400)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✉️</div>
            <h3 style={{ fontWeight: 700, color: 'var(--color-navy)' }}>Henüz Mesaj Yok</h3>
            <p>Sistem üzerinden gönderilen mesajlar burada görünecektir.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {chats.map((chat, index) => (
              <div 
                key={chat.otherUser.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1.5rem 2rem',
                  borderBottom: index !== chats.length - 1 ? '1px solid #f1f5f9' : 'none',
                  transition: 'all 0.2s ease',
                  background: chat.isRead ? 'transparent' : 'rgba(255, 195, 0, 0.03)',
                  position: 'relative'
                }}
                className="chat-item-row"
              >
                {!chat.isRead && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--color-gold)' }} />
                )}

                {/* Profil Foto / Baş Harfler */}
                <div 
                  className="chat-user-avatar"
                  style={{
                    width: 55, height: 55, borderRadius: '15px',
                    background: 'var(--color-navy)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', fontWeight: 800, marginRight: '1.5rem',
                    boxShadow: '0 8px 15px rgba(0,31,63,0.1)'
                  }}
                >
                  {chat.otherUser.profilePicture ? (
                    <img src={chat.otherUser.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '15px' }} />
                  ) : (
                    <>{chat.otherUser.firstName[0]}{chat.otherUser.lastName[0]}</>
                  )}
                </div>

                {/* Kullanıcı ve Mesaj Bilgisi */}
                <div className="chat-message-info" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div>
                      <span style={{ fontWeight: 800, color: 'var(--color-navy)', fontSize: '1.05rem' }}>
                        {chat.otherUser.firstName} {chat.otherUser.lastName}
                      </span>
                      <span style={{ 
                        marginLeft: '1rem', padding: '0.2rem 0.6rem', background: '#f1f5f9', 
                        borderRadius: '6px', fontSize: '0.75rem', color: 'var(--color-gray-600)', fontWeight: 600 
                      }}>
                        {chat.otherUser.email}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', fontWeight: 500 }}>
                      {new Date(chat.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ 
                    margin: 0, color: chat.isRead ? 'var(--color-gray-500)' : 'var(--color-navy)', 
                    fontSize: '0.95rem', fontWeight: chat.isRead ? 400 : 600,
                    maxWidth: '85%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {chat.lastMessage}
                  </p>
                </div>

                {/* Eylem Butonu */}
                <button 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('start_chat', { 
                      detail: { 
                        id: chat.otherUser.id,
                        name: `${chat.otherUser.firstName} ${chat.otherUser.lastName}`,
                        profilePicture: chat.otherUser.profilePicture
                      } 
                    }));
                  }}
                  className="chat-action-btn"
                  style={{
                    background: 'var(--color-gold)', 
                    color: 'var(--color-navy)', 
                    borderRadius: '12px', 
                    padding: '0.7rem 1.4rem', 
                    marginLeft: '1.5rem',
                    fontWeight: 800, 
                    fontSize: '0.85rem', 
                    border: 'none', 
                    cursor: 'pointer',
                    display: 'block',
                    boxShadow: '0 4px 12px rgba(255, 195, 0, 0.3)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Mesajı Gör
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .chat-item-row:hover {
          background: #f8fafc !important;
        }
        @media (max-width: 768px) {
          .chat-item-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 1.25rem !important;
            gap: 1rem !important;
          }
          .chat-user-avatar {
            margin-right: 0 !important;
            margin-bottom: 0.5rem !important;
          }
          .chat-message-info {
            width: 100% !important;
          }
          .chat-action-btn {
            width: 100% !important;
            margin-left: 0 !important;
            margin-top: 0.5rem !important;
            text-align: center !important;
          }
        }
      `}</style>
    </div>
  );
}
