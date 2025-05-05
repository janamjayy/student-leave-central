
import Layout from "@/components/layout/Layout";
import LeaveManagement from "@/components/admin/LeaveManagement";

const AdminLeavesPage = () => {
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Manage Leave Applications</h1>
      <LeaveManagement />
    </Layout>
  );
};

export default AdminLeavesPage;
