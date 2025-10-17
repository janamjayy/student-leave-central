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
// Note: Faculty leaves are managed in FacultyLeaveManagement; this view handles student leaves only.

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

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="text-2xl font-bold text-gray-800">Leave Management</CardTitle>
        <CardDescription>Review and process student leave applications</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6">
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
