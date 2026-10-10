import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Search, 
  QrCode, 
  FileUp, 
  Layers, 
  History, 
  Settings, 
  LogOut, 
  LogIn, 
  UserCheck,
  Cpu,
  LayoutDashboard,
  User
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, loginDemo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'Home', icon: ShieldCheck },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/verify', label: 'Verify', icon: Search },
    { path: '/qr', label: 'QR Scanner', icon: QrCode },
    { path: '/issuer/upload', label: 'Issue', icon: FileUp, reqRole: ['issuer', 'admin'] },
    { path: '/issuer/documents', label: 'Registry', icon: Layers, reqRole: ['issuer', 'admin'] },
    { path: '/explorer', label: 'EVM Explorer', icon: Cpu },
    { path: '/history', label: 'Audit Logs', icon: History },
    { path: '/admin', label: 'Governance', icon: Settings, reqRole: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.reqRole) return true;
    if (!user) return false;
    return item.reqRole.includes(user.role);
  });

  return (
    <nav className="glass-panel" style={{ margin: '1rem', position: 'sticky', top: '1rem', zIndex: 50, border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand */}
        <Link 
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            padding: '0.5rem',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
          }}>
            <ShieldCheck size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Block</span><span style={{ color: '#06b6d4' }}>Verify</span>
              <span className="badge-chain" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>Sepolia EVM</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ethereum Document Authentication</div>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }} className="desktop-menu">
          {filteredNavItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} color={isActive ? '#38bdf8' : 'currentColor'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Status / Quick Demo Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Link to="/profile" style={{ textAlign: 'right', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
                  <span className={user.role === 'admin' ? 'badge-chain' : user.role === 'issuer' ? 'badge-valid' : 'badge-chain'}>
                    {user.role.toUpperCase()}
                  </span>
                  {user.wallet_address && (
                    <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      {user.wallet_address.substring(0, 6)}...{user.wallet_address.substring(user.wallet_address.length - 4)}
                    </span>
                  )}
                </div>
              </Link>
              <Link to="/profile" className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }} title="Profile">
                <User size={15} />
              </Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                title="Log Out"
                className="btn-secondary"
                style={{ padding: '0.4rem 0.6rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={() => loginDemo('issuer').then(() => navigate('/dashboard'))}
                className="btn-primary"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
                title="Log in as ABC Engineering College Registrar"
              >
                <UserCheck size={14} /> Issuer Demo
              </button>
              <button
                onClick={() => loginDemo('admin').then(() => navigate('/admin'))}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
                title="Log in as System Admin"
              >
                Admin Demo
              </button>
              <Link
                to="/login"
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem', textDecoration: 'none' }}
              >
                <LogIn size={14} /> Login
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};
