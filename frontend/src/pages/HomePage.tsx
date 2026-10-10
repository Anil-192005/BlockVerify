import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Search, 
  Cpu, 
  FileCheck, 
  Lock, 
  QrCode, 
  AlertTriangle, 
  ArrowRight,
  Database,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Award
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats } from '../types';

export const HomePage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [searchId, setSearchId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/verify/${encodeURIComponent(searchId.trim())}`);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Hero Banner */}
      <div className="glass-panel-glow" style={{ padding: '3.5rem 2rem', textAlign: 'center', marginBottom: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '100px', background: 'radial-gradient(ellipse, rgba(99, 102, 241, 0.5), transparent)', filter: 'blur(40px)', zIndex: 0 }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.35rem 0.9rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, color: '#a5b4fc', marginBottom: '1.25rem' }}>
            <Sparkles size={14} color="#38bdf8" />
            <span>Decentralized Proof of Authenticity • Ethereum Sepolia & IPFS</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            Verify Documents. <br />
            <span style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Trust the Blockchain.
            </span>
          </h1>

          <p style={{ maxWidth: '780px', margin: '0 auto 2rem auto', fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Secure, tamper-resistant document authentication powered by Ethereum blockchain. Colleges, universities, and hospitals anchor immutable cryptographic fingerprints (SHA-256) on-chain so anyone can verify instantly without intermediaries.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <Link to="/verify" className="btn-primary" style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}>
              <Search size={18} /> Verify a Document
            </Link>
            <Link to="/issuer/upload" className="btn-secondary" style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}>
              <Award size={18} /> Issue a Document
            </Link>
          </div>

          {/* Quick Search Box */}
          <form onSubmit={handleSearch} style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto', display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.8)', padding: '0.4rem', borderRadius: '0.85rem', border: '1px solid rgba(99, 102, 241, 0.4)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '0.75rem', color: 'var(--text-dim)' }}>
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Enter Document ID (e.g. CERT-2026-000001)..." 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#ffffff', outline: 'none', fontSize: '0.95rem', padding: '0.5rem' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
              Verify On-Chain
            </button>
          </form>

          {/* 1-Click Demo Verifications */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            <span>Quick Test:</span>
            <button 
              onClick={() => navigate('/verify/CERT-2026-000001')}
              style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              ✅ CERT-2026-000001 (Valid Degree)
            </button>
            <button 
              onClick={() => navigate('/verify/CERT-2026-000003')}
              style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '0.2rem 0.6rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              ❌ CERT-2026-000003 (Revoked Credential)
            </button>
            <Link 
              to="/verify"
              style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#a5b4fc', padding: '0.2rem 0.6rem', borderRadius: '0.4rem', textDecoration: 'none', fontSize: '0.78rem' }}
            >
              🚨 Tamper Simulation Lab
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Total Registered</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>{stats?.total_documents ?? 3}</div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Cpu size={12} /> Ethereum Sepolia
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Authentic Valid</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{stats?.verified_documents ?? 2}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle size={12} /> 100% Cryptographic Match
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Revoked Credentials</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fb7185' }}>{stats?.revoked_documents ?? 1}</div>
          <div style={{ fontSize: '0.75rem', color: '#f43f5e', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertTriangle size={12} /> On-Chain Revocation
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Public Verifications</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a855f7' }}>{stats?.verification_requests ?? 24}</div>
          <div style={{ fontSize: '0.75rem', color: '#c084fc', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Lock size={12} /> Immutable Ledger
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="glass-panel" style={{ padding: '2.5rem 2rem', marginBottom: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>How It Works</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '650px', margin: '0 auto' }}>
            Decentralized document authentication powered by Ethereum smart contracts and IPFS storage.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto', fontWeight: 700 }}>1</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.35rem' }}>Upload</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Authorized issuer uploads certificate or degree PDF.</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto', fontWeight: 700 }}>2</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.35rem' }}>Hash</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Backend computes unique 256-bit SHA-256 digest.</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto', fontWeight: 700 }}>3</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.35rem' }}>IPFS Storage</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Document is mirrored off-chain with immutable CID (Qm...).</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto', fontWeight: 700 }}>4</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.35rem' }}>Blockchain</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Smart contract stores hash, wallet, and block number.</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto', fontWeight: 700 }}>5</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.35rem' }}>QR & Verification</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Public scans QR or uploads file for instant VALID / FORGED check.</div>
          </div>

        </div>
      </div>

    </div>
  );
};
