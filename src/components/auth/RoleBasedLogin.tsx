import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { Sun, Moon, Sparkles } from "lucide-react";
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
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [triedBootstrap, setTriedBootstrap] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const buttonLabel = useMemo(() => {
    const roleNames = { student: 'Student', faculty: 'Faculty', admin: 'Admin' };
    return `Sign in as ${roleNames[selectedRole]}`;
  }, [selectedRole]);

  // Helper: fast-fail timeout wrapper to prevent long hanging network calls
  const withTimeout = async <T,>(promise: Promise<T> | PromiseLike<T>, ms = 8000, label = 'request'): Promise<T> => {
    return await Promise.race<T>([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)) as Promise<T>,
    ]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (selectedRole === "admin") {
        // Supabase-native admin login: create a Supabase session and verify profile role
        let authUser = null as null | { id: string };
        try {
          const { data, error: sbError } = await withTimeout<any>(
            supabase.auth.signInWithPassword({ email, password }),
            8000,
            'sign-in'
          );
          if (!sbError && data?.user) authUser = { id: data.user.id };
        } catch (signErr: any) {
          // Ignore here, we’ll try bootstrap flow next
        }

        if (!authUser) {
          // Fallback: If this admin exists in admin_users but not in Auth, bootstrap via Edge Function then retry
          setTriedBootstrap(true);
          try {
            const { data: bootstrapRes, error: bootstrapErr } = await withTimeout<any>(
              supabase.functions.invoke('bootstrap-admin', { body: { email, password } }),
              6000,
              'bootstrap-admin'
            );
            if (bootstrapErr || !bootstrapRes?.success) {
              throw new Error(bootstrapErr?.message || 'Admin bootstrap failed');
            }
          } catch (bootErr: any) {
            setError(
              (bootErr?.message?.includes('timed out')
                ? 'Admin provisioning is not available. Please deploy the bootstrap-admin edge function and try again.'
                : bootErr?.message) ||
                'Admin provisioning failed. Please contact the system administrator.'
            );
            setLoading(false);
            return;
          }
          // Retry sign-in after bootstrap
          try {
            const retry = await withTimeout<any>(
              supabase.auth.signInWithPassword({ email, password }),
              8000,
              'sign-in (retry)'
            );
            if (retry.error || !retry.data?.user) {
              setError(retry.error?.message || "Sign-in failed after provisioning.");
              setLoading(false);
              return;
            }
            authUser = { id: retry.data.user.id };
          } catch (retryErr: any) {
            setError(retryErr?.message || 'Sign-in failed after provisioning.');
            setLoading(false);
            return;
          }
        }
        // Fetch profile and ensure role is admin
        const { data: profData, error: profErr } = await withTimeout<any>(
          supabase
          .from('profiles')
          .select('id, full_name, email, role, created_at')
          .eq('id', (authUser as any).id)
          .maybeSingle(),
          6000,
          'profile fetch'
        );
        if (profErr || !profData) {
          setError("Admin profile not found.");
          setLoading(false);
          return;
        }
        if (profData.role !== 'admin') {
          setError("You are not authorized as an admin.");
          setLoading(false);
          return;
        }
        // Set AdminContext for UI
        setAdmin({
          id: profData.id,
          email: profData.email,
          full_name: profData.full_name,
          created_at: profData.created_at,
          avatar_url: null,
        });
        navigate('/admin/dashboard');
        setLoading(false);
        return;
      }
      await login(email, password, selectedRole);
      switch (selectedRole) {
        case 'faculty':
          navigate('/faculty/dashboard');
          break;
        case 'student':
          navigate('/my-leaves');
          break;
      }
    } catch (err: any) {
      // Common extension noise: suppress unrelated contentScript errors in UI, but unlock the spinner
      const msg = String(err?.message || '')
      if (msg.includes('Receiving end does not exist')) {
        console.debug('Ignored extension contentScript error:', err);
        setError('Login was interrupted by a browser extension. Please retry or disable the extension for this site.');
      } else {
        setError(err.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 text-slate-900 dark:text-slate-100 transition-all duration-500 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-300/30 to-indigo-300/20 dark:from-blue-600/20 dark:to-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-300/30 to-pink-300/20 dark:from-purple-600/20 dark:to-pink-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Header removed as requested */}

      {/* Main Content */}
  <main className="flex items-center justify-center flex-1 px-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700/50">
            
            {/* Logo and Title */}
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                Welcome Back
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sign in to access your dashboard</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Role</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger className="w-full rounded-lg h-11 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-200 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                    <SelectItem value="student" className="rounded">🎓 Student</SelectItem>
                    <SelectItem value="faculty" className="rounded">👨‍🏫 Faculty</SelectItem>
                    <SelectItem value="admin" className="rounded">🛡️ Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label>
                <Input
                  type="email"
                  placeholder="user@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  required
                  disabled={loading}
                  aria-label="Email address"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                  required
                  disabled={loading}
                  aria-label="Password"
                />
              </div>

              {/* Forgot password link */}
              <div className="text-right -mt-1">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline"
                >
                  Forgot your password?
                </Link>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                  aria-label="Sign in"
                >
                  <span className="inline-flex items-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <span className="transition-all duration-300">{buttonLabel}</span>
                    )}
                  </span>
                </Button>
              </div>

              <div className="text-center pt-1">
                <button 
                  type="button" 
                  onClick={() => navigate('/signup')} 
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200"
                >
                  Don't have an account? <span className="underline">Sign up here</span>
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} Leave Management System. All rights reserved.
          </div>
        </div>
      </main>
    </div>
  );
};
