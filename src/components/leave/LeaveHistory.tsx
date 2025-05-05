
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Check, X, MessageSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

// Mock leave data
const mockLeaves = [
  {
    id: "1",
    startDate: "2025-05-10",
    endDate: "2025-05-12", 
    leaveType: "Medical Leave",
    reason: "Doctor's appointment for routine check-up and follow-up consultation.",
    status: "approved",
    appliedOn: "2025-05-01",
    approvedBy: "Dr. Smith",
    comments: "Approved. Please submit medical certificate upon return."
  },
  {
    id: "2",
    startDate: "2025-05-20",
    endDate: "2025-05-20", 
    leaveType: "Family Emergency",
    reason: "Need to attend to a family emergency situation.",
    status: "pending",
    appliedOn: "2025-05-15"
  },
  {
    id: "3",
    startDate: "2025-04-01",
    endDate: "2025-04-05", 
    leaveType: "Personal Leave",
    reason: "Need some personal time off for mental well-being.",
    status: "rejected",
    appliedOn: "2025-03-25",
    comments: "Rejected due to upcoming exams. Please reschedule."
  }
];

interface LeaveHistoryProps {
  studentId?: string; // Optional for filtering by student
}

const LeaveHistory = ({ studentId }: LeaveHistoryProps) => {
  const [selectedLeave, setSelectedLeave] = useState<typeof mockLeaves[0] | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const viewLeaveDetails = (leave: typeof mockLeaves[0]) => {
    setSelectedLeave(leave);
    setOpenDialog(true);
  };

  // In a real app, we would filter by studentId if provided
  const leaves = mockLeaves;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "approved":
        return "status-badge status-approved";
      case "rejected":
        return "status-badge status-rejected";
      default:
        return "status-badge status-pending";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <Check className="h-4 w-4" />;
      case "rejected":
        return <X className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
          <CardDescription>Track the status of all your leave applications</CardDescription>
        </CardHeader>
        <CardContent>
          {leaves.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">{leave.leaveType}</TableCell>
                      <TableCell>{formatDate(leave.startDate)}</TableCell>
                      <TableCell>{formatDate(leave.endDate)}</TableCell>
                      <TableCell>
                        <div className={getStatusBadgeClass(leave.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(leave.status)}
                            <span>{leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(leave.appliedOn)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewLeaveDetails(leave)}
                          className="flex items-center gap-1"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>Details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No leave applications found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        {selectedLeave && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Leave Application Details</DialogTitle>
              <DialogDescription>
                Submitted on {formatDate(selectedLeave.appliedOn)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Status</h4>
                <div className={`${getStatusBadgeClass(selectedLeave.status)} inline-flex mt-1`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(selectedLeave.status)}
                    <span>{selectedLeave.status.charAt(0).toUpperCase() + selectedLeave.status.slice(1)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Leave Type</h4>
                <p className="text-sm">{selectedLeave.leaveType}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Duration</h4>
                <p className="text-sm">
                  {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Reason</h4>
                <p className="text-sm">{selectedLeave.reason}</p>
              </div>
              
              {selectedLeave.approvedBy && (
                <div>
                  <h4 className="text-sm font-medium">Approved By</h4>
                  <p className="text-sm">{selectedLeave.approvedBy}</p>
                </div>
              )}
              
              {selectedLeave.comments && (
                <div>
                  <h4 className="text-sm font-medium">Comments</h4>
                  <p className="text-sm">{selectedLeave.comments}</p>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};

export default LeaveHistory;
