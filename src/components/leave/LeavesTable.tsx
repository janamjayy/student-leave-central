
import { Calendar, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { LeaveApplication } from "@/services/supabaseService";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LeaveStatusBadge from "./LeaveStatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabaseService } from "@/services/supabaseService";
import { toast } from "sonner";

interface LeavesTableProps {
  leaves: LeaveApplication[];
  formatDate: (dateString: string) => string;
  onUpdated?: () => void;
}

const LeavesTable = ({ leaves, formatDate, onUpdated }: LeavesTableProps) => {
  const { isAdmin, isFaculty, user } = useAuth();
  const showStudentInfo = isAdmin() || isFaculty();
  const canAct = isAdmin() || isFaculty();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdate = async (
    leave: LeaveApplication,
    status: "approved" | "rejected"
  ) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }
    try {
      setUpdatingId(leave.id);
      // Update status (comments and remarks optional here)
      const { success, error } = await supabaseService.updateLeaveStatus(
        leave.id,
        status,
        user.id
      );
      if (!success) throw new Error(error || "Failed to update status");
      toast.success(`Leave ${status}`);
      onUpdated && onUpdated();
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${status} leave`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableCaption>List of leave applications</TableCaption>
        <TableHeader>
          <TableRow>
            {showStudentInfo && <TableHead>Student</TableHead>}
            <TableHead>Type</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Application Date</TableHead>
            <TableHead>Status</TableHead>
            {canAct && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaves.map((leave) => (
            <TableRow key={leave.id} className="hover:bg-muted/50">
              {showStudentInfo && (
                <TableCell className="font-medium">
                  {leave.student?.full_name || "Unknown"}
                  {leave.student?.student_id && (
                    <div className="text-xs text-muted-foreground">
                      {leave.student.student_id}
                    </div>
                  )}
                </TableCell>
              )}
              <TableCell className="font-medium">{leave.leave_type}</TableCell>
              <TableCell>{formatDate(leave.start_date)}</TableCell>
              <TableCell>{formatDate(leave.end_date)}</TableCell>
              <TableCell className="text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(leave.applied_on)}</span>
                </div>
              </TableCell>
              <TableCell>
                <LeaveStatusBadge status={leave.status} />
              </TableCell>
              {canAct && (
                <TableCell className="text-right">
                  {leave.status === "pending" ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatingId === leave.id}
                        onClick={() => handleUpdate(leave, "rejected")}
                        className="text-red-600"
                        title="Reject"
                      >
                        {updatingId === leave.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ThumbsDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        disabled={updatingId === leave.id}
                        onClick={() => handleUpdate(leave, "approved")}
                        className="bg-green-600 hover:bg-green-700"
                        title="Approve"
                      >
                        {updatingId === leave.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ThumbsUp className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No actions</span>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeavesTable;
