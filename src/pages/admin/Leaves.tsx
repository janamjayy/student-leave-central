import Layout from "@/components/layout/Layout";
import LeaveManagement from "@/components/admin/LeaveManagement";
import RoleBasedRoute from "@/components/common/RoleBasedRoute";
import BulkOperations from "@/components/admin/BulkOperations";
import { useLeaveHistory } from "@/hooks/useLeaveHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminLeavesPage = () => {
  const { leaves, refreshLeaves } = useLeaveHistory();
  
  return (
    <Layout>
      <RoleBasedRoute allowedRoles={['admin', 'faculty']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Leave Management</h1>
            <p className="text-muted-foreground">
              Review and manage student leave applications
            </p>
          </div>

          <Tabs defaultValue="review" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="review">Review Leaves</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="review" className="mt-6">
              <LeaveManagement />
            </TabsContent>
            
            <TabsContent value="bulk" className="mt-6">
              <BulkOperations leaves={leaves} onComplete={refreshLeaves} />
            </TabsContent>
          </Tabs>
        </div>
      </RoleBasedRoute>
    </Layout>
  );
};

export default AdminLeavesPage;
