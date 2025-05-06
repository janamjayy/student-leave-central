
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { User, LogIn, Key } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [rememberMe, setRememberMe] = useState(false);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app with connected database, you would:
    // 1. Validate inputs
    // 2. Make API call to verify credentials
    // 3. Store user session/token in localStorage or cookie
    // 4. Redirect to dashboard
    
    toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} logged in successfully!`);
    
    // Mock authentication for demonstration
    if (rememberMe) {
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userRole", role);
    }
    
    console.log({ email, password, role, rememberMe });
  };

  return (
    <div className="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <Card className="w-full max-w-md mx-auto shadow-lg border-primary/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" onValueChange={setRole} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="student" className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>Student</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-1.5">
                <Key className="h-4 w-4" />
                <span>Admin</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="student">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="student@example.edu"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center space-x-2 my-4">
                  <Checkbox 
                    id="remember-me" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <label
                    htmlFor="remember-me"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </label>
                </div>
                <Button type="submit" className="w-full flex items-center gap-1.5 group">
                  <LogIn className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  <span>Login as Student</span>
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="admin">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    placeholder="admin@school.edu"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="admin-password">Password</Label>
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center space-x-2 my-4">
                  <Checkbox 
                    id="admin-remember-me" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <label
                    htmlFor="admin-remember-me"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </label>
                </div>
                <Button type="submit" className="w-full flex items-center gap-1.5 group">
                  <LogIn className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  <span>Login as Admin</span>
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-500">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
