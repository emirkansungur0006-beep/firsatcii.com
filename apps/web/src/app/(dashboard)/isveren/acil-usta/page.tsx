'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/utils/currency';

export default function AcilUstaPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [confirmPkg, setConfirmPkg] = useState<any | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchPackages = async () => {
    try {
      const [pkgRes, ordRes] = await Promise.all([
        fetch('/api/v1/packages', { credentials: 'include' }),
        fetch('/api/v1/packages/orders', { credentials: 'include' })
      ]);
      const pkgData = await pkgRes.json();
      const ordData = await ordRes.json();
      setPackages(pkgData || []);
      setOrders(ordData || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const executeBuy = async (pkg: any) => {
    setBuyingId(pkg.id);
    setConfirmPkg(null);
    try {
      const res = await fetch(`/api/v1/packages/${pkg.id}/buy`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'İstek gönderilemedi.');
      }
      setToast({ msg: '✅ Satın alma isteği ustaya iletildi! Usta onayladığında bildirim alacaksınız.', type: 'success' });
      fetchPackages();
    } catch (err: any) {
      setToast({ msg: `❌ ${err.message}`, type: 'error' });
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Hizmetler Yükleniyor...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-navy)', marginBottom: '1rem' }}>🚨 Acil Usta & Hazır Hizmetler</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
          İhale açmakla uğraşmayın! Ustaların belirlediği sabit fiyatlı paketleri inceleyin ve anında satın alma isteği gönderin.
        </p>
      </header>

      {packages.length === 0 ? (
        <div style={{ background: '#fff', padding: '5rem', borderRadius: '24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍃</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Henüz aktif paket bulunmuyor.</h3>
          <p style={{ color: '#64748b' }}>Lütfen daha sonra tekrar kontrol edin veya bir ihale oluşturun.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {packages.map(pkg => (
            <div key={pkg.id} style={{ 
              background: '#fff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', 
              transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
            >
              <div style={{ background: 'linear-gradient(135deg, var(--color-navy) 0%, #1a2a4a 100%)', color: 'white', padding: '1.5rem', position: 'relative' }}>
                 <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-gold)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{pkg.sector?.name}</div>
                 <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, lineHeight: 1.3, letterSpacing: '-0.5px' }}>{pkg.title}</h4>
                 <div style={{ 
                   position: 'absolute', bottom: '-20px', right: '20px', 
                   background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
                   color: 'var(--color-navy)', padding: '10px 20px', borderRadius: '14px', 
                   fontWeight: 900, fontSize: '1.25rem', 
                   boxShadow: '0 8px 15px rgba(255, 195, 0, 0.4)',
                   border: '2px solid white'
                 }}>
                   {formatCurrency(pkg.price)}
                 </div>
              </div>
              
              <div style={{ padding: '2rem 1.5rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                   <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                     {pkg.worker.firstName[0]}{pkg.worker.lastName[0]}
                   </div>
                   <div>
                     <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{pkg.worker.firstName} {pkg.worker.lastName}</div>
                     <div style={{ fontSize: '0.8rem', color: '#eab308', fontWeight: 700 }}>★ {pkg.worker.leaderScore?.toFixed(1) || '0.0'} Liderlik Puanı</div>
                   </div>
                </div>

                <p style={{ color: '#64748b', fontSize: '0.9rem', minHeight: '60px', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  {pkg.description || 'Bu paket için detaylı açıklama girilmemiş.'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                  📍 {pkg.city?.name} {pkg.district?.name ? `/ ${pkg.district.name}` : ''}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setConfirmPkg(pkg)}
                    disabled={buyingId === pkg.id || confirmPkg?.id === pkg.id}
                    style={{ 
                      flex: 2, padding: '1.2rem', borderRadius: '16px', border: 'none', 
                      background: 'linear-gradient(135deg, var(--color-gold) 0%, #FF9800 100%)', 
                      color: 'var(--color-navy)', fontWeight: 900, fontSize: '1rem',
                      cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 10px 20px -5px rgba(255, 152, 0, 0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      letterSpacing: '0.5px', textTransform: 'uppercase'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 20px 30px -10px rgba(255, 152, 0, 0.6)';
                      e.currentTarget.style.filter = 'brightness(1.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(255, 152, 0, 0.4)';
                      e.currentTarget.style.filter = 'brightness(1)';
                    }}
                  >
                    {buyingId === pkg.id ? '...' : (
                      <>
                        <span style={{ fontSize: '1.4rem' }}>🚀</span>
                        SATIN AL
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('start_chat', { 
                      detail: { id: pkg.workerId, name: `${pkg.worker.firstName} ${pkg.worker.lastName}` } 
                    }))}
                    style={{ 
                      flex: 1, padding: '1.2rem', borderRadius: '16px', border: '1px solid #e2e8f0', 
                      background: '#fff', color: 'var(--color-navy)', fontWeight: 800, fontSize: '0.9rem',
                      cursor: 'pointer', transition: 'all 0.3s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                  >
                    💬 Mesaj
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* SİPARİŞLERİM BÖLÜMÜ */}
      <section style={{ marginTop: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
            📦 Satın Alma Taleplerim
          </h2>
          {orders.some(o => o.status === 'ACCEPTED') && (
            <button 
              onClick={async () => {
                await fetch('/api/v1/notifications/read-by-type/PACKAGE_PURCHASE_ACCEPTED', { method: 'PATCH', credentials: 'include' });
                window.dispatchEvent(new CustomEvent('notifications_read'));
              }}
              className="btn btn-ghost btn-sm"
              style={{ color: '#64748b' }}
            >
              Tümünü Okundu Yap
            </button>
          )}
        </div>
        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '1rem' }}>Hizmet / Paket</th>
                <th style={{ textAlign: 'left', padding: '1rem' }}>Usta</th>
                <th style={{ textAlign: 'left', padding: '1rem' }}>Fiyat</th>
                <th style={{ textAlign: 'left', padding: '1rem' }}>Durum</th>
                <th style={{ textAlign: 'right', padding: '1rem' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Henüz bir satın alma talebiniz bulunmuyor.</td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700 }}>{order.package.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{order.package.sector?.name}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{order.package.worker.firstName} {order.package.worker.lastName}</div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                      {formatCurrency(order.package.price)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${
                        order.status === 'ACCEPTED' ? 'badge-success' : 
                        order.status === 'PENDING' ? 'badge-gold' : 'badge-danger'
                      }`}>
                        {order.status === 'ACCEPTED' ? 'ONAYLANDI' : 
                         order.status === 'PENDING' ? 'BEKLEMEDE' : 'REDDEDİLDİ'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {order.status === 'ACCEPTED' && (
                        <button 
                          onClick={() => window.dispatchEvent(new CustomEvent('start_chat', { 
                            detail: { id: order.package.workerId, name: `${order.package.worker.firstName} ${order.package.worker.lastName}` } 
                          }))}
                          className="btn btn-navy btn-sm"
                          style={{ 
                            background: 'var(--color-navy)', 
                            color: 'var(--color-gold)', 
                            fontWeight: 800,
                            padding: '0.6rem 1.2rem',
                            borderRadius: '10px',
                            boxShadow: '0 4px 6px rgba(10, 25, 49, 0.2)'
                          }}
                        >
                          💬 Mesaj Gönder
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ONAY MODALİ */}
      {confirmPkg && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(4px)'
        }} onClick={() => setConfirmPkg(null)}>
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '2.5rem',
            maxWidth: '440px', width: '90%', textAlign: 'center',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            animation: 'fadeInUp 0.3s ease'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
              Satın Alma Onayı
            </h3>
            <p style={{ color: '#64748b', marginBottom: '0.5rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#1e293b' }}>"{confirmPkg.title}"</strong> hizmetini
              <strong style={{ color: 'var(--color-gold)' }}> {formatCurrency(confirmPkg.price)}</strong> karşılığında
              satın almak istediğinize emin misiniz?
            </p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '2rem' }}>
              Usta: {confirmPkg.worker?.firstName} {confirmPkg.worker?.lastName}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setConfirmPkg(null)}
                style={{
                  flex: 1, padding: '1rem', borderRadius: '14px',
                  border: '1px solid #e2e8f0', background: '#f8fafc',
                  fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                İptal
              </button>
              <button
                onClick={() => executeBuy(confirmPkg)}
                style={{
                  flex: 1, padding: '1rem', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, var(--color-gold) 0%, #FF9800 100%)',
                  color: 'var(--color-navy)', fontWeight: 900, fontSize: '1rem',
                  cursor: 'pointer', boxShadow: '0 8px 20px rgba(255,152,0,0.4)'
                }}
              >
                🚀 Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST BİLDİRİMİ */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 10000,
          background: toast.type === 'success' ? '#0f766e' : '#dc2626',
          color: '#fff', padding: '1rem 1.5rem', borderRadius: '16px',
          fontWeight: 700, fontSize: '0.95rem', maxWidth: '400px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          animation: 'fadeInUp 0.3s ease'
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
