import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShieldCheck, CheckCircle, XCircle, ArrowLeft, UserPlus } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await api.toggleUserStatus(userId, currentStatus);
      await fetchUsers();
    } catch {
      alert('Failed to update user status');
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ marginBottom: '0.5rem' }}>
            <Link to="/admin" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}>
              <ArrowLeft size={14} /> Back to Governance
            </Link>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Manage Platform Users & Issuers</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Approve, inspect, and manage permissions for institutions and administrative accounts.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '1rem 1.25rem' }}>User / Institution</th>
              <th style={{ padding: '1rem 1.25rem' }}>Email</th>
              <th style={{ padding: '1rem 1.25rem' }}>Role</th>
              <th style={{ padding: '1rem 1.25rem' }}>Wallet Address</th>
              <th style={{ padding: '1rem 1.25rem' }}>Status</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{u.organization || 'Independent'}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className={u.role === 'admin' ? 'badge-chain' : u.role === 'issuer' ? 'badge-valid' : 'badge-chain'}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className="mono" style={{ fontSize: '0.78rem', color: '#38bdf8' }}>
                      {u.wallet_address ? `${u.wallet_address.substring(0, 8)}...${u.wallet_address.substring(u.wallet_address.length - 6)}` : 'None'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className={u.is_active !== false ? 'badge-valid' : 'badge-revoked'}>
                      {u.is_active !== false ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => toggleStatus(u.id, u.is_active !== false)}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    >
                      {u.is_active !== false ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                  {isLoading ? 'Loading users...' : 'No users found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
