
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import DashboardStatsCards from "./DashboardStats";
import DashboardCharts from "./DashboardCharts";

const AdminDashboard = () => {
  const { stats, loading, refreshData } = useAdminDashboard();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for leave management
          </p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <DashboardStatsCards stats={stats} loading={loading} />
      <DashboardCharts stats={stats} loading={loading} />
    </div>
  );
};

export default AdminDashboard;
