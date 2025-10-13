import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { User, GraduationCap, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppRole } from "@/services/roleService";

type LoginTab = 'student' | 'faculty' | 'superadmin';

export const LoginTabs = () => {
  const [tab, setTab] = useState<LoginTab>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, userRole, refreshRole } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (newTab: string) => {
    setTab(newTab as LoginTab);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Perform login
      await login(email, password);
      
      // Wait for role to be fetched
      await refreshRole();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect based on role
      if (tab === 'superadmin' && userRole !== 'superadmin') {
        setError("Access denied. Superadmin credentials required.");
        setIsLoading(false);
        return;
      }
      
      if (tab === 'faculty' && userRole !== 'faculty' && userRole !== 'superadmin') {
        setError("Access denied. Faculty credentials required.");
        setIsLoading(false);
        return;
      }

      // Navigate based on role
      if (userRole === 'superadmin') {
        navigate("/admin/dashboard");
      } else if (userRole === 'faculty') {
        navigate("/admin/leaves");
      } else {
        navigate("/my-leaves");
      }
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTabConfig = (tabType: LoginTab) => {
    const configs = {
      student: {
        icon: User,
        label: "Student",
        placeholder: "student@university.edu",
        buttonText: "Login as Student"
      },
      faculty: {
        icon: GraduationCap,
        label: "Faculty",
        placeholder: "faculty@university.edu",
        buttonText: "Login as Faculty"
      },
      superadmin: {
        icon: ShieldCheck,
        label: "Superadmin",
        placeholder: "admin@university.edu",
        buttonText: "Login as Superadmin"
      }
    };
    return configs[tabType];
  };

  const renderTabContent = (tabType: LoginTab) => {
    const config = getTabConfig(tabType);
    const Icon = config.icon;

    return (
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor={`${tabType}-email`}>Email</Label>
          <Input
            id={`${tabType}-email`}
            placeholder={config.placeholder}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${tabType}-password`}>Password</Label>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
          <Input
            id={`${tabType}-password`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center space-x-2 my-4">
          <Checkbox 
            id={`${tabType}-remember`}
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            disabled={isLoading}
          />
          <label
            htmlFor={`${tabType}-remember`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Remember me
          </label>
        </div>
        <Button 
          type="submit" 
          className="w-full flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
          <span>{config.buttonText}</span>
        </Button>
      </form>
    );
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="student" className="flex items-center gap-1.5">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Student</span>
        </TabsTrigger>
        <TabsTrigger value="faculty" className="flex items-center gap-1.5">
          <GraduationCap className="h-4 w-4" />
          <span className="hidden sm:inline">Faculty</span>
        </TabsTrigger>
        <TabsTrigger value="superadmin" className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4" />
          <span className="hidden sm:inline">Admin</span>
        </TabsTrigger>
      </TabsList>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <TabsContent value="student">{renderTabContent('student')}</TabsContent>
      <TabsContent value="faculty">{renderTabContent('faculty')}</TabsContent>
      <TabsContent value="superadmin">{renderTabContent('superadmin')}</TabsContent>
    </Tabs>
  );
};
