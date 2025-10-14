import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX } from "lucide-react";

interface AdminRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const AdminRoute = ({ children, fallback }: AdminRouteProps) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user || userRole !== 'admin') {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;