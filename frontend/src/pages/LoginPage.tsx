import React, { useState } from 'react';
import { LogIn, UserPlus, ShieldCheck, UserCheck, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, loginDemo } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'issuer' | 'verifier' | 'admin'>('issuer');
  const [organization, setOrganization] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (isRegister) {
        await api.register({
          name,
          email,
          password,
          role,
          organization: organization || undefined,
        });
        await login(email, password);
      } else {
        await login(email, password);
      }
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = async (role: 'issuer' | 'admin' | 'verifier') => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginDemo(role);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto', padding: '1rem' }}>
      
      {/* 1-Click Demo Credentials Card */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <UserCheck size={16} /> 1-Click Examiner / Demo Logins
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => handleDemoClick('issuer')}
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%', fontSize: '0.85rem' }}
          >
            🏫 Login as Issuer (ABC Engineering College)
          </button>
          
          <button
            onClick={() => handleDemoClick('admin')}
            disabled={isLoading}
            className="btn-secondary"
            style={{ width: '100%', fontSize: '0.85rem' }}
          >
            👨‍💼 Login as Admin (System Governance)
          </button>
          
          <button
            onClick={() => handleDemoClick('verifier')}
            disabled={isLoading}
            className="btn-secondary"
            style={{ width: '100%', fontSize: '0.85rem' }}
          >
            🔍 Login as Verifier (HR Recruiter)
          </button>
        </div>
      </div>

      {/* Main Login / Register Box */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {isRegister ? 'Create an Account' : 'Account Login'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {isRegister ? 'Register as an Issuer or Verifier' : 'Sign in to access your registry & documents'}
          </p>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '0.5rem', padding: '0.75rem', color: '#fb7185', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              Password
            </label>
            <input
              type="password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {isRegister && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Role
                </label>
                <select
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="issuer">Issuer (College / Organization)</option>
                  <option value="verifier">Verifier (Employer / Public)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Organization / University Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ABC Engineering College"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem' }}
          >
            {isLoading ? 'Processing...' : (isRegister ? 'Register Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setErrorMsg(null); }}
            style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer' }}
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>

      </div>

    </div>
  );
};
