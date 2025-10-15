
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, User, GraduationCap, RefreshCw } from "lucide-react";
import { supabaseService, UserProfile } from "@/services/supabaseService";
import { toast } from "sonner";

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await supabaseService.getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleUpdate = async (userId: string, newRole: 'faculty' | 'student') => {
    try {
      setUpdating(userId);
      const { success, error } = await supabaseService.updateUserRole(userId, newRole);
      
      if (success) {
        toast.success(`User role updated to ${newRole}`);
        // Update the local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
      } else {
        toast.error(error || "Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("An error occurred while updating the role");
    } finally {
      setUpdating(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'faculty':
        return <GraduationCap className="h-4 w-4" />;
      case 'student':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'faculty':
        return 'default';
      case 'student':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Manage user roles and permissions. Only faculty and student roles can be modified.
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Admin roles cannot be modified through this interface for security reasons.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            All Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.student_id || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit">
                      {getRoleIcon(user.role)}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Badge variant="outline">Protected</Badge>
                    ) : (
                      <Select
                        value={user.role}
                        onValueChange={(newRole: 'faculty' | 'student') => handleRoleUpdate(user.id, newRole)}
                        disabled={updating === user.id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="faculty">Faculty</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {updating === user.id && (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
