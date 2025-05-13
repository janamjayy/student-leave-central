import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="w-full border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-primary">
              LeavePortal
            </Link>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <>
                    <Link to="/admin/dashboard" className="text-sm font-medium px-2 py-1 rounded-md hover:bg-accent">
                      Dashboard
                    </Link>
                    <Link to="/admin/leaves" className="text-sm font-medium px-2 py-1 rounded-md hover:bg-accent">
                      Manage Leaves
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/apply-leave" className="text-sm font-medium px-2 py-1 rounded-md hover:bg-accent">
                      Apply Leave
                    </Link>
                    <Link to="/my-leaves" className="text-sm font-medium px-2 py-1 rounded-md hover:bg-accent">
                      My Leaves
                    </Link>
                  </>
                )}
                <button
                  onClick={logout}
                  className="text-sm font-medium px-2 py-1 rounded-md hover:bg-accent"
                >
                  Logout
                </button>
                <div className="text-sm font-medium">
                  {user.name} ({user.role})
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium px-2 py-1 rounded-md hover:bg-accent">
                  Login
                </Link>
                <Link to="/signup" className="text-sm font-medium px-2 py-1 rounded-md hover:bg-accent">
                  Sign up
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>
          
          <div className="flex sm:hidden">
            <ThemeToggle />
            {/* Mobile menu button */}
            <button
              type="button"
              className="-mr-2 flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Heroicon name: outline/menu */}
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
