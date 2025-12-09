
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeaveHistory } from "@/hooks/useLeaveHistory";
import LeaveFilters from "@/components/leave/LeaveFilters";
import LeavesTable from "@/components/leave/LeavesTable";
import EmptyLeaveState from "@/components/leave/EmptyLeaveState";
import LeaveReview from "./LeaveReview";
import { LeaveApplication } from "@/services/supabaseService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/context/AdminContext";
import { toast } from "sonner";

const LeaveManagement = () => {
  const {
    leaves,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    formatDate,
    hasFilters,
    refreshLeaves
  } = useLeaveHistory();

  // Real-time subscription for student leave updates
  useEffect(() => {
    const channel = supabase
      .channel('leave-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leave_applications'
        },
        () => {
          refreshLeaves();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshLeaves]);

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedTab, setSelectedTab] = useState("all");

  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentOptions, setStudentOptions] = useState<Array<{ id: string; full_name: string; email: string; }>>([]);


  // Filter leaves based on selected tab
  const filteredLeaves = leaves.filter(leave => {
    if (selectedTab === "pending") return leave.status === "pending";
    if (selectedTab === "approved") return leave.status === "approved";
    if (selectedTab === "rejected") return leave.status === "rejected";
    return true; // "all" tab
  });

  // Get counts for each status
  const pendingCount = leaves.filter(leave => leave.status === "pending").length;
  const approvedCount = leaves.filter(leave => leave.status === "approved").length;
  const rejectedCount = leaves.filter(leave => leave.status === "rejected").length;

  const handleLeaveUpdated = () => {
    refreshLeaves();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
          <p className="text-lg text-muted-foreground">Loading leave applications...</p>
        </div>
      </div>
    );
  }


  const { isAdmin, isFaculty } = useAuth();
  const { isAdminAuthenticated, admin } = useAdmin();

  const handleBackfill = async () => {
    // Simple implementation to backfill approver names if missing
    try {
      const { data: leavesToUpdate, error } = await supabase
        .from('leave_applications')
        .select('id, reviewed_by')
        .not('reviewed_by', 'is', null);

      if (error) throw error;

      let count = 0;
      // This is a placeholder. Real backfill would need to fetch profiles and update.
      // For now, we'll just toast.
      toast.info("Backfill feature is not fully implemented yet.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to backfill");
    }
  };

  const submitOnBehalf = async () => {
    if (!selectedStudentId || !leaveType || !startDate || !endDate || !reason) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('leave_applications').insert({
        student_id: selectedStudentId,
        leave_type: leaveType,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        reason: reason,
        status: 'pending' // or approved if admin wants to auto-approve?
      });

      if (error) throw error;

      toast.success("Leave application submitted successfully");
      setApplyOpen(false);
      // Reset form
      setSelectedStudentId("");
      setLeaveType("");
      setReason("");
      setStartDate(undefined);
      setEndDate(undefined);
      refreshLeaves();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit leave");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="w-full shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-2xl font-bold text-gray-800">Leave Management</CardTitle>
          <CardDescription>Review and process student leave applications</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6">
            {(isAdminAuthenticated || isAdmin()) && (
              <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
                <div className="text-sm text-muted-foreground">Admin tools</div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBackfill}>Backfill approver names</Button>
                  <Button variant="secondary" onClick={() => setApplyOpen(true)}>Apply on behalf of student</Button>
                </div>
              </div>
            )}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="all">
                  All
                  <span className="ml-2 bg-gray-200 text-gray-800 text-xs rounded-full px-2 py-0.5">
                    {leaves.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending
                  <span className="ml-2 bg-amber-100 text-amber-800 text-xs rounded-full px-2 py-0.5">
                    {pendingCount}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved
                  <span className="ml-2 bg-green-100 text-green-800 text-xs rounded-full px-2 py-0.5">
                    {approvedCount}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected
                  <span className="ml-2 bg-red-100 text-red-800 text-xs rounded-full px-2 py-0.5">
                    {rejectedCount}
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <LeaveFilters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                />
                {renderLeaveContent(filteredLeaves)}
              </TabsContent>

              <TabsContent value="pending">
                <LeaveFilters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter="pending"
                  setStatusFilter={setStatusFilter}
                />
                {renderLeaveContent(filteredLeaves)}
              </TabsContent>

              <TabsContent value="approved">
                <LeaveFilters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter="approved"
                  setStatusFilter={setStatusFilter}
                />
                {renderLeaveContent(filteredLeaves)}
              </TabsContent>

              <TabsContent value="rejected">
                <LeaveFilters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter="rejected"
                  setStatusFilter={setStatusFilter}
                />
                {renderLeaveContent(filteredLeaves)}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Apply on behalf dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Apply Leave on Behalf of Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Find student</Label>
              <Input placeholder="Search by name" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
              <div className="mt-2 max-h-40 overflow-auto border rounded">
                {studentOptions.map(opt => (
                  <button key={opt.id} type="button" onClick={() => setSelectedStudentId(opt.id)} className={`w-full text-left px-3 py-2 hover:bg-muted ${selectedStudentId === opt.id ? 'bg-muted' : ''}`}>
                    <div className="font-medium">{opt.full_name}</div>
                    <div className="text-xs text-muted-foreground">{opt.email}</div>
                  </button>
                ))}
                {studentOptions.length === 0 && <div className="p-3 text-sm text-muted-foreground">Type at least 2 letters…</div>}
              </div>
              {selectedStudentId && <div className="mt-1 text-xs">Selected ID: <span className="font-mono">{selectedStudentId.slice(0, 8)}…</span></div>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{startDate ? startDate.toDateString() : 'Select date'}</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>End date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start"><CalendarIcon className="mr-2 h-4 w-4" />{endDate ? endDate.toDateString() : 'Select date'}</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label>Leave type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {['Medical Leave', 'Family Emergency', 'Educational Program', 'Personal Reasons', 'Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button onClick={submitOnBehalf} disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>

  );

  function renderLeaveContent(leaves: LeaveApplication[]) {
    if (leaves.length === 0) {
      return <EmptyLeaveState hasFilters={hasFilters} />;
    }

    if (viewMode === 'table') {
      return <LeavesTable leaves={leaves} formatDate={formatDate} onUpdated={handleLeaveUpdated} />;
    } else {
      return (
        <div className="space-y-6">
          {leaves.map(leave => (
            <LeaveReview
              key={leave.id}
              leave={leave}
              onStatusUpdate={handleLeaveUpdated}
            />
          ))}
        </div>
      );
    }
  }
};

export default LeaveManagement;
