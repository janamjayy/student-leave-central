
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogIn } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // This will be replaced with actual auth state
  const [isAdmin, setIsAdmin] = useState(false); // This will be replaced with actual role check

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navItems = [
    { name: "Home", path: "/" },
    ...(isLoggedIn && !isAdmin ? [{ name: "Apply Leave", path: "/apply-leave" }] : []),
    ...(isLoggedIn && !isAdmin ? [{ name: "My Leaves", path: "/my-leaves" }] : []),
    ...(isLoggedIn && isAdmin ? [{ name: "Dashboard", path: "/admin/dashboard" }] : []),
    ...(isLoggedIn && isAdmin ? [{ name: "Manage Leaves", path: "/admin/leaves" }] : []),
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-primary font-bold text-xl">Student Leave Central</span>
            </Link>
          </div>
          
          <div className="hidden md:ml-6 md:flex md:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="hidden md:flex items-center">
            {!isLoggedIn ? (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="flex items-center gap-1">
                    <LogIn className="h-4 w-4" />
                    <span>Log in</span>
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default" className="ml-2">Sign up</Button>
                </Link>
              </>
            ) : (
              <Link to="/profile">
                <Button variant="ghost" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Button>
              </Link>
            )}
          </div>
          
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            ) : (
              <Link
                to="/profile"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
