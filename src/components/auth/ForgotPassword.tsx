
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real application with connected database, you would:
    // 1. Validate the email
    // 2. Make API call to send reset email
    
    toast.success("Password reset link sent to your email!");
    setIsSubmitted(true);
  };

  return (
    <div className="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <Card className="w-full max-w-md mx-auto shadow-lg border-primary/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            {!isSubmitted ? 
              "Enter your email and we'll send you a link to reset your password" :
              "Check your email for a link to reset your password"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    placeholder="Your registered email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full mt-6 group hover:scale-[1.02] transition-all"
              >
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-muted-foreground">
                We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
              </p>
              <Button 
                onClick={() => setIsSubmitted(false)} 
                variant="outline" 
                className="mt-4"
              >
                Resend Email
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center">
            <Link to="/login" className="text-primary hover:underline font-medium flex items-center justify-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to login</span>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
