import React from 'react';
import { ShieldCheck, Cpu, Terminal, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      margin: '4rem 1rem 1.5rem 1rem',
      padding: '2rem',
      borderRadius: '1rem',
      background: 'rgba(15, 23, 42, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      fontSize: '0.85rem',
      color: 'var(--text-muted)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>
            <ShieldCheck size={18} color="#06b6d4" />
            BlockVerify – Decentralized Document Authentication System
          </div>
          <div>Built with Ethereum Smart Contracts, Python FastAPI, IPFS & React.</div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Cpu size={14} color="#6366f1" />
            <span>Smart Contract:</span>
            <span className="mono" style={{ color: '#38bdf8' }}>0x5FbDB...80aa3</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Terminal size={14} color="#10b981" />
            <span>Network:</span>
            <span className="badge-chain" style={{ fontSize: '0.7rem' }}>Sepolia / EVM</span>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '1.25rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <div>Final Year Project • Cryptographic SHA-256 Non-Repudiation Architecture</div>
        <div>Defense & Viva Q&A Guide included in <span className="mono" style={{ color: '#e2e8f0' }}>security/DEFENSE_VIVA_QA.md</span></div>
      </div>
    </footer>
  );
};
