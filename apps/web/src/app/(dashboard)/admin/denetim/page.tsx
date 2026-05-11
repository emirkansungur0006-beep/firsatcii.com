'use client';
// apps/web/src/app/(dashboard)/admin/denetim/page.tsx
// Denetim Günlüğü (Audit Log) sayfası.

import { useEffect, useState } from 'react';

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  ipAddress: string;
  createdAt: string;
  admin: { firstName: string; lastName: string; email: string };
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  USER_BANNED: { label: '🚫 Kullanıcı Askıya Alındı', color: '#EF4444' },
  USER_UNBANNED: { label: '✅ Kullanıcı Aktifleştirildi', color: '#10B981' },
  USER_ROLE_CHANGED: { label: '🔄 Rol Değiştirildi', color: '#3B82F6' },
  USER_DELETED: { label: '🗑️ Kullanıcı Silindi', color: '#EF4444' },
  JOB_CANCELLED: { label: '❌ İhale İptal Edildi', color: '#F59E0B' },
};

export default function DenetimPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`/api/v1/admin/audit-logs?page=${page}&limit=30`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setLogs(data.data || []);
        setTotal(data.pagination?.total || 0);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [page]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Denetim Günlüğü</h1>
          <p style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
            Toplam {total} kayıt · Tüm admin işlemleri geri alınamaz şekilde kaydedilir
          </p>
        </div>
        <div className="anti-sniper-banner" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          🔐 Değiştirilemez Kayıt
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tarih & Saat</th>
                <th>Admin</th>
                <th>İşlem</th>
                <th>Hedef</th>
                <th>Detaylar</th>
                <th>IP Adresi</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: '#6B7280' };
                return (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString('tr-TR')}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      <div style={{ fontWeight: 600 }}>{log.admin.firstName} {log.admin.lastName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>{log.admin.email}</div>
                    </td>
                    <td>
                      <span style={{
                        color: actionInfo.color, fontWeight: 600,
                        fontSize: '0.8rem', whiteSpace: 'nowrap',
                      }}>
                        {actionInfo.label}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', fontFamily: 'monospace' }}>
                      {log.targetType}: {log.targetId.substring(0, 8)}...
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '200px' }}>
                      {log.details && (
                        <code style={{ background: 'var(--color-gray-100)', padding: '2px 6px', borderRadius: 4, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {JSON.stringify(log.details).substring(0, 60)}
                        </code>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--color-gray-500)' }}>
                      {log.ipAddress}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {logs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-gray-500)' }}>
              Henüz denetim kaydı yok.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
