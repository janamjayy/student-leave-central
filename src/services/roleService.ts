import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'student' | 'faculty' | 'superadmin';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

/**
 * Role service using server-side validation with security definer functions
 * CRITICAL: Never check roles using client-side storage
 */
export const roleService = {
  /**
   * Get user's primary role from the database (server-side check)
   */
  getUserRole: async (userId: string): Promise<AppRole | null> => {
    const { data, error } = await supabase
      .rpc('get_user_role', { _user_id: userId });
    
    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
    
    return data as AppRole;
  },

  /**
   * Check if user has a specific role (server-side check)
   */
  hasRole: async (userId: string, role: AppRole): Promise<boolean> => {
    const { data, error } = await supabase
      .rpc('has_role', { _user_id: userId, _role: role });
    
    if (error) {
      console.error('Error checking role:', error);
      return false;
    }
    
    return data as boolean;
  },

  /**
   * Get all roles for a user
   */
  getUserRoles: async (userId: string): Promise<UserRole[]> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
    
    return data as UserRole[];
  },

  /**
   * Assign a role to a user (superadmin only)
   */
  assignRole: async (userId: string, role: AppRole): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  },

  /**
   * Remove a role from a user (superadmin only)
   */
  removeRole: async (userId: string, role: AppRole): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  }
};
