
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, School, KeyRound } from "lucide-react";
import { toast } from "sonner";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [studentId, setStudentId] = useState("");

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password match
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    
    // In a real application with connected database, you would:
    // 1. Validate all inputs
    // 2. Make API call to register user
    // 3. Store user session/token
    // 4. Redirect to login or dashboard
    
    toast.success("Account created successfully! Please check your email to verify.");
    console.log({ name, email, password, studentId });
  };

  return (
    <div className="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <Card className="w-full max-w-md mx-auto shadow-lg border-primary/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your details below to create your student account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <div className="relative">
                  <School className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="studentId"
                    placeholder="S12345"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  placeholder="student@example.edu"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full flex items-center gap-1.5 mt-6 group hover:scale-[1.02] transition-all"
            >
              <User className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>Create Account</span>
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
