
import { Calendar } from "lucide-react";
import { LeaveApplication } from "@/services/leaveService";
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

interface LeavesTableProps {
  leaves: LeaveApplication[];
  formatDate: (dateString: string) => string;
}

const LeavesTable = ({ leaves, formatDate }: LeavesTableProps) => {
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableCaption>List of your leave applications</TableCaption>
        <TableHeader>
          <TableRow>
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
              <TableCell className="font-medium">{leave.leaveType}</TableCell>
              <TableCell>{formatDate(leave.startDate)}</TableCell>
              <TableCell>{formatDate(leave.endDate)}</TableCell>
              <TableCell className="text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(leave.appliedOn)}</span>
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
