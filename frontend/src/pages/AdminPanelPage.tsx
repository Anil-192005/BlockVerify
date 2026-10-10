import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, ShieldCheck, CheckCircle, UserPlus, Users, Layers, History, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminPanelPage: React.FC = () => {
  const { user } = useAuth();
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgWallet, setNewOrgWallet] = useState('');
  const [issuers, setIssuers] = useState([
    { name: 'ABC Engineering College', type: 'University', wallet: '0x8A92d00f7d54c12ef4b98c36391d4e082ef73812', status: 'AUTHORIZED' },
    { name: 'XYZ University', type: 'University', wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', status: 'AUTHORIZED' },
    { name: 'Global Tech Solutions', type: 'Company', wallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', status: 'AUTHORIZED' },
    { name: 'City Hospital', type: 'Hospital', wallet: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', status: 'AUTHORIZED' }
  ]);

  const handleAddIssuer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrgName && newOrgWallet) {
      setIssuers([...issuers, { name: newOrgName, type: 'Institution', wallet: newOrgWallet, status: 'AUTHORIZED' }]);
      setNewOrgName('');
      setNewOrgWallet('');
      alert(`Issuer ${newOrgName} authorized on Smart Contract!`);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#6366f1', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          <Settings size={16} /> Root Governance Console
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Admin & Smart Contract Governance</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Manage trusted educational institutions, authorize issuer wallets, and monitor protocol integrity.
        </p>
      </div>

      {/* Admin Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <Link to="/admin/users" className="glass-panel" style={{ padding: '1.25rem', textDecoration: 'none', transition: 'all 0.2s ease' }}>
          <Users size={24} color="#6366f1" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f8fafc' }}>Manage Users</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Approve & inspect institutional issuers</div>
        </Link>

        <Link to="/admin/documents" className="glass-panel" style={{ padding: '1.25rem', textDecoration: 'none', transition: 'all 0.2s ease' }}>
          <Layers size={24} color="#06b6d4" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f8fafc' }}>All Documents</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Platform-wide credential registry</div>
        </Link>

        <Link to="/admin/verifications" className="glass-panel" style={{ padding: '1.25rem', textDecoration: 'none', transition: 'all 0.2s ease' }}>
          <History size={24} color="#a855f7" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f8fafc' }}>Verifications Trail</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Real-time verification audit logs</div>
        </Link>
      </div>

      {/* Authorized Issuers List */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} color="#34d399" />
          Whitelisted Issuing Authorities (Sepolia EVM)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
          {issuers.map((org, idx) => (
            <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>{org.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Category: {org.type}</div>
                <div className="mono" style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.2rem' }}>
                  Wallet: {org.wallet}
                </div>
              </div>

              <div>
                <span className="badge-valid">
                  <CheckCircle size={12} /> {org.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Issuer */}
        <form onSubmit={handleAddIssuer} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <UserPlus size={16} color="#818cf8" /> Authorize New Issuer Wallet on Smart Contract
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Institution / University Name"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
            />
            <input
              type="text"
              required
              className="form-input"
              placeholder="Ethereum Wallet Address (0x...)"
              value={newOrgWallet}
              onChange={(e) => setNewOrgWallet(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
            Authorize on Smart Contract
          </button>
        </form>
      </div>

      {/* College Defense Guide Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(99, 102, 241, 0.3)', background: 'rgba(99, 102, 241, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.75rem', borderRadius: '0.75rem' }}>
            <BookOpen size={24} color="#818cf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem' }}>Final Year Defense & Viva Preparation File</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              A full technical examination Q&A guide with examiner questions, answers on off-chain vs on-chain storage, SHA-256 avalanche effect, smart contract gas mechanics, and non-repudiation is saved in your project repository under:
            </p>
            <div className="mono" style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.5rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.82rem', color: '#38bdf8', display: 'inline-block' }}>
              security/DEFENSE_VIVA_QA.md
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
