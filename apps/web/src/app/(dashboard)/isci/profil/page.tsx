'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function WorkerProfilePage() {
  const { user } = useAuth();
  
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cityId: '',
    districtId: '',
    aboutMe: '',
    education: '',
    university: '',
    sectorIds: [] as number[],
    skills: [] as string[],
    socialMedia: { instagram: '', linkedin: '', website: '' },
    portfolio: [] as any[],
    profilePicture: ''
  });

  const [districts, setDistricts] = useState<any[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState('');
  const [subCategories, setSubCategories] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/locations/cities').then(res => res.json()),
      fetch('/api/v1/categories').then(res => res.json()),
      fetch('/api/v1/users/profile', { credentials: 'include' }).then(res => res.json())
    ]).then(([citiesData, catsData, profileData]) => {
      setCities(citiesData || []);
      setCategories(catsData || []);
      
      if (profileData) {
        setForm({
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          cityId: profileData.cityId?.toString() || '',
          districtId: profileData.districtId?.toString() || '',
          aboutMe: profileData.workerProfile?.aboutMe || '',
          education: profileData.workerProfile?.education || '',
          university: profileData.workerProfile?.university || '',
          sectorIds: profileData.workerProfile?.sectorIds || [],
          skills: profileData.workerProfile?.skills || [],
          socialMedia: profileData.workerProfile?.socialMedia || { instagram: '', linkedin: '', website: '' },
          portfolio: profileData.workerProfile?.portfolio || [],
          profilePicture: profileData.profilePicture || ''
        });

        // Eğer şehir bilgisi varsa ilçeleri de çek
        if (profileData.cityId) {
          fetch(`/api/v1/locations/cities/${profileData.cityId}/districts`)
            .then(res => res.json())
            .then(setDistricts);
        }
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  // Ana kategori değiştiğinde alt kategorileri ayarla
  useEffect(() => {
    if (selectedMainCategoryId) {
      const selected = categories.find(c => c.id === parseInt(selectedMainCategoryId));
      setSubCategories(selected?.children || []);
    } else {
      setSubCategories([]);
    }
  }, [selectedMainCategoryId, categories]);

  useEffect(() => {
    if (form.cityId) {
      setDistricts([]); // Temizle
      fetch(`/api/v1/locations/cities/${form.cityId}/districts`)
        .then(res => res.json())
        .then(data => {
          console.log('🏘️ İşçi Profil - İlçeler:', data);
          setDistricts(data || []);
        })
        .catch(err => {
          console.error('❌ Profil ilçe hatası:', err);
          setDistricts([]);
        });
    } else {
      setDistricts([]);
    }
  }, [form.cityId]);

  const handleAddSector = (id: number) => {
    if (!id) return;
    setForm(prev => {
      if (prev.sectorIds.includes(id)) return prev;
      return { ...prev, sectorIds: [...prev.sectorIds, id] };
    });
  };

  const removeSector = (id: number) => {
    setForm(prev => ({ ...prev, sectorIds: prev.sectorIds.filter(s => s !== id) }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !form.skills.includes(skillInput.trim())) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

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

  const addPortfolioItem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ 
          ...prev, 
          portfolio: [...prev.portfolio, { url: reader.result as string, title: 'Yeni İş', description: '' }] 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/v1/users/worker-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          cityId: form.cityId ? parseInt(form.cityId) : null,
          districtId: form.districtId ? parseInt(form.districtId) : null,
          aboutMe: form.aboutMe,
          education: form.education,
          university: form.university,
          sectorIds: form.sectorIds,
          skills: form.skills,
          socialMedia: form.socialMedia,
          portfolio: form.portfolio,
          profilePicture: form.profilePicture
        })
      });

      if (!res.ok) throw new Error('Kaydedilemedi');
      setMessage('Profiliniz başarıyla güncellendi!');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      setMessage('Hata: Profil güncellenemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'var(--color-navy)', fontWeight: 800 }}>Kariyer ve Profil Yönetimi</h1>
      
      {message && (
        <div style={{ padding: '1rem', background: message.includes('Hata') ? '#fee2e2' : '#dcfce7', color: message.includes('Hata') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 600 }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Üst Kart: Foto ve Temel */}
        <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ 
              width: 120, height: 120, borderRadius: '50%', background: '#f1f5f9', 
              overflow: 'hidden', border: '4px solid var(--color-gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {form.profilePicture ? (
                <img src={form.profilePicture} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '3.5rem', color: '#cbd5e1' }}>👤</span>
              )}
            </div>
            <div>
              <h3 style={{ marginBottom: '0.5rem', fontWeight: 800 }}>Profil Vitrini</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="Adınız"
                  className="form-input" 
                  value={form.firstName} 
                  onChange={e => setForm({...form, firstName: e.target.value})} 
                />
                <input 
                  type="text" 
                  placeholder="Soyadınız"
                  className="form-input" 
                  value={form.lastName} 
                  onChange={e => setForm({...form, lastName: e.target.value})} 
                />
              </div>
              <input 
                type="email" 
                placeholder="E-posta Adresiniz"
                className="form-input" 
                style={{ marginBottom: '1rem' }}
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
              />
              <input 
                type="text" 
                placeholder="Telefon Numaranız"
                className="form-input" 
                style={{ marginBottom: '1rem' }}
                value={form.phone} 
                onChange={e => setForm({...form, phone: e.target.value})} 
              />
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>Müşterilerin sizi tanıması için kurumsal bir fotoğraf yükleyin.</p>
              <label className="btn btn-secondary" style={{ cursor: 'pointer', padding: '0.6rem 1.2rem', fontSize: '0.875rem' }}>
                Fotoğraf Değiştir
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Usta Biyografisi (Hakkımda)</label>
          <textarea
            rows={4}
            style={{ width: '100%', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}
            placeholder="Tecrübelerinizi, hangi marka cihazlarla çalıştığınızı ve neden sizi seçmeleri gerektiğini anlatın..."
            value={form.aboutMe}
            onChange={e => setForm({...form, aboutMe: e.target.value})}
          />
        </div>

        {/* Eğitim ve Konum */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Eğitim ve Lokasyon</h3>
          <div className="grid-2" style={{ gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Son Mezuniyet / Sertifika</label>
              <input
                type="text"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                placeholder="Örn: Endüstri Meslek Lisesi"
                value={form.education}
                onChange={e => setForm({...form, education: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Üniversite (Opsiyonel)</label>
              <input
                type="text"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                placeholder="Örn: Marmara Üniversitesi"
                value={form.university}
                onChange={e => setForm({...form, university: e.target.value})}
              />
            </div>
            <div className="grid-2" style={{ gridColumn: 'span 1', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Hizmet Bölgesi (İl)</label>
                <select
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  value={form.cityId}
                  onChange={e => setForm({...form, cityId: e.target.value, districtId: ''})}
                  required
                >
                  <option value="">İl Seçiniz...</option>
                  {cities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Hizmet Bölgesi (İlçe)</label>
                <select
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  value={form.districtId}
                  onChange={e => setForm({...form, districtId: e.target.value})}
                  required
                  disabled={districts.length === 0}
                >
                  <option value="">{districts.length > 0 ? 'İlçe Seçiniz...' : 'Önce İl Seçin'}</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sosyal Medya ve Uzmanlık Alanları */}
        <div className="grid-2" style={{ gap: '2rem' }}>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Sosyal Medya Linkleri</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                placeholder="Instagram URL"
                value={form.socialMedia.instagram}
                onChange={e => setForm({...form, socialMedia: {...form.socialMedia, instagram: e.target.value}})}
              />
              <input
                type="text"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                placeholder="LinkedIn URL"
                value={form.socialMedia.linkedin}
                onChange={e => setForm({...form, socialMedia: {...form.socialMedia, linkedin: e.target.value}})}
              />
              <input
                type="text"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                placeholder="Web Sitesi"
                value={form.socialMedia.website}
                onChange={e => setForm({...form, socialMedia: {...form.socialMedia, website: e.target.value}})}
              />
            </div>
          </div>

          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Uzmanlık Etiketleri (Skills)</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                placeholder="Örn: Klima, Tadilat, Boya"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <button type="button" onClick={addSkill} className="btn btn-secondary">Ekle</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {form.skills.map(skill => (
                <span key={skill} style={{ background: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Uzmanlık Alanları (Sektörler) - İhale Ver sayfasındaki gibi */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>📂 İş Tipi ve Uzmanlık Kategorileri</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Hangi alanlarda iş almak istediğinizi seçin. Birden fazla kategori ekleyebilirsiniz.
          </p>
          
          <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Ana Kategori</label>
              <select 
                className="form-input" 
                value={selectedMainCategoryId} 
                onChange={e => setSelectedMainCategoryId(e.target.value)}
              >
                <option value="">Seçiniz...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Alt Kategori (Uzmanlık)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  className="form-input" 
                  disabled={!selectedMainCategoryId}
                  onChange={e => handleAddSector(parseInt(e.target.value))}
                  value=""
                >
                  <option value="">{subCategories.length > 0 ? 'Seçiniz ve Ekleyin...' : 'Önce Ana Kategori Seçin'}</option>
                  {subCategories.map(c => (
                    <option key={c.id} value={c.id} disabled={form.sectorIds.includes(c.id)}>
                      {c.name} {form.sectorIds.includes(c.id) ? '(Ekli)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
            {form.sectorIds.length === 0 && <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Henüz bir kategori seçmediniz.</span>}
            {form.sectorIds.map(id => {
              // Kategori ismini bul
              let catName = 'Bilinmeyen Kategori';
              categories.forEach(main => {
                const sub = main.children?.find((s: any) => s.id === id);
                if (sub) catName = `${main.name} > ${sub.name}`;
              });
              
              return (
                <span key={id} style={{ background: 'var(--color-navy)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {catName}
                  <button type="button" onClick={() => removeSector(id)} style={{ border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                </span>
              );
            })}
          </div>
        </div>

        {/* Portfolyo Galerisi */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 800 }}>İş Portfolyosu (Galeri)</h3>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              + Yeni İş Ekle
              <input type="file" accept="image/*" onChange={addPortfolioItem} style={{ display: 'none' }} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {form.portfolio.map((item, idx) => (
              <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <img src={item.url} alt={item.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                <div style={{ padding: '0.75rem' }}>
                  <input 
                    type="text" 
                    value={item.title} 
                    onChange={e => {
                      const newPortfolio = [...form.portfolio];
                      newPortfolio[idx].title = e.target.value;
                      setForm({...form, portfolio: newPortfolio});
                    }}
                    style={{ width: '100%', border: 'none', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}
                  />
                  <button type="button" onClick={() => {
                    setForm({...form, portfolio: form.portfolio.filter((_, i) => i !== idx)});
                  }} style={{ color: 'red', fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer' }}>Sil</button>
                </div>
              </div>
            ))}
            {form.portfolio.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Henüz bir çalışma eklemediniz.</p>}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-full" style={{ padding: '1.2rem', fontSize: '1.1rem', fontWeight: 700 }} disabled={saving}>
          {saving ? 'Veriler Şifreleniyor & Kaydediliyor...' : 'PROFİLİMİ VE CV\'Mİ GÜNCELLE'}
        </button>
      </form>
    </div>
  );
}

