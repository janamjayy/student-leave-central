
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeProvider";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ApplyLeave from "./pages/ApplyLeave";
import MyLeaves from "./pages/MyLeaves";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLeaves from "./pages/admin/Leaves";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ 
  children, 
  allowedRoles = ['student', 'admin'], 
  redirectPath = '/login' 
}: { 
  children: React.ReactNode, 
  allowedRoles?: ('student' | 'admin')[], 
  redirectPath?: string 
}) => {
  const { user, loading } = useAuth();
  
  // Show loading or redirect if not authenticated or not authorized
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectPath} replace />;
  }
  
  return <>{children}</>;
};

// Admin only route
const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>
);

// Student only route
const StudentRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={['student']}>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Protected Student Routes */}
              <Route path="/apply-leave" element={
                <StudentRoute>
                  <ApplyLeave />
                </StudentRoute>
              } />
              <Route path="/my-leaves" element={
                <StudentRoute>
                  <MyLeaves />
                </StudentRoute>
              } />
              
              {/* Protected Admin Routes */}
              <Route path="/admin/dashboard" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="/admin/leaves" element={
                <AdminRoute>
                  <AdminLeaves />
                </AdminRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
