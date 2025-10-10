import Layout from "@/components/layout/Layout";
import RoleBasedRoute from "@/components/common/RoleBasedRoute";
import PolicyManagement from "@/components/admin/PolicyManagement";

const AdminPoliciesPage = () => {
  return (
    <Layout>
      <RoleBasedRoute allowedRoles={['admin']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Leave Policies</h1>
            <p className="text-muted-foreground">
              Configure and manage leave policies and enforcement rules
            </p>
          </div>
          
          <PolicyManagement />
        </div>
      </RoleBasedRoute>
    </Layout>
  );
};

export default AdminPoliciesPage;
