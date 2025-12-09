
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { DashboardStats } from "@/hooks/useAdminDashboard";

interface DashboardChartsProps {
  stats: DashboardStats;
  loading: boolean;
}

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#8b5cf6'];

const DashboardCharts = ({ stats, loading }: DashboardChartsProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-[400px] bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="monthly" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
        <TabsTrigger value="status">Status Breakdown</TabsTrigger>
        <TabsTrigger value="types">Leave Types</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="monthly">
        <Card>
          <CardHeader>
            <CardTitle>Leave Applications by Month</CardTitle>
            <CardDescription>
              Application trends over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="status">
        <Card>
          <CardHeader>
            <CardTitle>Application Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of leave applications by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {stats.statusData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{item.value}</div>
                      <div className="text-sm text-muted-foreground">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="types">
        <Card>
          <CardHeader>
            <CardTitle>Leave Types Distribution</CardTitle>
            <CardDescription>
              Most common types of leave applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.typeData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--accent))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="analytics">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Peak Application Period</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {stats.monthlyData.length > 0 
                    ? stats.monthlyData.reduce((max, month) => month.value > max.value ? month : max).name
                    : 'No data available'
                  }
                </p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <h4 className="font-semibold text-green-900 dark:text-green-100">Most Common Leave Type</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {stats.typeData.length > 0 
                    ? stats.typeData.reduce((max, type) => type.value > max.value ? type : max).name
                    : 'No data available'
                  }
                </p>
              </div>
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">Processing Efficiency</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {stats.totalLeaves > 0 
                    ? `${Math.round(((stats.approvedLeaves + stats.rejectedLeaves) / stats.totalLeaves) * 100)}% processed`
                    : 'No applications yet'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest leave applications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {stats.recentLeaves.slice(0, 5).map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{leave.student?.full_name || 'Unknown Student'}</p>
                      <p className="text-sm text-muted-foreground">{leave.leave_type}</p>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                        leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {leave.status}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(leave.applied_on).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {stats.recentLeaves.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No recent applications</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default DashboardCharts;
