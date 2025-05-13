
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Clock, FileText, Download, ThumbsUp, ThumbsDown, AlertTriangle, Loader2 } from "lucide-react";
import { LeaveApplication, supabaseService } from "@/services/supabaseService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface LeaveReviewProps {
  leave: LeaveApplication;
  onStatusUpdate: () => void;
}

const LeaveReview = ({ leave, onStatusUpdate }: LeaveReviewProps) => {
  const [comments, setComments] = useState(leave.comments || "");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const { user } = useAuth();
  
  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!user) {
      toast.error("You must be logged in to perform this action");
      return;
    }
    
    try {
      if (status === 'approved') {
        setIsApproving(true);
      } else {
        setIsRejecting(true);
      }
      
      const { success, error } = await supabaseService.updateLeaveStatus(
        leave.id,
        status,
        user.id,
        comments
      );
      
      if (error) {
        throw new Error(error);
      }
      
      toast.success(`Leave application has been ${status}`);
      onStatusUpdate();
    } catch (error) {
      console.error(`Error ${status} leave:`, error);
      toast.error(`Failed to ${status} leave application`);
    } finally {
      setIsApproving(false);
      setIsRejecting(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const isPending = leave.status === 'pending';
  const studentName = leave.student ? leave.student.full_name : "Student";
  
  return (
    <Card className="w-full shadow mb-6 overflow-hidden border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{leave.leave_type}</CardTitle>
            <CardDescription className="mt-1">
              <div className="flex items-center space-x-1">
                <span className="font-medium">{studentName}</span>
                {leave.student && <span>({leave.student.student_id})</span>}
              </div>
            </CardDescription>
          </div>
          <Badge className={`
            ${leave.status === 'approved' ? 'bg-green-500' : 
              leave.status === 'rejected' ? 'bg-red-500' : 
              'bg-amber-500'}
          `}>
            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>From: <span className="font-semibold">{formatDate(leave.start_date)}</span></span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>To: <span className="font-semibold">{formatDate(leave.end_date)}</span></span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <Clock className="h-4 w-4" />
          <span>Applied on: <span className="font-semibold">{formatDate(leave.applied_on)}</span></span>
        </div>
        
        {leave.is_emergency && (
          <div className="bg-red-50 p-3 rounded-md flex items-center gap-2 mb-4 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Emergency Leave</span>
          </div>
        )}
        
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h4 className="font-medium mb-2">Reason for Leave</h4>
          <p className="text-gray-600">{leave.reason}</p>
        </div>
        
        {leave.attachment_url && (
          <div className="mb-4">
            <a
              href={leave.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <FileText className="h-4 w-4" />
              <span>View Attachment</span>
              <Download className="h-4 w-4" />
            </a>
          </div>
        )}
        
        {isPending && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Comments (optional)
            </label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add comments or feedback for the student..."
              className="min-h-[100px]"
            />
          </div>
        )}
        
        {!isPending && leave.comments && (
          <div className="bg-gray-50 p-4 rounded-md mb-2">
            <h4 className="font-medium mb-2">Admin Comments</h4>
            <p className="text-gray-600">{leave.comments}</p>
          </div>
        )}
      </CardContent>
      
      {isPending && (
        <CardFooter className="bg-gray-50 border-t">
          <div className="flex gap-3 w-full">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="flex-1 flex items-center gap-1.5"
                  disabled={isRejecting || isApproving}
                >
                  {isRejecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsDown className="h-4 w-4" />
                  )}
                  <span>Reject</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject Leave Application?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will notify the student that their leave application has been rejected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-red-500 hover:bg-red-600"
                    onClick={() => handleStatusUpdate('rejected')}
                  >
                    Yes, Reject
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="default" 
                  className="flex-1 bg-green-600 hover:bg-green-700 flex items-center gap-1.5"
                  disabled={isApproving || isRejecting}
                >
                  {isApproving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-4 w-4" />
                  )}
                  <span>Approve</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve Leave Application?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will notify the student that their leave application has been approved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => handleStatusUpdate('approved')}
                  >
                    Yes, Approve
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default LeaveReview;
