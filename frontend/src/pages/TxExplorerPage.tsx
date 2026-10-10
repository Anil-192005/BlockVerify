import React, { useState, useEffect } from 'react';
import { Cpu, Layers, ExternalLink, ArrowRight, ShieldCheck, Hash, Clock, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { BlockchainTransaction } from '../types';

export const TxExplorerPage: React.FC = () => {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getBlockchainTransactions().then(setTransactions).finally(() => setIsLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          <Cpu size={16} /> Ethereum Virtual Machine (EVM)
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>On-Chain Transaction Explorer</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Live ledger of mined cryptographic blocks, smart contract function calls, and immutable state changes.
        </p>
      </div>

      {/* Contract & Network Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>SMART CONTRACT ADDRESS</div>
          <div className="mono" style={{ fontSize: '0.88rem', color: '#38bdf8', fontWeight: 700 }}>
            0x5FbDB2315678afecb367f032d93F642f64180aa3
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>BlockVerify.sol • Solidity ^0.8.20</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>CONSENSUS & ENVIRONMENT</div>
          <div style={{ fontSize: '0.95rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle size={16} /> Proof of Stake / Sepolia Testnet Ready
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Zero gas fee overhead for verifiers</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>HASHING STANDARD</div>
          <div className="mono" style={{ fontSize: '0.95rem', color: '#a855f7', fontWeight: 700 }}>
            SHA-256 (256-bit Digest)
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Non-colliding cryptographic fingerprint</div>
        </div>

      </div>

      {/* Visual Block Chain Representation */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} color="#818cf8" /> Visual Block Sequence
        </h3>

        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.75rem' }}>
          
          <div style={{ minWidth: '180px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.75rem', padding: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>GENESIS BLOCK</div>
            <div className="mono" style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.1rem' }}>#000000</div>
            <div className="mono" style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem' }}>Prev: 0x000000...</div>
            <div className="mono" style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Hash: 0x7e0021...</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', color: '#475569' }}><ArrowRight size={20} /></div>

          <div style={{ minWidth: '180px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>CERT REGISTRY</div>
            <div className="mono" style={{ fontWeight: 800, color: '#818cf8', fontSize: '1.1rem' }}>#18452091</div>
            <div className="mono" style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem' }}>Tx: registerDoc</div>
            <div className="mono" style={{ fontSize: '0.7rem', color: '#38bdf8' }}>CERT-2026-0001</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', color: '#475569' }}><ArrowRight size={20} /></div>

          <div style={{ minWidth: '180px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>CERT REGISTRY</div>
            <div className="mono" style={{ fontWeight: 800, color: '#818cf8', fontSize: '1.1rem' }}>#18452092</div>
            <div className="mono" style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem' }}>Tx: registerDoc</div>
            <div className="mono" style={{ fontSize: '0.7rem', color: '#38bdf8' }}>CERT-2026-0002</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', color: '#475569' }}><ArrowRight size={20} /></div>

          <div style={{ minWidth: '180px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '0.75rem', padding: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#fb7185', textTransform: 'uppercase' }}>REVOCATION BLOCK</div>
            <div className="mono" style={{ fontWeight: 800, color: '#fb7185', fontSize: '1.1rem' }}>#18452094</div>
            <div className="mono" style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem' }}>Tx: revokeDoc</div>
            <div className="mono" style={{ fontSize: '0.7rem', color: '#fb7185' }}>CERT-2026-0003</div>
          </div>

        </div>
      </div>

      {/* Transaction Feed Table */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: '1.1rem' }}>
          Mined Transactions Ledger
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '0.85rem 1.25rem' }}>Tx Hash</th>
              <th style={{ padding: '0.85rem 1.25rem' }}>Block</th>
              <th style={{ padding: '0.85rem 1.25rem' }}>Action</th>
              <th style={{ padding: '0.85rem 1.25rem' }}>Document ID</th>
              <th style={{ padding: '0.85rem 1.25rem' }}>Gas Used</th>
              <th style={{ padding: '0.85rem 1.25rem' }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((tx, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span className="mono" style={{ color: '#38bdf8' }}>
                      {tx.tx_hash.substring(0, 16)}...{tx.tx_hash.substring(tx.tx_hash.length - 8)}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span className="mono" style={{ color: '#f8fafc', fontWeight: 600 }}>#{tx.block_number}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span className={tx.action === 'revokeDocument' ? 'badge-revoked' : 'badge-chain'}>
                      {tx.action}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span className="mono" style={{ color: '#a5b4fc' }}>{tx.document_id}</span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-dim)' }}>
                    {tx.gas_used.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-dim)' }}>
                    {new Date(tx.timestamp * 1000).toLocaleTimeString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-dim)' }}>
                  {isLoading ? 'Fetching blockchain transactions...' : 'No transactions recorded yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
