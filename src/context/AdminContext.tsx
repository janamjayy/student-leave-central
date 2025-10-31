import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '@/services/adminService';
import { supabase } from '@/integrations/supabase/client';
import { supabaseService } from '@/services/supabaseService';

interface AdminContextType {
  admin: AdminUser | null;
  isAdminAuthenticated: boolean;
  setAdmin: (admin: AdminUser | null) => void;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdminState] = useState<AdminUser | null>(null);

  // Load admin from Supabase session (preferred) or localStorage (fallback)
  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      // Try Supabase session
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (user) {
          const profile = await supabaseService.getUserProfile(user.id);
          if (profile && profile.role === 'admin') {
            const adminFromProfile: AdminUser = {
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              created_at: profile.created_at,
              avatar_url: profile.avatar_url ?? null,
            };
            if (mounted) {
              setAdmin(adminFromProfile);
              return;
            }
          }
        }
      } catch {}

      // Fallback to localStorage for legacy/demo
      const storedAdmin = localStorage.getItem('admin_user');
      if (storedAdmin) {
        try {
          if (mounted) setAdminState(JSON.parse(storedAdmin));
        } catch (error) {
          console.error('Error parsing stored admin data:', error);
          localStorage.removeItem('admin_user');
        }
      }
    };
    boot();

    // Keep in sync with auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user || null;
      if (user) {
        const profile = await supabaseService.getUserProfile(user.id);
        if (profile && profile.role === 'admin') {
          const adminFromProfile: AdminUser = {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            created_at: profile.created_at,
            avatar_url: profile.avatar_url ?? null,
          };
          setAdmin(adminFromProfile);
        }
      } else {
        setAdmin(null);
      }
    });

    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  const setAdmin = (adminUser: AdminUser | null) => {
    console.log("[AdminContext] Setting admin:", adminUser);
    setAdminState(adminUser);
    if (adminUser) {
      localStorage.setItem('admin_user', JSON.stringify(adminUser));
    } else {
      localStorage.removeItem('admin_user');
    }
  };

  const logout = () => {
    setAdmin(null);
    // Clear Supabase session if any
    supabase.auth.signOut().catch(() => {});
  };

  const value = {
    admin,
    isAdminAuthenticated: !!admin,
    setAdmin,
    logout
  };

  console.log("[AdminContext] Current state:", { admin, isAdminAuthenticated: !!admin });

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};