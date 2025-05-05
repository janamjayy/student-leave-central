
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, MessageSquare, Calendar } from "lucide-react";
import { toast } from "sonner";

// Mock data
const mockPendingLeaves = [
  {
    id: "1",
    student: { id: "S001", name: "Rahul Sharma" },
    startDate: "2025-05-10",
    endDate: "2025-05-12",
    leaveType: "Medical Leave",
    reason: "Doctor's appointment for routine check-up and follow-up consultation.",
    status: "pending",
    appliedOn: "2025-05-01",
  },
  {
    id: "2",
    student: { id: "S002", name: "Priya Patel" },
    startDate: "2025-05-15",
    endDate: "2025-05-18",
    leaveType: "Family Emergency",
    reason: "Need to attend a family function in my hometown.",
    status: "pending",
    appliedOn: "2025-05-05",
  },
  {
    id: "3",
    student: { id: "S003", name: "Amir Khan" },
    startDate: "2025-05-20",
    endDate: "2025-05-22",
    leaveType: "Personal Leave",
    reason: "Need some personal time off for mental well-being.",
    status: "pending",
    appliedOn: "2025-05-08",
  }
];

const LeaveManagement = () => {
  const [pendingLeaves, setPendingLeaves] = useState(mockPendingLeaves);
  const [selectedLeave, setSelectedLeave] = useState<typeof mockPendingLeaves[0] | null>(null);
  const [comment, setComment] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleViewDetails = (leave: typeof mockPendingLeaves[0]) => {
    setSelectedLeave(leave);
    setComment("");
    setOpenDialog(true);
  };

  const handleApproveLeave = () => {
    if (!selectedLeave) return;
    
    // In a real app, this would make an API call
    setPendingLeaves(pendingLeaves.filter(leave => leave.id !== selectedLeave.id));
    toast.success(`Leave application from ${selectedLeave.student.name} has been approved`);
    setOpenDialog(false);
  };

  const handleRejectLeave = () => {
    if (!selectedLeave) return;
    
    // In a real app, this would make an API call
    setPendingLeaves(pendingLeaves.filter(leave => leave.id !== selectedLeave.id));
    toast.success(`Leave application from ${selectedLeave.student.name} has been rejected`);
    setOpenDialog(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredLeaves = pendingLeaves.filter(leave => 
    leave.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    leave.student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    leave.leaveType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Applications</CardTitle>
          <CardDescription>Review and approve student leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by student name, ID or leave type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          {filteredLeaves.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">{leave.student.name}</TableCell>
                      <TableCell>{leave.student.id}</TableCell>
                      <TableCell>{leave.leaveType}</TableCell>
                      <TableCell>{formatDate(leave.startDate)}</TableCell>
                      <TableCell>{formatDate(leave.endDate)}</TableCell>
                      <TableCell>{formatDate(leave.appliedOn)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(leave)}
                          className="flex items-center gap-1"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>Review</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery ? "No matching leave applications found." : "No pending leave applications."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        {selectedLeave && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Leave Application Review</DialogTitle>
              <DialogDescription>
                Application from {selectedLeave.student.name} ({selectedLeave.student.id})
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <div>
                  <Label className="text-sm font-medium">Leave Type</Label>
                  <p className="text-sm">{selectedLeave.leaveType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Applied On</Label>
                  <p className="text-sm">{formatDate(selectedLeave.appliedOn)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 items-center gap-4">
                <div>
                  <Label className="text-sm font-medium">From Date</Label>
                  <p className="text-sm">{formatDate(selectedLeave.startDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">To Date</Label>
                  <p className="text-sm">{formatDate(selectedLeave.endDate)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Reason</Label>
                <p className="text-sm mt-1 p-2 border rounded-md bg-muted">{selectedLeave.reason}</p>
              </div>
              
              <div>
                <Label htmlFor="comment">Comment (Optional)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your comments here..."
                  className="mt-1"
                />
              </div>
            </div>
            
            <DialogFooter className="flex space-x-2 sm:space-x-0">
              <Button
                type="button"
                variant="destructive"
                onClick={handleRejectLeave}
                className="flex items-center gap-1.5"
              >
                <X className="h-4 w-4" />
                <span>Reject</span>
              </Button>
              <Button
                type="button"
                onClick={handleApproveLeave}
                className="flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Approve</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};

export default LeaveManagement;
