'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function UstalarDirectoryPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    categoryId: '',
    cityId: '',
    districtId: '',
    search: ''
  });

  const [districts, setDistricts] = useState<any[]>([]);

  useEffect(() => {
    if (filters.cityId) {
      fetch(`/api/v1/locations/cities/${filters.cityId}/districts`)
        .then(res => res.json())
        .then(setDistricts)
        .catch(() => setDistricts([]));
    } else {
      setDistricts([]);
    }
  }, [filters.cityId]);

  useEffect(() => {
    // İlk yüklemede kategorileri ve illeri çek
    Promise.all([
      fetch('/api/v1/categories').then(res => res.json()),
      fetch('/api/v1/locations/cities').then(res => res.json())
    ]).then(([cats, cts]) => {
      setCategories(cats || []);
      setCities(cts || []);
    });
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    const query = new URLSearchParams(filters as any).toString();
    try {
      const res = await fetch(`/api/v1/users/workers?${query}`, { credentials: 'include' });
      const data = await res.json();
      setWorkers(data || []);
    } catch (error) {
      console.error('Usta listesi çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchWorkers(), 500);
    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '1rem' }}>
          Usta Bul & Yetenek Keşfet
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
          2026 vizyonuyla en iyi ustaları puanlarına ve referanslarına göre listeleyin.
        </p>
      </header>

      {/* Filtreleme Paneli */}
      <section className="filter-panel">
        <input 
          type="text" 
          name="search"
          placeholder="Usta adı veya yetenek ara..." 
          className="filter-input-main"
          value={filters.search}
          onChange={handleFilterChange}
        />
        <div className="filter-selects">
          <select 
            name="categoryId"
            className="filter-select"
            value={filters.categoryId}
            onChange={handleFilterChange}
          >
            <option value="">Tüm Sektörler</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <select 
            name="cityId"
            className="filter-select"
            value={filters.cityId}
            onChange={(e) => setFilters({ ...filters, cityId: e.target.value, districtId: '' })}
          >
            <option value="">Tüm İller</option>
            {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
          </select>
          <select 
            name="districtId"
            className="filter-select"
            value={filters.districtId}
            onChange={handleFilterChange}
            disabled={!filters.cityId}
          >
            <option value="">{filters.cityId ? 'Tüm İlçeler' : 'Önce İl Seçin'}</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </section>

      <style jsx>{`
        .filter-panel {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          padding: 1.5rem;
          borderRadius: 20px;
          boxShadow: 0 10px 25px -5px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2.5rem;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .filter-input-main {
          width: 100%;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .filter-input-main:focus {
          border-color: var(--color-navy);
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
          outline: none;
        }

        .filter-selects {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .filter-select {
          padding: 0.875rem 1rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #fff;
          font-size: 0.95rem;
          cursor: pointer;
        }

        .workers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .workers-grid {
            grid-template-columns: 1fr;
          }
          .filter-panel {
            padding: 1rem;
          }
          .filter-selects {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Usta Kartları */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Yetenekler Yükleniyor...</div>
      ) : (
        <div className="workers-grid">
          {workers.map(worker => (
            <div key={worker.id} style={{ 
              background: '#fff', 
              borderRadius: '24px', 
              padding: '1.5rem', 
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid #f1f5f9',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Link href={`/isveren/ustalar/${worker.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '15px', overflow: 'hidden', background: '#f8fafc' }}>
                    {worker.profilePicture ? (
                      <img src={worker.profilePicture} alt={worker.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👷</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1.125rem', margin: 0 }}>{worker.firstName} {worker.lastName}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#eab308', marginTop: '4px' }}>
                      <span>★</span>
                      <span style={{ color: '#1e293b', fontWeight: 600 }}>{worker.workerProfile?.avgRating || 'Yeni'}</span>
                      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>({worker.workerProfile?.reviewCount || 0} yorum)</span>
                    </div>
                  </div>
                </div>

                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#475569', 
                  marginBottom: '1rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  height: '2.5rem'
                }}>
                  {worker.workerProfile?.aboutMe || 'Harika bir uzmanlık profili...'}
                </p>
              </Link>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                {(worker.workerProfile?.skills || []).slice(0, 3).map((s: string) => (
                  <span key={s} style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                    {s}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>📍 {worker.city?.name || 'Tüm Türkiye'}</span>
                  <Link href={`/isveren/ustalar/${worker.id}`} style={{ color: 'var(--color-navy)', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}>Profili Gör →</Link>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    href={`/isveren/is-olustur?targetWorkerId=${worker.id}&workerName=${worker.firstName}%20${worker.lastName}`}
                    style={{ 
                      flex: 1,
                      textAlign: 'center', 
                      background: 'var(--color-navy)', 
                      color: 'white', 
                      padding: '0.75rem', 
                      borderRadius: '10px', 
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    🤝 İhale Ver
                  </Link>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('start_chat', { 
                      detail: { id: worker.id, name: `${worker.firstName} ${worker.lastName}` } 
                    }))}
                    style={{ 
                      flex: 1,
                      background: 'white', 
                      color: 'var(--color-navy)', 
                      padding: '0.75rem', 
                      borderRadius: '10px', 
                      fontWeight: 700,
                      border: '1px solid var(--color-navy)',
                      cursor: 'pointer'
                    }}
                  >
                    💬 Mesaj
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && workers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <p style={{ fontSize: '1.25rem', color: '#64748b' }}>Aradığınız kriterlerde bir usta bulunamadı.</p>
        </div>
      )}
    </div>
  );
}
