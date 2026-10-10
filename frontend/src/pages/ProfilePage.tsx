import React, { useState } from 'react';
import { UserCheck, ShieldCheck, Cpu, Copy, Check, ExternalLink, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!user) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }} className="glass-panel">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Active Session</h2>
        <p style={{ color: 'var(--text-muted)' }}>Please log in to view your user profile and institutional credentials.</p>
      </div>
    );
  }

  const copyWallet = () => {
    if (user.wallet_address) {
      navigator.clipboard.writeText(user.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#6366f1', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          <UserCheck size={16} /> User Profile & Credentials
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Account & Organization</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Authorized issuer credentials, Ethereum cryptographic wallet, and system access rights.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem', color: '#fff', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}>
            {user.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{user.name}</h2>
              <span className={user.role === 'admin' ? 'badge-chain' : user.role === 'issuer' ? 'badge-valid' : 'badge-chain'}>
                {user.role.toUpperCase()}
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{user.email}</div>
          </div>

          <button onClick={logout} className="btn-secondary" style={{ color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
            <LogOut size={16} /> Log Out
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Institutional Affiliation</div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f8fafc', marginTop: '0.2rem' }}>
              {user.organization || 'Independent Verifier'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Account Authority</div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: '#34d399', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} /> Whitelisted Issuer Rights
            </div>
          </div>
        </div>

        {/* Ethereum Wallet Info */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Cpu size={14} color="#38bdf8" /> Cryptographic Ethereum Wallet Address
            </div>
            <span className="badge-chain" style={{ fontSize: '0.7rem' }}>Sepolia Network</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="mono" style={{ fontSize: '0.88rem', color: '#38bdf8', wordBreak: 'break-all' }}>
              {user.wallet_address || '0x8A92d00f7d54c12ef4b98c36391d4e082ef73812'}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={copyWallet} className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />} Copy
              </button>
              {user.wallet_address && (
                <a
                  href={`https://sepolia.etherscan.io/address/${user.wallet_address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                >
                  <ExternalLink size={14} /> Etherscan
                </a>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
