// apps/web/src/app/nasil-calisir/page.tsx
export default function NasilCalisirPage() {
  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-navy)' }}>❓ Nasıl Çalışır?</h1>
        <p style={{ color: 'var(--color-gray-500)', marginTop: '1rem' }}>Sistem işleyişi ve Sıkça Sorulan Sorular sayfası yakında eklenecektir.</p>
        <a href="/" className="btn btn-primary" style={{ marginTop: '2rem' }}>Ana Sayfaya Dön</a>
      </div>
    </div>
  );
}
