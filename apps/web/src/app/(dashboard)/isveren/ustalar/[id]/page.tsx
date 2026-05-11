
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function WorkerDetailPage() {
  const { id } = useParams();
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorker();
  }, [id]);

  const fetchWorker = async () => {
    try {
      const res = await fetch(`/api/v1/users/workers/${id}`, { credentials: 'include' });
      const data = await res.json();
      setWorker(data);
    } catch (error) {
      console.error('Usta detayı çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Profil Detayları Yükleniyor...</div>;
  if (!worker) return <div style={{ textAlign: 'center', padding: '5rem' }}>Usta bulunamadı.</div>;

  return (
    <div className="profile-container">
      {/* Profil Header */}
      <div className="profile-header">
        <div className="profile-image-container">
          {worker.profilePicture ? (
            <img src={worker.profilePicture} alt={worker.firstName} className="profile-img" />
          ) : (
            <div className="profile-placeholder">👷</div>
          )}
        </div>
        <div className="profile-info">
          <div className="name-badge-row">
            <h1 className="worker-name">{worker.firstName} {worker.lastName}</h1>
            <span className="verified-badge">DOĞRULANMIŞ USTA</span>
          </div>
          <p className="worker-subtitle">{worker.city?.name} • {worker.workerProfile?.avgRating || 0} Puan</p>
          
          <div className="contact-row">
            <div className="contact-item">
              <span className="contact-label">📞 Telefon</span>
              <span className="contact-value">{worker.phone || 'Görüşme Başladığında Açılacak'}</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">📧 E-posta</span>
              <span className="contact-value">{worker.email || 'Görüşme Başladığında Açılacak'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content-grid">
        {/* Sol Sütun: CV ve Detaylar */}
        <div className="content-left">
          <section className="profile-section">
            <h2 className="section-title">Usta Hakkında</h2>
            <p className="section-text">{worker.workerProfile?.aboutMe || 'Biyografi henüz girilmemiş.'}</p>
          </section>

          <section className="profile-section">
            <h2 className="section-title">Kariyer ve Eğitim</h2>
            <div className="details-grid">
              <div>
                <span className="detail-label">Eğitim</span>
                <p className="detail-value">{worker.workerProfile?.education || 'Bilgi yok'}</p>
              </div>
              <div>
                <span className="detail-label">Üniversite</span>
                <p className="detail-value">{worker.workerProfile?.university || 'Bilgi yok'}</p>
              </div>
            </div>
          </section>

          <section className="profile-section">
            <h2 className="section-title">Uzmanlık ve Beceriler</h2>
            <div className="skills-container">
              {(worker.workerProfile?.skills || []).map((skill: string) => (
                <span key={skill} className="skill-tag">#{skill}</span>
              ))}
              {(worker.workerProfile?.skills || []).length === 0 && <p>Henüz beceri etiketi eklenmemiş.</p>}
            </div>
          </section>

          <section className="profile-section">
            <h2 className="section-title">İş Portfolyosu</h2>
            <div className="portfolio-grid">
              {(worker.workerProfile?.portfolio || []).map((item: any, idx: number) => (
                <div key={idx} className="portfolio-item">
                  <img src={item.url} alt={item.title} className="portfolio-img" />
                  <div className="portfolio-title">{item.title}</div>
                </div>
              ))}
              {(worker.workerProfile?.portfolio || []).length === 0 && <p>Portfolyo görseli bulunmuyor.</p>}
            </div>
          </section>
        </div>

        {/* Sağ Sütun: Aksiyon ve Sosyal Medya */}
        <div className="content-right">
          <div className="social-card">
            <h3 className="card-title">İletişim & Sosyal</h3>
            <div className="social-links">
              <div className="social-link">
                <span className="social-icon">📸</span>
                <span className="social-text">{worker.workerProfile?.socialMedia?.instagram || 'Instagram Kilitli'}</span>
              </div>
              <div className="social-link">
                <span className="social-icon">💼</span>
                <span className="social-text">{worker.workerProfile?.socialMedia?.linkedin || 'LinkedIn Kilitli'}</span>
              </div>
              <div className="social-link">
                <span className="social-icon">🌐</span>
                <span className="social-text">{worker.workerProfile?.socialMedia?.website || 'Web Sitesi Kilitli'}</span>
              </div>
            </div>
            
            <hr className="divider" />
            
            <p className="info-note">
              🔒 Bu ustanın iletişim bilgilerini görmek için verdiği bir teklifi onaylamanız gerekmektedir.
            </p>
          </div>

          <div className="action-card">
             <h3 className="action-title">Usta ile Çalışın</h3>
             <p className="action-desc">Bu ustanın hizmetlerinden yararlanmak için hemen bir ihale oluşturun ve onu davet edin.</p>
             <Link href={`/isveren/is-olustur?cityId=${worker.cityId}&districtId=${worker.districtId}&categoryId=${worker.workerProfile?.sectorIds?.[0] || ''}`} className="btn-action">
               İHALE OLUŞTUR
             </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 1rem 5rem 1rem;
        }
        
        .profile-header {
          background: linear-gradient(135deg, var(--color-navy) 0%, #1e293b 100%);
          border-radius: 24px;
          padding: 3rem;
          color: #fff;
          display: flex;
          gap: 2.5rem;
          align-items: center;
          margin-bottom: 2rem;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }

        .profile-image-container {
          width: 160px;
          height: 160px;
          border-radius: 40px;
          overflow: hidden;
          border: 4px solid var(--color-gold);
          background: #fff;
          flex-shrink: 0;
        }

        .profile-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
        }

        .profile-info {
          flex: 1;
        }

        .name-badge-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        .worker-name {
          font-size: 2.5rem;
          font-weight: 800;
          margin: 0;
        }

        .verified-badge {
          background: var(--color-gold);
          color: var(--color-navy);
          padding: 0.4rem 0.8rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 800;
        }

        .worker-subtitle {
          font-size: 1.25rem;
          opacity: 0.9;
          margin-bottom: 1.5rem;
        }

        .contact-row {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .contact-item {
          background: rgba(255,255,255,0.1);
          padding: 0.75rem 1.25rem;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .contact-label {
          display: block;
          font-size: 0.75rem;
          opacity: 0.7;
          margin-bottom: 0.2rem;
        }

        .contact-value {
          font-weight: 700;
        }

        .main-content-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 2rem;
        }

        .profile-section {
          background: #fff;
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          color: var(--color-navy);
        }

        .section-text {
          line-height: 1.7;
          color: #475569;
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .detail-label {
          display: block;
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 0.25rem;
        }

        .detail-value {
          font-weight: 600;
          margin: 0;
        }

        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .skill-tag {
          background: #f1f5f9;
          color: var(--color-navy);
          padding: 0.6rem 1rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
        }

        .portfolio-item {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .portfolio-img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        .portfolio-title {
          padding: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .social-card {
          background: #fff;
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .card-title {
          font-weight: 800;
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
        }

        .social-links {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .social-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #475569;
        }

        .social-icon {
          font-size: 1.5rem;
        }

        .divider {
          margin: 1.5rem 0;
          border: 0;
          border-top: 1px solid #f1f5f9;
        }

        .info-note {
          font-size: 0.75rem;
          color: #94a3b8;
          line-height: 1.5;
        }

        .action-card {
          background: var(--color-navy);
          padding: 2rem;
          border-radius: 20px;
          color: #fff;
          margin-top: 1.5rem;
        }

        .action-title {
          font-size: 1.25rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .action-desc {
          font-size: 0.875rem;
          opacity: 0.8;
          margin-bottom: 1.5rem;
        }

        .btn-action {
          display: block;
          text-align: center;
          background: var(--color-gold);
          color: var(--color-navy);
          padding: 1rem;
          border-radius: 12px;
          font-weight: 800;
          text-decoration: none;
          transition: transform 0.2s;
        }

        .btn-action:hover {
          transform: translateY(-2px);
        }

        @media (max-width: 900px) {
          .main-content-grid {
            grid-template-columns: 1fr;
          }
          .profile-header {
            flex-direction: column;
            text-align: center;
            padding: 2rem 1.5rem;
          }
          .name-badge-row {
            justify-content: center;
          }
          .contact-row {
            justify-content: center;
          }
          .worker-name {
            font-size: 2rem;
          }
          .profile-image-container {
            width: 140px;
            height: 140px;
          }
        }

        @media (max-width: 600px) {
          .details-grid {
            grid-template-columns: 1fr;
          }
          .contact-item {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
