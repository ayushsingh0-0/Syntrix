import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  isEmailVerified: boolean;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('syntrix_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('syntrix_access_token');
  });
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/users/me');
      setUser(data.data);
      localStorage.setItem('syntrix_user', JSON.stringify(data.data));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('syntrix_access_token');
      if (token) {
        try {
          const { data } = await api.get('/users/me');
          setUser(data.data);
          localStorage.setItem('syntrix_user', JSON.stringify(data.data));
        } catch {
          setUser(null);
          setAccessToken(null);
          localStorage.removeItem('syntrix_user');
          localStorage.removeItem('syntrix_access_token');
        }
      }
      setIsLoading(false);
    };

    initAuth();

    const handleSessionExpired = () => {
      setUser(null);
      setAccessToken(null);
      showToast('error', 'Session expired. Please log in again.');
    };

    window.addEventListener('syntrix_session_expired', handleSessionExpired);
    return () => window.removeEventListener('syntrix_session_expired', handleSessionExpired);
  }, [showToast]);

  const login = async (email: string, pass: string) => {
    const { data } = await api.post('/auth/login', { email, password: pass });
    const { user: authUser, accessToken: token } = data.data;

    setUser(authUser);
    setAccessToken(token);
    localStorage.setItem('syntrix_user', JSON.stringify(authUser));
    localStorage.setItem('syntrix_access_token', token);
    showToast('success', `Welcome back, ${authUser.name}!`);
  };

  const register = async (name: string, email: string, pass: string) => {
    const { data } = await api.post('/auth/register', { name, email, password: pass });
    const { user: authUser, accessToken: token } = data.data;

    setUser(authUser);
    setAccessToken(token);
    localStorage.setItem('syntrix_user', JSON.stringify(authUser));
    localStorage.setItem('syntrix_access_token', token);
    showToast('success', 'Account created successfully!');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('syntrix_user');
      localStorage.removeItem('syntrix_access_token');
      localStorage.removeItem('syntrix_active_org_id');
      showToast('info', 'Logged out successfully');
    }
  };

  const updateUser = (updatedData: Partial<User>) => {
    if (user) {
      const merged = { ...user, ...updatedData };
      setUser(merged);
      localStorage.setItem('syntrix_user', JSON.stringify(merged));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
