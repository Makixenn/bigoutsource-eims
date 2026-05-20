import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppUser, UserRole } from '../types';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { clearAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: (role: UserRole) => void;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isIT: boolean;
  isHR: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toAppUser(apiUser: any): AppUser {
  return {
    uid: apiUser.id,
    email: apiUser.email,
    role: apiUser.role,
    status: apiUser.status,
    site: apiUser.site || 'Unassigned',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrapSession() {
      const token = getAuthToken();
      const savedDemoUser = localStorage.getItem('nexus_demo_user');

      if (!token && savedDemoUser) {
        try {
          setUser(JSON.parse(savedDemoUser));
        } catch (e) {
          localStorage.removeItem('nexus_demo_user');
        } finally {
          setLoading(false);
        }
        return;
      }

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const apiUser = await authService.me();
        setUser(toAppUser(apiUser));
      } catch (error) {
        clearAuthToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrapSession();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      localStorage.removeItem('nexus_demo_user');
      const apiUser = await authService.login(email, pass);
      setUser(toAppUser(apiUser));
      toast.success('Successfully logged in');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    // Simulated Google Login
    const googleUser: AppUser = {
      uid: 'google_user_demo',
      email: 'google.demo@bigoutsource.com',
      role: 'super_admin',
      status: 'active',
      site: 'HQ'
    };
    clearAuthToken();
    setUser(googleUser);
    localStorage.setItem('nexus_demo_user', JSON.stringify(googleUser));
    toast.success('Successfully Signed in with Google (Demo)');
  };

  const loginAsDemo = (role: UserRole) => {
    const demoUser: AppUser = {
      uid: `demo_${role}`,
      email: `${role.replace('_', '.')}@demo-bigoutsource.com`,
      role: role,
      status: 'active',
      site: role === 'super_admin' ? 'HQ' : role === 'it_admin' ? 'Site A' : 'Remote'
    };
    clearAuthToken();
    setUser(demoUser);
    localStorage.setItem('nexus_demo_user', JSON.stringify(demoUser));
    toast.success(`Logged in as Demo ${role.replace('_', ' ').toUpperCase()}`);
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('nexus_demo_user');
    setUser(null);
    toast.success('Logged out');
  };

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    loginAsDemo,
    logout,
    isAdmin: user?.role === 'super_admin',
    isIT: user?.role === 'super_admin' || user?.role === 'it_admin',
    isHR: user?.role === 'super_admin' || user?.role === 'hr_admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
