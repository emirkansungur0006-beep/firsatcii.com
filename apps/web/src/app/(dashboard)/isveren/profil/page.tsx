'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function IsverenProfilePage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  const [form, setForm] = useState({
    profileType: 'INDIVIDUAL',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    taxNumber: '',
    profilePicture: '',
    cityId: '',
    districtId: ''
  });

  useEffect(() => {
    // Şehirleri çek
    fetch('/api/v1/locations/cities').then(res => res.json()).then(setCities).catch(console.error);

    fetch('/api/v1/users/profile', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data) {
          setForm({
            profileType: data.profileType || 'INDIVIDUAL',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || '',
            companyName: data.companyName || '',
            taxNumber: data.taxNumber || '',
            profilePicture: data.profilePicture || '',
            cityId: data.cityId?.toString() || '',
            districtId: data.districtId?.toString() || ''
          });

          if (data.cityId) {
            fetch(`/api/v1/locations/cities/${data.cityId}/districts`)
              .then(res => res.json())
              .then(setDistricts);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Şehir değişince ilçeleri çek
  useEffect(() => {
    if (form.cityId) {
      setDistricts([]);
      fetch(`/api/v1/locations/cities/${form.cityId}/districts`)
        .then(res => res.json())
        .then(setDistricts)
        .catch(() => setDistricts([]));
    } else {
      setDistricts([]);
    }
  }, [form.cityId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/v1/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          cityId: form.cityId ? parseInt(form.cityId) : null,
          districtId: form.districtId ? parseInt(form.districtId) : null,
          companyName: form.profileType === 'CORPORATE' ? form.companyName : null,
          taxNumber: form.profileType === 'CORPORATE' ? form.taxNumber : null,
        })
      });

      if (!res.ok) throw new Error('Kaydedilemedi');
      setMessage('Profiliniz başarıyla güncellendi!');
      window.location.reload();
    } catch (error) {
      setMessage('Hata: Profil güncellenemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--color-navy)', fontWeight: 800 }}>İşveren Profilim</h1>
      
      {message && (
        <div style={{ padding: '1rem', background: message.includes('Hata') ? '#fee2e2' : '#dcfce7', color: message.includes('Hata') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        
        {/* Fotoğraf Yükleme */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ 
            width: 100, height: 100, borderRadius: '50%', background: '#f1f5f9', 
            overflow: 'hidden', border: '3px solid var(--color-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {form.profilePicture ? (
              <img src={form.profilePicture} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '3rem', color: '#cbd5e1' }}>📷</span>
            )}
          </div>
          <div>
            <h3 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>Profil Fotoğrafı</h3>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              Fotoğraf Yükle
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
            {form.profilePicture && (
              <button type="button" onClick={() => setForm({...form, profilePicture: ''})} className="btn" style={{ marginLeft: '0.5rem', color: 'red', background: 'transparent', border: 'none' }}>Kaldır</button>
            )}
          </div>
        </div>

        <h3 style={{ marginBottom: '1rem', fontWeight: 700, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Temel Bilgiler</h3>
        <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Ad</label>
            <input type="text" className="form-input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Soyad</label>
            <input type="text" className="form-input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
          </div>
        </div>

        <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>İl</label>
            <select className="form-input" required value={form.cityId} onChange={e => setForm({...form, cityId: e.target.value, districtId: ''})}>
              <option value="">Seçiniz</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>İlçe</label>
            <select className="form-input" required disabled={districts.length === 0} value={form.districtId} onChange={e => setForm({...form, districtId: e.target.value})}>
              <option value="">{districts.length > 0 ? 'Seçiniz' : 'Önce İl Seçin'}</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>E-posta Adresi</label>
            <input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Telefon Numarası</label>
            <input type="text" className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
        </div>

        <h3 style={{ marginBottom: '1rem', fontWeight: 700, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginTop: '2rem' }}>Şirket/Kurum Bilgileri</h3>
        
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="radio" checked={form.profileType === 'INDIVIDUAL'} onChange={() => setForm({...form, profileType: 'INDIVIDUAL'})} />
            Bireysel İşveren
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="radio" checked={form.profileType === 'CORPORATE'} onChange={() => setForm({...form, profileType: 'CORPORATE'})} />
            Kurumsal İşveren
          </label>
        </div>

        {form.profileType === 'CORPORATE' && (
          <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Firma Adı</label>
              <input type="text" className="form-input" required 
                value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Vergi Numarası (VKN)</label>
              <input type="text" className="form-input" required maxLength={10}
                value={form.taxNumber} onChange={e => setForm({...form, taxNumber: e.target.value.replace(/\D/g, '')})} />
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-full" disabled={saving} style={{ marginTop: '2rem' }}>
          {saving ? 'Kaydediliyor...' : 'Profili Güncelle'}
        </button>
      </form>
    </div>
  );
}
