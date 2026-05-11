'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function IsverenBildirimlerPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/notifications', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data ? data.data : []);
        setNotifications(list);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/v1/notifications/read-all', { method: 'PATCH', credentials: 'include' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new CustomEvent('notifications_read'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH', credentials: 'include' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      window.dispatchEvent(new CustomEvent('notifications_read'));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--color-navy)', fontWeight: 800, margin: 0 }}>Bildirimlerim</h1>
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAllRead}
            className="btn btn-secondary btn-sm"
          >
            ✅ Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.5rem' }}>Yeni Bildirim Yok</h3>
          <p style={{ color: '#6b7280' }}>İhaleleriniz sonuçlandığında veya teklif geldiğinde buradan haberdar olacaksınız.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {notifications.map(n => {
            let targetHref = '#';
            if (n.jobId) {
              targetHref = `/isveren/ihaleler/${n.jobId}/onay`;
            } else if (n.type === 'NEW_MESSAGE' && n.metadata?.senderId) {
              targetHref = '#'; // Mesajlar için CustomEvent kullanıyoruz ama istersen link de verilebilir
            }

            return (
              <div 
                key={n.id} 
                onClick={() => {
                  if (!n.isRead) handleMarkOneRead(n.id);
                  
                  // Akıllı Yönlendirme
                  if (n.type === 'NEW_MESSAGE' && n.metadata?.senderId) {
                    window.dispatchEvent(new CustomEvent('start_chat', { 
                      detail: { id: n.metadata.senderId, name: n.metadata.senderName || 'Sohbet' } 
                    }));
                  } else if (targetHref !== '#') {
                    window.location.href = targetHref;
                  }
                }}
                style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  background: n.isRead ? '#f8fafc' : '#fff', 
                  padding: '1.25rem', 
                  borderRadius: '12px', 
                  borderLeft: `4px solid ${n.isRead ? '#e2e8f0' : '#3b82f6'}`,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: n.isRead ? '0 2px 4px rgba(0,0,0,0.02)' : '0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -4px rgba(59, 130, 246, 0.1)',
                  border: n.isRead ? '1px solid transparent' : '1px solid #dbeafe',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {!n.isRead && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></span>
                )}
                <div style={{ fontSize: '1.75rem', opacity: n.isRead ? 0.5 : 1 }}>
                  {n.type === 'NEW_BID' ? '💰' : n.type === 'NEW_MESSAGE' ? '💬' : '🔔'}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 700, color: n.isRead ? '#64748b' : 'var(--color-navy)', marginBottom: '4px', fontSize: '1.05rem' }}>{n.title}</h4>
                  <p style={{ color: n.isRead ? '#94a3b8' : '#475569', fontSize: '0.9rem', lineHeight: 1.4 }}>{n.message}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(n.createdAt).toLocaleString('tr-TR')}</span>
                    <span style={{ fontSize: '0.75rem', color: n.isRead ? '#94a3b8' : 'var(--color-navy)', fontWeight: 600 }}>
                      {n.type === 'NEW_MESSAGE' ? 'Mesajı Aç →' : 'Detayları Gör →'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
