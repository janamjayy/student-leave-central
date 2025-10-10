import { supabase } from "@/integrations/supabase/client";
import { LeaveApplication } from "./supabaseService";

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  studentId?: string;
  department?: string;
  leaveType?: string;
  status?: string;
}

export interface LeaveReport {
  totalLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  pendingLeaves: number;
  averageDuration: number;
  emergencyLeaves: number;
  leavesByType: { type: string; count: number }[];
  leavesByMonth: { month: string; count: number }[];
  topStudents: { studentName: string; studentId: string; count: number }[];
}

export const reportingService = {
  generateReport: async (filters: ReportFilters): Promise<LeaveReport> => {
    try {
      let query = supabase
        .from('leave_applications')
        .select('*');

      if (filters.startDate) {
        query = query.gte('applied_on', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('applied_on', filters.endDate);
      }
      if (filters.studentId) {
        query = query.eq('student_id', filters.studentId);
      }
      if (filters.leaveType) {
        query = query.eq('leave_type', filters.leaveType);
      }
      if (filters.status) {
        query = query.eq('status', filters.status as any);
      }

      const { data: leaves, error } = await query;

      if (error) throw error;

      const typedLeaves = leaves as LeaveApplication[];

      // Calculate statistics
      const totalLeaves = typedLeaves.length;
      const approvedLeaves = typedLeaves.filter((l: any) => l.status === 'approved').length;
      const rejectedLeaves = typedLeaves.filter(l => l.status === 'rejected').length;
      const pendingLeaves = typedLeaves.filter(l => l.status === 'pending').length;
      const emergencyLeaves = typedLeaves.filter(l => l.is_emergency).length;

      // Calculate average duration
      const totalDuration = typedLeaves.reduce((sum, leave) => {
        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return sum + duration;
      }, 0);
      const averageDuration = totalLeaves > 0 ? Math.round(totalDuration / totalLeaves) : 0;

      // Group by type
      const typeMap = new Map<string, number>();
      typedLeaves.forEach(leave => {
        const type = leave.leave_type || 'Other';
        typeMap.set(type, (typeMap.get(type) || 0) + 1);
      });
      const leavesByType = Array.from(typeMap.entries()).map(([type, count]) => ({
        type,
        count
      }));

      // Group by month
      const monthMap = new Map<string, number>();
      typedLeaves.forEach(leave => {
        const date = new Date(leave.applied_on);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
      });
      const leavesByMonth = Array.from(monthMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Top students
      const studentMap = new Map<string, { name: string; count: number }>();
      typedLeaves.forEach(leave => {
        const id = leave.student_id;
        const existing = studentMap.get(id);
        if (existing) {
          existing.count++;
        } else {
          studentMap.set(id, { name: leave.student_name, count: 1 });
        }
      });
      const topStudents = Array.from(studentMap.entries())
        .map(([studentId, { name, count }]) => ({
          studentId,
          studentName: name,
          count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalLeaves,
        approvedLeaves,
        rejectedLeaves,
        pendingLeaves,
        averageDuration,
        emergencyLeaves,
        leavesByType,
        leavesByMonth,
        topStudents
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  exportToCSV: (leaves: LeaveApplication[], filename: string = 'leave_report.csv') => {
    const headers = [
      'Student ID',
      'Student Name',
      'Leave Type',
      'Start Date',
      'End Date',
      'Duration (days)',
      'Status',
      'Emergency',
      'Applied On',
      'Reason'
    ];

    const rows = leaves.map(leave => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      return [
        leave.student_id,
        leave.student_name,
        leave.leave_type,
        leave.start_date,
        leave.end_date,
        duration.toString(),
        leave.status,
        leave.is_emergency ? 'Yes' : 'No',
        new Date(leave.applied_on).toLocaleDateString(),
        leave.reason.replace(/,/g, ';') // Replace commas to avoid CSV issues
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
};
