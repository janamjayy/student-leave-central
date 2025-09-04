import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX } from "lucide-react";

interface AdminRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const AdminRoute = ({ children, fallback }: AdminRouteProps) => {
  const { isAdminAuthenticated } = useAdmin();

  if (!isAdminAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;