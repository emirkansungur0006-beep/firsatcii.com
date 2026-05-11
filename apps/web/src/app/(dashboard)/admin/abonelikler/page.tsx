'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/currency';

export default function AdminAboneliklerPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    features: '',
    durationDays: '30'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, subsRes] = await Promise.all([
        fetch('/api/v1/subscriptions/plans', { credentials: 'include' }).then(res => res.json()),
        fetch('/api/v1/subscriptions/subscribers', { credentials: 'include' }).then(res => res.json())
      ]);
      setPlans(Array.isArray(plansRes) ? plansRes : (plansRes?.data || []));
      setSubscribers(Array.isArray(subsRes) ? subsRes : (subsRes?.data || []));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/subscriptions/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          durationDays: Number(form.durationDays),
          features: form.features.split(',').map(f => f.trim())
        }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Hata oluştu');
      setIsModalOpen(false);
      setForm({ name: '', description: '', price: '', features: '', durationDays: '30' });
      fetchData();
    } catch (err) {
      alert('Plan oluşturulamadı.');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Yükleniyor...</div>;

  return (
    <div style={{ paddingBottom: '100px', maxWidth: '1200px', margin: '0 auto' }}>
      <header className="page-header">
        <h1 className="page-title">Paket Yönetimi</h1>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="btn btn-primary" 
          style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}
        >
          ➕ Yeni Paket Tanımla
        </button>
      </header>

      <div className="admin-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '2.5rem' 
      }}>
        {/* PAKETLER LİSTESİ */}
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Mevcut Paketler</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {plans.map(plan => (
              <div key={plan.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{plan.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0' }}>{plan.description}</p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {plan.features.map((f: string, i: number) => (
                      <span key={i} className="badge" style={{ fontSize: '0.65rem', background: '#f1f5f9' }}>{f}</span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-gold)' }}>{formatCurrency(plan.price)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{plan.durationDays} Gün</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ABONELER LİSTESİ */}
        <aside>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Mevcut Aboneler</h2>
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Kullanıcı</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Paket</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Bitiş</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map(sub => (
                  <tr key={sub.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>{sub.user.firstName} {sub.user.lastName}</td>
                    <td style={{ padding: '12px' }}>{sub.plan.name}</td>
                    <td style={{ padding: '12px' }}>{new Date(sub.endDate).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ 
            background: 'white', 
            padding: '2rem', 
            borderRadius: '24px', 
            width: '90%', 
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Yeni Paket Oluştur</h2>
            <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="Paket Adı" className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <textarea placeholder="Açıklama" className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <input type="number" placeholder="Fiyat (TL)" className="form-input" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
              <input type="number" placeholder="Süre (Gün)" className="form-input" value={form.durationDays} onChange={e => setForm({...form, durationDays: e.target.value})} required />
              <input type="text" placeholder="Özellikler (virgülle ayırın)" className="form-input" value={form.features} onChange={e => setForm({...form, features: e.target.value})} />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>Vazgeç</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
