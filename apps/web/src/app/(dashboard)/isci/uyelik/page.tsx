'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/currency';

export default function IsciUyelikPage() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [mySub, setMySub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'WORKER') return;
    fetchData();

    // CANLI GÜNCELLEME: Soket üzerinden gelen bildirimi dinle
    const handleUpdate = () => fetchData();
    window.addEventListener('subscription_plans_updated', handleUpdate);
    return () => window.removeEventListener('subscription_plans_updated', handleUpdate);
  }, [user]);

  const fetchData = async () => {
    try {
      const fetchJson = async (url: string) => {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return null;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      };

      const [plansRes, mySubRes] = await Promise.all([
        fetchJson('/api/v1/subscriptions/plans'),
        fetchJson('/api/v1/subscriptions/my')
      ]);
      
      console.log('💎 ABONELİK PLANLARI YANITI:', plansRes);
      const planList = Array.isArray(plansRes) ? plansRes : (plansRes?.data || []);
      setPlans(planList);
      setMySub(mySubRes?.id ? mySubRes : null);
      setLoading(false);
    } catch (err) {
      console.error('fetchData hatası:', err);
      setLoading(false);
    }
  };

  if (user?.role !== 'WORKER') {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Bu sayfa sadece işçiler içindir.</div>;
  }

  const handleSubscribe = async (planId: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/subscriptions/subscribe/${planId}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await res.json().catch(() => null);
      
      if (!res.ok) {
        throw new Error(data?.message || 'İşlem başarısız (Sunucu Hatası)');
      }
      
      alert('Üyeliğiniz başarıyla aktif edildi! Artık sistemin tüm özelliklerini kullanabilirsiniz.');
      await refreshUser();
      await fetchData();
    } catch (err: any) {
      console.error('Satın alma hatası:', err);
      alert('Satın alma işlemi başarısız oldu: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Yükleniyor...</div>;

  const isSubActive = mySub && new Date(mySub.endDate) > new Date() && mySub.isActive;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-navy)', marginBottom: '1rem' }}>Üyelik İşlemleri</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Sistemin tüm özelliklerinden yararlanmak için bir paket seçin.</p>
      </header>

      {/* MEVCUT DURUM */}
      {mySub && (
        <div style={{ 
          background: isSubActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${isSubActive ? '#10b981' : '#ef4444'}`,
          padding: '1.5rem',
          borderRadius: '16px',
          marginBottom: '3rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 800, color: isSubActive ? '#065f46' : '#991b1b' }}>
              {isSubActive ? '✅ Aktif Aboneliğiniz Var' : '⚠️ Aboneliğiniz Sona Erdi'}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
              Paket: <strong>{mySub.plan.name}</strong> · Bitiş Tarihi: {new Date(mySub.endDate).toLocaleDateString('tr-TR')}
            </div>
          </div>
          {isSubActive && (
            <span className="badge badge-success">AKTİF</span>
          )}
        </div>
      )}

      {/* PAKET KARTLARI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {plans.map(plan => (
          <div key={plan.id} style={{ 
            background: 'white', 
            padding: '2.5rem', 
            borderRadius: '24px', 
            border: mySub?.planId === plan.id ? '3px solid var(--color-gold)' : '1px solid #e2e8f0',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            transform: mySub?.planId === plan.id ? 'scale(1.05)' : 'none',
            zIndex: mySub?.planId === plan.id ? 10 : 1
          }}>
            {mySub?.planId === plan.id && (
              <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-gold)', color: 'var(--color-navy)', padding: '4px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                MEVCUT PAKETİNİZ
              </div>
            )}
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', textAlign: 'center' }}>{plan.name}</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-navy)', textAlign: 'center', margin: '1.5rem 0' }}>
              {formatCurrency(plan.price)}
              <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}> / {plan.durationDays} Gün</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem' }}>{plan.description}</p>
            
            <div style={{ flex: 1, marginBottom: '2.5rem' }}>
              {plan.features.map((feat: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '0.95rem' }}>
                  <span style={{ color: '#10b981' }}>✔</span> {feat}
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleSubscribe(plan.id)}
              disabled={actionLoading || (mySub?.planId === plan.id && isSubActive)}
              className={`btn ${mySub?.planId === plan.id && isSubActive ? 'btn-ghost' : 'btn-primary'}`}
              style={{ width: '100%', padding: '1rem', fontWeight: 800 }}
            >
              {mySub?.planId === plan.id && isSubActive ? 'Kullanılıyor' : 'Hemen Satın Al'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
