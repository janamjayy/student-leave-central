import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, Eye, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseService } from "@/services/supabaseService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/context/AdminContext";

interface FacultyLeave {
  id: string;
  faculty_id: string;
  faculty_name?: string;
  faculty_email?: string;
  leave_type: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_on: string;
  reviewed_by?: string;
  admin_remarks?: string;
  profile?: {
    full_name: string;
    email: string;
  };
}

const FacultyLeaveManagement = () => {
  const [leaves, setLeaves] = useState<FacultyLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState<FacultyLeave | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();
  const { isAdminAuthenticated } = useAdmin();

  const fetchFacultyLeaves = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('faculty_leave_applications')
        .select('*')
        .order('applied_on', { ascending: false });

      if (error) throw error;

      const list: FacultyLeave[] = (data as any) || [];
      // Resolve faculty names/emails via profiles
      const ids = Array.from(new Set(list.map(l => l.faculty_id))).filter(Boolean) as string[];
      const profileMap = await supabaseService.getProfilesByIds(ids);
      const withProfiles = list.map(l => ({
        ...l,
        profile: profileMap[l.faculty_id] ? {
          full_name: profileMap[l.faculty_id].full_name,
          email: profileMap[l.faculty_id].email
        } : undefined
      }));

      setLeaves(withProfiles);
    } catch (error: any) {
      console.error("Error fetching faculty leaves:", error);
      toast.error("Failed to load faculty leave applications");
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    fetchFacultyLeaves();

    const channel = supabase
      .channel('faculty-leave-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'faculty_leave_applications'
        },
        () => {
          fetchFacultyLeaves();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleReview = async (status: 'approved' | 'rejected') => {
    // Allow if a leave is selected; either a Supabase-auth user (faculty/admin) exists OR admin context is authenticated
    if (!selectedLeave) return;
    if (!user && !isAdminAuthenticated) return;

    try {
      setProcessing(true);

      const { error } = await (supabase as any)
        .from('faculty_leave_applications')
        .update({
          status,
          reviewed_by: user?.id || null,
          admin_remarks: comments,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedLeave.id);

      if (error) throw error;

      // Log audit
      // Best-effort audit log; may fail due to RLS if not allowed
      const { error: auditErr } = await (supabase as any).from('audit_logs').insert({
        user_id: user?.id || null,
        action: `${status}_faculty_leave`,
        entity_type: 'faculty_leave_application',
        entity_id: selectedLeave.id,
        details: { admin_remarks: comments }
      });
      if (auditErr) {
        console.debug('Audit log insert failed (non-blocking):', auditErr.message);
      }

      toast.success(`Faculty leave ${status}`);
      setReviewDialogOpen(false);
      setComments('');
      setSelectedLeave(null);
      fetchFacultyLeaves();
    } catch (error: any) {
      console.error("Error reviewing leave:", error);
      toast.error(error.message || "Failed to review leave");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading faculty leaves...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Faculty Leave Applications</h3>
          <p className="text-sm text-muted-foreground">
            Review and approve faculty leave requests
          </p>
        </div>
        <Button onClick={fetchFacultyLeaves} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Faculty Leaves ({leaves.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {leaves.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No faculty leave applications found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty Name</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium">
                      {leave.faculty_name || leave.profile?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell>{leave.leave_type}</TableCell>
                    <TableCell>
                      {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(leave.applied_on).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLeave(leave);
                            setComments(leave.admin_remarks || '');
                            setReviewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Faculty Leave Application</DialogTitle>
            <DialogDescription>
              Review the details and approve or reject the leave request
            </DialogDescription>
          </DialogHeader>
          
          {selectedLeave && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Faculty Name</Label>
                  <p className="font-medium">{selectedLeave.faculty_name || selectedLeave.profile?.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedLeave.faculty_email || selectedLeave.profile?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Leave Type</Label>
                  <p className="font-medium">{selectedLeave.leave_type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedLeave.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p className="font-medium">{new Date(selectedLeave.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">End Date</Label>
                  <p className="font-medium">{new Date(selectedLeave.end_date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Reason</Label>
                <p className="font-medium mt-1">{selectedLeave.reason}</p>
              </div>

              {selectedLeave.status === 'pending' && (
                <div>
                  <Label htmlFor="comments">Comments (Optional)</Label>
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add any comments or remarks..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedLeave?.status === 'pending' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReview('rejected')}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Reject
                </Button>
                <Button
                  onClick={() => handleReview('approved')}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve
                </Button>
              </>
            ) : (
              <Button onClick={() => setReviewDialogOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacultyLeaveManagement;