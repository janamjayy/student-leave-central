
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const Index = () => {
  return (
    <Layout>
      <div className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl animate-fade-in">
                Student Leave Management System
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                A simple, efficient way to manage student leave applications and approvals
              </p>
            </div>
            <div className="space-x-4">
              <Link to="/login">
                <Button className="px-8">Login</Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline" className="px-8">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-card">
            <div className="p-3 rounded-full bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold">Students</h3>
            <p className="text-sm text-center text-gray-500">
              Apply for leaves online and track the status of your applications with ease
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-card">
            <div className="p-3 rounded-full bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
            </div>
            <h3 className="text-xl font-bold">Administrators</h3>
            <p className="text-sm text-center text-gray-500">
              Review, approve, or reject leave applications with a comprehensive dashboard
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-card">
            <div className="p-3 rounded-full bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold">Reliable & Secure</h3>
            <p className="text-sm text-center text-gray-500">
              Keep student leave records organized and secure with our digital management system
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
