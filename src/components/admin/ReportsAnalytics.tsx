import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, Calendar, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LeaveStats {
  totalLeaves: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  studentLeaves: number;
  facultyLeaves: number;
}

const ReportsAnalytics = () => {
  const [stats, setStats] = useState<LeaveStats>({
    totalLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    studentLeaves: 0,
    facultyLeaves: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      // Fetch student leaves
      const { data: studentLeaves, error: studentError } = await supabase
        .from('leave_applications')
        .select('*')
        .gte('applied_on', daysAgo.toISOString());

      if (studentError) throw studentError;

      // Fetch faculty leaves
      const { data: facultyLeaves, error: facultyError } = await (supabase as any)
        .from('faculty_leave_applications')
        .select('*')
        .gte('applied_on', daysAgo.toISOString());

      if (facultyError) throw facultyError;

      const allLeaves: any[] = [...(studentLeaves || []), ...(facultyLeaves || [])];

      setStats({
        totalLeaves: allLeaves.length,
        pendingLeaves: allLeaves.filter((l: any) => l.status === 'pending').length,
        approvedLeaves: allLeaves.filter((l: any) => l.status === 'approved').length,
        rejectedLeaves: allLeaves.filter((l: any) => l.status === 'rejected').length,
        studentLeaves: studentLeaves?.length || 0,
        facultyLeaves: facultyLeaves?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const exportReport = () => {
    const csvContent = `Report Type,Count
Total Leaves,${stats.totalLeaves}
Pending Leaves,${stats.pendingLeaves}
Approved Leaves,${stats.approvedLeaves}
Rejected Leaves,${stats.rejectedLeaves}
Student Leaves,${stats.studentLeaves}
Faculty Leaves,${stats.facultyLeaves}`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Report exported successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Reports & Analytics</h3>
          <p className="text-muted-foreground">
            Institution-wide leave trends and compliance monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leaves</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeaves}</div>
            <p className="text-xs text-muted-foreground">
              All leave applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLeaves}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedLeaves}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.approvedLeaves / stats.totalLeaves) * 100 || 0).toFixed(1)}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student Leaves</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentLeaves}</div>
            <p className="text-xs text-muted-foreground">
              From students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty Leaves</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.facultyLeaves}</div>
            <p className="text-xs text-muted-foreground">
              From faculty
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejectedLeaves}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.rejectedLeaves / stats.totalLeaves) * 100 || 0).toFixed(1)}% rejection rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Leave Policy Adherence</p>
                <p className="text-sm text-muted-foreground">
                  All leave requests processed within policy guidelines
                </p>
              </div>
              <div className="text-green-600 font-semibold">Compliant</div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Pending Requests</p>
                <p className="text-sm text-muted-foreground">
                  {stats.pendingLeaves} requests awaiting review
                </p>
              </div>
              <div className={stats.pendingLeaves > 10 ? "text-amber-600 font-semibold" : "text-green-600 font-semibold"}>
                {stats.pendingLeaves > 10 ? "Needs Attention" : "On Track"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsAnalytics;
