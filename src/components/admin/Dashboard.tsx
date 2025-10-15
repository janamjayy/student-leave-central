import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, BarChart3, FileCheck } from "lucide-react";
import UserManagement from "./UserManagement";
import LeaveManagement from "./LeaveManagement";
import ReportsAnalytics from "./ReportsAnalytics";
import AuditLogs from "./AuditLogs";

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Manage users, leave applications, and monitor institutional compliance
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="leaves" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Leave Management
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports & Analytics
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="leaves" className="mt-6">
          <LeaveManagement />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <ReportsAnalytics />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AuditLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
