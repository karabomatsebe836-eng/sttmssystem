import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Role, Department } from '../types';

interface AuthContextType {
  user: (User & { role: Role; department?: Department }) | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isProcurementOfficer: boolean;
  isSupplier: boolean;
  isAuditor: boolean;
}

interface SignUpData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthUser = User & { role: Role; department?: Department };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('sttms_user');
          return;
        }
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          const storedUser = localStorage.getItem('sttms_user');
          if (storedUser) {
            try { setUser(JSON.parse(storedUser) as AuthUser); } catch { /* ignore parse errors */ }
          }
        }
      })();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function checkSession() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const storedUser = localStorage.getItem('sttms_user');
      if (sessionData.session && storedUser) setUser(JSON.parse(storedUser) as AuthUser);
      else if (!sessionData.session) {
        localStorage.removeItem('sttms_user');
        setUser(null);
      }
    } catch (error) {
      console.error('Session check error:', error);
      localStorage.removeItem('sttms_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('auth-login', { body: { email, password } });
      if (error || !data?.success || !data.user || !data.session) return { success: false, error: 'Invalid email or password' };

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (sessionError) return { success: false, error: 'Unable to establish a secure session' };

      const fullUser: AuthUser = {
        id: data.user.id,
        auth_user_id: data.user.auth_user_id,
        email: data.user.email,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        role_id: data.user.role_id,
        role: data.user.role,
        department: data.user.department,
        department_id: data.user.department_id,
        employee_id: data.user.employee_id,
        phone: data.user.phone,
        is_active: data.user.is_active,
        email_verified: data.user.email_verified,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
      };
      setUser(fullUser);
      localStorage.setItem('sttms_user', JSON.stringify(fullUser));
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Unable to sign in right now. Please try again.' };
    } finally {
      setLoading(false);
    }
  }

  async function signUp(data: SignUpData) {
    try {
      setLoading(true);
      const { data: result, error } = await supabase.functions.invoke('auth-register', { body: data });
      if (error || !result?.success) return { success: false, error: result?.error || 'Registration failed. Please try again.' };
      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Registration is temporarily unavailable.' };
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('sttms_user');
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    signUp,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role?.name === 'admin',
    isProcurementOfficer: user?.role?.name === 'procurement_officer',
    isSupplier: user?.role?.name === 'supplier',
    isAuditor: user?.role?.name === 'auditor',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
