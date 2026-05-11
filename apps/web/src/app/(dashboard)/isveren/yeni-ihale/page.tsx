'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function YeniIhalePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    cityId: '',
    districtId: '',
    budgetMin: '',
    budgetMax: '',
    publishDate: '',
    auctionEnd: '',
    workStartDate: '',
  });

  useEffect(() => {
    fetch('/api/v1/categories').then(res => res.json()).then(setCategories).catch(console.error);
    fetch('/api/v1/locations/cities').then(res => res.json()).then(setCities).catch(console.error);
  }, []);

  useEffect(() => {
    if (form.cityId) {
      fetch(`/api/v1/locations/cities/${form.cityId}/districts`)
        .then(res => res.json())
        .then(setDistricts)
        .catch(console.error);
    } else {
      setDistricts([]);
    }
  }, [form.cityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Geçerlilik (Örn: Bitiş, başlangıçtan büyük olmalı)
    if (new Date(form.auctionEnd) <= new Date(form.publishDate)) {
      setError('İhale bitiş tarihi, başlangıç tarihinden sonra olmalıdır.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: form.title,
        description: form.description,
        categoryId: parseInt(form.categoryId),
        cityId: parseInt(form.cityId),
        districtId: parseInt(form.districtId),
        budgetMin: form.budgetMin ? parseFloat(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : undefined,
        publishDate: new Date(form.publishDate).toISOString(),
        auctionEnd: new Date(form.auctionEnd).toISOString(),
        workStartDate: form.workStartDate ? new Date(form.workStartDate).toISOString() : undefined,
        latitude: parseFloat("39.92077"), // Mock coordinates or use browser geolocation
        longitude: parseFloat("32.85411")
      };

      const res = await fetch('/api/v1/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'İhale oluşturulamadı.');
      }

      router.push('/isveren/ihaleler');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h1 style={{ fontSize: '2rem', color: 'var(--color-navy)', fontWeight: 800, marginBottom: '2rem' }}>Yeni İhale Aç</h1>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">İhale Başlığı</label>
          <input type="text" className="form-input" required 
            placeholder="Örn: Ev Tadilatı ve Boya" value={form.title} 
            onChange={e => setForm({...form, title: e.target.value})} />
        </div>

        <div className="form-group">
          <label className="form-label">İhale Detayı</label>
          <textarea className="form-input" required rows={4}
            placeholder="İşin kapsamı, kullanılacak malzemeler vb. detaylar..." value={form.description} 
            onChange={e => setForm({...form, description: e.target.value})} />
        </div>

        <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label className="form-label">Sektör (Kategori)</label>
            <select className="form-input" required value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}>
              <option value="">Seçiniz</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid-2" style={{ gap: '0.5rem', marginBottom: 0 }}>
            <div>
              <label className="form-label">İl</label>
              <select className="form-input" required value={form.cityId} onChange={e => setForm({...form, cityId: e.target.value, districtId: ''})}>
                <option value="">Seçiniz</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">İlçe</label>
              <select className="form-input" required value={form.districtId} onChange={e => setForm({...form, districtId: e.target.value})}>
                <option value="">Seçiniz</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label className="form-label">Minimum Bütçe (₺)</label>
            <input type="number" className="form-input" 
              value={form.budgetMin} onChange={e => setForm({...form, budgetMin: e.target.value})} />
          </div>
          <div>
            <label className="form-label">Maksimum Bütçe (₺)</label>
            <input type="number" className="form-input" 
              value={form.budgetMax} onChange={e => setForm({...form, budgetMax: e.target.value})} />
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-navy)' }}>⏳ Zamanlama</h3>
          
          <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label">İhale Başlangıç / Yayına Giriş Zamanı</label>
              <input type="datetime-local" className="form-input" required
                value={form.publishDate} onChange={e => setForm({...form, publishDate: e.target.value})} />
            </div>
            <div>
              <label className="form-label">İhale Bitiş Zamanı (Anti-Sniper Çalışır)</label>
              <input type="datetime-local" className="form-input" required
                value={form.auctionEnd} onChange={e => setForm({...form, auctionEnd: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="form-label">Gerçekleşecek İşin Planlanan Başlama Tarihi (Opsiyonel)</label>
            <input type="date" className="form-input"
              value={form.workStartDate} onChange={e => setForm({...form, workStartDate: e.target.value})} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ padding: '1rem', fontSize: '1.1rem' }}>
          {loading ? 'Oluşturuluyor...' : '🚀 İhaleyi Yayına Al'}
        </button>
      </form>
    </div>
  );
}
