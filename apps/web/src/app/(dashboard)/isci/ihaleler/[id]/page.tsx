'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/currency';

export default function IhaleDetayPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const { user } = useAuth();

  const [job, setJob] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidNote, setBidNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    fetchData();
  }, [jobId]);

  useEffect(() => {
    if (job?.status === 'IN_PROGRESS' && job.actualStartDate) {
      const interval = setInterval(() => {
        const start = new Date(job.actualStartDate).getTime();
        const now = new Date().getTime();
        setTimerSeconds(Math.floor((now - start) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [job]);

  const fetchData = async () => {
    try {
      const [jobRes, bidsRes] = await Promise.all([
        fetch(`/api/v1/jobs/${jobId}`, { credentials: 'include' }),
        fetch(`/api/v1/bids/job/${jobId}${user?.id ? `?workerId=${user.id}` : ''}`, { credentials: 'include' })
      ]);
      const jobData = await jobRes.json();
      const bidsData = await bidsRes.json();
      setJob(jobData);
      setBids(bidsData);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartJob = async () => {
    if (!confirm('İşi başlatmak istediğinizi işverene bildirmek üzeresiniz?')) return;
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/start`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('İşlem başarısız');
      alert('İstek gönderildi. İşveren onayladığında zamanlayıcı başlayacaktır.');
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleFinishJob = async () => {
    if (!confirm('İşi bitirdiğinizi onaylıyor musunuz?')) return;
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/finish`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('İşlem başarısız');
      alert('İş tamamlandı olarak işaretlendi. İşveren onayı bekleniyor.');
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidAmount) return;
    if (job.employerId === user?.id) {
      alert('Kendi ihalenize teklif veremezsiniz!');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, amount: Number(bidAmount), note: bidNote }),
        credentials: 'include'
      });
      if (res.ok) {
        alert('Teklifiniz başarıyla iletildi.');
        setBidAmount('');
        setBidNote('');
        fetchData();
      } else {
        const error = await res.json();
        alert(error.message || 'Teklif verilirken bir hata oluştu.');
      }
    } catch (error) {
      alert('Sistemsel bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Yükleniyor...</div>;
  if (!job) return <div style={{ padding: '2rem', textAlign: 'center' }}>İhale bulunamadı.</div>;

  const isWinner = job.winnerId === user?.id;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-navy)' }}>İhale Detayı</h1>
          <span className={`badge ${job.status === 'ACTIVE' ? 'badge-gold' : 'badge-navy'}`}>
            {job.status === 'ACTIVE' ? '⏳ TEKLİF ALINIYOR' : '🔒 KAPALI / SÜREÇTE'}
          </span>
        </div>
        <h2 className="text-break" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{job.title}</h2>
        <p className="text-break" style={{ color: '#64748b', marginTop: '0.5rem' }}>{job.description}</p>
      </header>

      {isWinner && job.status !== 'ACTIVE' && (
        <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', border: '2px solid var(--color-navy)', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '1.5rem' }}>🛠️ İş Takip ve Süreç</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>DURUM</span>
              <span style={{ fontWeight: 800 }}>
                {job.status === 'AWARDED' && '⏳ Başlatma Onayı Bekliyor'}
                {job.status === 'IN_PROGRESS' && '🏃 İş Devam Ediyor'}
                {job.status === 'FINISHED' && '🏁 Bitirme Onayı Bekleniyor'}
                {job.status === 'COMPLETED' && '✅ Tamamlandı'}
              </span>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: job.status === 'IN_PROGRESS' ? '2px solid #10b981' : 'none' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>GEÇEN SÜRE</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'monospace' }}>
                {job.status === 'IN_PROGRESS' ? formatDuration(timerSeconds) : (job.totalDurationSeconds ? formatDuration(job.totalDurationSeconds) : '00:00:00')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {job.status === 'IN_PROGRESS' && (
              <button onClick={handleFinishJob} className="btn btn-success btn-finish-job" style={{ flex: 2, background: '#10b981', fontWeight: 800 }}>
                ✅ İŞİ TAMAMLADIM - İŞVERENE BİLDİR
              </button>
            )}
            {job.status === 'FINISHED' && (
              <div style={{ flex: 2, padding: '1rem', background: 'var(--color-gold-pale)', color: 'var(--color-navy)', borderRadius: '12px', textAlign: 'center', fontWeight: 700, border: '1px solid var(--color-gold)' }}>
                🏁 İŞİ BİTİRDİNİZ! İşveren onayı bekleniyor...
              </div>
            )}
            {job.status === 'COMPLETED' && (
               <div style={{ flex: 2, padding: '1rem', background: '#f0fdf4', color: '#166534', borderRadius: '8px', textAlign: 'center', fontWeight: 700 }}>
                🏆 TEBRİKLER! Bu iş başarıyla tamamlandı.
               </div>
            )}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('start_chat', { 
                detail: { id: job.employerId, name: `${job.employer.firstName} ${job.employer.lastName}` } 
              }))}
              className="btn btn-navy"
              style={{ flex: 1, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span>💬</span> Mesaj
            </button>
          </div>
        </div>
      )}

      {job.status === 'ACTIVE' && (
        <div style={{ background: '#fff', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', marginBottom: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
          {job.employerId === user?.id ? (
            <div style={{ 
              padding: '1.5rem', 
              background: '#fff1f2', 
              border: '1px solid #fda4af', 
              borderRadius: '16px',
              color: '#9f1239',
              textAlign: 'center',
              fontWeight: 700
            }}>
              ⚠️ Bu ihaleyi siz oluşturdunuz. Kendi ihalelerinize teklif veremezsiniz.
            </div>
          ) : (
            <>
              {(() => {
                const myBid = bids.find(b => b.isOwn);
                const usedRights = myBid?.updateCount || 0;
                const remainingRights = Math.max(0, 3 - usedRights);
                const hasRights = remainingRights > 0;

                return (
                  <>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '1.5rem',
                      background: hasRights ? 'var(--color-gold-pale)' : '#fee2e2',
                      padding: '1rem 1.5rem',
                      borderRadius: '16px',
                      border: `1px solid ${hasRights ? 'var(--color-gold)' : '#fda4af'}`,
                    }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <span style={{ fontSize: '1.5rem' }}>💰</span>
                        Teklif Ver
                      </h3>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Kalan Teklif Hakkınız</div>
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: 900, 
                          color: hasRights ? 'var(--color-navy)' : '#e11d48',
                          animation: hasRights ? 'pulse-gold 2s infinite' : 'none'
                        }}>
                          {remainingRights} / 3
                        </div>
                      </div>
                    </div>

                    {hasRights ? (
                      <form onSubmit={handleBidSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="number" 
                            placeholder="Teklif Tutarı (TL)" 
                            value={bidAmount} 
                            onChange={e => setBidAmount(e.target.value)} 
                            style={{ padding: '1.2rem', paddingLeft: '3rem', borderRadius: '16px', border: '2px solid #e2e8f0', width: '100%', fontSize: '1.1rem', fontWeight: 700 }} 
                            required 
                          />
                          <span style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748b' }}>₺</span>
                        </div>
                        <textarea 
                          placeholder="İşverene bir not bırakın (Opsiyonel)..." 
                          value={bidNote} 
                          onChange={e => setBidNote(e.target.value)} 
                          style={{ padding: '1.2rem', borderRadius: '16px', border: '2px solid #e2e8f0', minHeight: '100px', fontSize: '1rem' }} 
                        />
                        
                        <button 
                          type="submit" 
                          disabled={isSubmitting} 
                          className="btn btn-gold btn-full"
                          style={{ borderRadius: '18px', padding: '1.4rem' }}
                        >
                          {isSubmitting ? 'İletiliyor...' : '🚀 Teklifi Hemen Gönder'}
                        </button>

                        <div style={{ 
                          marginTop: '0.5rem', 
                          padding: '1rem', 
                          background: '#f8fafc', 
                          borderRadius: '12px', 
                          border: '1px dashed #cbd5e1',
                          fontSize: '0.85rem',
                          color: '#475569',
                          textAlign: 'center'
                        }}>
                          <div style={{ marginBottom: '4px' }}>
                            ✅ <strong>Onaylıyorum:</strong> Teklifi göndererek sistem kurallarını ve süreç takvimini kabul etmiş olursunuz.
                          </div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                            Her ihale için toplam <strong>3 kez</strong> fiyat güncelleme hakkınız vardır.
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '2rem', 
                        background: '#f8fafc', 
                        borderRadius: '20px',
                        border: '2px dashed #cbd5e1'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                        <h4 style={{ fontWeight: 800, color: 'var(--color-navy)' }}>Teklif Hakkınız Doldu</h4>
                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Bu ihale için verilen maksimum (3) teklif limitine ulaştınız. Artık bu ihale için yeni fiyat veremezsiniz.</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}

      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>📊 Mevcut Teklifler ({bids.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {bids.map((bid: any) => (
          <div key={bid.id} style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: bid.isOwn ? '2px solid var(--color-gold)' : '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--color-navy)' }}>
                {bid.isOwn ? formatCurrency(bid.amount) : '*** TL (Gizli)'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(bid.createdAt).toLocaleString('tr-TR')}</div>
            </div>
            {bid.isOwn && <span className="badge badge-gold">Senin Teklifin</span>}
            {!bid.isOwn && <span className="badge badge-navy" style={{ opacity: 0.6 }}>Diğer Teklif</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
