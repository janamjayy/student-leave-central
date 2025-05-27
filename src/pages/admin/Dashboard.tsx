
import Layout from "@/components/layout/Layout";
import AdminDashboard from "@/components/admin/Dashboard";
import RoleBasedRoute from "@/components/common/RoleBasedRoute";

const AdminDashboardPage = () => {
  return (
    <Layout>
      <RoleBasedRoute allowedRoles={['admin', 'faculty']}>
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <AdminDashboard />
      </RoleBasedRoute>
    </Layout>
  );
};

export default AdminDashboardPage;
