
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { supabaseService, UserProfile } from '@/services/supabaseService';
import { toast } from 'sonner';

// Define context type
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, studentId: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAdmin: () => boolean;
  isFaculty: () => boolean;
  isStudent: () => boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  isAdmin: () => false,
  isFaculty: () => false,
  isStudent: () => false,
});

// Create hook for easy context use
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const userProfile = await supabaseService.getUserProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        // Update state based on auth events
        setSession(currentSession);
        setUser(currentSession?.user || null);

        // If we have a user, fetch their profile
        if (currentSession?.user) {
          // Use setTimeout to avoid potential deadlocks
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }

        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          setProfile(null);
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

  // Role check functions
  const isAdmin = () => profile?.role === 'admin';
  const isFaculty = () => profile?.role === 'faculty';
  const isStudent = () => profile?.role === 'student';

  const value = {
    user,
    session,
    profile,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    isAdmin,
    isFaculty,
    isStudent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
