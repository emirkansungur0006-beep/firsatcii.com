'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AdminIhalelerPage() {
  const { user } = useAuth();
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [cities, setCities] = useState<any[]>([]);
  
  // Filtre State'leri
  const [filters, setFilters] = useState({
    status: '',
    cityId: ''
  });

  useEffect(() => {
    // İl listesini çek (Filtreleme için)
    fetch('/api/v1/locations/cities').then(res => res.json()).then(setCities).catch(console.error);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = () => {
    setLoading(true);
    let url = '/api/v1/jobs?limit=100';
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.cityId) url += `&cityId=${filters.cityId}`;

    fetch(url, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setJobs(data.data || data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return { bg: '#dcfce7', text: '#166534' };
      case 'LOCKED': return { bg: '#fee2e2', text: '#991b1b' };
      case 'COMPLETED': return { bg: '#e0e7ff', text: '#3730a3' };
      case 'CANCELLED': return { bg: '#f3f4f6', text: '#374151' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  if (!user || user.role !== 'ADMIN') return <div>Yetkisiz Erişim</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--color-navy)', fontWeight: 800 }}>Kapsamlı İhale Yönetimi</h1>
      </div>

      {/* FILTER BAR */}
      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563' }}>Durum Filtresi</label>
          <select 
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
            value={filters.status}
            onChange={e => setFilters({...filters, status: e.target.value})}
          >
            <option value="">Tümü</option>
            <option value="ACTIVE">Aktif (Teklif Alıyor)</option>
            <option value="LOCKED">Kilitli (Son 10 Dk)</option>
            <option value="COMPLETED">Tamamlanmış</option>
            <option value="CANCELLED">İptal Edilmiş</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563' }}>Lokasyon (İl) Filtresi</label>
          <select 
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
            value={filters.cityId}
            onChange={e => setFilters({...filters, cityId: e.target.value})}
          >
            <option value="">Tüm Türkiye</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* DATA GRID */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '1rem', color: '#475569', fontWeight: 700 }}>İhale Kodu</th>
              <th style={{ padding: '1rem', color: '#475569', fontWeight: 700 }}>Başlık & Kategori</th>
              <th style={{ padding: '1rem', color: '#475569', fontWeight: 700 }}>Lokasyon</th>
              <th style={{ padding: '1rem', color: '#475569', fontWeight: 700 }}>Durum</th>
              <th style={{ padding: '1rem', color: '#475569', fontWeight: 700 }}>Bitiş Tarihi</th>
              <th style={{ padding: '1rem', color: '#475569', fontWeight: 700 }}>Teklif Sayısı</th>
              <th style={{ padding: '1rem', color: '#475569', fontWeight: 700 }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>Veriler yükleniyor...</td></tr>
            ) : jobs.length === 0 ? (
               <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Kriterlere uygun ihale bulunamadı.</td></tr>
            ) : (
              jobs.map(job => {
                const statusColor = getStatusColor(job.status);
                return (
                  <tr key={job.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', fontFamily: 'monospace', color: '#64748b' }}>
                      {job.id.substring(0,8)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-navy)' }}>{job.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{job.category?.name || '-'}</div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {job.city?.name || 'Belirtilmemiş'} / {job.district?.name || '-'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        background: statusColor.bg, color: statusColor.text, 
                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 
                      }}>
                        {job.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {new Date(job.auctionEnd).toLocaleString('tr-TR')}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 800, textAlign: 'center' }}>
                      {job._count?.bids || 0}
                    </td>
                    <td style={{ padding: '1rem' }}>
                       {/* Eylemler (İptal et, Detay gör vb.) */}
                       <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', background: '#e2e8f0', color: '#334155' }}>
                         Detay
                       </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
