import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { analyticsService } from "@/services/analyticsService";
import { Button } from "@/components/ui/button";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const TrendAnalysis = () => {
  const [trends, setTrends] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [trendsData, distributionData, patternsData] = await Promise.all([
        analyticsService.getLeavetrends(6),
        analyticsService.getLeaveTypeDistribution(),
        analyticsService.getStudentLeavePatterns()
      ]);
      
      setTrends(trendsData);
      setDistribution(distributionData);
      setPatterns(patternsData.slice(0, 10)); // Top 10 students
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Leave Trends & Analytics
        </h3>
        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          Refresh Data
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Application Trends (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} name="Approved" />
              <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} name="Rejected" />
              <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pending" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leave Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.type}: ${entry.percentage}%`}
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Students by Leave Count</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={patterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="studentName" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalLeaves" fill="#8884d8" name="Total Leaves" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Leave Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Student Name</th>
                  <th className="text-center p-2">Total Leaves</th>
                  <th className="text-center p-2">Approval Rate</th>
                  <th className="text-center p-2">Avg Duration</th>
                  <th className="text-center p-2">Emergency</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map((pattern) => (
                  <tr key={pattern.studentId} className="border-b hover:bg-muted/50">
                    <td className="p-2">{pattern.studentName}</td>
                    <td className="text-center p-2">{pattern.totalLeaves}</td>
                    <td className="text-center p-2">
                      <span className={pattern.approvedRate >= 70 ? "text-green-600" : pattern.approvedRate >= 50 ? "text-yellow-600" : "text-red-600"}>
                        {pattern.approvedRate}%
                      </span>
                    </td>
                    <td className="text-center p-2">{pattern.averageDuration} days</td>
                    <td className="text-center p-2">{pattern.emergencyCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrendAnalysis;
