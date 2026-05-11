'use client';
// apps/web/src/app/(dashboard)/admin/page.tsx
// Gelişmiş Admin Dashboard - İstatistikler, son aktiviteler.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Stats {
  totalUsers: number;
  totalJobs: number;
  totalBids: number;
  activeJobs: number;
  roleStats: Array<{ role: string; count: number }>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/stats', { credentials: 'include' })
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Admin Paneli</h1>
        </div>
        <div className="grid-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-xl)' }}></div>
          ))}
        </div>
      </div>
    );
  }

  const STAT_CARDS = [
    { icon: '👥', label: 'Toplam Kullanıcı', value: stats?.totalUsers || 0, color: '#3B82F6' },
    { icon: '🏗️', label: 'Toplam İhale', value: stats?.totalJobs || 0, color: 'var(--color-gold)' },
    { icon: '💰', label: 'Toplam Teklif', value: stats?.totalBids || 0, color: '#10B981' },
    { icon: '⚡', label: 'Aktif İhale', value: stats?.activeJobs || 0, color: '#EF4444' },
  ];

  return (
    <div>
      {/* Başlık */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Paneli</h1>
          <p style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Tüm sistemi bu panelden yönetin
          </p>
        </div>
        <span className="badge badge-danger">👑 Süper Admin</span>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="stat-card-icon">{card.icon}</div>
            <div className="stat-card-value" style={{ color: card.color }}>
              {card.value.toLocaleString('tr-TR')}
            </div>
            <div className="stat-card-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Rol Dağılımı ve Hızlı Eylemler */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Rol Dağılımı */}
        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: '1.5rem', fontSize: '1rem' }}>
            📊 Kullanıcı Rol Dağılımı
          </h3>
          {stats?.roleStats.map((r) => {
            const total = stats.totalUsers || 1;
            const pct = Math.round((r.count / total) * 100);
            const labels: Record<string, { label: string; color: string }> = {
              WORKER: { label: '🔨 İşçi', color: 'var(--color-gold)' },
              EMPLOYER: { label: '🏢 İşveren', color: 'var(--color-navy)' },
              ADMIN: { label: '👑 Admin', color: '#EF4444' },
            };
            const info = labels[r.role] || { label: r.role, color: '#6B7280' };
            return (
              <div key={r.role} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{info.label}</span>
                  <span style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
                    {r.count} kullanıcı ({pct}%)
                  </span>
                </div>
                <div style={{ background: 'var(--color-gray-100)', borderRadius: 'var(--radius-full)', height: 8 }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: info.color, borderRadius: 'var(--radius-full)',
                    transition: 'width 1s ease',
                  }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hızlı Eylemler */}
        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: '1.5rem', fontSize: '1rem' }}>
            ⚡ Hızlı Eylemler
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: '👥 Kullanıcıları Yönet', href: '/admin/kullanicilar', color: 'btn-primary' },
              { label: '📋 Denetim Günlüğü', href: '/admin/denetim', color: 'btn-secondary' },
              { label: '🏗️ İhaleleri Gör', href: '/admin/ihaleler', color: 'btn-secondary' },
            ].map(item => (
              <Link key={item.href} href={item.href} className={`btn ${item.color} btn-full`}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
