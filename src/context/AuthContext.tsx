
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { supabaseService, UserProfile } from '@/services/supabaseService';
import { roleService, AppRole } from '@/services/roleService';
import { toast } from 'sonner';

// Define context type
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  userRole: AppRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, studentId: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isSuperAdmin: () => boolean;
  isFaculty: () => boolean;
  isStudent: () => boolean;
  refreshRole: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  userRole: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  isSuperAdmin: () => false,
  isFaculty: () => false,
  isStudent: () => false,
  refreshRole: async () => {},
});

// Create hook for easy context use
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile and role
  const fetchUserProfile = async (userId: string) => {
    try {
      const userProfile = await supabaseService.getUserProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Fetch user role from database (server-side check)
  const fetchUserRole = async (userId: string) => {
    try {
      const role = await roleService.getUserRole(userId);
      setUserRole(role);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
    }
  };

  const refreshRole = async () => {
    if (user) {
      await fetchUserRole(user.id);
    }
  };

  useEffect(() => {
    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        // Update state based on auth events
        setSession(currentSession);
        setUser(currentSession?.user || null);

        // If we have a user, fetch their profile and role
        if (currentSession?.user) {
          // Use setTimeout to avoid potential deadlocks
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
            fetchUserRole(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRole(null);
        }

        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setUserRole(null);
        }
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { user: initialUser, session: initialSession } = await supabaseService.getCurrentSession();
        
        setUser(initialUser);
        setSession(initialSession);
        
        if (initialUser) {
          await fetchUserProfile(initialUser.id);
          await fetchUserRole(initialUser.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { user: authUser, error } = await supabaseService.login(email, password);
      
      if (error) {
        toast.error(error);
        throw new Error(error);
      }
      
      if (authUser) {
        toast.success('Login successful');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, studentId: string) => {
    try {
      setLoading(true);
      const { user: authUser, error } = await supabaseService.signUp(email, password, name, studentId);
      
      if (error) {
        toast.error(error);
        throw new Error(error);
      }
      
      if (authUser) {
        toast.success('Account created successfully');
      }
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabaseService.logout();
      toast.info('You have been logged out');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to log out');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabaseService.resetPassword(email);
      
      if (error) {
        toast.error(error);
        throw new Error(error);
      }
      
      toast.success('Password reset email sent');
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  };

  // Role check functions - using server-validated role
  const isSuperAdmin = () => userRole === 'superadmin';
  const isFaculty = () => userRole === 'faculty';
  const isStudent = () => userRole === 'student';

  const value = {
    user,
    session,
    profile,
    userRole,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    isSuperAdmin,
    isFaculty,
    isStudent,
    refreshRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
