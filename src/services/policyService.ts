import { supabase } from "@/integrations/supabase/client";

export interface LeavePolicy {
  id: string;
  policy_name: string;
  policy_type: 'quota' | 'date_restriction' | 'approval_workflow';
  policy_rules: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const policyService = {
  getAllPolicies: async (): Promise<LeavePolicy[]> => {
    try {
      const { data, error } = await (supabase as any)
        .from('leave_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LeavePolicy[];
    } catch (error) {
      console.error('Error fetching policies:', error);
      return [];
    }
  },

  createPolicy: async (policy: Omit<LeavePolicy, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error: string | null }> => {
    try {
      const user = await supabase.auth.getUser();
      
      const { error } = await (supabase as any)
        .from('leave_policies')
        .insert({
          ...policy,
          created_by: user.data.user?.id
        });

      if (error) throw error;
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error creating policy:', error);
      return { success: false, error: error.message };
    }
  },

  updatePolicy: async (id: string, updates: Partial<LeavePolicy>): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await (supabase as any)
        .from('leave_policies')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error updating policy:', error);
      return { success: false, error: error.message };
    }
  },

  deletePolicy: async (id: string): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await (supabase as any)
        .from('leave_policies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error deleting policy:', error);
      return { success: false, error: error.message };
    }
  },

  togglePolicy: async (id: string, isActive: boolean): Promise<{ success: boolean; error: string | null }> => {
    return policyService.updatePolicy(id, { is_active: isActive });
  }
};
