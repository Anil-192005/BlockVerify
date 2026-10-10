import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  loginDemo: (role: 'issuer' | 'admin' | 'verifier') => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('blockverify_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const profile = await api.getProfile();
          setUser(profile);
        } catch {
          localStorage.removeItem('blockverify_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    localStorage.setItem('blockverify_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const loginDemo = async (role: 'issuer' | 'admin' | 'verifier') => {
    let email = 'issuer@abccollege.edu';
    let pass = 'issuer123';
    if (role === 'admin') {
      email = 'admin@blockverify.eth';
      pass = 'admin123';
    } else if (role === 'verifier') {
      email = 'verifier@techcorp.com';
      pass = 'verifier123';
    }
    await login(email, pass);
  };

  const logout = () => {
    localStorage.removeItem('blockverify_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginDemo, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
