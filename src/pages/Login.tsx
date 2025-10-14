import Layout from "@/components/layout/Layout";
import { RoleBasedLogin } from "@/components/auth/RoleBasedLogin";

const LoginPage = () => {
  return (
    <Layout>
      <RoleBasedLogin />
    </Layout>
  );
};

export default LoginPage;
