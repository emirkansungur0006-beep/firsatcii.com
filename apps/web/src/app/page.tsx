'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { icon: '🏠', name: 'Ev & Yapı', slug: 'ev-yapi' },
  { icon: '💻', name: 'Dijital', slug: 'dijital-teknoloji' },
  { icon: '🚗', name: 'Ulaşım', slug: 'ulasim-nakliye' },
  { icon: '💆', name: 'Sağlık', slug: 'saglik-guzellik' },
  { icon: '🎉', name: 'Etkinlik', slug: 'etkinlik-organizasyon' },
  { icon: '📚', name: 'Eğitim', slug: 'egitim' },
  { icon: '🎨', name: 'Tasarım', slug: 'tasarim' },
  { icon: '🔧', name: 'Tamirat', slug: 'tamirat' },
];

const DUMMY_AUCTIONS = [
  { id: 1, title: 'Boya Badana & Dekorasyon', location: 'İstanbul / Beşiktaş' },
  { id: 2, title: 'Mutfak Dolabı & Tezgah Montajı', location: 'Ankara / Çankaya' },
  { id: 3, title: 'Şehirler Arası Nakliyat', location: 'İzmir / Bornova' },
  { id: 4, title: 'Bahçe Peyzaj & Düzenleme', location: 'Bursa / Nilüfer' },
  { id: 5, title: 'Kombi Bakımı & Tesisat', location: 'Antalya / Muratpaşa' },
  { id: 6, title: 'Kurumsal Logo & Marka Tasarımı', location: 'Kocaeli / İzmit' },
  { id: 7, title: 'Çatı Aktarma & İzolasyon', location: 'İstanbul / Ümraniye' },
  { id: 8, title: 'Özel Matematik & Geometri Dersi', location: 'Ankara / Yenimahalle' },
];

export default function HomePage() {
  const [activeRole, setActiveRole] = useState<'worker' | 'employer'>('employer');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactForm, setContactForm] = useState({ email: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  return (
    <>
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* ─── NAVBAR ─── */}
      <nav className="glass-header">
        <div className="nav-container">
          <div className="nav-left">
            <Link href="/" className="logo-link">
              <img src="/assets/logo.png" alt="Fırsatçı" className="main-logo" />
            </Link>
            <div className="desktop-menu">
              <Link href="/ihaleler">İhaleler</Link>
              <Link href="/kategoriler">Kategoriler</Link>
            </div>
          </div>
          <div className="nav-right">
            <Link href="/giris" className="login-link">GİRİŞ YAP</Link>
            <Link href="/kayit" className="btn btn-gold register-btn">ÜCRETSİZ KAYIT</Link>
          </div>
        </div>
        <div className="mobile-nav-menu">
          <Link href="/ihaleler">İhaleler</Link>
          <Link href="/kategoriler">Kategoriler</Link>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="hero-section">
        <div className="hero-pattern"></div>
        <div className="container hero-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          
          {/* 1. MEGA BADGE (EN ÜSTTE) */}
          <div className="live-badge" style={{ 
            background: 'var(--color-navy)', 
            border: '3px solid var(--color-gold)', 
            padding: '0.8rem 2rem', 
            marginBottom: '2.5rem', 
            boxShadow: '0 0 40px rgba(255, 215, 0, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50px'
          }}>
            <span style={{ color: 'var(--color-gold)', fontSize: '0.95rem', fontWeight: 900, letterSpacing: '0.5px' }}>
              TEKLİF BAŞI ÜCRET ÖDEMEKTEN SIKILDINIZ MI? <span style={{ color: 'var(--color-gold)', fontWeight: 900, marginLeft: '10px' }}>SINIRSIZ TEKLİF HAKKI BURADA! 🚀</span>
            </span>
          </div>

          {/* 2. BAŞLIK VE AÇIKLAMA */}
          <h1 className="hero-title">
            Hizmet Alırken <span className="blue-text">Kazanan Sen Ol!</span>
          </h1>

          <p className="hero-desc">
            İster işini yaptır en iyi fiyatı al, ister ustalığını konuştur ihaleyi kap. 
            Türkiye'nin en şeffaf hizmet platformuyla tanış.
          </p>

          {/* 3. KARTLAR (YAN YANA) */}
          <div className="cta-grid">
            <Link href="/kayit?role=employer" className="card-cta employer">
              <div className="icon">👔</div>
              <h3>İşveren Ol</h3>
              <div className="btn-card">İHALE VER</div>
            </Link>

            <Link href="/kayit?role=worker" className="card-cta worker">
              <div className="icon">🛠️</div>
              <h3>Usta Ol</h3>
              <div className="btn-card">İŞ AL</div>
            </Link>
          </div>

          {/* 4. İSTATİSTİKLER (EN ALTTA) */}
          <div className="stats-row">
            <div className="stat-box" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📋</span>
              <div>
                <strong style={{ fontSize: '1.2rem', textTransform: 'uppercase' }}>Aktif</strong>
                <span>İhaleler</span>
              </div>
            </div>
            <div className="divider"></div>
            <div className="stat-box" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🛠️</span>
              <div>
                <strong style={{ fontSize: '1.2rem', textTransform: 'uppercase' }}>Yüzlerce</strong>
                <span>Meslek Grubu</span>
              </div>
            </div>
            <div className="divider"></div>
            <div className="stat-box" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⭐</span>
              <div>
                <strong style={{ fontSize: '1.2rem', textTransform: 'uppercase' }}>Binlerce</strong>
                <span>Mutlu Müşteri</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HİZMET KATEGORİLERİ VİTRİNİ (REKLAM ALANI) ─── */}
      <section style={{ padding: '6rem 0 4rem', background: 'var(--color-navy)', position: 'relative', zIndex: 5 }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ color: 'white', fontSize: '3rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
            HİZMET <span style={{ color: 'var(--color-gold)' }}>KATEGORİLERİ</span>
          </h2>
        </div>
        
        <div className="scroll-container">
          <div className="scroll-track" style={{ animationDuration: '40s' }}>
            {[...DUMMY_AUCTIONS, ...DUMMY_AUCTIONS].map((auc, i) => (
              <div key={i} className="premium-card" style={{ 
                background: 'rgba(255,255,255,0.03)', 
                borderColor: 'rgba(255,255,255,0.1)', 
                color: 'white', 
                minWidth: '320px', 
                padding: '2rem', 
                borderRadius: '30px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', fontWeight: 800, color: 'var(--color-gold)' }}>{auc.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                  <span>📍</span>
                  <span>{auc.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── KATEGORİ REKLAM BANTI (GÜNCELLENDİ) ─── */}
      <section style={{ padding: '6rem 0 3rem', background: 'linear-gradient(to bottom, #ffffff, #f8fafc)' }}>
        <div className="container" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ 
            display: 'inline-block', 
            padding: '1.2rem 3rem', 
            background: 'var(--color-navy)', 
            borderRadius: '100px', 
            color: 'var(--color-gold)',
            fontWeight: 900,
            fontSize: '1.2rem',
            marginBottom: '2rem',
            boxShadow: '0 15px 35px rgba(0, 31, 63, 0.25)',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            🚀 DEV HİZMET AĞI: 1000+ KATEGORİ
          </div>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--color-navy)', marginBottom: '1.5rem', letterSpacing: '-2px', lineHeight: '1.1' }}>
            Binlerce Meslek, <br className="hidden-mobile"/> <span className="blue-text">Tek Platformda Buluşuyor!</span>
          </h2>
          <p style={{ fontSize: '1.4rem', color: '#475569', maxWidth: '900px', margin: '0 auto', lineHeight: '1.6', fontWeight: 600 }}>
            Türkiye'nin en geniş kapsamlı hizmet borsasında, 1.000'den fazla uzmanlık alanında 
            işverenleri ve profesyonelleri kusursuz bir güvenle bir araya getiriyoruz.
          </p>
        </div>

        <div className="scroll-container" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '2rem 0' }}>
          <div className="scroll-track" style={{ animationDuration: '60s', gap: '4rem' }}>
            {[...CATEGORIES, ...CATEGORIES].map((cat, i) => (
              <Link href="/kayit" key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'var(--color-navy)', fontWeight: 700 }}>
                <span style={{ fontSize: '2rem' }}>{cat.icon}</span>
                <span style={{ fontSize: '1.1rem' }}>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NASIL ÇALIŞIR? (ROLE SWITCHER) ─── */}
      <section style={{ padding: '6rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-navy)' }}>Sistem <span style={{ color: 'var(--color-gold)' }}>Nasıl Çalışır?</span></h2>
            <div style={{ 
              display: 'inline-flex', 
              background: '#f1f5f9', 
              padding: '6px', 
              borderRadius: '100px', 
              marginTop: '2rem',
              border: '1px solid #e2e8f0'
            }}>
              <button 
                onClick={() => setActiveRole('employer')}
                style={{ 
                  padding: '10px 30px', 
                  borderRadius: '100px', 
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeRole === 'employer' ? 'var(--color-navy)' : 'transparent',
                  color: activeRole === 'employer' ? 'white' : 'var(--color-navy)',
                  transition: '0.3s'
                }}
              >
                İşverenim
              </button>
              <button 
                onClick={() => setActiveRole('worker')}
                style={{ 
                  padding: '10px 30px', 
                  borderRadius: '100px', 
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeRole === 'worker' ? 'var(--color-gold)' : 'transparent',
                  color: activeRole === 'worker' ? 'var(--color-navy)' : 'var(--color-navy)',
                  transition: '0.3s'
                }}
              >
                Ustayım
              </button>
            </div>
          </div>

          <div className="grid-3" style={{ gap: '2rem' }}>
            {activeRole === 'employer' ? (
              <>
                <div className="premium-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                  <h3 style={{ marginBottom: '1rem' }}>İhaleni Başlat</h3>
                  <p style={{ color: '#64748b' }}>Kategorini seç, detayları yaz ve bütçeni belirle. Saniyeler içinde ilanını yayına al.</p>
                </div>
                <div className="premium-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                  <h3 style={{ marginBottom: '1rem' }}>Teklifleri Topla</h3>
                  <p style={{ color: '#64748b' }}>Bölgendeki profesyonel ustalar en iyi fiyatı verebilmek için yarışmaya başlasın.</p>
                </div>
                <div className="premium-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</div>
                  <h3 style={{ marginBottom: '1rem' }}>En Uygunu Seç</h3>
                  <p style={{ color: '#64748b' }}>Yorumları ve puanları incele, bütçene en uygun usta ile hemen işe başla.</p>
                </div>
              </>
            ) : (
              <>
                <div className="premium-card" style={{ textAlign: 'center', borderColor: 'var(--color-gold)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
                  <h3 style={{ marginBottom: '1rem' }}>Bildirim Al</h3>
                  <p style={{ color: '#64748b' }}>Hizmet verdiğin bölgede yeni bir ihale açıldığında cebine anında bildirim gelsin.</p>
                </div>
                <div className="premium-card" style={{ textAlign: 'center', borderColor: 'var(--color-gold)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚔️</div>
                  <h3 style={{ marginBottom: '1rem' }}>Rekabet Et</h3>
                  <p style={{ color: '#64748b' }}>İşverene en iyi fiyatı ve süreyi teklif et. Rakiplerini geride bırakıp işi kap.</p>
                </div>
                <div className="premium-card" style={{ textAlign: 'center', borderColor: 'var(--color-gold)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
                  <h3 style={{ marginBottom: '1rem' }}>Kazancını Artır</h3>
                  <p style={{ color: '#64748b' }}>Reklam derdi olmadan, doğrudan iş ayağına gelsin. Portföyünü büyüt, puanını yükselt.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{ padding: '8rem 0', background: 'var(--color-gold)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }}></div>
        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--color-navy)', marginBottom: '1.5rem' }}>Zaman Kaybetme, <br/> Fırsatı Yakala!</h2>
          <p style={{ fontSize: '1.5rem', color: 'var(--color-navy)', opacity: 0.8, marginBottom: '2rem', fontWeight: 700 }}>
            Teklif Başı Ücret Ödeme, Sınırsız Teklif Hakkıyla Kazancını Katla!
          </p>
          <p style={{ fontSize: '1.2rem', color: 'var(--color-navy)', opacity: 0.6, marginBottom: '3rem' }}>Ücretsiz kayıt ol, sistemdeki binlerce ihaleye hemen ulaş.</p>
          <Link href="/kayit" className="btn btn-navy btn-lg cta-shiny" style={{ padding: '1.5rem 4rem', fontSize: '1.5rem', borderRadius: '100px' }}>
            Ücretsiz Kayıt Ol
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: 'var(--color-navy)', color: 'white', padding: '4rem 0 2rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '3rem', marginBottom: '3rem' }}>
            <div style={{ maxWidth: '300px' }}>
              <img src="/assets/logo.png" alt="Logo" style={{ height: '80px', marginBottom: '1.5rem' }} />
              <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>Türkiye'nin en dinamik hizmet pazar yeri. Şeffaf, hızlı ve güvenilir ihaleler ile işinizi çözüme ulaştırın.</p>
            </div>
            <div style={{ display: 'flex', gap: '4rem' }}>
              <div>
                <h4 style={{ color: 'var(--color-gold)', marginBottom: '1.5rem' }}>Hızlı Menü</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: 0.7 }}>
                  <Link href="/ihaleler">İhaleler</Link>
                  <Link href="/kategoriler">Kategoriler</Link>
                  <Link href="/nasil-calisir">Yardım</Link>
                </div>
              </div>
              <div>
                <h4 style={{ color: 'var(--color-gold)', marginBottom: '1.5rem' }}>Kurumsal</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: 0.7 }}>
                  <button onClick={() => setShowPrivacy(true)} style={{ background: 'none', border: 'none', color: 'white', opacity: 0.7, padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>Gizlilik</button>
                  <button onClick={() => setShowTerms(true)} style={{ background: 'none', border: 'none', color: 'white', opacity: 0.7, padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>Kullanım Koşulları</button>
                  <button onClick={() => setShowContact(true)} style={{ background: 'none', border: 'none', color: 'white', opacity: 0.7, padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>İletişim</button>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
            © 2026 Fırsatçı. Tüm hakları saklıdır. T.C. Hukuk sınırları çerçevesinde hizmet sunar.
          </div>
        </div>
      </footer>

      {/* ─── GİZLİLİK VE YASAL SORUMLULUK POP-UP (MODAL) ─── */}
      {showPrivacy && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0, 31, 63, 0.9)', zIndex: 10000, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ 
            background: 'white', maxWidth: '650px', width: '100%', 
            borderRadius: '24px', overflow: 'hidden', position: 'relative',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            animation: 'pulse 0.3s ease-out'
          }}>
            <div style={{ background: 'var(--color-navy)', padding: '1.5rem 2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--color-gold)', letterSpacing: '1px' }}>YASAL BİLGİLENDİRME & GİZLİLİK</h3>
              <button 
                onClick={() => setShowPrivacy(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}
              >✕</button>
            </div>
            
            <div style={{ padding: '2.5rem', maxHeight: '65vh', overflowY: 'auto', color: '#1e293b', lineHeight: '1.7', fontSize: '1rem' }}>
              <h4 style={{ color: 'var(--color-navy)', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '2px solid var(--color-gold)', display: 'inline-block' }}>Fırsatçı Platform Beyanı</h4>
              
              <p>Fırsatçı, Türkiye Cumhuriyeti Devleti hukuk sınırları çerçevesinde faaliyet gösteren profesyonel bir <strong>Hizmet Borsası</strong> platformudur.</p>
              
              <div style={{ background: '#f1f5f9', padding: '1.5rem', borderRadius: '16px', margin: '1.5rem 0' }}>
                <p style={{ margin: 0 }}><strong>Sorumluluk Reddi:</strong> Platformumuz sadece işveren ve usta/hizmet veren arasında bir köprü (Yer Sağlayıcı) vazifesi görmektedir. Taraflar arasında oluşabilecek her türlü uyuşmazlık, ödeme sorunu veya hizmet kalitesi aksaklıklarından <strong>Fırsatçı hiçbir şekilde hukuki veya cezai olarak sorumlu tutulamaz.</strong></p>
              </div>

              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><strong>Hukuki Statü:</strong> Kullanıcılar, yaptıkları tüm işlemlerde T.C. Borçlar Kanunu ve ilgili mevzuatlara tabidir.</li>
                <li><strong>Veri Güvenliği:</strong> Kişisel verileriniz KVKK kapsamında yüksek güvenlik standartları ile korunmaktadır.</li>
                <li><strong>İşlem Güvenliği:</strong> İhaleye katılan her kullanıcı, kendi beyan ettiği bilgilerin doğruluğundan sorumludur.</li>
              </ul>
              
              <p style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8, fontStyle: 'italic' }}>* Bu platformu kullanarak yukarıda belirtilen tüm yasal şartları peşinen kabul etmiş sayılırsınız.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── KULLANIM KOŞULLARI POP-UP (MODAL) ─── */}
      {showTerms && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0, 31, 63, 0.9)', zIndex: 10000, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ 
            background: 'white', maxWidth: '650px', width: '100%', 
            borderRadius: '24px', overflow: 'hidden', position: 'relative',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            animation: 'pulse 0.3s ease-out'
          }}>
            <div style={{ background: 'var(--color-navy)', padding: '1.5rem 2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--color-gold)', letterSpacing: '1px' }}>KULLANIM KOŞULLARI</h3>
              <button 
                onClick={() => setShowTerms(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}
              >✕</button>
            </div>
            
            <div style={{ padding: '2.5rem', maxHeight: '65vh', overflowY: 'auto', color: '#1e293b', lineHeight: '1.7', fontSize: '1rem' }}>
              <h4 style={{ color: 'var(--color-navy)', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '2px solid var(--color-gold)', display: 'inline-block' }}>Fırsatçı Platform Kullanım Şartları</h4>
              
              <p>Fırsatçı platformuna üye olan ve hizmet alan/veren her kullanıcı aşağıdaki şartları kabul etmiş sayılır:</p>
              
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><strong>Üyelik ve Beyan:</strong> Kullanıcılar üye olurken verdikleri bilgilerin (telefon, isim, meslek vb.) doğruluğundan bizzat sorumludur. Sahte profil oluşturulması yasaktır.</li>
                <li><strong>İhale Kuralları:</strong> İhalelerde etik dışı fiyat kırma, manipülasyon veya hileli teklif verilmesi durumunda kullanıcının hesabı kalıcı olarak askıya alınır.</li>
                <li><strong>Hizmet Akdi:</strong> Fırsatçı, sadece tarafları buluşturan bir platformdur. İşin tamamlanması, kalitesi ve ödeme süreçleri tamamen taraflar arasındaki özel hukuka tabidir.</li>
                <li><strong>Fikri Mülkiyet:</strong> Platform üzerindeki tüm logolar, yazılımlar ve tasarımlar Fırsatçı'ya aittir; izinsiz kopyalanamaz.</li>
                <li><strong>Hesap Güvenliği:</strong> Kullanıcılar kendi şifre ve hesap güvenliğinden sorumludur; hesabın üçüncü kişilerce kullanılmasından doğacak zararlardan platform sorumlu değildir.</li>
              </ul>
              
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fffbeb', borderRadius: '12px', border: '1px solid var(--color-gold)', fontSize: '0.9rem' }}>
                <strong>UYARI:</strong> Kullanım koşullarının ihlali durumunda Fırsatçı, tek taraflı olarak hizmeti durdurma hakkını saklı tutar.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── İLETİŞİM VE ADMİNE MESAJ POP-UP (MODAL) ─── */}
      {showContact && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0, 31, 63, 0.95)', zIndex: 10000, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            background: 'white', maxWidth: '500px', width: '100%', 
            borderRadius: '28px', overflow: 'hidden', position: 'relative',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
            animation: 'pulse 0.3s ease-out'
          }}>
            <div style={{ background: 'var(--color-navy)', padding: '2rem', color: 'white', textAlign: 'center', position: 'relative' }}>
              <h3 style={{ margin: 0, color: 'var(--color-gold)', fontSize: '1.5rem' }}>BİZE ULAŞIN</h3>
              <p style={{ margin: '0.5rem 0 0', opacity: 0.7, fontSize: '0.9rem' }}>Sadece kayıtlı kullanıcılar mesaj gönderebilir.</p>
              <button 
                onClick={() => { setShowContact(false); setStatus(null); }}
                style={{ position: 'absolute', right: '20px', top: '25px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' }}
              >✕</button>
            </div>

            <div style={{ padding: '2.5rem' }}>
              {status && (
                <div style={{ 
                  padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
                  background: status.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: status.type === 'success' ? '#065f46' : '#991b1b',
                  fontSize: '0.9rem', fontWeight: 600, border: `1px solid ${status.type === 'success' ? '#10b981' : '#ef4444'}`
                }}>
                  {status.text}
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-navy)' }}>KAYITLI E-POSTA ADRESİNİZ</label>
                <input 
                  type="email" 
                  placeholder="admin@firsatci.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                  style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-navy)' }}>MESAJINIZ</label>
                <textarea 
                  placeholder="Admine iletmek istediğiniz notu buraya yazın..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  rows={4}
                  style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none', resize: 'none' }}
                />
              </div>

              <button 
                disabled={isSending}
                onClick={async () => {
                  if (!contactForm.email || !contactForm.message) {
                    setStatus({ type: 'error', text: 'Lütfen tüm alanları doldurun.' });
                    return;
                  }
                  setIsSending(true);
                  setStatus(null);
                  try {
                    const res = await fetch('/api/v1/contact/send-to-admin', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(contactForm)
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setStatus({ type: 'success', text: 'Mesajınız başarıyla iletildi! Admin en kısa sürede dönüş yapacaktır.' });
                      setContactForm({ email: '', message: '' });
                      setTimeout(() => setShowContact(false), 3000);
                    } else {
                      setStatus({ type: 'error', text: data.message || 'Doğrulama başarısız. E-posta sistemde kayıtlı değil.' });
                    }
                  } catch (err) {
                    setStatus({ type: 'error', text: 'Sistem hatası oluştu. Lütfen tekrar deneyin.' });
                  } finally {
                    setIsSending(false);
                  }
                }}
                style={{ 
                  width: '100%', background: 'var(--color-navy)', color: 'white', 
                  padding: '1.2rem', borderRadius: '50px', border: 'none', 
                  fontWeight: 800, cursor: isSending ? 'not-allowed' : 'pointer',
                  fontSize: '1rem', opacity: isSending ? 0.7 : 1,
                  boxShadow: '0 10px 20px rgba(0, 31, 63, 0.2)'
                }}
              >
                {isSending ? 'DOĞRULANIYOR...' : 'DOĞRULA VE GÖNDER'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
