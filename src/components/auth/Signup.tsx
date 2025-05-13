
import Layout from "@/components/layout/Layout";
import AuthForm from "./AuthForm";

const Signup = () => {
  return (
    <div className="container mx-auto py-10">
      <AuthForm mode="signup" />
    </div>
  );
};

export default Signup;
