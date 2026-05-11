'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function IsverenIhalelerimPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // İşverenin kendi açtığı ihaleleri çekiyoruz. (API'nin uygun bir endpoint ile dönüş yaptığı varsayılır)
    fetch('/api/v1/jobs?employerId=' + user?.id, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data ? data.data : []);
        setJobs(list);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--color-navy)', fontWeight: 800 }}>İhalelerim</h1>
        <Link href="/isveren/is-olustur" className="btn btn-primary">
          + Yeni İhale Aç
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📂</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.5rem' }}>Henüz Bir İhale Açmadınız</h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>İhtiyacınız olan hizmeti bulmak için hemen ilk ihaleyi başlatın.</p>
          <Link href="/isveren/is-olustur" className="btn btn-primary">
            İhale Oluştur
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {jobs.map(job => {
            const timeLeft = new Date(job.auctionEnd).getTime() - new Date().getTime();
            const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            return (
              <div key={job.id} style={{ 
                background: '#fff', 
                borderRadius: '20px', 
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Üst Şerit: Durum */}
                <div style={{ 
                  background: job.status === 'ACTIVE' ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : '#1e293b',
                  padding: '0.5rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                    {job.status === 'ACTIVE' ? '🚀 İHALE YAYINDA' : '🏁 TAMAMLANDI'}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}>
                    ID: #{job.id.slice(0,8)}
                  </span>
                </div>

                <div style={{ padding: '1.5rem' }}>
                  {/* Başlık ve Sektör */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
                      {job.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                      <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>
                        📁 {job.category?.name || 'Genel Sektör'}
                      </span>
                    </div>
                  </div>

                  {/* Tarih Bilgileri */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '1rem', 
                    background: '#f8fafc', 
                    padding: '1rem', 
                    borderRadius: '12px',
                    marginBottom: '1.25rem'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Başlangıç</span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                        {new Date(job.publishDate || job.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Bitiş</span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                        {new Date(job.auctionEnd).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>

                  {/* Kalan Süre Vurgusu */}
                  {timeLeft > 0 ? (
                    <div style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '0.75rem', background: '#fffbeb', border: '1px dashed #f59e0b', borderRadius: '12px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, display: 'block', marginBottom: '4px' }}>⏱️ KALAN SÜRE</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#92400e' }}>
                        {daysLeft > 0 ? `${daysLeft} Gün ` : ''}{hoursLeft} Saat {minutesLeft} Dakika
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '0.75rem', background: '#f1f5f9', borderRadius: '12px', color: '#64748b', fontWeight: 700 }}>
                      Süre Doldu
                    </div>
                  )}

                  {/* Alt Kısım: Teklifler ve Aksiyon */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Gelen Teklif</span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-gold)' }}>
                        {job._count?.bids || 0} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Adet</span>
                      </div>
                    </div>
                    <Link href={`/isveren/ihaleler/${job.id}/onay`} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      Yönet / Onayla ➔
                    </Link>
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
