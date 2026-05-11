// apps/web/src/app/kategoriler/page.tsx
export default function KategorilerPage() {
  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-navy)' }}>📂 Kategoriler</h1>
        <p style={{ color: 'var(--color-gray-500)', marginTop: '1rem' }}>Bu sayfa yakında aktif olacak. Tüm hizmet kategorileri burada yer alacaktır.</p>
        <a href="/" className="btn btn-primary" style={{ marginTop: '2rem' }}>Ana Sayfaya Dön</a>
      </div>
    </div>
  );
}
