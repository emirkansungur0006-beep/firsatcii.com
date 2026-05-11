'use client';
// apps/web/src/app/(auth)/giris/page.tsx
// Giriş sayfası - E-posta ve şifre ile giriş.

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function GirisPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Zaten giriş yapmış kullanıcıyı yönlendir
  useEffect(() => {
    if (isAuthenticated && user) {
      // Role göre dashboard'a yönlendir
      if (user.role === 'ADMIN') router.push('/admin');
      else if (user.role === 'EMPLOYER') router.push('/isveren');
      else router.push('/isci');
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Yönlendirme useEffect ile yapılır
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img
            src="/assets/logo.png"
            alt="Fırsatçı"
            className="prime-logo"
            style={{ width: '240px', height: '240px', objectFit: 'contain' }}
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              const text = document.createElement('span');
              text.textContent = 'Fırsatçı';
              text.style.cssText = 'font-size:1.8rem;font-weight:900;color:var(--color-navy)';
              el.parentNode?.appendChild(text);
            }}
          />
        </div>

        <h1 className="auth-title">Tekrar Hoş Geldiniz!</h1>
        <p className="auth-subtitle">Hesabınıza giriş yapın ve fırsatları kaçırmayın</p>

        {/* Hata Mesajı */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: 'var(--color-error)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            fontWeight: 500,
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* E-posta */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">E-posta Adresi</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Şifre */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">Şifre</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {/* Giriş Butonu */}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading}
            style={{ marginTop: '0.5rem', padding: '0.875rem' }}
          >
            {isLoading ? (
              <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span> Giriş yapılıyor...</>
            ) : (
              '🚀 Giriş Yap'
            )}
          </button>
        </form>

        {/* Kayıt Bağlantısı */}
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
          Hesabınız yok mu?{' '}
          <Link href="/kayit" style={{ color: 'var(--color-navy)', fontWeight: 700 }}>
            Ücretsiz Kayıt Ol →
          </Link>
        </p>

        {/* Admin Demo */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--color-gold-pale)', borderRadius: 'var(--radius-lg)', fontSize: '0.8rem' }}>
          <strong>🔑 Test Admin:</strong> admin@firsatci.com / LLpp369*
        </div>
      </div>
    </div>
  );
}
