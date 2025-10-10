import { supabase } from "@/integrations/supabase/client";

export interface TrendData {
  period: string;
  approved: number;
  rejected: number;
  pending: number;
  total: number;
}

export interface LeaveTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface StudentLeavePattern {
  studentId: string;
  studentName: string;
  totalLeaves: number;
  approvedRate: number;
  averageDuration: number;
  emergencyCount: number;
}

export const analyticsService = {
  getLeavetrends: async (months: number = 6): Promise<TrendData[]> => {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data, error } = await supabase
        .from('leave_applications')
        .select('applied_on, status')
        .gte('applied_on', startDate.toISOString());

      if (error) throw error;

      // Group by month
      const monthMap = new Map<string, { approved: number; rejected: number; pending: number }>();
      
      data.forEach((leave: any) => {
        const date = new Date(leave.applied_on);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const stats = monthMap.get(monthKey) || { approved: 0, rejected: 0, pending: 0 };
        if (leave.status === 'approved') stats.approved++;
        else if (leave.status === 'rejected') stats.rejected++;
        else if (leave.status === 'pending') stats.pending++;
        
        monthMap.set(monthKey, stats);
      });

      const trends: TrendData[] = Array.from(monthMap.entries())
        .map(([period, stats]) => ({
          period,
          approved: stats.approved,
          rejected: stats.rejected,
          pending: stats.pending,
          total: stats.approved + stats.rejected + stats.pending
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      return trends;
    } catch (error) {
      console.error('Error fetching leave trends:', error);
      return [];
    }
  },

  getLeaveTypeDistribution: async (): Promise<LeaveTypeDistribution[]> => {
    try {
      const { data, error } = await supabase
        .from('leave_applications')
        .select('leave_type');

      if (error) throw error;

      const typeMap = new Map<string, number>();
      let total = 0;

      data.forEach((leave: any) => {
        const type = leave.leave_type || 'Other';
        typeMap.set(type, (typeMap.get(type) || 0) + 1);
        total++;
      });

      return Array.from(typeMap.entries())
        .map(([type, count]) => ({
          type,
          count,
          percentage: Math.round((count / total) * 100)
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error fetching leave type distribution:', error);
      return [];
    }
  },

  getStudentLeavePatterns: async (): Promise<StudentLeavePattern[]> => {
    try {
      const { data, error } = await supabase
        .from('leave_applications')
        .select('*');

      if (error) throw error;

      const studentMap = new Map<string, {
        name: string;
        leaves: any[];
      }>();

      data.forEach((leave: any) => {
        const existing = studentMap.get(leave.student_id);
        if (existing) {
          existing.leaves.push(leave);
        } else {
          studentMap.set(leave.student_id, {
            name: leave.student_name,
            leaves: [leave]
          });
        }
      });

      const patterns: StudentLeavePattern[] = Array.from(studentMap.entries())
        .map(([studentId, { name, leaves }]) => {
          const totalLeaves = leaves.length;
          const approvedCount = leaves.filter(l => l.status === 'approved').length;
          const emergencyCount = leaves.filter(l => l.is_emergency).length;
          
          const totalDuration = leaves.reduce((sum, leave) => {
            const start = new Date(leave.start_date);
            const end = new Date(leave.end_date);
            const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return sum + duration;
          }, 0);

          return {
            studentId,
            studentName: name,
            totalLeaves,
            approvedRate: totalLeaves > 0 ? Math.round((approvedCount / totalLeaves) * 100) : 0,
            averageDuration: totalLeaves > 0 ? Math.round(totalDuration / totalLeaves) : 0,
            emergencyCount
          };
        })
        .sort((a, b) => b.totalLeaves - a.totalLeaves);

      return patterns;
    } catch (error) {
      console.error('Error fetching student patterns:', error);
      return [];
    }
  },

  refreshAnalytics: async (): Promise<void> => {
    try {
      // Refresh analytics view using explicit any to bypass type checking
      const { error } = await (supabase as any).rpc('refresh_leave_analytics');
      if (error) throw error;
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    }
  }
};
