
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
  // New: per-month type share (raw counts; chart uses 100% stacked mode)
  typeShareSeries: TypeShareRow[];
  typeLegend: string[];
}

interface TypeShareRow {
  name: string;
  // dynamic keys for types and 'Others'
  [key: string]: string | number;
}

export const useAdminDashboard = () => {
  const [audience, setAudience] = useState<'all' | 'student' | 'faculty'>('all');
  const [stats, setStats] = useState<DashboardStats>({
    totalLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    pendingLeaves: 0,
    monthlyData: [],
    statusData: [],
    typeData: [],
    recentLeaves: [],
    typeShareSeries: [],
    typeLegend: []
  });
  const [loading, setLoading] = useState(true);
  const [rawStudent, setRawStudent] = useState<LeaveApplication[]>([]);
  const [rawFaculty, setRawFaculty] = useState<FacultyLeaveApplication[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [studentLeaves, facultyLeaves] = await Promise.all([
        supabaseService.getAllLeaves(),
        facultyLeaveService.getAllFacultyLeaves()
      ]);
      setRawStudent(studentLeaves);
      setRawFaculty(facultyLeaves);
      computeAndSetStats(studentLeaves, facultyLeaves, audience);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const computeAndSetStats = (
    studentLeaves: LeaveApplication[],
    facultyLeaves: FacultyLeaveApplication[],
    audienceSel: 'all' | 'student' | 'faculty'
  ) => {
    try {
      const combined = (
        audienceSel === 'student' ? studentLeaves :
        audienceSel === 'faculty' ? (facultyLeaves as any) :
        [...studentLeaves, ...facultyLeaves]
      ) as Array<LeaveApplication | FacultyLeaveApplication>;
      
      // Calculate basic stats
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
      
    // Generate leave type data (overall counts)
  const typeData = generateLeaveTypeData(combined as any);

    // Generate monthly type share series for last 12 months
  const { series: typeShareSeries, legend: typeLegend } = generateTypeShareSeries(combined as any, 12);
      
      // Get recent leaves (last 10) – show student leaves for now
  const recentLeaves = (studentLeaves as LeaveApplication[]).slice(0, 10);
      
      setStats({
        totalLeaves,
        approvedLeaves,
        rejectedLeaves,
        pendingLeaves,
        monthlyData,
        statusData,
        typeData,
        recentLeaves,
        typeShareSeries,
        typeLegend
      });
    } catch (error) {
      console.error("Error computing dashboard stats:", error);
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
    const typeCount: Record<string, number> = {};
    for (const leave of leaves) {
      const raw = (leave as any)?.leave_type;
      const type = (typeof raw === 'string' && raw.trim().length > 0) ? raw : 'Other';
      const prev = Number(typeCount[type] || 0);
      typeCount[type] = prev + 1;
    }
    const out = Object.entries(typeCount).map(([name, value]) => ({ name, value: Number(value) || 0 }));
    // Sort descending for better visuals
    out.sort((a, b) => b.value - a.value);
    return out;
  };

  const normalizeType = (raw: any): string => {
    if (!raw || typeof raw !== 'string') return 'Other';
    const s = raw.trim();
    if (!s) return 'Other';
    // Simple normalization: title case common variants
    const map: Record<string, string> = {
      'casual': 'Casual Leave',
      'casual leave': 'Casual Leave',
      'sick': 'Sick Leave',
      'sick leave': 'Sick Leave',
      'medical': 'Medical Leave',
      'medical leave': 'Medical Leave',
      'personal': 'Personal Leave',
      'personal leave': 'Personal Leave',
      'emergency': 'Emergency Leave',
      'emergency leave': 'Emergency Leave'
    };
    const key = s.toLowerCase();
    return map[key] || s;
  };

  const generateTypeShareSeries = (leaves: Array<{ leave_type: string; applied_on: string }>, months: number) => {
    // Build list of month keys (MMM YYYY), oldest first
    const monthsArr: string[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthsArr.push(key);
    }
    // Count per month per type
    const perMonth: Record<string, Record<string, number>> = {};
    const typeTotals: Record<string, number> = {};
    for (const m of monthsArr) perMonth[m] = {};
    for (const l of leaves) {
      if (!l?.applied_on) continue;
      const d = new Date(l.applied_on);
      const mk = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!(mk in perMonth)) continue; // out of range
      const t = normalizeType((l as any).leave_type);
      perMonth[mk][t] = (perMonth[mk][t] || 0) + 1;
      typeTotals[t] = (typeTotals[t] || 0) + 1;
    }
    // Pick top 4 types overall, rest grouped as 'Others'
    const topTypes = Object.entries(typeTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([t]) => t);
    const legend = [...topTypes, 'Others'];
    // Build series rows
    const series: TypeShareRow[] = monthsArr.map((mk) => {
      const row: TypeShareRow = { name: mk };
      let others = 0;
      const counts = perMonth[mk] || {};
      for (const [t, c] of Object.entries(counts)) {
  if (topTypes.includes(t)) row[t] = Number(row[t] || 0) + Number(c);
        else others += Number(c);
      }
      if (others > 0) row['Others'] = others;
      // Ensure keys exist so Recharts renders consistent stacks
      for (const t of legend) { if (row[t] == null) row[t] = 0; }
      // Total for labels
      row.total = legend.reduce((acc, t) => acc + Number(row[t] || 0), 0);
      return row;
    });
    return { series, legend };
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

  // Recompute stats whenever audience changes and we have raw data
  useEffect(() => {
    if (rawStudent.length > 0 || rawFaculty.length > 0) {
      computeAndSetStats(rawStudent, rawFaculty, audience);
    }
  }, [audience]);

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    stats,
    loading,
    refreshData,
    audience,
    setAudience
  };
};
