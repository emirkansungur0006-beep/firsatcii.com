'use client';
// apps/web/src/app/(dashboard)/layout.tsx
// Dashboard layout - Navbar + Sidebar + Ana içerik alanı.
// Rol bazlı sidebar menüsü oluşturur.

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import NotificationHandler from '@/components/NotificationHandler';
import Messenger from '@/components/Messenger';

const WORKER_MENU = [
  { icon: '🏠', label: 'Ana Sayfa', href: '/isci', permission: 'view_home' },
  { icon: '🔍', label: 'Aktif İhaleler', href: '/isci/ihaleler', permission: 'view_active_jobs' },
  { icon: '📋', label: 'Tekliflerim', href: '/isci/tekliflerim', permission: 'view_my_bids' },
  { icon: '✉️', label: 'Mesajlarım', href: '/isci/mesajlar', permission: 'view_messages' },
  { icon: '🔔', label: 'Bildirimler', href: '/isci/bildirimler', permission: 'view_notifications' },
  { icon: '👤', label: 'Profilim', href: '/isci/profil', permission: 'view_profile' },
  { icon: '📦', label: 'Paket Oluştur', href: '/isci/paketlerim', permission: 'create_package' },
  { icon: '💎', label: 'Üyelik İşlemleri', href: '/isci/uyelik' },
];

const EMPLOYER_MENU = [
  { icon: '🏠', label: 'Ana Sayfa', href: '/isveren', permission: 'view_home' },
  { icon: '➕', label: 'İş Oluştur', href: '/isveren/is-olustur', permission: 'view_create_job' },
  { icon: '🚨', label: 'Acil Usta', href: '/isveren/acil-usta', permission: 'view_urgent_worker' },
  { icon: '🔍', label: 'Usta Bul', href: '/isveren/ustalar', permission: 'view_find_worker' },
  { icon: '📊', label: 'İhalelerim', href: '/isveren/ihaleler', permission: 'view_my_jobs' },
  { icon: '✉️', label: 'Mesajlarım', href: '/isveren/mesajlar', permission: 'view_messages' },
  { icon: '🔔', label: 'Bildirimler', href: '/isveren/bildirimler', permission: 'view_notifications' },
  { icon: '👤', label: 'Profilim', href: '/isveren/profil', permission: 'view_profile' },
];

const ADMIN_MENU = [
  { icon: '📊', label: 'Genel Bakış', href: '/admin' },
  { icon: '👥', label: 'Kullanıcılar', href: '/admin/kullanicilar' },
  { icon: '🏗️', label: 'İhaleler', href: '/admin/ihaleler' },
  { icon: '💎', label: 'Paket Yönetimi', href: '/admin/abonelikler' },
  { icon: '📋', label: 'Denetim Günlüğü', href: '/admin/denetim' },
  { icon: '✉️', label: 'Mesajlarım', href: '/admin/mesajlar' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [packageBadge, setPackageBadge] = useState(0);
  const [urgentBadge, setUrgentBadge] = useState(0);
  const [newMessageGlow, setNewMessageGlow] = useState(false);

  // Bildirim sayılarını çek (Başlangıçta)
  useEffect(() => {
    if (isAuthenticated && user) {
      fetch('/api/v1/notifications', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          const unread = (data || []).filter((n: any) => !n.isRead).length;
          setUnreadCount(unread);
          
          // Paket ve Acil Usta özel bildirimleri
          const pkgCount = (data || []).filter((n: any) => !n.isRead && n.type === 'PACKAGE_PURCHASE_REQUEST').length;
          const urgentCount = (data || []).filter((n: any) => !n.isRead && n.type === 'PACKAGE_PURCHASE_ACCEPTED').length;
          setPackageBadge(pkgCount);
          setUrgentBadge(urgentCount);
        });
    }
  }, [isAuthenticated, user]);

  // Sayfa değişiminde yetkileri tazele (Admin bir şeyi değiştirmiş olabilir)
  useEffect(() => {
    if (isAuthenticated) {
      refreshUser();
    }
  }, [pathname, isAuthenticated, refreshUser]);

  // Yeni bildirim geldiğinde sayayı artır (Global Listener)
  useEffect(() => {
    const handleNewNotification = (e: any) => {
      setUnreadCount(prev => prev + 1);
      
      // Tipine göre ilgili rozeti de artır
      const notification = e.detail;
      if (notification?.type === 'PACKAGE_PURCHASE_REQUEST') setPackageBadge(prev => prev + 1);
      if (notification?.type === 'PACKAGE_PURCHASE_ACCEPTED') setUrgentBadge(prev => prev + 1);
    };
    window.addEventListener('new_notification', handleNewNotification);
    
    const handleNewMessage = () => {
      setNewMessageGlow(true);
    };
    window.addEventListener('new_message_received', handleNewMessage);

    const handleRead = () => {
      // Sayıları tekrar çek
      fetch('/api/v1/notifications', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          const unread = (data || []).filter((n: any) => !n.isRead).length;
          setUnreadCount(unread);
          setPackageBadge((data || []).filter((n: any) => !n.isRead && n.type === 'PACKAGE_PURCHASE_REQUEST').length);
          setUrgentBadge((data || []).filter((n: any) => !n.isRead && n.type === 'PACKAGE_PURCHASE_ACCEPTED').length);
        });
    };
    window.addEventListener('notifications_read', handleRead);

    return () => {
      window.removeEventListener('new_notification', handleNewNotification);
      window.removeEventListener('new_message_received', handleNewMessage);
      window.removeEventListener('notifications_read', handleRead);
    };
  }, []);

  // Kimlik doğrulama kontrolü
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/giris');
    }

    // Abonelik Kontrolü (Sadece İşçiler için)
    if (!isLoading && isAuthenticated && user?.role === 'WORKER') {
      const sub = user.subscription;
      const isSubActive = sub && new Date(sub.endDate) > new Date() && sub.isActive;
      
      // Kısıtlı sayfalar listesi
      const restrictedPaths = ['/isci/ihaleler', '/isci/tekliflerim', '/isci/paketlerim'];
      const isRestrictedPath = restrictedPaths.some(p => pathname.startsWith(p));

      if (!isSubActive && isRestrictedPath) {
        router.push('/isci/uyelik');
      }
    }
  }, [isLoading, isAuthenticated, router, user, pathname]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" style={{ width: 48, height: 48 }}></div>
      </div>
    );
  }

  if (!user) return null;

  // Kullanıcı rolüne göre menü seç ve izinlere göre filtrele
  const rawMenu = user.role === 'ADMIN' ? ADMIN_MENU
    : user.role === 'EMPLOYER' ? EMPLOYER_MENU
    : WORKER_MENU;

  const menu = rawMenu.filter(item => {
    if (user.role === 'ADMIN') return true;
    if (!item.permission) return true;
    // Eğer yetki false olarak set edilmişse gizle, aksi halde göster
    return user.permissions?.[item.permission] !== false;
  });

  const handleLogout = async () => {
    await logout();
    router.push('/giris');
  };

  return (
    <div className="dashboard-layout">
      {/* GLOBAL LİSTENERS */}
      <NotificationHandler />
      <Messenger />
      
      <style jsx global>{`
        /* MOBİL KAYMAYI KESİN ENGELLEME (ULTRA AGRESİF) */
        @media (max-width: 1024px) {
          .dashboard-layout {
            display: block !important;
            width: 100vw !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
            position: relative !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .main-content {
            width: 100vw !important;
            max-width: 100vw !important;
            margin: 0 !important;
            padding: 1rem !important;
            flex: none !important;
            margin-top: 70px !important;
            display: block !important;
            min-height: calc(100vh - 70px) !important;
          }
          .sidebar {
            display: none !important;
            width: 0 !important;
            position: fixed !important;
          }
          .sidebar.open {
            display: flex !important;
            width: 280px !important;
            z-index: 9999 !important;
            visibility: visible !important;
          }
          .navbar {
            width: 100vw !important;
            left: 0 !important;
          }
          body, html {
            overflow-x: hidden !important;
            width: 100vw !important;
            position: relative !important;
          }
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        .toast-popup {
          font-family: 'Inter', sans-serif;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes glow-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 195, 0, 0.4); }
          50% { box-shadow: 0 0 20px 5px rgba(255, 195, 0, 0.7); }
          100% { box-shadow: 0 0 0 0 rgba(255, 195, 0, 0.4); }
        }
        .glowing-menu-item {
          animation: glow-pulse 1.5s infinite;
          background: rgba(255, 195, 0, 0.2) !important;
          color: white !important;
          border: 1px solid var(--color-gold);
        }
      `}</style>

      {/* ─── NAVBAR ─── */}
      <nav className="navbar">
        <div className="navbar-container">
          {/* Hamburger (Mobil) */}
          <button
            className="navbar-hamburger"
            id="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menüyü aç/kapat"
          >
            <span></span><span></span><span></span>
          </button>

          {/* Logo - Mobil'de menü açar */}
          <Link
            href="/"
            className="navbar-logo"
            onClick={(e) => {
              if (window.innerWidth < 768) {
                e.preventDefault();
                setMobileMenuOpen(!mobileMenuOpen);
              }
            }}
          >
            <img src="/assets/logo.png" alt="Fırsatçı" className="prime-logo" />
          </Link>

          {/* Rol Rozeti */}
          <span className={`badge ${user.role === 'ADMIN' ? 'badge-danger' : user.role === 'EMPLOYER' ? 'badge-navy' : 'badge-gold'}`}>
            {user.role === 'ADMIN' ? '👑 Admin' : user.role === 'EMPLOYER' ? '🏢 İşveren' : '🔨 İşçi'}
          </span>

          <div style={{ flex: 1 }}></div>

          {/* Kullanıcı Bilgisi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="hidden-mobile" style={{ color: 'var(--color-gray-300)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: 'white' }}>{user.firstName} {user.lastName}</span>
              <span style={{ fontSize: '0.75rem' }}>{user.email}</span>
            </span>
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.4rem 0.8rem' }}
            >
              Çıkış
            </button>
          </div>
        </div>
      </nav>

      {/* ─── SIDEBAR ─── */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        {/* Kullanıcı Kartı */}
        <Link 
          href={user.role === 'WORKER' ? '/isci/profil' : (user.role === 'EMPLOYER' ? '/isveren/profil' : '/admin')}
          style={{
            background: 'rgba(255,195,0,0.1)',
            border: '1px solid rgba(255,195,0,0.2)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.2rem 1rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
            display: 'block',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          className="sidebar-user-card"
        >
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--color-gold)', color: 'var(--color-navy)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 800, margin: '0 auto 0.5rem',
            overflow: 'hidden', border: '3px solid var(--color-gold-pale)'
          }}>
            {user.profilePicture ? (
              <img src={user.profilePicture} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <>{user.firstName[0]}{user.lastName[0]}</>
            )}
          </div>
          <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
            {user.firstName} {user.lastName}
          </div>
          {user.role !== 'ADMIN' && (
            <div style={{ color: 'var(--color-gold)', fontSize: '0.75rem', marginTop: '4px' }}>
              ⭐ {user.leaderScore.toFixed(1)} Puan · {user.completedJobs} İş
            </div>
          )}
          
          {user.role === 'WORKER' && (
            <div style={{ marginTop: '8px' }}>
              {user.subscription && new Date(user.subscription.endDate) > new Date() && user.subscription.isActive ? (
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>💎 {user.subscription.plan.name}</span>
              ) : (
                <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>⚠️ Abone Değil</span>
              )}
            </div>
          )}
        </Link>

        {user.role !== 'ADMIN' && (
          <button 
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                const res = await fetch('/api/v1/users/switch-role', { method: 'POST', credentials: 'include' });
                if (res.ok) {
                  await refreshUser();
                  router.push(user.role === 'WORKER' ? '/isveren/ihaleler' : '/isci/ihaleler');
                }
              } catch (err) {
                console.error('Mod değiştirme hatası:', err);
              }
            }}
            className={`btn-switch-role ${user.role === 'WORKER' ? 'worker' : 'employer'}`}
            style={{ marginBottom: '1.5rem', width: '100%' }}
          >
            {user.role === 'WORKER' ? '🔄 İşveren Moduna Geç' : '🔄 Usta Moduna Geç'}
          </button>
        )}

        {/* Menü */}
        <div className="sidebar-section-title">Menü</div>
        <nav>
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname === item.href ? 'active' : ''} ${item.label === 'Mesajlarım' && newMessageGlow ? 'glowing-menu-item' : ''}`}
              onClick={async () => {
                setMobileMenuOpen(false);
                if (item.label === 'Bildirimler') setUnreadCount(0);
                if (item.label === 'Mesajlarım') setNewMessageGlow(false);
                
                // Paket Bildirimlerini Söndür
                if (item.label === 'Paket Oluştur' && packageBadge > 0) {
                  setPackageBadge(0);
                  await fetch('/api/v1/notifications/read-by-type/PACKAGE_PURCHASE_REQUEST', { method: 'PATCH', credentials: 'include' });
                }
                // Acil Usta Bildirimlerini Söndür
                if (item.label === 'Acil Usta' && urgentBadge > 0) {
                  setUrgentBadge(0);
                  await fetch('/api/v1/notifications/read-by-type/PACKAGE_PURCHASE_ACCEPTED', { method: 'PATCH', credentials: 'include' });
                }
              }}
              style={{ position: 'relative' }}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
              {((item.label === 'Bildirimler' && unreadCount > 0) || 
                (item.label === 'Paket Oluştur' && packageBadge > 0) ||
                (item.label === 'Acil Usta' && urgentBadge > 0)) && (
                <span style={{
                  position: 'absolute',
                  right: '1rem',
                  background: 'var(--color-error)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {item.label === 'Bildirimler' ? (unreadCount > 9 ? '9+' : unreadCount)
                   : item.label === 'Paket Oluştur' ? packageBadge
                   : urgentBadge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Çıkış */}
        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{ width: '100%', cursor: 'pointer', color: 'var(--color-error)' }}
          >
            <span className="sidebar-link-icon">🚪</span>
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* ─── ANA İÇERİK ─── */}
      <main className="main-content">
        {children}
      </main>

      {/* Mobil overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(10,25,49,0.7)',
            zIndex: 850, backdropFilter: 'blur(4px)',
          }}
        />
      )}
    </div>
  );
}
