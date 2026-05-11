'use client';
// apps/web/src/app/(dashboard)/isci/page.tsx
// İşçi Dashboard - Bölgedeki ihaleler, teklif istatistikleri.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function IsciDashboard() {
  const { user } = useAuth();
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/jobs?limit=5&status=ACTIVE', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/v1/users/revenue', { credentials: 'include' }).then(r => r.json()),
    ])
      .then(([jobsData, revData]) => {
        setRecentJobs(jobsData?.data || []);
        if (revData && !revData.message) setRevenue(revData);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      {/* Karşılama */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Merhaba, {user?.firstName}! 👋
          </h1>
          <p style={{ color: 'var(--color-gray-500)', marginTop: '0.25rem' }}>
            Yeni fırsatlar sizi bekliyor. Tekliflerinizi kontrol edin.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-navy)' }}>
            ⭐ {user?.leaderScore.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Liderlik Puanı</div>
        </div>
      </div>

      {/* GELİR PANELİ (FIRSATÇI 2026 ÖZEL) */}
      {revenue && revenue.showRevenuePanel && (
        <div style={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
          color: 'white', 
          padding: '2rem', 
          borderRadius: '20px', 
          marginBottom: '2rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Arka plan süsü */}
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '12rem', opacity: 0.1, pointerEvents: 'none' }}>💰</div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#94a3b8' }}>💰 Gelir Paneli</h3>
              <span style={{ background: '#10b981', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>BU AY</span>
            </div>
            
            <div className="revenue-grid">
              <div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '4px' }}>Toplam Kazancın</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981' }}>
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(revenue.totalEarnings)}
                </div>
              </div>
              <div className="revenue-stat-divider">
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '4px' }}>Platform Harcaman</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f43f5e' }}>
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(revenue.estimateSpending)}
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', color: '#cbd5e1' }}>
              🚀 Fırsatçı üzerinden <strong>{revenue.completedJobsCount} iş</strong> tamamlayarak müthiş bir başarı yakaladın!
            </div>
          </div>
        </div>
      )}

      {/* Stat Kartları */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {[
          { icon: '🏆', label: 'Tamamlanan İş', value: revenue?.completedJobsCount || user?.completedJobs || 0 },
          { icon: '⭐', label: 'Liderlik Puanı', value: Number(user?.leaderScore || 0).toFixed(1) },
          { icon: '⚡', label: 'Bölgede İhale', value: recentJobs.length },
          { icon: '💰', label: 'Toplam Teklifim', value: revenue?.totalBidsCount || 0 },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div className="stat-card-icon">{stat.icon}</div>
            <div className="stat-card-value">{stat.value}</div>
            <div className="stat-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Yakındaki İhaleler */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-navy)' }}>
            🔥 Aktif İhaleler
          </h3>
          <Link href="/isci/ihaleler" className="btn btn-secondary btn-sm">
            Tümünü Gör →
          </Link>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className="spinner"></div>
          </div>
        ) : recentJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-gray-500)' }}>
            Şu an bölgenizde aktif ihale yok. 🏙️
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentJobs.map((job) => (
              <Link key={job.id} href={`/isci/ihaleler/${job.id}`} className="job-card" style={{ display: 'block' }}>
                <div className="flex-between">
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: '4px' }}>
                      {job.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>
                      {job.category?.name} · {job.city?.name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-gold)' }}>
                      {job._count?.bids || 0} Teklif
                    </div>
                    <span className={`badge ${job.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                      {job.status === 'ACTIVE' ? '● Aktif' : '🔒 Kilitli'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
