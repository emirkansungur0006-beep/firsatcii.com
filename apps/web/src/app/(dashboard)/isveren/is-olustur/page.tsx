'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, parseCurrency } from '@/utils/currency';

export default function YeniIhalePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const targetWorkerId = searchParams.get('targetWorkerId');
  const targetWorkerName = searchParams.get('workerName');

  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    mainCategoryId: '',
    categoryId: searchParams.get('categoryId') !== 'undefined' ? (searchParams.get('categoryId') || '') : '',
    cityId: searchParams.get('cityId') !== 'undefined' ? (searchParams.get('cityId') || '') : '',
    districtId: searchParams.get('districtId') !== 'undefined' ? (searchParams.get('districtId') || '') : '',
    budgetMin: '',
    budgetMax: '',
    publishDate: '',
    auctionEnd: '',
    workStartDate: '',
    targetWorkerId: targetWorkerId || '',
    isFlash: false,
  });

  const [allDistricts, setAllDistricts] = useState<any[]>([]);

  useEffect(() => {
    // Ana verileri çek (Kategoriler, Şehirler ve TÜM 973 İlçe)
    fetch('/api/v1/categories').then(res => res.json()).then(setMainCategories).catch(console.error);
    fetch('/api/v1/locations/cities').then(res => res.json()).then(setCities).catch(console.error);
    fetch('/api/v1/locations/districts/all')
      .then(res => res.json())
      .then(data => {
        setAllDistricts(data);
        setDistricts(data);
      })
      .catch(console.error);
  }, []);

  // Ana kategori değiştiğinde alt kategorileri ayarla
  useEffect(() => {
    if (form.mainCategoryId) {
      const selected = mainCategories.find(c => c.id === parseInt(form.mainCategoryId));
      setSubCategories(selected?.children || []);
      setForm(prev => ({ ...prev, categoryId: '' }));
    } else {
      setSubCategories([]);
    }
  }, [form.mainCategoryId, mainCategories]);

  // Şehir seçimine göre ilçeleri filtrele
  useEffect(() => {
    if (form.cityId && form.cityId !== 'undefined') {
      const cityIdNum = parseInt(form.cityId);
      const filtered = allDistricts.filter(d => d.cityId === cityIdNum);
      setDistricts(filtered);
    } else {
      setDistricts(allDistricts);
    }
  }, [form.cityId, allDistricts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!form.categoryId) {
      setError('Lütfen bir alt kategori seçiniz.');
      setLoading(false);
      return;
    }

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
        districtId: form.districtId ? parseInt(form.districtId) : undefined,
        budgetMin: form.budgetMin ? parseFloat(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : undefined,
        publishDate: form.isFlash ? new Date().toISOString() : new Date(form.publishDate).toISOString(),
        auctionEnd: form.isFlash ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : new Date(form.auctionEnd).toISOString(),
        workStartDate: form.workStartDate ? new Date(form.workStartDate).toISOString() : undefined,
        targetWorkerId: form.targetWorkerId || undefined,
        isFlash: form.isFlash,
        latitude: 41.0082, 
        longitude: 28.9784
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

      {/* İHALE TİPİ SEÇİMİ (MODERN BUTONLAR) */}
      <div style={{ marginBottom: '2.5rem' }}>
        <label className="form-label" style={{ marginBottom: '1rem', display: 'block', textAlign: 'center', fontSize: '1rem' }}>Hangi türde bir ihale açmak istersiniz?</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* NORMAL İHALE BUTONU */}
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, isFlash: false }))}
            style={{
              padding: '1.5rem',
              borderRadius: '20px',
              border: !form.isFlash ? '3px solid var(--color-navy)' : '1px solid #e2e8f0',
              background: !form.isFlash ? 'var(--color-navy)' : '#fff',
              color: !form.isFlash ? '#fff' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              boxShadow: !form.isFlash ? 'var(--shadow-navy)' : 'none'
            }}
          >
            <span style={{ fontSize: '2rem' }}>📋</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Normal İhale</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Tarihleri siz belirleyin</div>
            </div>
          </button>

          {/* ACİL İHALE BUTONU */}
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, isFlash: true }))}
            style={{
              padding: '1.5rem',
              borderRadius: '20px',
              border: form.isFlash ? '3px solid #ff4d4d' : '1px solid #e2e8f0',
              background: form.isFlash ? 'linear-gradient(135deg, #ff4d4d 0%, #b30000 100%)' : '#fff',
              color: form.isFlash ? '#fff' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              boxShadow: form.isFlash ? '0 10px 25px rgba(255, 77, 77, 0.4)' : 'none',
              animation: form.isFlash ? 'pulse-red 2s infinite' : 'none'
            }}
          >
            <span style={{ fontSize: '2rem', filter: form.isFlash ? 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' : 'none' }}>⚡</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Acil İhale</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>24 Saat / Sesli Bildirim</div>
            </div>
          </button>
        </div>

        {/* ACİL İHALE BİLGİ PANELİ */}
        {form.isFlash && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1.25rem', 
            background: '#fff1f2', 
            borderRadius: '16px', 
            border: '1px solid #fda4af',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            animation: 'slideDown 0.4s ease-out'
          }}>
            <div style={{ fontSize: '1.5rem' }}>📢</div>
            <div style={{ fontSize: '0.875rem', color: '#9f1239', fontWeight: 600 }}>
              <strong>DİKKAT:</strong> Acil ihaleler tüm ustalara anında sesli bildirim olarak gider ve 24 saat içinde sonuçlanması gerekir.
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse-red {
          0% { box-shadow: 0 10px 25px rgba(255, 77, 77, 0.4); }
          50% { box-shadow: 0 10px 40px rgba(255, 77, 77, 0.7); }
          100% { box-shadow: 0 10px 25px rgba(255, 77, 77, 0.4); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

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

        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '1rem' }}>📂 İş Tipi ve Kategori</h3>
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div>
              <label className="form-label">Ana Kategori</label>
              <select className="form-input" required value={form.mainCategoryId} onChange={e => setForm({...form, mainCategoryId: e.target.value})}>
                <option value="">Seçiniz</option>
                {mainCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Alt Kategori (Uzmanlık)</label>
              <select className="form-input" required disabled={!form.mainCategoryId} value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}>
                <option value="">{subCategories.length > 0 ? 'Seçiniz' : 'Önce Ana Kategori Seçin'}</option>
                {subCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="grid-2" style={{ gap: '0.5rem', marginBottom: 0, gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="form-label">İl</label>
              <select className="form-input" required value={form.cityId} onChange={e => setForm({...form, cityId: e.target.value, districtId: ''})}>
                <option value="">Seçiniz</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">İlçe</label>
              <select 
                className="form-input" 
                required 
                disabled={districts.length === 0}
                value={form.districtId} 
                onChange={e => setForm({...form, districtId: e.target.value})}
              >
                <option value="">{Array.isArray(districts) && districts.length > 0 ? 'Seçiniz' : 'Önce İl Seçin'}</option>
                {Array.isArray(districts) && districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
        {/* Bütçe aralığı kullanıcı isteği üzerine gizlenmiştir */}
        <div style={{ display: 'none' }}>
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div>
              <label className="form-label">Min Bütçe</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="1.000 TL"
                value={form.budgetMin ? formatCurrency(form.budgetMin) : ''} 
                onChange={e => {
                  const val = parseCurrency(e.target.value);
                  setForm({...form, budgetMin: val > 0 ? val.toString() : ''});
                }} 
              />
            </div>
            <div>
              <label className="form-label">Max Bütçe</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="5.000 TL"
                value={form.budgetMax ? formatCurrency(form.budgetMax) : ''} 
                onChange={e => {
                  const val = parseCurrency(e.target.value);
                  setForm({...form, budgetMax: val > 0 ? val.toString() : ''});
                }} 
              />
            </div>
          </div>
        </div>
        </div>

        {!form.isFlash && (
          <div style={{ background: '#fdfcf0', padding: '1.5rem', border: '1px solid #fef08a', borderRadius: '8px', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#854d0e' }}>⏳ Zamanlama</h3>
            
            <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Başlangıç Zamanı</label>
                <input type="datetime-local" className="form-input" required
                  value={form.publishDate} onChange={e => setForm({...form, publishDate: e.target.value})} />
              </div>
              <div>
                <label className="form-label">İhale Bitiş Zamanı</label>
                <input type="datetime-local" className="form-input" required
                  value={form.auctionEnd} onChange={e => setForm({...form, auctionEnd: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="form-label">İşin Planlanan Başlama Tarihi (Opsiyonel)</label>
              <input type="date" className="form-input"
                value={form.workStartDate} onChange={e => setForm({...form, workStartDate: e.target.value})} />
            </div>
          </div>
        )}

        <button 
          type="submit" 
          className={`btn btn-full ${form.isFlash ? 'btn-danger' : 'btn-primary'}`} 
          disabled={loading} 
          style={{ 
            padding: '1.2rem', 
            fontSize: '1.1rem',
            background: form.isFlash ? '#e11d48' : undefined,
            color: 'white',
            fontWeight: 700
          }}
        >
          {loading ? 'İşlem Sürüyor...' : form.isFlash ? '🚨 FLAŞ İHALEYİ YAYINLA (24 Saat)' : '🚀 İhaleyi Yayına Al'}
        </button>
      </form>
    </div>
  );
}
