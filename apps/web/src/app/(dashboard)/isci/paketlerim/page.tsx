'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/currency';

export default function PaketlerimPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    mainCategoryId: '',
    categoryId: '',
    cityId: '',
    districtId: '',
  });

  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchMetadata();
  }, []);

  const fetchData = async () => {
    try {
      const [pkgs, ords] = await Promise.all([
        fetch('/api/v1/packages/my', { credentials: 'include' }).then(res => res.json()),
        fetch('/api/v1/packages/orders', { credentials: 'include' }).then(res => res.json())
      ]);
      setPackages(pkgs || []);
      setOrders(ords || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [catRes, cityRes] = await Promise.all([
        fetch('/api/v1/categories').then(res => res.json()),
        fetch('/api/v1/locations/cities').then(res => res.json())
      ]);
      setMainCategories(catRes || []);
      setCities(cityRes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMainCategoryChange = (mainId: string) => {
    setForm({ ...form, mainCategoryId: mainId, categoryId: '' });
    if (!mainId) {
      setSubCategories([]);
      return;
    }
    const selected = mainCategories.find(c => c.id === parseInt(mainId));
    setSubCategories(selected?.children || []);
  };

  const handleCityChange = async (cityId: string) => {
    setForm({ ...form, cityId, districtId: '' });
    if (!cityId) {
      setDistricts([]);
      return;
    }
    const res = await fetch(`/api/v1/locations/cities/${cityId}/districts`);
    const data = await res.json();
    setDistricts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/v1/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price: Number(form.price),
          categoryId: Number(form.categoryId),
          cityId: form.cityId ? Number(form.cityId) : undefined,
          districtId: form.districtId ? Number(form.districtId) : undefined,
        }),
        credentials: 'include'
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Paket oluşturulamadı.');
      }
      alert('Paket başarıyla oluşturuldu!');
      setIsModalOpen(false);
      setForm({ title: '', description: '', price: '', mainCategoryId: '', categoryId: '', cityId: '', districtId: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondOrder = async (orderId: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (!confirm(`Bu satışı ${status === 'ACCEPTED' ? 'onaylamak' : 'reddetmek'} istediğinize emin misiniz?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/packages/orders/${orderId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('İşlem başarısız.');
      alert('İşlem tamamlandı.');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Yükleniyor...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-navy)' }}>Paketlerim</h1>
          <p style={{ color: '#64748b' }}>Hizmetlerinizi paket haline getirerek doğrudan satış yapın.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontWeight: 700 }}>
          ➕ Yeni Paket Oluştur
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* PAKET LİSTESİ */}
        <section>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-navy)' }}>Aktif Paketler</h3>
          {packages.length === 0 ? (
            <div style={{ background: '#fff', padding: '3rem', borderRadius: '16px', textAlign: 'center', color: '#94a3b8', border: '1px dashed #e2e8f0' }}>
              Henüz bir paket oluşturmadınız.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {packages.map(pkg => (
                <div key={pkg.id} style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{pkg.title}</h4>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                      {pkg.category?.name} · {pkg.city?.name} {pkg.district?.name ? `/ ${pkg.district.name}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-gold)' }}>{formatCurrency(pkg.price)}</div>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>AKTİF</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* GELEN SİPARİŞLER */}
        <aside>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-navy)', margin: 0 }}>🔔 Satış İstekleri</h3>
            {orders.some(o => o.status === 'PENDING') && (
              <button 
                onClick={async () => {
                  await fetch('/api/v1/notifications/read-by-type/PACKAGE_PURCHASE_REQUEST', { method: 'PATCH', credentials: 'include' });
                  window.dispatchEvent(new CustomEvent('notifications_read'));
                }}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.7rem', color: '#64748b' }}
              >
                Tümünü Okundu Yap
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.filter(o => o.status === 'PENDING').length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Yeni bir istek bulunmuyor.</p>
            )}
            {orders.filter(o => o.status === 'PENDING').map(order => (
              <div key={order.id} style={{ background: 'linear-gradient(135deg, #fff 0%, #fdfcf0 100%)', padding: '1.25rem', borderRadius: '16px', border: '2px solid var(--color-gold-pale)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-gold)', textTransform: 'uppercase', marginBottom: '8px' }}>YENİ SATIŞ İSTEĞİ</div>
                <div style={{ fontWeight: 800, marginBottom: '4px' }}>{order.employer.firstName} {order.employer.lastName}</div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>"{order.package.title}" hizmetinizi satın almak istiyor.</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleRespondOrder(order.id, 'ACCEPTED')} disabled={actionLoading} className="btn btn-success btn-sm" style={{ flex: 1 }}>Onayla</button>
                  <button onClick={() => handleRespondOrder(order.id, 'REJECTED')} disabled={actionLoading} className="btn btn-danger btn-sm" style={{ flex: 1 }}>Reddet</button>
                </div>
              </div>
            ))}
          </div>
          
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2rem', marginBottom: '1rem', color: '#64748b' }}>Geçmiş Satışlar</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             {orders.filter(o => o.status !== 'PENDING').map(order => (
                <div key={order.id} style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{order.employer.firstName} {order.employer.lastName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 700, color: order.status === 'ACCEPTED' ? '#10b981' : '#ef4444' }}>
                      {order.status === 'ACCEPTED' ? 'ONAYLANDI' : 'REDDEDİLDİ'}
                    </span>
                    {order.status === 'ACCEPTED' && (
                      <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('start_chat', { detail: { id: order.employerId, name: `${order.employer.firstName} ${order.employer.lastName}` } }))}
                        className="btn btn-ghost btn-sm" 
                        style={{ padding: '2px 8px', fontSize: '0.75rem', color: 'var(--color-navy)' }}
                      >
                        💬 Mesaj
                      </button>
                    )}
                  </div>
                </div>
             ))}
          </div>
        </aside>
      </div>

      {/* PAKET OLUŞTUR MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '1.5rem' }}>Yeni Hizmet Paketi</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Paket Başlığı (Örn: Web Tasarım İşi)</label>
                <input type="text" className="form-input" placeholder="Örn: 1 Günde Boya Badana" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              
              <div className="grid-2">
                <div>
                  <label className="form-label">Hizmet Ana Dalı</label>
                  <select className="form-input" value={form.mainCategoryId} onChange={e => handleMainCategoryChange(e.target.value)} required>
                    <option value="">Seçiniz</option>
                    {mainCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Alt Hizmet / Uzmanlık</label>
                  <select className="form-input" value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} disabled={!form.mainCategoryId} required>
                    <option value="">Seçiniz</option>
                    {subCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Sabit Paket Fiyatı (TL)</label>
                <input type="number" className="form-input" placeholder="0.00" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
              </div>

              <div className="grid-2">
                <div>
                  <label className="form-label">İl</label>
                  <select className="form-input" value={form.cityId} onChange={e => handleCityChange(e.target.value)}>
                    <option value="">Tüm Türkiye</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">İlçe</label>
                  <select className="form-input" value={form.districtId} onChange={e => setForm({...form, districtId: e.target.value})} disabled={!form.cityId}>
                    <option value="">Tüm İlçeler</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Açıklama (İşin kapsamını belirtin)</label>
                <textarea className="form-input" style={{ minHeight: '100px' }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Bu fiyata neler dahil?"></textarea>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>İptal</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ flex: 2 }}>{actionLoading ? 'Kaydediliyor...' : 'Paketi Yayınla'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
