import Layout from "@/components/layout/Layout";
import AdminDashboard from "@/components/admin/Dashboard";
import RoleBasedRoute from "@/components/common/RoleBasedRoute";

const AdminDashboardPage = () => {
  return (
    <Layout>
      <RoleBasedRoute allowedRoles={['admin']}>
        <AdminDashboard />
      </RoleBasedRoute>
    </Layout>
  );
};

export default AdminDashboardPage;
