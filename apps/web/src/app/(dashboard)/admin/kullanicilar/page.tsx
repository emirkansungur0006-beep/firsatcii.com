'use client';

import { useEffect, useState, useCallback } from 'react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isSuspended: boolean;
  permissions: any;
  createdAt: string;
}

const WORKER_PERMISSIONS = [
  { key: 'view_home', label: 'Ana Sayfa', desc: 'İşçi ana sayfa erişimi' },
  { key: 'view_active_jobs', label: 'Aktif İhaleler', desc: 'İhale listesini görebilir' },
  { key: 'view_my_bids', label: 'Tekliflerim', desc: 'Kendi tekliflerini görebilir' },
  { key: 'view_messages', label: 'Mesajlarım', desc: 'Mesaj kutusuna erişim' },
  { key: 'view_notifications', label: 'Bildirimler', desc: 'Bildirim merkezine erişim' },
  { key: 'view_profile', label: 'Profil', desc: 'Profil bilgilerine erişim' },
  { key: 'create_package', label: 'Paket Oluştur', desc: 'İşçi paket oluşturabilir ve satabilir' },
];

const EMPLOYER_PERMISSIONS = [
  { key: 'view_home', label: 'Ana Sayfa', desc: 'İşveren ana sayfa erişimi' },
  { key: 'view_home_create_job_btn', label: 'Hızlı İş Aç Butonu', desc: 'Ana sayfadaki Yeni İhale Aç butonu' },
  { key: 'view_create_job', label: 'İş Oluştur', desc: 'Yeni ihale sayfası erişimi' },
  { key: 'view_find_worker', label: 'Usta Bul', desc: 'Usta arama sayfası erişimi' },
  { key: 'view_my_jobs', label: 'İhalelerim', desc: 'Kendi ihalelerine erişim' },
  { key: 'view_messages', label: 'Mesajlarım', desc: 'Mesaj kutusuna erişim' },
  { key: 'view_notifications', label: 'Bildirimler', desc: 'Bildirim merkezine erişim' },
  { key: 'view_profile', label: 'Profilim', desc: 'Profil yönetimi erişimi' },
  { key: 'view_urgent_worker', label: 'Acil Usta', desc: 'Acil usta ve paket satın alma erişimi' },
];

const ROLE_LABELS: Record<string, { label: string; badge: string }> = {
  WORKER: { label: '🔨 İşçi', badge: 'badge-gold' },
  EMPLOYER: { label: '🏢 İşveren', badge: 'badge-navy' },
  ADMIN: { label: '👑 Admin', badge: 'badge-danger' },
};

export default function KullanicilarPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalUser, setModalUser] = useState<User | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editPermissions, setEditPermissions] = useState<any>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/api/v1/admin/users?${params}`, { credentials: 'include' });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === users.length) setSelectedIds([]);
    else setSelectedIds(users.map(u => u.id));
  };

  const savePermissions = async (userIds: string[], perms: any) => {
    try {
      const isBulk = userIds.length > 1;
      const url = isBulk ? '/api/v1/admin/users/bulk-permissions' : `/api/v1/admin/users/${userIds[0]}/permissions`;
      const body = isBulk ? { userIds, permissions: perms } : { permissions: perms };

      const res = await fetch(url, {
        method: isBulk ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Yetkiler güncellenemedi.');
      showMessage('success', 'Yetkiler başarıyla güncellendi.');
      setModalUser(null);
      setBulkModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const handleRolePermissions = async (role: string, perms: any) => {
    if (!confirm(`Tüm ${role === 'WORKER' ? 'İşçilerin' : 'İşverenlerin'} yetkilerini bu ayarlarla eşitlemek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch('/api/v1/admin/users/role-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, permissions: perms }),
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Toplu yetki güncelleme başarısız.');
      showMessage('success', `Tüm ${role === 'WORKER' ? 'İşçi' : 'İşveren'} yetkileri güncellendi.`);
      setBulkModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const handleBulkStatus = async (isSuspended: boolean) => {
    if (!confirm(`${selectedIds.length} kullanıcıyı ${isSuspended ? 'askıya almak' : 'aktifleştirmek'} istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch('/api/v1/admin/users/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedIds, isSuspended }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('İşlem başarısız.');
      showMessage('success', 'Kullanıcı durumları güncellendi.');
      setSelectedIds([]);
      fetchUsers();
    } catch (err: any) {
      showMessage('error', err.message);
    }
  };

  const currentPermList = modalUser?.role === 'EMPLOYER' ? EMPLOYER_PERMISSIONS : WORKER_PERMISSIONS;

  return (
    <div style={{ paddingBottom: '100px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kullanıcı Yönetimi</h1>
          <p style={{ color: 'var(--color-gray-500)' }}>Dinamik yetkilendirme ve toplu işlemler.</p>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          width: '100%', 
          maxWidth: '500px',
          flexWrap: 'wrap'
        }}>
          <button 
            className="btn btn-gold" 
            style={{ 
              padding: '1rem', 
              fontSize: '0.9rem', 
              fontWeight: 800, 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 12px -3px rgba(234, 179, 8, 0.2)',
              background: 'linear-gradient(135deg, #facc15 0%, #a3e635 100%)',
              border: 'none',
              color: 'var(--color-navy)'
            }} 
            onClick={() => { setEditPermissions({}); setBulkModalOpen(true); setRoleFilter('WORKER'); }}
          >
            <span style={{ fontSize: '1.2rem' }}>🔨</span> İŞÇİ YETKİLERİ
          </button>
          <button 
            className="btn btn-navy" 
            style={{ 
              padding: '1rem', 
              fontSize: '0.9rem', 
              fontWeight: 800, 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 12px -3px rgba(30, 58, 138, 0.2)',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              border: 'none',
              color: 'white'
            }} 
            onClick={() => { setEditPermissions({}); setBulkModalOpen(true); setRoleFilter('EMPLOYER'); }}
          >
            <span style={{ fontSize: '1.2rem' }}>🏢</span> İŞVEREN YETKİLERİ
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '1rem', borderRadius: '12px', marginBottom: '1rem',
          background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: message.type === 'success' ? '#059669' : '#dc2626',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
          fontWeight: 600
        }}>
          {message.text}
        </div>
      )}

      {/* Filtreler */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem', display: 'flex', gap: '1rem' }}>
        <input 
          className="form-input" 
          placeholder="🔍 Kullanıcı ara..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select className="form-input" style={{ width: '200px' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">Tüm Roller</option>
          <option value="WORKER">İşçiler</option>
          <option value="EMPLOYER">İşverenler</option>
        </select>
      </div>

      {/* Kullanıcı Listesi */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="data-table" style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input type="checkbox" checked={selectedIds.length === users.length && users.length > 0} onChange={selectAll} />
              </th>
              <th>Kullanıcı</th>
              <th>Rol / Durum</th>
              <th>Yetki Özeti</th>
              <th style={{ textAlign: 'right' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Yükleniyor...</td></tr>
            ) : users.map(u => {
              const permList = u.role === 'EMPLOYER' ? EMPLOYER_PERMISSIONS : WORKER_PERMISSIONS;
              return (
                <tr key={u.id} style={{ background: selectedIds.includes(u.id) ? 'var(--color-gold-pale)' : 'transparent' }}>
                  <td>
                    <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggleSelect(u.id)} />
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{u.firstName} {u.lastName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${ROLE_LABELS[u.role]?.badge}`}>{ROLE_LABELS[u.role]?.label}</span>
                    <span style={{ marginLeft: '8px' }} className={`badge ${u.isSuspended ? 'badge-danger' : 'badge-success'}`}>
                      {u.isSuspended ? 'Askıda' : 'Aktif'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {permList.slice(0, 4).map(p => (
                        <span key={p.key} style={{ 
                          fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                          background: u.permissions?.[p.key] !== false ? '#dcfce7' : '#fef2f2',
                          color: u.permissions?.[p.key] !== false ? '#166534' : '#dc2626',
                          border: `1px solid ${u.permissions?.[p.key] !== false ? '#bbf7d0' : '#fecaca'}`
                        }}>
                          {p.label}
                        </span>
                      ))}
                      {permList.length > 4 && <span style={{ fontSize: '10px', color: '#64748b' }}>+{permList.length - 4}</span>}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setModalUser(u); setEditPermissions(u.permissions || {}); }}>
                      ⚙️ İnce Ayar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TOPLU İŞLEM BARI */}
      {selectedIds.length > 0 && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--color-navy)', color: 'white', padding: '1rem 2rem',
          borderRadius: '50px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 1000,
          animation: 'slideUp 0.3s ease'
        }}>
          <span style={{ fontWeight: 700, borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '1.5rem' }}>
            {selectedIds.length} Kullanıcı Seçili
          </span>
          <button className="btn btn-gold btn-sm" onClick={() => { setEditPermissions({}); setBulkModalOpen(true); }}>
            🛠️ Seçilenlere Yetki Tanımla
          </button>
          <button className="btn btn-success btn-sm" onClick={() => handleBulkStatus(false)}>🔓 Aktifleştir</button>
          <button className="btn btn-danger btn-sm" onClick={() => handleBulkStatus(true)}>🚫 Askıya Al</button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'white' }} onClick={() => setSelectedIds([])}>Vazgeç</button>
        </div>
      )}

      {/* YETKİ MODALI (TEKİL / TOPLU / GLOBAL) */}
      {(modalUser || bulkModalOpen) && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '0.5rem', fontWeight: 800 }}>
              {bulkModalOpen 
                ? (roleFilter ? `Global ${ROLE_LABELS[roleFilter]?.label} Yetkileri` : `Toplu Yetkilendirme (${selectedIds.length} Kişi)`) 
                : `Yetki Yönetimi: ${modalUser?.firstName}`}
            </h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {bulkModalOpen && roleFilter 
                ? `Bu işlem sistemdeki TÜM ${ROLE_LABELS[roleFilter]?.label} kullanıcılarını etkileyecektir.` 
                : "Modülleri açıp kapatarak kullanıcı erişimini kısıtlayabilirsiniz."}
            </p>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              maxHeight: '60vh',
              overflowY: 'auto',
              paddingRight: '4px',
              paddingBottom: '10px'
            }}>
              {/* GELİR PANELİ KONTROLÜ (FIRSATÇI 2026) */}
              {!bulkModalOpen && modalUser?.role === 'WORKER' && (
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem', background: '#f0f9ff', borderRadius: '12px', border: '2px solid #bae6fd',
                  marginBottom: '0.5rem'
                }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0369a1' }}>💰 Gelir Paneli Erişimi</div>
                    <div style={{ fontSize: '0.75rem', color: '#0ea5e9' }}>İşçi panelde kazanç istatistiklerini görsün mü?</div>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={(modalUser as any).showRevenuePanel !== false} 
                      onChange={async (e) => {
                        const status = e.target.checked;
                        try {
                          const res = await fetch(`/api/v1/users/admin/${modalUser.id}/revenue-panel`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status }),
                            credentials: 'include'
                          });
                          if (!res.ok) throw new Error('Güncelleme başarısız');
                          setModalUser({...modalUser, showRevenuePanel: status} as any);
                          showMessage('success', 'Gelir paneli durumu güncellendi.');
                          fetchUsers();
                        } catch (err: any) {
                          showMessage('error', err.message);
                        }
                      }}
                    />
                    <span className="slider round" style={{ backgroundColor: (modalUser as any).showRevenuePanel !== false ? '#0ea5e9' : '#cbd5e1' }}></span>
                  </label>
                </div>
              )}

              {(bulkModalOpen && roleFilter ? (roleFilter === 'EMPLOYER' ? EMPLOYER_PERMISSIONS : WORKER_PERMISSIONS) : currentPermList).map(p => (
                <div key={p.key} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-navy)' }}>{p.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.desc}</div>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={editPermissions[p.key] !== false} 
                      onChange={e => setEditPermissions({...editPermissions, [p.key]: e.target.checked})}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn btn-secondary btn-full" onClick={() => { setModalUser(null); setBulkModalOpen(false); }}>Vazgeç</button>
              {bulkModalOpen && roleFilter ? (
                <button className="btn btn-primary btn-full" onClick={() => handleRolePermissions(roleFilter, editPermissions)}>
                  🌍 Global Uygula
                </button>
              ) : (
                <button className="btn btn-primary btn-full" onClick={() => savePermissions(bulkModalOpen ? selectedIds : [modalUser!.id], editPermissions)}>
                  💾 Kaydet
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; inset: 0; background-color: #cbd5e1; transition: .4s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--color-success); }
        input:checked + .slider:before { transform: translateX(20px); }
        
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); }
          to { transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
