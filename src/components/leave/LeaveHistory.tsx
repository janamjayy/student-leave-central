
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { leaveService } from "@/services/leaveService";
import type { LeaveApplication } from "@/services/leaveService";

const LeaveHistory = () => {
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
            leaveType: "चिकित्सा अवकाश",
            reason: "डॉक्टर के पास जाना है",
            status: "pending",
            appliedOn: "2025-05-01"
          },
          {
            id: "2",
            studentId: user?.studentId || "",
            studentName: user?.name || "",
            startDate: "2025-04-20",
            endDate: "2025-04-22",
            leaveType: "पारिवारिक आपातकाल",
            reason: "पारिवारिक समारोह में भाग लेने के लिए",
            status: "approved",
            appliedOn: "2025-04-15"
          },
          {
            id: "3",
            studentId: user?.studentId || "",
            studentName: user?.name || "",
            startDate: "2025-03-05",
            endDate: "2025-03-08",
            leaveType: "व्यक्तिगत कारण",
            reason: "मानसिक स्वास्थ्य के लिए कुछ समय चाहिए",
            status: "rejected",
            appliedOn: "2025-03-01",
            comments: "पिछले महीने में बहुत अधिक अनुपस्थिति"
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
    return new Date(dateString).toLocaleDateString('hi-IN', options);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">स्वीकृत</Badge>;
      case 'rejected':
        return <Badge variant="destructive">अस्वीकृत</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">लंबित</Badge>;
      default:
        return <Badge variant="outline">अज्ञात</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Clock className="h-10 w-10 text-primary animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading leave history...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full shadow-lg animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">मेरी छुट्टियों का इतिहास</CardTitle>
        <CardDescription>अपने सभी छुट्टी अनुरोधों की स्थिति देखें</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-2/3">
            <Label htmlFor="search" className="sr-only">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="छुट्टी प्रकार, कारण, या तिथि द्वारा खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <Label htmlFor="status-filter" className="sr-only">Status Filter</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="स्थिति द्वारा फ़िल्टर करें" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">सभी छुट्टियां</SelectItem>
                <SelectItem value="pending">लंबित</SelectItem>
                <SelectItem value="approved">स्वीकृत</SelectItem>
                <SelectItem value="rejected">अस्वीकृत</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredLeaves.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableCaption>आपके छुट्टी आवेदनों की सूची</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>प्रकार</TableHead>
                  <TableHead>से</TableHead>
                  <TableHead>तक</TableHead>
                  <TableHead>आवेदन तिथि</TableHead>
                  <TableHead>स्थिति</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaves.map((leave) => (
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
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">कोई छुट्टी नहीं मिली</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery || statusFilter !== "all" 
                ? "कृपया अपने फ़िल्टर परिवर्तित करें या खोज हटाएं" 
                : "आपने अभी तक कोई छुट्टी का आवेदन नहीं किया है"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveHistory;
