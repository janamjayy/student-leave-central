
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

// Define User type
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  studentId?: string;
}

// Define context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: string, rememberMe: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string, studentId: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  resetPassword: async () => {},
});

// Create hook for easy context use
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, role: string, rememberMe: boolean) => {
    try {
      setLoading(true);
      const user = await authService.login(email, password, role);
      setUser(user);
      toast.success(`Welcome back, ${user.name}!`);
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Failed to login. Please check your credentials.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, studentId: string) => {
    try {
      setLoading(true);
      const user = await authService.register(name, email, password, studentId);
      setUser(user);
      toast.success('Account created successfully!');
    } catch (error) {
      console.error('Signup failed:', error);
      toast.error('Failed to create account. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    toast.info('You have been logged out');
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
      toast.success('Password reset email sent successfully!');
    } catch (error) {
      console.error('Password reset failed:', error);
      toast.error('Failed to send reset email. Please try again.');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
