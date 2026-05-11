'use client';
// apps/web/src/app/(dashboard)/isveren/page.tsx
// İşveren Dashboard

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function IsverenDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/jobs?limit=10', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setJobs(data?.data || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const myJobs = jobs.filter(j => j.employerId === user?.id);
  const activeCount = myJobs.filter(j => j.status === 'ACTIVE').length;
  const completedCount = myJobs.filter(j => j.status === 'COMPLETED').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Merhaba, {user?.firstName}! 👋</h1>
          <p style={{ color: 'var(--color-gray-500)', marginTop: '0.25rem' }}>
            İhalelerinizi yönetin ve en iyi teklifleri seçin.
          </p>
        </div>
        {user?.permissions?.view_home_create_job_btn !== false && (
          <Link href="/isveren/is-olustur" className="btn btn-primary">
            ➕ Yeni İhale Aç
          </Link>
        )}
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {[
          { icon: '📋', label: 'Toplam İhale', value: myJobs.length },
          { icon: '⚡', label: 'Aktif İhale', value: activeCount },
          { icon: '✅', label: 'Tamamlandı', value: completedCount },
          { icon: '💰', label: 'Toplam Teklif', value: myJobs.reduce((s, j) => s + (j._count?.bids || 0), 0) },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div className="stat-card-icon">{stat.icon}</div>
            <div className="stat-card-value">{stat.value}</div>
            <div className="stat-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-navy)' }}>
            📋 Son İhalelerim
          </h3>
          <Link href="/isveren/ihaleler" className="btn btn-secondary btn-sm">Tümü →</Link>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className="spinner"></div>
          </div>
        ) : myJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--color-gray-500)', marginBottom: '1rem' }}>
              Henüz ihale açmadınız.
            </p>
            {user?.permissions?.view_home_create_job_btn !== false && (
              <Link href="/isveren/is-olustur" className="btn btn-primary">
                ➕ İlk İhalenizi Açın
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {myJobs.slice(0, 5).map((job) => (
              <Link key={job.id} href={`/isveren/ihaleler/${job.id}/onay`} className="job-card" style={{ display: 'block', padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 800, color: 'var(--color-navy)', fontSize: '1rem', flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                      {job.title}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-gold)', marginLeft: '10px' }}>
                      {job._count?.bids || 0}
                      <span style={{ fontSize: '0.75rem', fontWeight: 500 }}> teklif</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>
                      {job.category?.name} · {new Date(job.auctionEnd).toLocaleDateString('tr-TR')} bitiş
                    </div>
                    <span className={`badge ${
                      job.status === 'ACTIVE' ? 'badge-success'
                      : job.status === 'LOCKED' ? 'badge-warning'
                      : job.status === 'COMPLETED' ? 'badge-navy'
                      : 'badge-danger'
                    }`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                      {job.status === 'ACTIVE' ? '● Aktif'
                        : job.status === 'LOCKED' ? '🔒 Kilitli'
                        : job.status === 'COMPLETED' ? '✅ Tamamlandı'
                        : '❌ İptal'}
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
