
import Layout from "@/components/layout/Layout";
import AuthForm from "./AuthForm";

const Login = () => {
  return (
    <div className="container mx-auto py-10">
      <AuthForm mode="login" />
    </div>
  );
};

export default Login;
