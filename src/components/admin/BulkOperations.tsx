import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { LeaveApplication } from "@/services/supabaseService";
import { bulkOperationsService } from "@/services/bulkOperationsService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface BulkOperationsProps {
  leaves: LeaveApplication[];
  onComplete: () => void;
}

const BulkOperations = ({ leaves, onComplete }: BulkOperationsProps) => {
  const { user } = useAuth();
  const [selectedLeaves, setSelectedLeaves] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeaves(new Set(leaves.map(l => l.id)));
    } else {
      setSelectedLeaves(new Set());
    }
  };

  const handleSelectLeave = (leaveId: string, checked: boolean) => {
    const newSelected = new Set(selectedLeaves);
    if (checked) {
      newSelected.add(leaveId);
    } else {
      newSelected.delete(leaveId);
    }
    setSelectedLeaves(newSelected);
  };

  const handleBulkApprove = async () => {
    if (selectedLeaves.size === 0) {
      toast.error("Please select at least one leave to approve");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to perform this action");
      return;
    }

    setLoading(true);
    try {
      const result = await bulkOperationsService.bulkApproveLeaves(
        Array.from(selectedLeaves),
        user.id,
        comments
      );

      if (result.success) {
        toast.success(`Successfully approved ${result.count} leave application(s)`);
        setSelectedLeaves(new Set());
        setComments("");
        onComplete();
      } else {
        toast.error(result.error || "Failed to approve leaves");
      }
    } catch (error) {
      console.error("Error in bulk approve:", error);
      toast.error("An error occurred while approving leaves");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedLeaves.size === 0) {
      toast.error("Please select at least one leave to reject");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to perform this action");
      return;
    }

    if (!comments.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    try {
      const result = await bulkOperationsService.bulkRejectLeaves(
        Array.from(selectedLeaves),
        user.id,
        comments
      );

      if (result.success) {
        toast.success(`Successfully rejected ${result.count} leave application(s)`);
        setSelectedLeaves(new Set());
        setComments("");
        onComplete();
      } else {
        toast.error(result.error || "Failed to reject leaves");
      }
    } catch (error) {
      console.error("Error in bulk reject:", error);
      toast.error("An error occurred while rejecting leaves");
    } finally {
      setLoading(false);
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bulk Operations</span>
          <span className="text-sm font-normal text-muted-foreground">
            {selectedLeaves.size} of {pendingLeaves.length} selected
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="selectAll"
            checked={selectedLeaves.size === pendingLeaves.length && pendingLeaves.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <Label htmlFor="selectAll" className="font-medium cursor-pointer">
            Select All Pending Leaves
          </Label>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-2">
          {pendingLeaves.map((leave) => (
            <div key={leave.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
              <Checkbox
                id={leave.id}
                checked={selectedLeaves.has(leave.id)}
                onCheckedChange={(checked) => handleSelectLeave(leave.id, checked as boolean)}
              />
              <Label htmlFor={leave.id} className="flex-1 cursor-pointer text-sm">
                <span className="font-medium">{leave.student_name}</span>
                {' - '}
                <span className="text-muted-foreground">
                  {leave.leave_type} ({leave.start_date} to {leave.end_date})
                </span>
              </Label>
            </div>
          ))}
          
          {pendingLeaves.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No pending leaves available
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="bulkComments">Comments / Reason (Optional for approval, Required for rejection)</Label>
          <Textarea
            id="bulkComments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Enter comments or reason for bulk action..."
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="flex-1"
                disabled={selectedLeaves.size === 0 || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Approve Selected ({selectedLeaves.size})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Bulk Approval</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to approve {selectedLeaves.size} leave application(s)? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkApprove}>
                  Approve All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={selectedLeaves.size === 0 || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                Reject Selected ({selectedLeaves.size})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Bulk Rejection</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reject {selectedLeaves.size} leave application(s)? 
                  {!comments.trim() && (
                    <span className="block mt-2 text-red-500">
                      Please provide a reason for rejection in the comments field.
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleBulkReject}
                  disabled={!comments.trim()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Reject All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkOperations;
