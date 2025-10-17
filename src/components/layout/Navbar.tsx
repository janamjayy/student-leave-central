import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User, BookOpen, CalendarCheck, Users, Shield, BarChart3 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/context/AdminContext";
import NotificationCenter from "@/components/notifications/NotificationCenter";
const Navbar = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const {
    user,
    profile,
    logout,
    isAdmin,
    isFaculty,
    isStudent
  } = useAuth();
  const {
    admin,
    isAdminAuthenticated,
    logout: adminLogout
  } = useAdmin();
  const navigate = useNavigate();
  const handleLogout = async () => {
    if (isAdminAuthenticated) {
      adminLogout();
    } else {
      await logout();
    }
    navigate("/login");
  };

  // Check if any user is authenticated (regular user or admin)
  const isAuthenticated = user || isAdminAuthenticated;
  const currentUser = admin || profile;
  return <header className="bg-card border-b sticky top-0 z-40">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
            <BookOpen className="h-6 w-6" />
            <span className="hidden md:inline-block">LeaveApp</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {isAuthenticated ? <>
              {isStudent() && <>
                  <Link to="/apply-leave" className="text-sm font-medium transition-colors hover:text-foreground/80">
                    Apply Leave
                  </Link>
                  <Link to="/my-leaves" className="text-sm font-medium transition-colors hover:text-foreground/80">
                    My Leaves
                  </Link>
                </>}
              {(isAdmin() || isAdminAuthenticated) && <>
                  <Link to="/admin/dashboard" className="text-sm font-medium transition-colors hover:text-foreground/80">
                    <Shield className="inline h-4 w-4 mr-1" />
                    Dashboard
                  </Link>
                  
                  
                </>}
              {isFaculty() && <>
                  <Link to="/faculty/dashboard" className="text-sm font-medium transition-colors hover:text-foreground/80">
                    Dashboard
                  </Link>
                  <Link to="/faculty/leaves" className="text-sm font-medium transition-colors hover:text-foreground/80">
                    Manage Leaves
                  </Link>
                </>}
              <NotificationCenter />
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {isAdminAuthenticated && <Shield className="h-4 w-4 text-blue-600" />}
                  <span className="text-sm font-medium">
                    {isAdminAuthenticated ? admin?.full_name : profile?.full_name}
                  </span>
                </div>
                <Button variant="outline" size="icon" onClick={handleLogout} className="text-destructive" title="Logout">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </> : <>
              <Link to="/login" className="text-sm font-medium transition-colors hover:text-foreground/80">
                Login
              </Link>
              <Link to="/signup">
                <Button>Sign Up</Button>
              </Link>
              <ThemeToggle />
            </>}
        </nav>

        {/* Mobile Menu */}
        {isMobile && <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && <NotificationCenter />}
            <ThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader className="border-b pb-5 mb-5">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4">
                  {isAuthenticated ? <>
                      <div className="flex items-center space-x-2 mb-4 pb-4 border-b">
                        <div className="flex items-center gap-2">
                          {isAdminAuthenticated && <Shield className="h-5 w-5 text-blue-600" />}
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {isAdminAuthenticated ? admin?.full_name : profile?.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isAdminAuthenticated ? admin?.email : profile?.email}
                          </p>
                          {isAdminAuthenticated && <p className="text-xs text-blue-600 font-medium">Administrator</p>}
                        </div>
                      </div>
                      {isStudent() && <>
                          <SheetClose asChild>
                            <Link to="/apply-leave" className="flex items-center py-2 font-medium transition-colors hover:text-foreground/80" onClick={() => setIsOpen(false)}>
                              <CalendarCheck className="mr-2 h-5 w-5" />
                              Apply for Leave
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/my-leaves" className="flex items-center py-2 font-medium transition-colors hover:text-foreground/80" onClick={() => setIsOpen(false)}>
                              <BookOpen className="mr-2 h-5 w-5" />
                              My Leaves
                            </Link>
                          </SheetClose>
                        </>}
                      {(isAdmin() || isAdminAuthenticated) && <>
                          <SheetClose asChild>
                            <Link to="/admin/dashboard" className="flex items-center py-2 font-medium transition-colors hover:text-foreground/80" onClick={() => setIsOpen(false)}>
                              <Shield className="mr-2 h-5 w-5 text-blue-600" />
                              Admin Dashboard
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/admin/leaves" className="flex items-center py-2 font-medium transition-colors hover:text-foreground/80" onClick={() => setIsOpen(false)}>
                              <CalendarCheck className="mr-2 h-5 w-5" />
                              Manage Leaves
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/admin/users" className="flex items-center py-2 font-medium transition-colors hover:text-foreground/80" onClick={() => setIsOpen(false)}>
                              <Users className="mr-2 h-5 w-5" />
                              User Management
                            </Link>
                          </SheetClose>
                        </>}
                      {isFaculty() && <>
                          <SheetClose asChild>
                            <Link to="/faculty/dashboard" className="flex items-center py-2 font-medium transition-colors hover:text-foreground/80" onClick={() => setIsOpen(false)}>
                              <BookOpen className="mr-2 h-5 w-5" />
                              Dashboard
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link to="/faculty/leaves" className="flex items-center py-2 font-medium transition-colors hover:text-foreground/80" onClick={() => setIsOpen(false)}>
                              <CalendarCheck className="mr-2 h-5 w-5" />
                              Manage Leaves
                            </Link>
                          </SheetClose>
                        </>}
                      <Button variant="destructive" className="mt-4" onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </> : <>
                      <SheetClose asChild>
                        <Link to="/login" className="flex items-center py-2 font-medium transition-colors hover:text-foreground/80" onClick={() => setIsOpen(false)}>
                          <User className="mr-2 h-5 w-5" />
                          Login
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/signup" onClick={() => setIsOpen(false)}>
                          <Button className="w-full">Sign Up</Button>
                        </Link>
                      </SheetClose>
                    </>}
                </div>
              </SheetContent>
            </Sheet>
          </div>}
      </div>
    </header>;
};
export default Navbar;