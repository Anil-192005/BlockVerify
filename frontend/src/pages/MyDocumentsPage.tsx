import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Download, 
  QrCode, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  X,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem } from '../types';

export const MyDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // QR Modal
  const [activeQrDoc, setActiveQrDoc] = useState<DocumentItem | null>(null);

  // Revoke Modal
  const [revokeDoc, setRevokeDoc] = useState<DocumentItem | null>(null);
  const [revokeReason, setRevokeReason] = useState('Academic misconduct / Misprinted grade');
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMyDocuments();
      setDocuments(data);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeDoc) return;
    setIsRevoking(true);
    try {
      await api.revokeDocument(revokeDoc.document_id, revokeReason);
      setRevokeDoc(null);
      await fetchDocs();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke document');
    } finally {
      setIsRevoking(false);
    }
  };

  const filteredDocs = documents.filter(doc => 
    (doc.owner_name || doc.recipient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Institutional Credential Registry</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            All issued credentials anchored to Ethereum smart contracts.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '0.6rem', padding: '0.4rem 0.8rem', width: '300px' }}>
          <Search size={16} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.85rem', marginLeft: '0.5rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '1rem 1.25rem' }}>Document ID</th>
              <th style={{ padding: '1rem 1.25rem' }}>Recipient & USN</th>
              <th style={{ padding: '1rem 1.25rem' }}>Category</th>
              <th style={{ padding: '1rem 1.25rem' }}>Issued Date</th>
              <th style={{ padding: '1rem 1.25rem' }}>Status</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.15s ease' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div className="mono" style={{ fontWeight: 700, color: '#38bdf8' }}>{doc.document_id}</div>
                    <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Hash: {doc.file_hash.substring(0, 10)}...
                    </div>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{doc.owner_name || doc.recipient_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>USN: {doc.recipient_id || 'N/A'}</div>
                  </td>

                  <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>
                    {doc.document_type}
                  </td>

                  <td style={{ padding: '1rem 1.25rem', color: 'var(--text-dim)' }}>
                    {new Date(doc.issued_at).toLocaleDateString()}
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className={doc.status === 'VALID' ? 'badge-valid' : 'badge-revoked'}>
                      {doc.status}
                    </span>
                  </td>

                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        onClick={() => setActiveQrDoc(doc)}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                        title="View Verification QR Code"
                      >
                        <QrCode size={14} /> QR
                      </button>

                      <a
                        href={api.getDocumentDownloadUrl(doc.document_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                        title="Download Certificate PDF"
                      >
                        <Download size={14} /> PDF
                      </a>

                      {doc.status === 'VALID' && (
                        <button
                          onClick={() => setRevokeDoc(doc)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                          title="Revoke Credential on Blockchain"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  {isLoading ? 'Loading credentials...' : 'No credentials found matching your search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* QR Modal */}
      {activeQrDoc && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel" style={{ maxWidth: '420px', width: '100%', padding: '2rem', textAlign: 'center', position: 'relative' }}>
            <button 
              onClick={() => setActiveQrDoc(null)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Official Verification QR</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Document ID: <b className="mono" style={{ color: '#38bdf8' }}>{activeQrDoc.document_id}</b>
            </p>

            {activeQrDoc.qr_code_base64 && (
              <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '1rem', display: 'inline-block', marginBottom: '1.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
                <img src={activeQrDoc.qr_code_base64} alt="QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
              </div>
            )}

            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Scan to instantly open the public verification portal for this credential.
            </div>
          </div>
        </div>
      )}

      {/* Revocation Modal */}
      {revokeDoc && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '2rem', border: '1px solid rgba(244, 63, 94, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#fb7185', fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={22} />
              Revoke Credential on Blockchain
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              You are about to revoke <b>{revokeDoc.document_id}</b> issued to <b>{revokeDoc.owner_name || revokeDoc.recipient_name}</b>. This will permanently update the smart contract state on Ethereum. The historical block remains immutable, but verifiers will see <b>REVOKED</b>.
            </p>

            <form onSubmit={handleRevokeSubmit}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Revocation Reason (Recorded on-chain) *
              </label>
              <textarea
                required
                className="form-input"
                rows={3}
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                style={{ marginBottom: '1.5rem' }}
              />

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setRevokeDoc(null)}
                  className="btn-secondary"
                  disabled={isRevoking}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-danger"
                  disabled={isRevoking}
                >
                  {isRevoking ? 'Mining Revocation...' : 'Confirm Blockchain Revocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
