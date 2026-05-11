'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AktifIhalelerPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());

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
    return `${days > 0 ? days + 'g ' : ''}${hours}s ${minutes}d`;
  };

  useEffect(() => {
    // İl listesini çek
    fetch('/api/v1/locations/cities').then(res => res.json()).then(data => {
      setCities(data || []);
      // Eğer kullanıcının bulunduğu bir il varsa onu varsayılan yap
      if (user?.cityId) {
        setSelectedCity(user.cityId.toString());
      }
    }).catch(console.error);
  }, [user]);

  useEffect(() => {
    if (selectedCity) {
      fetch(`/api/v1/locations/cities/${selectedCity}/districts`).then(res => res.json()).then(data => {
        setDistricts(data || []);
      }).catch(console.error);
    } else {
      setDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedCity]);

  useEffect(() => {
    // İhaleleri çek
    // Orijinalinde sadece status=ACTIVE çekiliyordu. Kullanıcı TAMAMLANDI vs de görsün diyorsa bunu kaldırabiliriz, 
    // ama "Aktif İhaleler" sayfasındayız. Status belirtmeden çekip UI'da filtreleyebiliriz veya API destekliyorsa status=ACTIVE,LOCKED,COMPLETED diyebiliriz.
    // Şimdilik API'nin kendi işleyişine göre yapıyoruz.
    const params = new URLSearchParams();
    // İşçi paneli olduğu için varsayılan olarak sadece ACTIVE gösterilebilir, 
    // ancak tüm durumları görmek için status filtresi boş bırakılabilir.
    // Şimdilik API'ye göre sadece dolu olanları ekliyoruz.
    if (selectedCity) params.append('cityId', selectedCity);
    if (selectedDistrict) params.append('districtId', selectedDistrict);
    
    // Status filtresini buraya eklemiyoruz (veya isterseniz ekleyebiliriz)
    // params.append('status', 'ACTIVE'); 

    const url = `/api/v1/jobs?${params.toString()}`;

    setLoading(true);
    fetch(url, { credentials: 'include' })
      .then(res => res.json())
      .then(result => {
        // API { data: [], pagination: {} } dönüyorsa result.data al, yoksa direkt result (array ise) al
        const fetchedJobs = result?.data ? result.data : (Array.isArray(result) ? result : []);
        setJobs(fetchedJobs);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedCity, selectedDistrict]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--color-navy)', fontWeight: 800 }}>Aktif İhaleler</h1>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select 
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', width: '200px' }}
            value={selectedCity}
            onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(''); }}
          >
            <option value="">İl Seç (Tümü)</option>
            {cities.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select 
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', width: '200px' }}
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={!selectedCity || districts.length === 0}
          >
            <option value="">İlçe Seç (Tümü)</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div>İhaleler yükleniyor...</div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.5rem' }}>Aktif İhale Bulunmamaktadır</h3>
          <p style={{ color: '#6b7280' }}>Seçtiğiniz lokasyona ait şu anda açık bir ihale yok. Lütfen daha sonra tekrar kontrol edin.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {jobs.map((job) => (
            <div key={job.id} style={{ 
              background: '#fff', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', 
              display: 'flex', 
              flexDirection: 'column',
              border: job.isFlash && job.status !== 'COMPLETED' ? '2px solid #fb7185' : '1px solid #f1f5f9',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ background: '#fffbeb', color: '#b45309', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {job.category?.name || 'Genel'}
                  </span>
                  {job.isFlash && job.status !== 'COMPLETED' && (
                    <span style={{ background: '#e11d48', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800 }}>
                      ⚡ ACİL
                    </span>
                  )}
                </div>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {job.city?.name} {job.district ? `- ${job.district.name}` : ''}
                </span>
              </div>
              
              <h3 className="text-break" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-navy)' }}>{job.title}</h3>
              <p className="text-break" style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '1.5rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {job.description}
              </p>
              
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {job.status === 'COMPLETED' ? 'Durum' : 'Kalan Süre'}
                  </div>
                  <div style={{ fontWeight: 800, color: job.status === 'COMPLETED' ? '#10b981' : (job.isFlash ? '#e11d48' : '#dc2626') }}>
                    {job.status === 'COMPLETED' ? '✅ İhale Verildi' : `${job.isFlash ? '🚨 ' : ''}${calculateTimeRemaining(job.auctionEnd)}`}
                  </div>
                </div>
                <Link href={`/isci/ihaleler/${job.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: job.status === 'COMPLETED' ? '#4b5563' : undefined, borderColor: job.status === 'COMPLETED' ? '#4b5563' : undefined }}>
                  {job.status === 'COMPLETED' ? 'Detayı Gör' : 'İncele & Teklif Ver'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
