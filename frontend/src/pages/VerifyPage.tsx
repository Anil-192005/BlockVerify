import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search, 
  FileUp, 
  ShieldCheck, 
  Cpu, 
  Download, 
  Copy, 
  Check, 
  ExternalLink,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { VerificationResult } from '../types';

interface VerifyPageProps {
  initialDocId?: string;
}

export const VerifyPage: React.FC<VerifyPageProps> = ({ initialDocId }) => {
  const { documentId: routeDocId } = useParams<{ documentId?: string }>();
  const effectiveDocId = routeDocId || initialDocId || '';

  const [activeTab, setActiveTab] = useState<'upload' | 'id' | 'tamper'>('upload');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileSha256Preview, setFileSha256Preview] = useState<string>('');
  const [claimedDocIdInput, setClaimedDocIdInput] = useState<string>('');
  
  // ID state
  const [documentId, setDocumentId] = useState<string>(effectiveDocId);

  // Tamper lab state
  const [tamperClaimedId, setTamperClaimedId] = useState<string>('CERT-2026-000001');
  const [tamperFile, setTamperFile] = useState<File | null>(null);

  // Status & Results
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleVerifyById = async (idToVerify?: string) => {
    const id = idToVerify || documentId;
    if (!id.trim()) return;
    setIsLoading(true);
    setResult(null);
    try {
      const res = await api.verifyById(id.trim());
      setResult(res);
    } catch (err: any) {
      setResult({
        status: 'NOT_FOUND',
        is_valid: false,
        is_tampered: false,
        is_revoked: false,
        message: err.message || `No document record found for '${id}'`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveDocId) {
      setDocumentId(effectiveDocId);
      setActiveTab('id');
      handleVerifyById(effectiveDocId);
    }
  }, [effectiveDocId]);

  // Client-side SHA-256 preview helper
  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
      setFileSha256Preview(hashHex);
    } catch {
      setFileSha256Preview('');
    }
  };

  const handleVerifyFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsLoading(true);
    setResult(null);
    try {
      const res = await api.verifyFile(selectedFile, claimedDocIdInput.trim() || undefined);
      setResult(res);
    } catch (err: any) {
      setResult({
        status: 'NOT_FOUND',
        is_valid: false,
        is_tampered: false,
        is_revoked: false,
        message: err.message || 'File verification failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Run deliberate tampering test
  const handleRunTamperSimulation = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      // Create a simulated modified file with altered bytes
      let fileToUse = tamperFile;
      if (!fileToUse) {
        const fakeContent = `ABC ENGINEERING COLLEGE\nOFFICIAL DEGREE CERTIFICATE\nName: Anil M\nUSN: 1AB23CS001\nCourse: B.E Computer Science\nMarks: 95 (MODIFIED/TAMPERED FROM 85)\nDate: 2026-10-07`;
        fileToUse = new File([fakeContent], 'Anil_Degree_TAMPERED.pdf', { type: 'application/pdf' });
      }

      const res = await api.verifyFile(fileToUse, tamperClaimedId);
      setResult(res);
    } catch (err: any) {
      alert(err.message || 'Error running tamper simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Page Title */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          <ShieldCheck size={16} /> Ethereum Smart Contract Registry
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Document Verification Portal</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Instantly verify the cryptographic integrity and status of credentials on the blockchain.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.35rem', borderRadius: '0.75rem', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => { setActiveTab('upload'); setResult(null); }}
          className={activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1, minWidth: '180px' }}
        >
          <FileUp size={16} /> Upload & Verify File
        </button>

        <button
          onClick={() => { setActiveTab('id'); setResult(null); }}
          className={activeTab === 'id' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1, minWidth: '180px' }}
        >
          <Search size={16} /> Verify by Document ID
        </button>

        <button
          onClick={() => { setActiveTab('tamper'); setResult(null); }}
          className={activeTab === 'tamper' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1, minWidth: '180px', borderColor: activeTab === 'tamper' ? '#f43f5e' : undefined }}
        >
          <AlertTriangle size={16} color={activeTab === 'tamper' ? '#ffffff' : '#fb7185'} /> Tamper Simulation Lab
        </button>
      </div>

      {/* Tab 1: File Upload */}
      {activeTab === 'upload' && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <form onSubmit={handleVerifyFile}>
            <div 
              style={{
                border: '2px dashed rgba(99, 102, 241, 0.4)',
                borderRadius: '0.75rem',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.4)',
                cursor: 'pointer',
                marginBottom: '1.25rem'
              }}
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <FileUp size={40} color="#818cf8" style={{ margin: '0 auto 1rem auto' }} />
              <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                {selectedFile ? selectedFile.name : 'Click or Drag & Drop Document PDF / File'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB • Ready for cryptographic comparison` : 'Supports PDF, PNG, JPG, Degree Certificates'}
              </div>
            </div>

            {fileSha256Preview && (
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '0.6rem', padding: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>Calculated Client-Side SHA-256 Digest:</div>
                <div className="mono" style={{ fontSize: '0.8rem', color: '#38bdf8', wordBreak: 'break-all' }}>
                  {fileSha256Preview}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                Claimed Document ID (Optional — for precise tamper comparison):
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CERT-2026-000001 (leave empty to search all registered blockchain hashes)"
                value={claimedDocIdInput}
                onChange={(e) => setClaimedDocIdInput(e.target.value)}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                💡 If provided, the system compares the uploaded file directly against the original blockchain signature of this specific ID, detecting single-byte tampering.
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedFile || isLoading}
              className="btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {isLoading ? 'Hashing & Querying Ethereum Blockchain...' : 'Verify Cryptographic Hash on Blockchain'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Document ID */}
      {activeTab === 'id' && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <form onSubmit={(e) => { e.preventDefault(); handleVerifyById(); }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              Enter Certificate ID / Business Reference:
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <input
                type="text"
                placeholder="e.g. CERT-2026-0001"
                className="form-input"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
              />
              <button
                type="submit"
                disabled={!documentId.trim() || isLoading}
                className="btn-primary"
                style={{ padding: '0 1.5rem', whiteSpace: 'nowrap' }}
              >
                {isLoading ? 'Querying...' : 'Search On-Chain'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              <span>Quick tests:</span>
              <button
                type="button"
                onClick={() => { setDocumentId('CERT-2026-0001'); handleVerifyById('CERT-2026-0001'); }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#34d399', padding: '0.2rem 0.5rem', borderRadius: '0.3rem', cursor: 'pointer' }}
              >
                CERT-2026-0001 (Valid Degree)
              </button>
              <button
                type="button"
                onClick={() => { setDocumentId('CERT-2026-0003'); handleVerifyById('CERT-2026-0003'); }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#fb7185', padding: '0.2rem 0.5rem', borderRadius: '0.3rem', cursor: 'pointer' }}
              >
                CERT-2026-0003 (Revoked)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Tampering Simulation Lab */}
      {activeTab === 'tamper' && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#fb7185', fontWeight: 700, marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} />
            Interactive Tamper Detection Experiment
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Demonstrates how altering even a single mark or digit (e.g. <b>85</b> changed to <b>95</b>) triggers the <b>Cryptographic Avalanche Effect</b>, generating an entirely different SHA-256 hash that fails against the smart contract.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                Claimed Genuine Document ID:
              </label>
              <input
                type="text"
                className="form-input"
                value={tamperClaimedId}
                onChange={(e) => setTamperClaimedId(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                Upload Modified File (Optional):
              </label>
              <input
                type="file"
                className="form-input"
                style={{ padding: '0.45rem' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setTamperFile(e.target.files[0]);
                  }
                }}
              />
            </div>
          </div>

          <button
            onClick={handleRunTamperSimulation}
            disabled={isLoading}
            className="btn-danger"
            style={{ width: '100%', padding: '0.85rem' }}
          >
            {isLoading ? 'Simulating Tamper Verification...' : '🚨 Run Tamper Detection Test (Simulate Altered Certificate)'}
          </button>
        </div>
      )}

      {/* RESULTS DISPLAY */}
      {result && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          
          {/* Result Banner */}
          <div 
            className="glass-panel" 
            style={{
              padding: '1.75rem',
              marginBottom: '1.5rem',
              borderColor: result.status === 'VALID' ? 'rgba(16, 185, 129, 0.4)' : result.status === 'REVOKED' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(244, 63, 94, 0.5)',
              background: result.status === 'VALID' ? 'rgba(6, 78, 59, 0.2)' : result.status === 'REVOKED' ? 'rgba(120, 53, 15, 0.2)' : 'rgba(136, 19, 55, 0.25)',
              boxShadow: result.status === 'VALID' ? '0 10px 30px -10px var(--emerald-glow)' : '0 10px 30px -10px var(--rose-glow)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                {result.status === 'VALID' && <CheckCircle size={36} color="#34d399" />}
                {result.status === 'REVOKED' && <AlertTriangle size={36} color="#fbbf24" />}
                {(result.status === 'TAMPERED' || result.status === 'INVALID' || result.status === 'NOT_FOUND') && <XCircle size={36} color="#fb7185" />}
                {result.status === 'VERIFICATION_UNAVAILABLE' && <AlertTriangle size={36} color="#38bdf8" />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                    {result.status === 'VALID' && '✅ VERIFIED AUTHENTIC DOCUMENT'}
                    {result.status === 'REVOKED' && '⚠️ NOT VERIFIED: DOCUMENT FORMALLY REVOKED'}
                    {(result.status === 'TAMPERED' || result.status === 'INVALID') && '🚨 NOT VERIFIED: TAMPERING DETECTED'}
                    {result.status === 'NOT_FOUND' && '❌ NOT VERIFIED: UNREGISTERED / MODIFIED DOCUMENT'}
                    {result.status === 'VERIFICATION_UNAVAILABLE' && '⚠️ VERIFICATION TEMPORARILY UNAVAILABLE'}
                  </h2>
                  <span className={result.status === 'VALID' ? 'badge-valid' : result.status === 'REVOKED' ? 'badge-chain' : 'badge-revoked'}>
                    {result.status === 'VALID' ? 'VERIFIED' : result.status === 'REVOKED' ? 'REVOKED' : result.status === 'VERIFICATION_UNAVAILABLE' ? 'UNAVAILABLE' : 'NOT VERIFIED'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {result.message}
                </p>
              </div>
            </div>
          </div>

          {/* Tamper Comparison Card if Tampered */}
          {result.hash_comparison && !result.hash_comparison.match && (
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(244, 63, 94, 0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fb7185', fontWeight: 700, marginBottom: '1rem' }}>
                <AlertTriangle size={18} /> Cryptographic Hash Mismatch Breakdown
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1rem', borderRadius: '0.6rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, marginBottom: '0.35rem' }}>
                    REGISTERED BLOCKCHAIN HASH (Original):
                  </div>
                  <div className="mono" style={{ fontSize: '0.8rem', color: '#34d399', wordBreak: 'break-all' }}>
                    {result.hash_comparison.original_blockchain_hash}
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1rem', borderRadius: '0.6rem', border: '1px solid rgba(244, 63, 94, 0.4)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#fb7185', fontWeight: 700, marginBottom: '0.35rem' }}>
                    UPLOADED FILE HASH (Altered/Tampered):
                  </div>
                  <div className="mono" style={{ fontSize: '0.8rem', color: '#fb7185', wordBreak: 'break-all' }}>
                    {result.hash_comparison.uploaded_file_hash}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                💡 <b>Avalanche Effect in action:</b> Even a single altered letter or pixel changes the binary stream, creating a totally irreconcilable 256-bit hash. Modification cannot go undetected.
              </div>
            </div>
          )}

          {/* Certificate Metadata Details */}
          {result.document && (
            <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Credential Metadata</h3>
                {result.document.file_name && (
                  <a 
                    href={api.getDocumentDownloadUrl(result.document.document_id)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                  >
                    <Download size={14} /> Download Official PDF
                  </a>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Document ID</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc' }}>{result.document.document_id}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Recipient Name</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#38bdf8' }}>{result.document.owner_name || result.document.recipient_name}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Registration / USN</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{result.document.recipient_id || 'N/A'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Document Category</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{result.document.document_type}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Issuing Organization</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{result.document.organization_name}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Date Issued</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{new Date(result.document.issued_at).toLocaleDateString()}</div>
                </div>
              </div>

              {result.document.qr_code_base64 && (
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '0.6rem' }}>
                  <img src={result.document.qr_code_base64} alt="QR Code" style={{ width: '80px', height: '80px', borderRadius: '0.4rem', background: '#ffffff', padding: '4px' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Official Verification QR Code</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Scan with any phone camera to re-verify directly on the web application.</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Blockchain Audit Proof */}
          {result.blockchain_proof && (
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <Cpu size={18} color="#6366f1" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Ethereum Blockchain Verification Proof</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Network:</span>
                  <span className="badge-chain">{result.blockchain_proof.network}</span>
                </div>

                {result.blockchain_proof.issuer_address && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Issuer Wallet Address:</span>
                    <span className="mono" style={{ fontSize: '0.82rem', color: '#f8fafc' }}>
                      {result.blockchain_proof.issuer_address}
                    </span>
                  </div>
                )}

                {result.blockchain_proof.transaction_hash && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Transaction Hash:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="mono" style={{ fontSize: '0.82rem', color: '#38bdf8' }}>
                        {result.blockchain_proof.transaction_hash}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(result.blockchain_proof?.transaction_hash || '', 'tx')}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                      >
                        {copiedField === 'tx' ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                {result.blockchain_proof.ipfs_cid && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>IPFS Content Identifier (CID):</span>
                    <span className="mono" style={{ fontSize: '0.82rem', color: '#c084fc' }}>
                      {result.blockchain_proof.ipfs_cid}
                    </span>
                  </div>
                )}

                {result.blockchain_proof.revocation_reason && (
                  <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#fb7185', fontWeight: 700 }}>REVOCATION REASON ON BLOCKCHAIN:</div>
                    <div style={{ fontSize: '0.85rem', color: '#f8fafc', marginTop: '0.2rem' }}>{result.blockchain_proof.revocation_reason}</div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
