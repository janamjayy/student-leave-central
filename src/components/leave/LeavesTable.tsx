
import { Calendar, Loader2, ThumbsUp, ThumbsDown, Paperclip } from "lucide-react";
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
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [reviewers, setReviewers] = useState<Record<string, { full_name: string; email: string; role: string }>>({});

  // Faculty remarks modal state
  const [remarksOpen, setRemarksOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [flagInvalidReason, setFlagInvalidReason] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    leave: LeaveApplication;
    status: "approved" | "rejected";
  } | null>(null);

  const handleUpdate = async (
    leave: LeaveApplication,
    status: "approved" | "rejected"
  ) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    // If faculty, collect remarks first
    if (isFaculty()) {
      setPendingAction({ leave, status });
      setRemarks("");
      setFlagInvalidReason(false);
      setRemarksOpen(true);
      return;
    }

    // Admin path: proceed immediately (no remarks required)
    try {
      setUpdatingId(leave.id);
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

  const confirmWithRemarks = async () => {
    if (!pendingAction || !user) return;
    if (!remarks.trim()) {
      toast.error("Please add your remarks before submitting.");
      return;
    }
    const { leave, status } = pendingAction;
    try {
      setUpdatingId(leave.id);
      // Save faculty remarks and optional invalid reason flag
      const remarksRes = await supabaseService.updateRemarksAndReasonFlag(
        leave.id,
        remarks.trim(),
        flagInvalidReason,
        user.id
      );
      if (!remarksRes.success) throw new Error(remarksRes.error || "Failed to save remarks");

      // Update status with comments
      const statusRes = await supabaseService.updateLeaveStatus(
        leave.id,
        status,
        user.id,
        remarks.trim()
      );
      if (!statusRes.success) throw new Error(statusRes.error || "Failed to update status");

      toast.success(`Leave ${status}`);
      setRemarksOpen(false);
      setPendingAction(null);
      onUpdated && onUpdated();
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${pendingAction.status} leave`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Resolve reviewer names for current page
  const reviewerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const l of leaves) {
      if (l.reviewed_by) ids.add(l.reviewed_by);
    }
    return Array.from(ids);
  }, [leaves]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (reviewerIds.length === 0) return;
      const map = await supabaseService.getProfilesByIds(reviewerIds);
      if (!ignore) setReviewers(map);
    };
    run();
    return () => { ignore = true; };
  }, [reviewerIds]);

  return (
    <>
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableCaption>List of leave applications</TableCaption>
        <TableHeader>
          <TableRow>
            {showStudentInfo && <TableHead>Student</TableHead>}
            <TableHead>Type</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Attachment</TableHead>
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
                  {/* Prefer denormalized applicant name captured at submission time */}
                  {leave.student_name || leave.student?.full_name || "Unknown"}
                  {(leave.student?.student_id || leave.student_id) && (
                    <div className="text-xs text-muted-foreground">
                      {leave.student?.student_id || leave.student_id}
                    </div>
                  )}
                </TableCell>
              )}
              <TableCell className="font-medium">{leave.leave_type}</TableCell>
              <TableCell>{formatDate(leave.start_date)}</TableCell>
              <TableCell>{formatDate(leave.end_date)}</TableCell>
              <TableCell>
                {leave.attachment_url ? (
                  <a
                    href={leave.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    title="View attachment"
                  >
                    <Paperclip className="h-4 w-4" /> View
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(leave.applied_on)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <LeaveStatusBadge status={leave.status} />
                  {leave.reviewed_by && reviewers[leave.reviewed_by] && (
                    <span className="text-xs text-muted-foreground">by {reviewers[leave.reviewed_by].full_name}</span>
                  )}
                </div>
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
  {/* Faculty remarks modal */}
    <AlertDialog open={remarksOpen} onOpenChange={setRemarksOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add remarks before submitting</AlertDialogTitle>
          <AlertDialogDescription>
            Your remarks will be saved with this decision and visible in reports.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Provide brief context for your decision" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="invalid-reason" checked={flagInvalidReason} onCheckedChange={(v: any) => setFlagInvalidReason(!!v)} />
            <Label htmlFor="invalid-reason">Flag reason as potentially invalid</Label>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingAction(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmWithRemarks}>
            {pendingAction?.status === "approved" ? "Approve" : "Reject"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default LeavesTable;
