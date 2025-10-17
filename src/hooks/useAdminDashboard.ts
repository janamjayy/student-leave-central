
import { useState, useEffect } from "react";
import { supabaseService, LeaveApplication } from "@/services/supabaseService";
import { facultyLeaveService, FacultyLeaveApplication } from "@/services/facultyLeaveService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DashboardStats {
  totalLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  pendingLeaves: number;
  monthlyData: Array<{ name: string; value: number }>;
  statusData: Array<{ name: string; value: number; percentage: number }>;
  typeData: Array<{ name: string; value: number }>;
  recentLeaves: LeaveApplication[];
}

export const useAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    pendingLeaves: 0,
    monthlyData: [],
    statusData: [],
    typeData: [],
    recentLeaves: []
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [studentLeaves, facultyLeaves] = await Promise.all([
        supabaseService.getAllLeaves(),
        facultyLeaveService.getAllFacultyLeaves()
      ]);
      
      // Calculate basic stats
  const combined = [...studentLeaves, ...facultyLeaves] as Array<LeaveApplication | FacultyLeaveApplication>;
  const totalLeaves = combined.length;
  const approvedLeaves = combined.filter(leave => leave.status === 'approved').length;
  const rejectedLeaves = combined.filter(leave => leave.status === 'rejected').length;
  const pendingLeaves = combined.filter(leave => leave.status === 'pending').length;
      
      // Generate monthly data (last 6 months)
  const monthlyData = generateMonthlyData(combined as any);
      
      // Generate status breakdown with percentages
      const statusData = [
        { 
          name: 'Approved', 
          value: approvedLeaves, 
          percentage: totalLeaves > 0 ? Math.round((approvedLeaves / totalLeaves) * 100) : 0 
        },
        { 
          name: 'Pending', 
          value: pendingLeaves, 
          percentage: totalLeaves > 0 ? Math.round((pendingLeaves / totalLeaves) * 100) : 0 
        },
        { 
          name: 'Rejected', 
          value: rejectedLeaves, 
          percentage: totalLeaves > 0 ? Math.round((rejectedLeaves / totalLeaves) * 100) : 0 
        }
      ];
      
      // Generate leave type data
  const typeData = generateLeaveTypeData(combined as any);
      
      // Get recent leaves (last 10)
  const recentLeaves = (studentLeaves as LeaveApplication[]).slice(0, 10);
      
      setStats({
        totalLeaves,
        approvedLeaves,
        rejectedLeaves,
        pendingLeaves,
        monthlyData,
        statusData,
        typeData,
        recentLeaves
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = (leaves: Array<{ applied_on: string }>) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const monthlyCount: { [key: string]: number } = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      monthlyCount[monthKey] = 0;
    }
    
    // Count leaves by month
    leaves.forEach(leave => {
      const leaveDate = new Date(leave.applied_on);
      const monthKey = `${months[leaveDate.getMonth()]} ${leaveDate.getFullYear()}`;
      if (monthlyCount.hasOwnProperty(monthKey)) {
        monthlyCount[monthKey]++;
      }
    });
    
    return Object.entries(monthlyCount).map(([name, value]) => ({ name, value }));
  };

  const generateLeaveTypeData = (leaves: Array<{ leave_type: string }>) => {
    const typeCount: { [key: string]: number } = {};
    
    leaves.forEach(leave => {
      const type = leave.leave_type || 'Other';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    return Object.entries(typeCount).map(([name, value]) => ({ name, value }));
  };

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to real-time updates for student and faculty leave applications
    const channel = supabase
      .channel('admin-dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leave_applications'
        },
        () => {
          console.log('Leave application changed, refreshing dashboard...');
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'faculty_leave_applications'
        },
        () => {
          console.log('Faculty leave changed, refreshing dashboard...');
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    stats,
    loading,
    refreshData
  };
};
