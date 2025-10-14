
import { Calendar } from "lucide-react";
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

interface LeavesTableProps {
  leaves: LeaveApplication[];
  formatDate: (dateString: string) => string;
}

const LeavesTable = ({ leaves, formatDate }: LeavesTableProps) => {
  const { isAdmin, isFaculty } = useAuth();
  const showStudentInfo = isAdmin() || isFaculty();

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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeavesTable;
