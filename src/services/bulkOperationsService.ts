import { supabase } from "@/integrations/supabase/client";
import { supabaseService } from "./supabaseService";

export interface BulkOperation {
  id: string;
  operation_type: 'approve' | 'reject' | 'delete';
  affected_count: number;
  status: 'pending' | 'completed' | 'failed';
  performed_by?: string;
  details?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export const bulkOperationsService = {
  bulkApproveLeaves: async (leaveIds: string[], reviewerId: string, comments?: string): Promise<{ success: boolean; count: number; error: string | null }> => {
    try {
      // Create bulk operation record
      const { data: operation, error: opError } = await (supabase as any)
        .from('bulk_operations')
        .insert({
          operation_type: 'approve',
          performed_by: reviewerId,
          details: { leave_ids: leaveIds, comments }
        })
        .select()
        .single();

      if (opError) throw opError;

      let successCount = 0;
      const errors: string[] = [];

      // Update each leave
      for (const leaveId of leaveIds) {
        const result = await supabaseService.updateLeaveStatus(leaveId, 'approved', reviewerId, comments);
        if (result.success) {
          successCount++;
        } else {
          errors.push(`Failed to approve leave ${leaveId}: ${result.error}`);
        }
      }

      // Update operation status
      await (supabase as any)
        .from('bulk_operations')
        .update({
          affected_count: successCount,
          status: successCount === leaveIds.length ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          details: { leave_ids: leaveIds, comments, errors }
        })
        .eq('id', operation.id);

      return {
        success: successCount > 0,
        count: successCount,
        error: errors.length > 0 ? errors.join('; ') : null
      };
    } catch (error: any) {
      console.error('Error in bulk approve:', error);
      return { success: false, count: 0, error: error.message };
    }
  },

  bulkRejectLeaves: async (leaveIds: string[], reviewerId: string, reason?: string): Promise<{ success: boolean; count: number; error: string | null }> => {
    try {
      // Create bulk operation record
      const { data: operation, error: opError } = await (supabase as any)
        .from('bulk_operations')
        .insert({
          operation_type: 'reject',
          performed_by: reviewerId,
          details: { leave_ids: leaveIds, reason }
        })
        .select()
        .single();

      if (opError) throw opError;

      let successCount = 0;
      const errors: string[] = [];

      // Update each leave
      for (const leaveId of leaveIds) {
        const result = await supabaseService.updateLeaveStatus(leaveId, 'rejected', reviewerId, reason);
        if (result.success) {
          successCount++;
        } else {
          errors.push(`Failed to reject leave ${leaveId}: ${result.error}`);
        }
      }

      // Update operation status
      await (supabase as any)
        .from('bulk_operations')
        .update({
          affected_count: successCount,
          status: successCount === leaveIds.length ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          details: { leave_ids: leaveIds, reason, errors }
        })
        .eq('id', operation.id);

      return {
        success: successCount > 0,
        count: successCount,
        error: errors.length > 0 ? errors.join('; ') : null
      };
    } catch (error: any) {
      console.error('Error in bulk reject:', error);
      return { success: false, count: 0, error: error.message };
    }
  },

  getBulkOperations: async (): Promise<BulkOperation[]> => {
    try {
      const { data, error } = await (supabase as any)
        .from('bulk_operations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as BulkOperation[];
    } catch (error) {
      console.error('Error fetching bulk operations:', error);
      return [];
    }
  }
};
