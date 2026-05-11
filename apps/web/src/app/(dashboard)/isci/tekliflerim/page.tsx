'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

// Countdown Timer Komponenti
const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, seconds: number }>({ hours: 0, minutes: 0, seconds: 0 });
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const end = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = end - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        setIsLocked(true);
        return;
      }

      // Son 10 dakika (600000 ms) kontrolü (Anti-sniper kilidi görselleştirme)
      if (distance <= 600000 && !isLocked) {
        setIsLocked(true);
      }

      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, isLocked]);

  if (isLocked) {
    return <span style={{ color: '#dc2626', fontWeight: 800 }}>🔒 Tekliflere Kapalı (Son Düzlük) Veya Bitti</span>;
  }

  return (
    <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: '#b45309' }}>
      {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
    </span>
  );
};

export default function MyBidsPage() {
  const { user } = useAuth();
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'accepted'>('all');

  useEffect(() => {
    fetch('/api/v1/bids/my-bids', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const fetchedBids = Array.isArray(data) ? data : (data?.data ? data.data : []);
        setBids(fetchedBids);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredBids = filter === 'accepted' ? bids.filter(b => b.status === 'ACCEPTED') : bids;

  if (loading) return <div>Teklifleriniz yükleniyor...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--color-navy)', fontWeight: 800 }}>Tekliflerim (My Bids)</h1>
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '12px' }}>
          <button 
            onClick={() => setFilter('all')}
            style={{ 
              padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', 
              background: filter === 'all' ? 'white' : 'transparent',
              color: filter === 'all' ? 'var(--color-navy)' : '#64748b',
              fontWeight: 700, cursor: 'pointer', boxShadow: filter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Tümü
          </button>
          <button 
            onClick={() => setFilter('accepted')}
            style={{ 
              padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', 
              background: filter === 'accepted' ? '#10b981' : 'transparent',
              color: filter === 'accepted' ? 'white' : '#64748b',
              fontWeight: 700, cursor: 'pointer', boxShadow: filter === 'accepted' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Kabul Edilenler 🏆
          </button>
        </div>
      </div>

      {filteredBids.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{filter === 'accepted' ? '⏳' : '📝'}</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
            {filter === 'accepted' ? 'Henüz Kabul Edilen Teklifiniz Yok' : 'Henüz Bir Teklif Vermediniz'}
          </h3>
          <p style={{ color: '#6b7280' }}>
            {filter === 'accepted' ? 'Teklif verdiğiniz ihalelerin sonuçlanmasını bekleyin.' : 'Aktif ihaleleri inceleyip ilk teklifinizi hemen verin!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {filteredBids.map(bid => (
            <div key={bid.id} style={{ 
              background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', 
              display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 1fr 1fr 1fr', alignItems: 'center', gap: '1rem',
              borderLeft: bid.status === 'ACCEPTED' ? '6px solid #10b981' : 'none'
            }}>
              
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>İhale Başlığı</span>
                  {bid.status === 'ACCEPTED' && <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900 }}>KABUL EDİLDİ</span>}
                  {bid.status === 'REJECTED' && <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900 }}>REDDEDİLDİ</span>}
                </div>
                <h3 className="text-break" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-navy)' }}>{bid.job?.title || 'Bilinmeyen İhale'}</h3>
                {bid.status === 'ACCEPTED' && (
                  <a href={`/isci/ihaleler/${bid.jobId}`} style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, textDecoration: 'underline', marginTop: '8px', display: 'inline-block' }}>
                    İş Takibi Sayfasına Git →
                  </a>
                )}
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Durum / Kalan Süre</span>
                <br/>
                {bid.job?.status === 'COMPLETED' ? <span style={{ color: '#10b981', fontWeight: 700 }}>İhale Bitti</span> : <CountdownTimer targetDate={bid.job?.auctionEnd} />}
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span> 
                  Güncel En Düşük
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                  {bid.job?.lowestBid ? `₺${bid.job.lowestBid}` : 'Henüz Yok'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Benim Teklifim</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy)' }}>
                  ₺{bid.amount}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
