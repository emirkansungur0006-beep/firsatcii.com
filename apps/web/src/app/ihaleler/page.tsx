// apps/web/src/app/ihaleler/page.tsx
export default function IhalelerPage() {
  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-navy)' }}>🏗️ İhaleler</h1>
        <p style={{ color: 'var(--color-gray-500)', marginTop: '1rem' }}>Bu sayfa yakında aktif olacak. İhale arama ve listeleme ekranı burada yer alacaktır.</p>
        <a href="/" className="btn btn-primary" style={{ marginTop: '2rem' }}>Ana Sayfaya Dön</a>
      </div>
    </div>
  );
}
