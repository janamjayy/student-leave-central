import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'student' | 'faculty' | 'admin';

// Centralized role access now uses profiles.role directly to avoid relying on user_roles table.
export const roleService = {
  // Get user's role from profiles
  getUserRole: async (userId: string): Promise<AppRole | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      return (data?.role as AppRole) ?? 'student';
    } catch (error) {
      console.error("Error in getUserRole:", error);
      return null;
    }
  },

  // Check if user has a specific role via profiles.role
  hasRole: async (userId: string, role: AppRole): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error checking role:", error);
        return false;
      }

      return (data?.role as AppRole) === role;
    } catch (error) {
      console.error("Error in hasRole:", error);
      return false;
    }
  },

  // Assign role to user (admin only) by updating profiles.role
  assignRole: async (userId: string, role: AppRole): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Error assigning role:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  // Remove role from user (admin only) — set to 'student' by default
  removeRole: async (userId: string, role: AppRole): Promise<{ success: boolean; error: string | null }> => {
    try {
      // If removing the current role, downgrade to 'student'; otherwise, no-op
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const current = (data?.role as AppRole) || 'student';
      if (current === role && role !== 'student') {
        const { error } = await supabase
          .from('profiles')
          .update({ role: 'student', updated_at: new Date().toISOString() })
          .eq('id', userId);
        if (error) return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (error) {
      console.error("Error removing role:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }
};
