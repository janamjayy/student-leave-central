
import Layout from "@/components/layout/Layout";
import UserManagement from "@/components/admin/UserManagement";
import RoleBasedRoute from "@/components/common/RoleBasedRoute";

const AdminUsersPage = () => {
  return (
    <Layout>
      <RoleBasedRoute allowedRoles={['superadmin']}>
        <h1 className="text-2xl font-bold mb-6">User Management</h1>
        <UserManagement />
      </RoleBasedRoute>
    </Layout>
  );
};

export default AdminUsersPage;
