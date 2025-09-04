
import Layout from "@/components/layout/Layout";
import AdminDashboard from "@/components/admin/Dashboard";

const AdminDashboardPage = () => {
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <AdminDashboard />
    </Layout>
  );
};

export default AdminDashboardPage;
