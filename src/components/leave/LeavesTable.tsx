
import { Calendar, Loader2, ThumbsUp, ThumbsDown, Paperclip, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import LeavePdfTemplate from "@/components/admin/LeavePdfTemplate";
import { createRoot } from "react-dom/client";
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
import { useAdmin } from "@/context/AdminContext";
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
  const { isAdminAuthenticated, admin } = useAdmin();
  const showStudentInfo = isAdmin() || isFaculty() || isAdminAuthenticated;
  const canAct = isAdmin() || isFaculty() || isAdminAuthenticated;
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
  // Admin override modal state
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<"approved" | "rejected">("approved");
  const [overrideComments, setOverrideComments] = useState("");
  const [overrideTarget, setOverrideTarget] = useState<LeaveApplication | null>(null);

  // Review dialog (admin-style like faculty leaves)
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<LeaveApplication | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [reviewProcessing, setReviewProcessing] = useState(false);

  const openReview = (leave: LeaveApplication) => {
    setReviewTarget(leave);
    setReviewComments(leave.comments || "");
    setReviewOpen(true);
  };

  const handleReviewAction = async (status: "approved" | "rejected") => {
    if (!reviewTarget) return;
    try {
      setReviewProcessing(true);
      const approverName = (isAdminAuthenticated && admin?.full_name) ? admin.full_name : undefined;
      const { success, error } = await supabaseService.updateLeaveStatus(
        reviewTarget.id,
        status,
        user?.id || null,
        reviewComments,
        approverName
      );
      if (!success) throw new Error(error || `Failed to ${status}`);
      toast.success(`Leave ${status}`);
      setReviewOpen(false);
      setReviewTarget(null);
      setReviewComments("");
      onUpdated && onUpdated();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update');
    } finally {
      setReviewProcessing(false);
    }
  };

  const handleUpdate = async (
    leave: LeaveApplication,
    status: "approved" | "rejected"
  ) => {
    // Admins via AdminContext are allowed even without Supabase user

    // If faculty, collect remarks first
  if (isFaculty() && user) {
      setPendingAction({ leave, status });
      setRemarks("");
      setFlagInvalidReason(false);
      setRemarksOpen(true);
      return;
    }

    // Admin path: proceed immediately (no remarks required)
    try {
      setUpdatingId(leave.id);
      const approverName = (isAdminAuthenticated && admin?.full_name) ? admin.full_name : undefined;
      const { success, error } = await supabaseService.updateLeaveStatus(
        leave.id,
        status,
        user?.id || null,
        undefined,
        approverName
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

  const confirmOverride = async () => {
    if (!overrideTarget) return;
    try {
      setUpdatingId(overrideTarget.id);
      const approverName = (isAdminAuthenticated && admin?.full_name) ? admin.full_name : undefined;
      const { success, error } = await supabaseService.updateLeaveStatus(
        overrideTarget.id,
        overrideStatus,
        user?.id || null,
        overrideComments,
        approverName,
        { overrideFrom: overrideTarget.status as any }
      );
      if (!success) throw new Error(error || 'Failed to override');
      toast.success(`Decision changed to ${overrideStatus}`);
      setOverrideOpen(false);
      setOverrideTarget(null);
      setOverrideComments("");
      onUpdated && onUpdated();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to change decision');
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper: allow override only if decision was made today
  const canOverrideToday = (leave: LeaveApplication) => {
    // Only admins can override
    if (!(isAdminAuthenticated || isAdmin())) return false;
    if (leave.status === 'pending') return false;
    const ts = leave.status_decided_at || leave.updated_at;
    if (!ts) return false;
    const decided = new Date(ts);
    const now = new Date();
    return decided.getFullYear() === now.getFullYear() &&
      decided.getMonth() === now.getMonth() &&
      decided.getDate() === now.getDate();
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

  const downloadStudentPdf = async (leave: LeaveApplication) => {
    try {
      // Build approver display similar to LeaveReview
      const approverId = leave.reviewed_by || '';
      let approverName = approverId && reviewers[approverId]?.full_name ? reviewers[approverId].full_name : '';
      if (approverId && !approverName) {
        // Force-resolve on demand
        try {
          const map = await supabaseService.getProfilesByIds([approverId]);
          approverName = map[approverId]?.full_name || '';
        } catch (_) {}
      }
      if (!approverName && isAdminAuthenticated && admin?.full_name) {
        approverName = admin.full_name;
      }
      const approver = { name: approverName, id: '', role: '' };

      // Applicant details for PDF header (real-time where possible)
      const applicant = {
        name: leave.student_name || leave.student?.full_name || '—',
        role: 'Student',
        id: leave.student?.student_id || leave.student_id || null
      };

      // Create offscreen container and a known wrapper
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = '210mm';
      document.body.appendChild(container);

      const wrapper = document.createElement('div');
      wrapper.id = 'student-pdf-wrapper';
      container.appendChild(wrapper);

      const root = createRoot(wrapper);
      const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  root.render(<LeavePdfTemplate leave={leave} approver={approver} applicant={applicant} mode={mode} />);

  // Ensure QR and fonts render before capture
  await new Promise(res => setTimeout(res, 200));
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const target = wrapper as HTMLDivElement;
      if (!target) throw new Error('PDF container not found');

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: mode === 'dark' ? '#18181b' : '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210; const pageHeight = 297;
      const props = pdf.getImageProperties(imgData);
      let pdfWidth = pageWidth; let pdfHeight = (props.height * pdfWidth) / props.width;
      if (pdfHeight > pageHeight) { pdfHeight = pageHeight; pdfWidth = (props.width * pdfHeight) / props.height; }
      pdf.addImage(imgData, 'PNG', (pageWidth - pdfWidth) / 2, 10, pdfWidth, pdfHeight);

  const name = leave.student_name || leave.student?.full_name || 'student';
      pdf.save(`student_leave_${name}_${leave.id}.pdf`);

      // Cleanup
      root.unmount();
      document.body.removeChild(container);
    } catch (e) {
      console.error('PDF generation failed', e);
    }
  };

  return (
    <>
    <div className="border rounded-md overflow-hidden">
      <Table>
        
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
                  {/* For students (no admin actions), offer download here when not pending */}
                  {leave.status !== 'pending' && !canAct && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadStudentPdf(leave)}
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
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
                        onClick={() => openReview(leave)}
                        title="Review"
                      >
                        Review
                      </Button>
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
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReview(leave)}
                        title="Review"
                      >
                        Review
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadStudentPdf(leave)}
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {canOverrideToday(leave) && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { setOverrideTarget(leave); setOverrideStatus(leave.status === 'approved' ? 'rejected' : 'approved'); setOverrideComments(''); setOverrideOpen(true); }}
                          title="Change decision"
                        >
                          Change Decision
                        </Button>
                      )}
                    </div>
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
            <Checkbox id="invalid-reason" checked={flagInvalidReason} onCheckedChange={(v) => setFlagInvalidReason(v === true)} />
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
  {/* Admin override dialog */}
    <AlertDialog open={overrideOpen} onOpenChange={setOverrideOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change decision</AlertDialogTitle>
          <AlertDialogDescription>
            Only admins can override a previous decision. Select the new status and add optional comments. This action will be logged.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">New status:</label>
            <div className="flex gap-2">
              <Button variant={overrideStatus==='approved' ? 'default' : 'outline'} size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setOverrideStatus('approved')}>Approve</Button>
              <Button variant={overrideStatus==='rejected' ? 'destructive' : 'outline'} size="sm" onClick={() => setOverrideStatus('rejected')}>Reject</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="override-comments">Comments</Label>
            <Textarea id="override-comments" value={overrideComments} onChange={(e) => setOverrideComments(e.target.value)} placeholder="Why is this decision being changed?" />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOverrideTarget(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmOverride}>
            Apply Change
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  {/* Review dialog for student leaves (admin/faculty) */}
    <AlertDialog open={reviewOpen} onOpenChange={setReviewOpen}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Review Student Leave Application</AlertDialogTitle>
          <AlertDialogDescription>
            Review the details and approve or reject the leave request.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {reviewTarget && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Student Name</Label>
                <p className="font-medium">{reviewTarget.student_name || reviewTarget.student?.full_name || 'Unknown'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">ID</Label>
                <p className="font-medium">{reviewTarget.student?.student_id || reviewTarget.student_id || '—'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Leave Type</Label>
                <p className="font-medium">{reviewTarget.leave_type}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <LeaveStatusBadge status={reviewTarget.status} />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Start Date</Label>
                <p className="font-medium">{formatDate(reviewTarget.start_date)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">End Date</Label>
                <p className="font-medium">{formatDate(reviewTarget.end_date)}</p>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Reason</Label>
              <p className="font-medium mt-1">{reviewTarget.reason}</p>
            </div>
            {reviewTarget.status === 'pending' && (
              <div>
                <Label htmlFor="review-comments">Comments (Optional)</Label>
                <Textarea id="review-comments" value={reviewComments} onChange={(e) => setReviewComments(e.target.value)} rows={3} />
              </div>
            )}
          </div>
        )}
        <AlertDialogFooter>
          {reviewTarget?.status === 'pending' ? (
            <>
              <AlertDialogCancel disabled={reviewProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-500 hover:bg-red-600"
                onClick={() => handleReviewAction('rejected')}
                disabled={reviewProcessing}
              >
                {reviewProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() => handleReviewAction('approved')}
                disabled={reviewProcessing}
              >
                {reviewProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction onClick={() => setReviewOpen(false)}>Close</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default LeavesTable;