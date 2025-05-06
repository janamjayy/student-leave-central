
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { leaveService, LeaveApplication } from "@/services/leaveService";

export const useLeaveHistory = () => {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<LeaveApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        if (user?.studentId) {
          const studentLeaves = await leaveService.getStudentLeaves(user.studentId);
          setLeaves(studentLeaves);
          setFilteredLeaves(studentLeaves);
        }
      } catch (error) {
        console.error("Error fetching leaves:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
    
    // For demo purposes, add some mock data if none exists
    setTimeout(() => {
      if (leaves.length === 0) {
        const mockLeaves: LeaveApplication[] = [
          {
            id: "1",
            studentId: user?.studentId || "",
            studentName: user?.name || "",
            startDate: "2025-05-10",
            endDate: "2025-05-12",
            leaveType: "Medical Leave",
            reason: "Doctor appointment",
            status: "pending",
            appliedOn: "2025-05-01"
          },
          {
            id: "2",
            studentId: user?.studentId || "",
            studentName: user?.name || "",
            startDate: "2025-04-20",
            endDate: "2025-04-22",
            leaveType: "Family Emergency",
            reason: "Attending a family function",
            status: "approved",
            appliedOn: "2025-04-15"
          },
          {
            id: "3",
            studentId: user?.studentId || "",
            studentName: user?.name || "",
            startDate: "2025-03-05",
            endDate: "2025-03-08",
            leaveType: "Personal Leave",
            reason: "Need some time off for mental health",
            status: "rejected",
            appliedOn: "2025-03-01",
            comments: "Too many absences in the past month"
          }
        ];
        
        setLeaves(mockLeaves);
        setFilteredLeaves(mockLeaves);
        setLoading(false);
      }
    }, 1000);
  }, [user]);

  useEffect(() => {
    // Filter leaves based on search query and status filter
    let filtered = leaves;
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(leave => leave.status === statusFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(leave => 
        leave.leaveType.toLowerCase().includes(query) ||
        leave.reason.toLowerCase().includes(query) ||
        new Date(leave.startDate).toLocaleDateString().includes(query) ||
        new Date(leave.endDate).toLocaleDateString().includes(query)
      );
    }
    
    setFilteredLeaves(filtered);
  }, [searchQuery, statusFilter, leaves]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return {
    leaves: filteredLeaves,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    formatDate,
    hasFilters: searchQuery !== "" || statusFilter !== "all"
  };
};
