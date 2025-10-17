import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { GraduationCap, Users, Shield } from "lucide-react";
import { AppRole } from "@/services/roleService";
import { useAdmin } from "@/context/AdminContext";
import { adminService } from "@/services/adminService";
import { supabase } from "@/integrations/supabase/client";

export const RoleBasedLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { setAdmin } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>('student');

  const handleLogin = async (e: React.FormEvent, roleType: AppRole) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (roleType === "admin") {
        // Use adminService for admin login
        console.log("[RoleBasedLogin] Starting admin login");
        const { admin, error: adminError } = await adminService.login(email, password);
        if (adminError) {
          setError(adminError);
          setLoading(false);
          return;
        }
        if (!admin) {
          setError("Invalid admin credentials.");
          setLoading(false);
          return;
        }
        // Store admin in context
        console.log("[RoleBasedLogin] Setting admin in context:", admin);
        setAdmin(admin);

        // Optionally establish a Supabase auth session if explicitly enabled
        // Set VITE_ADMIN_SUPABASE_LOGIN=true in your env to enable.
        const shouldSupabaseAdminSignIn = `${import.meta.env.VITE_ADMIN_SUPABASE_LOGIN}` === 'true';
        if (shouldSupabaseAdminSignIn) {
          try {
            const { error: sbError } = await supabase.auth.signInWithPassword({ email, password });
            if (sbError) {
              console.warn("[RoleBasedLogin] Supabase admin sign-in failed:", sbError.message);
            } else {
              console.log("[RoleBasedLogin] Supabase session established for admin");
            }
          } catch (e) {
            console.warn("[RoleBasedLogin] Supabase admin sign-in threw:", e);
          }
        }
        console.log("[RoleBasedLogin] Navigating to /admin/dashboard");
        navigate("/admin/dashboard");
        setLoading(false);
        return;
      }
      await login(email, password, roleType);
      switch (roleType) {
        case 'faculty':
          navigate('/faculty/dashboard');
          break;
        case 'student':
          navigate('/my-leaves');
          break;
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = (roleType: AppRole, icon: React.ReactNode, title: string, description: string) => (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-2xl">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => handleLogin(e, roleType)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor={`email-${roleType}`}>Email</Label>
            <Input
              id={`email-${roleType}`}
              type="email"
              placeholder={`${roleType}@university.edu`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`password-${roleType}`}>Password</Label>
            <Input
              id={`password-${roleType}`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : `Sign in as ${title}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Leave Management System</h1>
        <p className="text-muted-foreground">Choose your portal to sign in</p>
      </div>

      <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="student">
            <GraduationCap className="h-4 w-4 mr-2" />
            Student
          </TabsTrigger>
          <TabsTrigger value="faculty">
            <Users className="h-4 w-4 mr-2" />
            Faculty
          </TabsTrigger>
          <TabsTrigger value="admin">
            <Shield className="h-4 w-4 mr-2" />
            Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="student" className="mt-6">
          {renderLoginForm(
            'student',
            <GraduationCap className="h-6 w-6 text-primary" />,
            'Student Portal',
            'Access your leave applications and academic records'
          )}
        </TabsContent>

        <TabsContent value="faculty" className="mt-6">
          {renderLoginForm(
            'faculty',
            <Users className="h-6 w-6 text-primary" />,
            'Faculty Portal',
            'Manage student leave requests and apply for your own leave'
          )}
        </TabsContent>

        <TabsContent value="admin" className="mt-6">
          {renderLoginForm(
            'admin',
            <Shield className="h-6 w-6 text-primary" />,
            'Admin Portal',
            'Full system access and user management'
          )}
        </TabsContent>
      </Tabs>

      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Button variant="link" className="p-0" onClick={() => navigate('/signup')}>
            Sign up as Student
          </Button>
        </p>
      </div>
    </div>
  );
};
