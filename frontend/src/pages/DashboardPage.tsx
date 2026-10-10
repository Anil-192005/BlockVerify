import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Cpu, 
  FileCheck, 
  AlertTriangle, 
  ShieldCheck, 
  FileUp, 
  Search, 
  QrCode, 
  Layers, 
  ExternalLink,
  Download,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, BlockchainTransaction } from '../types';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [txs, setTxs] = useState<BlockchainTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      api.getDashboardStats().then(setStats).catch(() => {}),
      api.getBlockchainTransactions().then(setTxs).catch(() => {})
    ]).finally(() => setIsLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            <Cpu size={14} /> Ethereum Sepolia Connected
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>
            {user?.role === 'issuer' ? `${user.organization || 'Institutional'} Issuer Dashboard` : 'BlockVerify Governance Dashboard'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Real-time monitoring of decentralized document issuance, verification requests, and smart contract transactions.
          </p>
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {(user?.role === 'issuer' || user?.role === 'admin') && (
            <Link to="/issuer/upload" className="btn-primary">
              <FileUp size={16} /> Issue Document
            </Link>
          )}
          <Link to="/verify" className="btn-secondary">
            <Search size={16} /> Verify File
          </Link>
          <Link to="/qr" className="btn-secondary">
            <QrCode size={16} /> Scan QR
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Documents</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
            {stats?.total_documents ?? 3}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Cpu size={12} /> Anchored on Smart Contract
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Authentic Verified</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
            {stats?.verified_documents ?? 2}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle size={12} /> Cryptographic 0-Collision
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Revoked Credentials</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fb7185', marginTop: '0.25rem' }}>
            {stats?.revoked_documents ?? 1}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#f43f5e', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertTriangle size={12} /> Formally Recalled on EVM
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Verification Queries</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#a855f7', marginTop: '0.25rem' }}>
            {stats?.verification_requests ?? 24}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#c084fc', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={12} /> Public Non-Repudiation
          </div>
        </div>

      </div>

      {/* Main Content Layout: Left side Recent Documents, Right side Live Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Recent Documents Table */}
        <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="#6366f1" /> Recently Issued Credentials
            </h3>
            <Link to="/issuer/documents" style={{ color: '#38bdf8', fontSize: '0.82rem', textDecoration: 'none' }}>
              View All →
            </Link>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem' }}>ID & Recipient</th>
                <th style={{ padding: '0.75rem' }}>Category</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_documents && stats.recent_documents.length > 0 ? (
                stats.recent_documents.slice(0, 5).map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <Link to={`/issuer/documents/${doc.document_id}`} className="mono" style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}>
                        {doc.document_id}
                      </Link>
                      <div style={{ fontSize: '0.78rem', color: '#f8fafc' }}>{doc.owner_name}</div>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                      {doc.document_type}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={doc.status === 'VALID' ? 'badge-valid' : 'badge-revoked'}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <Link to={`/verify/${doc.document_id}`} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                        Verify
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No documents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Live Blockchain Transactions */}
        <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} color="#06b6d4" /> Ethereum Sepolia Transactions
            </h3>
            <Link to="/explorer" style={{ color: '#38bdf8', fontSize: '0.82rem', textDecoration: 'none' }}>
              Full Explorer →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {txs.slice(0, 5).map((tx, idx) => (
              <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '0.6rem', padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className={tx.action === 'revokeDocument' ? 'badge-revoked' : 'badge-chain'}>
                    {tx.action}
                  </span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Block #{tx.block_number}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                    {tx.tx_hash.substring(0, 16)}...
                  </span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${tx.tx_hash}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem' }}
                  >
                    Etherscan <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
