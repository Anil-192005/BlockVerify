import React, { useState } from 'react';
import { 
  FileUp, 
  Sparkles, 
  CheckCircle, 
  Download, 
  Cpu, 
  QrCode, 
  Lock, 
  ArrowRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface UploadPageProps {
  onDocumentCreated?: (doc: DocumentItem) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onDocumentCreated }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'auto' | 'custom'>('auto');

  // Form Fields
  const [recipientName, setRecipientName] = useState('Anil M');
  const [recipientId, setRecipientId] = useState('1AB23CS001');
  const [documentType, setDocumentType] = useState('Degree Certificate');
  const [organizationName, setOrganizationName] = useState(user?.organization || 'ABC Engineering College');
  const [customFile, setCustomFile] = useState<File | null>(null);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdDoc, setCreatedDoc] = useState<DocumentItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async (doc: DocumentItem) => {
    try {
      setIsDownloading(true);
      await api.downloadOfficialPdf(doc);
    } catch (err: any) {
      alert('Error downloading PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setCreatedDoc(null);

    const formData = new FormData();
    formData.append('owner_name', recipientName);
    formData.append('recipient_name', recipientName);
    formData.append('recipient_id', recipientId);
    formData.append('document_type', documentType);
    formData.append('organization_name', organizationName);

    try {
      let doc: DocumentItem;
      if (mode === 'auto') {
        doc = await api.issueCertificateAuto(formData);
      } else {
        if (!customFile) {
          throw new Error('Please select a file to upload');
        }
        formData.append('file', customFile);
        doc = await api.uploadCustomDocument(formData);
      }
      setCreatedDoc(doc);
      if (onDocumentCreated) {
        onDocumentCreated(doc);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to issue document on blockchain');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#818cf8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          <Award size={16} /> Authorized Issuer Console
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Issue Authentic Credential</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Generate tamper-proof educational degrees with embedded QR codes & commit cryptographic proof to Ethereum.
        </p>
      </div>

      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.35rem', borderRadius: '0.75rem', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => { setMode('auto'); setCreatedDoc(null); }}
          className={mode === 'auto' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1 }}
        >
          <Sparkles size={16} /> Automated Certificate Generator + QR
        </button>

        <button
          onClick={() => { setMode('custom'); setCreatedDoc(null); }}
          className={mode === 'custom' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1 }}
        >
          <FileUp size={16} /> Upload Custom PDF / File
        </button>
      </div>

      {/* Form Container */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                Recipient Full Name *
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Anil M"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                Student ID / USN / Reg No
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 1AB23CS001"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                Credential / Document Type
              </label>
              <select
                className="form-input"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="Degree Certificate">Degree Certificate (B.E / B.Tech / M.Sc)</option>
                <option value="Diploma Certificate">Diploma Certificate</option>
                <option value="Marks Card">Marks Card / Transcript</option>
                <option value="Course Certificate">Course Certificate</option>
                <option value="Experience Certificate">Experience Certificate</option>
                <option value="Transfer Certificate">Transfer Certificate</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                Issuing Organization Name
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. ABC Engineering College"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>

          </div>

          {mode === 'custom' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                Select Document PDF / File *
              </label>
              <input
                type="file"
                required
                className="form-input"
                style={{ padding: '0.5rem' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setCustomFile(e.target.files[0]);
                  }
                }}
              />
            </div>
          )}

          {errorMsg && (
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '0.5rem', padding: '0.75rem', color: '#fb7185', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
          >
            {isSubmitting ? 'Generating PDF, Computing SHA-256 & Anchoring to Ethereum...' : '⚡ Issue Credential on Ethereum Blockchain'}
          </button>
        </form>
      </div>

      {/* Confirmation Card upon successful issuance */}
      {createdDoc && (
        <div className="glass-panel" style={{ padding: '2rem', borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(6, 78, 59, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <CheckCircle size={28} color="#34d399" />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>Credential Successfully Anchored on Ethereum!</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Document ID: <b className="mono" style={{ color: '#ffffff' }}>{createdDoc.document_id}</b></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>SHA-256 HASH</div>
              <div className="mono" style={{ fontSize: '0.75rem', color: '#38bdf8', wordBreak: 'break-all' }}>
                {createdDoc.file_hash}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>ETHEREUM TX HASH</div>
              <div className="mono" style={{ fontSize: '0.75rem', color: '#a855f7', wordBreak: 'break-all' }}>
                {createdDoc.transaction_hash}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>IPFS CID</div>
              <div className="mono" style={{ fontSize: '0.75rem', color: '#fbbf24', wordBreak: 'break-all' }}>
                {createdDoc.ipfs_cid}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>BLOCK NUMBER</div>
              <div className="mono" style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700 }}>
                #{createdDoc.block_number}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => handleDownloadPdf(createdDoc)}
              disabled={isDownloading}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: isDownloading ? 'wait' : 'pointer' }}
            >
              <Download size={16} /> {isDownloading ? 'Generating PDF...' : 'Download Official PDF with QR Code'}
            </button>

            <Link
              to={`/verify/${createdDoc.document_id}`}
              className="btn-secondary"
              style={{ color: '#38bdf8', borderColor: '#38bdf8' }}
            >
              <ShieldCheck size={16} /> Verify This Document Now
            </Link>

            <Link
              to={`/issuer/documents/${createdDoc.document_id}`}
              className="btn-secondary"
            >
              <ArrowRight size={16} /> View in Registry
            </Link>

            <button
              type="button"
              onClick={() => { setCreatedDoc(null); setCustomFile(null); }}
              className="btn-secondary"
              style={{ marginLeft: 'auto' }}
            >
              + Issue Another Credential
            </button>
          </div>

          {createdDoc.qr_code_base64 && (
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem 1rem', borderRadius: '0.6rem' }}>
              <img src={createdDoc.qr_code_base64} alt="QR" style={{ width: '64px', height: '64px', background: '#fff', borderRadius: '6px', padding: '4px' }} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Embedded QR Code Active</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan this QR code with any mobile device or the built-in scanner to verify authenticity instantly.</div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
