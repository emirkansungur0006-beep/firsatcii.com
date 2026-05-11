'use client';
// apps/web/src/app/(auth)/kayit/page.tsx
// Kayıt sayfası - Rol seçimi, form doğrulama, kayıt.

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Role = 'WORKER' | 'EMPLOYER';

interface FormData {
  firstName: string;
  lastName: string;
  tckn: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  profileType: 'INDIVIDUAL' | 'CORPORATE';
  companyName: string;
  taxNumber: string;
}

function KayitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('rol') === 'isveren' ? 'EMPLOYER' : 'WORKER';

  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    tckn: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: defaultRole as Role,
    profileType: 'INDIVIDUAL',
    companyName: '',
    taxNumber: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [step, setStep] = useState(1); // 1: Bilgiler, 2: OTP
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const update = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Form doğrulama
  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!form.firstName || form.firstName.length < 2)
      newErrors.firstName = 'Ad en az 2 karakter olmalı.';
    if (!form.lastName || form.lastName.length < 2)
      newErrors.lastName = 'Soyad en az 2 karakter olmalı.';
    if (!/^\d{11}$/.test(form.tckn))
      newErrors.tckn = 'TCKN 11 haneli sayıdan oluşmalıdır.';
    if (!/^(\+90|0)?[0-9]{10}$/.test(form.phone))
      newErrors.phone = 'Geçerli bir telefon numarası girin.';
    if (form.profileType === 'CORPORATE') {
      if (!form.companyName || form.companyName.length < 2) newErrors.companyName = 'Firma adı giriniz.';
      if (!/^\d{10}$/.test(form.taxNumber)) newErrors.taxNumber = 'Vergi Numarası 10 haneli olmalıdır.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Geçerli bir e-posta adresi girin.';
    if (form.password.length < 8)
      newErrors.password = 'Şifre en az 8 karakter olmalı.';
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Şifreler eşleşmiyor.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, email: form.email })
      });
      if (!res.ok) throw new Error('Doğrulama kodu gönderilemedi.');
      setStep(2);
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setOtpError('Lütfen 6 haneli doğrulama kodunu girin.');
      return;
    }

    setIsLoading(true);
    setServerError('');

    try {
      const { confirmPassword, ...registerData } = form;
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...registerData,
          otp
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Kayıt başarısız.');
      }

      setSuccess(true);
      setTimeout(() => router.push('/giris'), 2000);
    } catch (err: any) {
      setServerError(err.message);
      if (err.message.includes('kod')) setStep(2); 
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: 'var(--color-navy)', fontWeight: 800 }}>Hesabınız Oluşturuldu!</h2>
          <p style={{ color: 'var(--color-gray-500)', marginTop: '0.5rem' }}>
            Giriş sayfasına yönlendiriliyorsunuz...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="auth-card" style={{ maxWidth: '560px' }}>
        {/* Logo */}
        <div className="auth-logo" style={{ display: 'flex', justifyContent: 'center' }}>
          <img src="/assets/logo.png" alt="Fırsatçı" className="prime-logo"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        <h1 className="auth-title">Hesap Oluştur</h1>
        <p className="auth-subtitle">Ücretsiz kayıt ol, hemen başla!</p>

        {/* ROL SEÇİMİ */}
        <div className="role-selector">
          <button
            type="button"
            id="role-employer"
            className={`role-option ${form.role === 'EMPLOYER' ? 'selected' : ''}`}
            onClick={() => update('role', 'EMPLOYER')}
          >
            <div className="role-option-icon">🏢</div>
            <div className="role-option-title">İşveren</div>
            <div className="role-option-desc">İş açıp teklif al</div>
          </button>
          <button
            type="button"
            id="role-worker"
            className={`role-option ${form.role === 'WORKER' ? 'selected' : ''}`}
            onClick={() => update('role', 'WORKER')}
          >
            <div className="role-option-icon">🔨</div>
            <div className="role-option-title">İşçi</div>
            <div className="role-option-desc">İhalelere teklif ver</div>
          </button>
        </div>

        {/* PROFIL TIPI SEÇIMI (Sadece İşveren İçin) */}
        {form.role === 'EMPLOYER' && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="radio" name="profileType" 
                checked={form.profileType === 'INDIVIDUAL'} 
                onChange={() => update('profileType', 'INDIVIDUAL')} 
              /> Bireysel
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="radio" name="profileType" 
                checked={form.profileType === 'CORPORATE'} 
                onChange={() => update('profileType', 'CORPORATE')} 
              /> Kurumsal
            </label>
          </div>
        )}

        {/* SUNUCU HATASI */}
        {serverError && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: 'var(--color-error)', padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-lg)', fontSize: '0.875rem',
            marginBottom: '1rem', fontWeight: 500,
          }}>
            ⚠️ {serverError}
          </div>
        )}

        <form onSubmit={step === 1 ? handleSendOtp : handleRegister}>
          {step === 1 ? (
            <>
              {/* Ad & Soyad */}
              <div className="grid-2" style={{ gap: '1rem', marginBottom: 0 }}>
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">Ad</label>
                  <input id="firstName" type="text" className={`form-input ${errors.firstName ? 'error' : ''}`}
                    placeholder="Ahmet" value={form.firstName}
                    onChange={(e) => update('firstName', e.target.value)} />
                  {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">Soyad</label>
                  <input id="lastName" type="text" className={`form-input ${errors.lastName ? 'error' : ''}`}
                    placeholder="Yılmaz" value={form.lastName}
                    onChange={(e) => update('lastName', e.target.value)} />
                  {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                </div>
              </div>
              
              {/* KURUMSAL BILGILER */}
              {form.role === 'EMPLOYER' && form.profileType === 'CORPORATE' && (
                <div className="grid-2" style={{ gap: '1rem', marginBottom: 0 }}>
                  <div className="form-group">
                    <label htmlFor="companyName" className="form-label">Firma Adı</label>
                    <input id="companyName" type="text" className={`form-input ${errors.companyName ? 'error' : ''}`}
                      placeholder="Firma A.Ş." value={form.companyName}
                      onChange={(e) => update('companyName', e.target.value)} />
                    {errors.companyName && <span className="form-error">{errors.companyName}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="taxNumber" className="form-label">Vergi Numarası (VKN)</label>
                    <input id="taxNumber" type="text" className={`form-input ${errors.taxNumber ? 'error' : ''}`}
                      placeholder="1234567890" maxLength={10} value={form.taxNumber}
                      onChange={(e) => update('taxNumber', e.target.value.replace(/\D/g, ''))} />
                    {errors.taxNumber && <span className="form-error">{errors.taxNumber}</span>}
                  </div>
                </div>
              )}

              {/* TCKN */}
              <div className="form-group">
                <label htmlFor="tckn" className="form-label">TC Kimlik Numarası</label>
                <input id="tckn" type="text" className={`form-input ${errors.tckn ? 'error' : ''}`}
                  placeholder="12345678901" maxLength={11} value={form.tckn}
                  onChange={(e) => update('tckn', e.target.value.replace(/\D/g, ''))} />
                {errors.tckn && <span className="form-error">{errors.tckn}</span>}
              </div>

              {/* Telefon */}
              <div className="form-group">
                <label htmlFor="phone" className="form-label">Telefon Numarası</label>
                <input id="phone" type="tel" className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="05551234567" value={form.phone}
                  onChange={(e) => update('phone', e.target.value)} />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>

              {/* E-posta */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">E-posta Adresi</label>
                <input id="email" type="email" className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="ornek@email.com" value={form.email}
                  onChange={(e) => update('email', e.target.value)} />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              {/* Şifre */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">Şifre</label>
                <input id="password" type="password" className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Min. 8 karakter" value={form.password}
                  onChange={(e) => update('password', e.target.value)} />
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              {/* Şifre Tekrar */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Şifre Tekrar</label>
                <input id="confirmPassword" type="password" className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Şifrenizi tekrar girin" value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)} />
                {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={isLoading} style={{ marginTop: '0.5rem', padding: '0.875rem' }}>
                {isLoading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
              <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>E-posta Doğrulama</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
                <strong>{form.email}</strong> adresine bir kod gönderdik. Lütfen gelen kutunuzu (ve gereksiz kutusunu) kontrol edin.
              </p>
              
              <div className="form-group">
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 900 }}
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                  required
                />
                {otpError && <span className="form-error" style={{ display: 'block', marginTop: '8px' }}>{otpError}</span>}
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={isLoading} style={{ marginTop: '1.5rem', padding: '0.875rem' }}>
                {isLoading ? 'Doğrulanıyor...' : 'Doğrula ve Kayıt Ol'}
              </button>
              
              <button type="button" onClick={() => setStep(1)} className="btn btn-ghost" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
                ← Bilgileri Düzenle
              </button>
            </div>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
          Zaten hesabınız var mı?{' '}
          <Link href="/giris" style={{ color: 'var(--color-navy)', fontWeight: 700 }}>Giriş Yap →</Link>
        </p>
      </div>
    </div>
  );
}

export default function KayitPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <KayitContent />
    </Suspense>
  );
}
