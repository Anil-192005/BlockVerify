import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, CheckCircle, XCircle, AlertTriangle, Search } from 'lucide-react';
import { api } from '../services/api';
import { VerificationLog } from '../types';

export const VerificationHistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getVerificationHistory().then(setLogs).finally(() => setIsLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#a855f7', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          <History size={16} /> Audit Trail & Analytics
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Public Verification Logs</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Every cryptographic verification check is logged for transparency and anti-fraud monitoring.
        </p>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '1rem 1.25rem' }}>Timestamp</th>
              <th style={{ padding: '1rem 1.25rem' }}>Document Ref / Query</th>
              <th style={{ padding: '1rem 1.25rem' }}>Method</th>
              <th style={{ padding: '1rem 1.25rem' }}>Result</th>
              <th style={{ padding: '1rem 1.25rem' }}>Verified By</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--text-dim)' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className="mono" style={{ color: '#38bdf8', fontWeight: 600 }}>
                      {log.document_id || log.searched_id_or_hash.substring(0, 18) + '...'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>
                    {log.method === 'file_upload' && 'Binary File Hash'}
                    {log.method === 'doc_id' && 'Document ID Query'}
                    {log.method === 'qr_scan' && 'QR Code Camera'}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {log.result === 'VALID' && (
                      <span className="badge-valid">
                        <CheckCircle size={12} /> AUTHENTIC
                      </span>
                    )}
                    {log.result === 'TAMPERED' && (
                      <span className="badge-revoked">
                        <XCircle size={12} /> TAMPERED
                      </span>
                    )}
                    {log.result === 'REVOKED' && (
                      <span className="badge-chain" style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.15)' }}>
                        <AlertTriangle size={12} /> REVOKED
                      </span>
                    )}
                    {log.result === 'NOT_FOUND' && (
                      <span className="badge-revoked">
                        <XCircle size={12} /> UNREGISTERED
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>
                    {log.verified_by}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  {isLoading ? 'Loading logs...' : 'No verification attempts logged yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
