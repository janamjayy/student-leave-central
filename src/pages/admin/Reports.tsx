import Layout from "@/components/layout/Layout";
import RoleBasedRoute from "@/components/common/RoleBasedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportGenerator from "@/components/admin/ReportGenerator";
import TrendAnalysis from "@/components/admin/TrendAnalysis";

const AdminReportsPage = () => {
  return (
    <Layout>
      <RoleBasedRoute allowedRoles={['superadmin', 'faculty']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Generate detailed reports and analyze leave trends
            </p>
          </div>

          <Tabs defaultValue="reports" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="reports">Generate Reports</TabsTrigger>
              <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="reports" className="mt-6">
              <ReportGenerator />
            </TabsContent>
            
            <TabsContent value="trends" className="mt-6">
              <TrendAnalysis />
            </TabsContent>
          </Tabs>
        </div>
      </RoleBasedRoute>
    </Layout>
  );
};

export default AdminReportsPage;
