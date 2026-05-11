'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/currency';

export default function IhaleOnayPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const { user } = useAuth();

  const [job, setJob] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const calculateTimeRemaining = (endTime: string) => {
    const total = Date.parse(endTime) - now;
    if (total <= 0) return "Süre Doldu";
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const seconds = Math.floor((total / 1000) % 60);
    return `${days > 0 ? days + ' gün ' : ''}${hours} saat ${minutes} dk ${seconds} sn`;
  };

  const fetchData = async () => {
    try {
      const [jobData, bidsData] = await Promise.all([
        fetch(`/api/v1/jobs/${jobId}`, { credentials: 'include' }).then(res => res.json()),
        fetch(`/api/v1/bids/job/${jobId}/employer`, { credentials: 'include' }).then(res => res.json())
      ]);
      setJob(jobData);
      setBids(Array.isArray(bidsData) ? bidsData : (bidsData?.data || []));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Veriler yüklenirken bir sorun oluştu.');
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [jobId]);

  const handleAcceptBid = async (bidId: string) => {
    if (!confirm('Bu teklifi ve işçiyi onaylıyor musunuz?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/bids/${bidId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Onay Başarısız.');
      alert('Teklif kabul edildi. İş süreci başladı.');
      fetchData();
    } catch (err: any) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleConfirmStart = async () => {
    if (!confirm('Ustanın işe başladığını onaylıyor musunuz?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/confirm-start`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Onay başarısız');
      fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(false); }
  };

  const handleConfirmFinish = async () => {
    if (!confirm('İşin bittiğini onaylıyor musunuz?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/confirm-finish`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Onay başarısız');
      setShowRatingModal(true); 
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(false); }
  };

  const handleSubmitRating = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jobId: jobId,
          fromId: user?.id,
          toId: job.winnerId,
          rating,
          comment: ratingComment
        })
      });
      if (!res.ok) throw new Error('Yorum gönderilemedi');
      alert('Değerlendirmeniz için teşekkürler!');
      setShowRatingModal(false);
      fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(false); }
  };

  const handleCancelJob = async () => {
    if (!confirm('İhaleyi iptal etmek istediğinize emin misiniz?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('İptal başarısız.');
      alert('İhale iptal edildi.');
      router.push('/isveren/ihaleler');
    } catch (err: any) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleRejectBid = async (bidId: string) => {
    if (!confirm('Bu teklifi reddetmek istediğinize emin misiniz?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/bids/${bidId}/reject`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Reddetme işlemi başarısız.');
      alert('Teklif reddedildi.');
      fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Yükleniyor...</div>;
  if (!job) return <div style={{ padding: '2rem', textAlign: 'center' }}>İhale bulunamadı.</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem', paddingBottom: '5rem' }}>
      {/* ... existing code ... */}
      {/* Üst Bilgi Paneli (Kontrol Paneli Stili) */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '24px', 
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', 
        marginBottom: '2rem', 
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Durum Şeridi */}
        <div style={{ 
          background: job.status === 'ACTIVE' ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'var(--color-navy)',
          padding: '0.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
            {job.status === 'ACTIVE' ? '⏳ TEKLİF ALMA AŞAMASI' : '📋 İHALE YÖNETİMİ'}
          </span>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '4px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
            ← Geri Dön
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
                {job.title}
              </h1>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                  📁 {job.category?.name || 'Sektör Belirtilmedi'}
                </span>
                <span style={{ background: '#f0fdf4', color: '#166534', padding: '4px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                  📍 {job.city?.name} / {job.district?.name}
                </span>
              </div>
            </div>
            
            <div style={{ textAlign: 'right', minWidth: '200px' }}>
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '1rem', borderRadius: '16px' }}>
                <span style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 700, display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Kalan Süre</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#92400e' }}>
                  {calculateTimeRemaining(job.auctionEnd)}
                </div>
              </div>
            </div>
          </div>

          {/* Tarih ve İstatistik Paneli */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '1.5rem', 
            background: '#f8fafc', 
            padding: '1.5rem', 
            borderRadius: '20px',
            marginBottom: '2rem'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Başlangıç</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)' }}>{new Date(job.createdAt).toLocaleDateString('tr-TR')}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Planlanan Bitiş</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)' }}>{new Date(job.auctionEnd).toLocaleDateString('tr-TR')}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Toplam Teklif</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-gold)' }}>{bids.length} Adet</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
               {job.status !== 'COMPLETED' && job.status !== 'CANCELLED' && (
                <button onClick={handleCancelJob} disabled={actionLoading} className="btn btn-danger btn-sm" style={{ width: '100%', borderRadius: '10px' }}>
                  🚫 İhaleyi İptal Et
                </button>
              )}
            </div>
          </div>

          {/* Açıklama Alanı */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>İhale Açıklaması</h3>
            <div style={{ 
              fontSize: '1.05rem', 
              color: '#475569', 
              lineHeight: 1.6, 
              whiteSpace: 'pre-wrap',
              background: '#fff',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid #f1f5f9'
            }}>
              {job.description || 'Açıklama belirtilmemiş.'}
            </div>
          </div>
        </div>
      </div>

      {job.winnerId && job.status !== 'CANCELLED' && (
        <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', marginBottom: '2rem', border: '2px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '1.5rem' }}>🛠️ İş Akışı Yönetimi</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block' }}>BAŞLAMA</span>
              <span style={{ fontWeight: 700 }}>{job.actualStartDate ? new Date(job.actualStartDate).toLocaleString('tr-TR') : '---'}</span>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block' }}>BİTİŞ</span>
              <span style={{ fontWeight: 700 }}>{job.actualEndDate ? new Date(job.actualEndDate).toLocaleString('tr-TR') : '---'}</span>
            </div>
            {job.totalDurationSeconds && (
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block' }}>SÜRE</span>
                <span style={{ fontWeight: 900, color: '#10b981' }}>{Math.floor(job.totalDurationSeconds / 3600)}s {Math.floor((job.totalDurationSeconds % 3600) / 60)}d</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {job.status === 'IN_PROGRESS' && (
              <div style={{ width: '100%', padding: '1rem', background: 'var(--color-gold-pale)', color: 'var(--color-navy)', borderRadius: '12px', textAlign: 'center', fontWeight: 700, border: '1px solid var(--color-gold)' }}>
                🏃 İŞ ŞU ANDA DEVAM EDİYOR... (Süre Sayılıyor)
              </div>
            )}
            {job.status === 'FINISHED' && (
              <button onClick={handleConfirmFinish} disabled={actionLoading} className="btn btn-success btn-full" style={{ background: '#10b981', padding: '1rem' }}>
                🏁 USTA İŞİ BİTİRDİ - SON ONAYI VER VE ÖDEMEYİ TAMAMLA
              </button>
            )}
            {job.status === 'COMPLETED' && (
               <div style={{ width: '100%', padding: '1rem', background: '#f0fdf4', color: '#166534', borderRadius: '8px', textAlign: 'center', fontWeight: 700 }}>
                🏆 İŞ BAŞARIYLA TAMAMLANDI VE ARŞİVLENDİ.
               </div>
            )}
          </div>
        </div>
      )}

      {showRatingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', maxWidth: '500px', width: '90%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '1rem' }}>Yıldız Verin ⭐️</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', fontSize: '2.5rem', marginBottom: '1.5rem' }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: s <= rating ? '#eab308' : '#e2e8f0' }}>★</button>
              ))}
            </div>
            <textarea placeholder="Yorumunuz..." value={ratingComment} onChange={e => setRatingComment(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '100px', marginBottom: '1.5rem' }} />
            <button onClick={handleSubmitRating} disabled={actionLoading} className="btn btn-navy btn-full">Değerlendirmeyi Gönder</button>
          </div>
        </div>
      )}

      {job.winner && (
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white', padding: '2rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>🏆 Kazanan: {job.winner.firstName} {job.winner.lastName}</h3>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div><span style={{ opacity: 0.7, fontSize: '0.8rem' }}>TEL:</span> {job.winnerPhone || '---'}</div>
              <div><span style={{ opacity: 0.7, fontSize: '0.8rem' }}>EMAIL:</span> {job.winnerEmail || '---'}</div>
            </div>
          </div>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('start_chat', { 
              detail: { id: job.winnerId, name: `${job.winner.firstName} ${job.winner.lastName}` } 
            }))}
            className="btn btn-gold"
            style={{ padding: '0.75rem 1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>💬</span> Mesaj Gönder
          </button>
        </div>
      )}

      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>📬 Gelen Teklifler</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {bids.filter(b => b.status !== 'REJECTED').map(bid => {
          const isWinner = job.winnerId === bid.workerId;
          return (
            <div key={bid.id} style={{ background: '#fff', border: isWinner ? '2px solid #10b981' : '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '16px', position: 'relative' }}>
              {isWinner && <div style={{ position: 'absolute', top: '-10px', right: '10px', background: '#10b981', color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>KAZANAN</div>}
              <div style={{ fontWeight: 800 }}>{bid.worker.firstName} {bid.worker.lastName}</div>
              <div style={{ color: '#eab308', fontSize: '0.9rem' }}>★ {bid.worker.leaderScore?.toFixed(1) || '0.0'}</div>
              <div style={{ marginTop: '1rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-gold)' }}>{formatCurrency(bid.amount)}</div>
              
              {bid.note && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  background: '#f8fafc', 
                  borderRadius: '12px', 
                  fontSize: '0.85rem', 
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.5'
                }}>
                  <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--color-navy)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Teklif Notu:</strong>
                  {bid.note}
                </div>
              )}

              {!job.winnerId && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleAcceptBid(bid.id)} 
                    disabled={actionLoading} 
                    className="btn btn-gold" 
                    style={{ 
                      flex: 1,
                      minWidth: '140px',
                      fontSize: '0.75rem', 
                      padding: '0.75rem 0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      lineHeight: '1.2',
                      textAlign: 'center',
                      whiteSpace: 'normal',
                      fontWeight: 800
                    }}
                  >
                    ✅ ONAYLA & BAŞLAT
                  </button>
                  <button 
                    onClick={() => handleRejectBid(bid.id)} 
                    disabled={actionLoading} 
                    className="btn btn-danger" 
                    style={{ 
                      flex: 1,
                      minWidth: '140px',
                      fontSize: '0.75rem', 
                      padding: '0.75rem 0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      lineHeight: '1.2',
                      textAlign: 'center',
                      whiteSpace: 'normal',
                      fontWeight: 800,
                      background: '#ef4444'
                    }}
                  >
                    ❌ TEKLİFİ REDDET
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
