import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowLeft, 
  Cpu, 
  QrCode, 
  Calendar,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem } from '../types';

export const DocumentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      api.verifyById(id)
        .then((res) => {
          if (res.document) {
            setDoc(res.document);
          } else {
            setErrorMsg('Document record not found');
          }
        })
        .catch((err) => setErrorMsg(err.message || 'Error fetching document'))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '900px', margin: '3rem auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading document details from blockchain...
      </div>
    );
  }

  if (errorMsg || !doc) {
    return (
      <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '1rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <AlertTriangle size={36} color="#fb7185" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Document Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{errorMsg || 'Could not locate this document record on the blockchain.'}</p>
          <Link to="/issuer/documents" className="btn-primary">
            <ArrowLeft size={16} /> Back to Registry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Back button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/issuer/documents" className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}>
          <ArrowLeft size={14} /> Back to Documents List
        </Link>
      </div>

      {/* Main card */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>{doc.document_id}</span>
              <span className={doc.status === 'VALID' ? 'badge-valid' : 'badge-revoked'}>
                {doc.status}
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{doc.document_type}</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Issued by {doc.organization_name}</div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <a
              href={api.getDocumentDownloadUrl(doc.document_id)}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              <Download size={16} /> Download Official PDF
            </a>
            <Link to={`/verify/${doc.document_id}`} className="btn-secondary">
              <FileCheck size={16} /> Public Verify View
            </Link>
          </div>
        </div>

        {/* Metadata grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Recipient Name</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc' }}>{doc.owner_name}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Registration / USN</div>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{doc.recipient_id || 'N/A'}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Issue Date</div>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{new Date(doc.issued_at).toLocaleDateString()}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>File Size</div>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{(doc.file_size_bytes / 1024).toFixed(1)} KB</div>
          </div>
        </div>

        {/* Cryptographic Hashes & Blockchain Trail */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={16} color="#6366f1" /> Cryptographic Integrity Proof
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>SHA-256 BINARY DIGEST</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="mono" style={{ fontSize: '0.82rem', color: '#38bdf8', wordBreak: 'break-all' }}>{doc.file_hash}</span>
                <button onClick={() => copyToClipboard(doc.file_hash, 'hash')} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  {copiedField === 'hash' ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>ETHEREUM SEPOLIA TRANSACTION HASH</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="mono" style={{ fontSize: '0.82rem', color: '#a855f7', wordBreak: 'break-all' }}>{doc.transaction_hash}</span>
                <button onClick={() => copyToClipboard(doc.transaction_hash, 'tx')} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  {copiedField === 'tx' ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                </button>
                <a 
                  href={`https://sepolia.etherscan.io/tx/${doc.transaction_hash}`}
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center' }}
                  title="View on Etherscan"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>IPFS CONTENT IDENTIFIER (CID)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="mono" style={{ fontSize: '0.82rem', color: '#fbbf24', wordBreak: 'break-all' }}>{doc.ipfs_cid}</span>
                <button onClick={() => copyToClipboard(doc.ipfs_cid, 'cid')} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                  {copiedField === 'cid' ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code preview */}
        {doc.qr_code_base64 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', padding: '1.25rem', borderRadius: '0.75rem' }}>
            <img src={doc.qr_code_base64} alt="QR Code" style={{ width: '90px', height: '90px', borderRadius: '0.5rem', background: '#ffffff', padding: '4px' }} />
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>Official Verification QR Code</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                Encodes the public URL: <span className="mono" style={{ color: '#38bdf8' }}>{window.location.origin}/verify/{doc.document_id}</span>
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Anyone scanning this QR code with a phone camera is directed immediately to the decentralized on-chain verification screen.
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
