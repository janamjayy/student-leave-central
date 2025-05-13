import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Calendar as CalendarIcon, FileText, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { leaveService } from "@/services/leaveService";

const LeaveApplicationForm = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !leaveType || !reason) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (startDate > endDate) {
      toast.error("The return date cannot be earlier than the leave start date");
      return;
    }
    
    if (!user) {
      toast.error("You must be logged in to apply for leave");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await leaveService.submitLeave({
        studentId: user.studentId || user.id,
        studentName: user.name,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        leaveType,
        reason,
        isEmergency,
        attachmentUrl: attachmentName ? `mock_url_for_${attachmentName}` : undefined
      });
      
      toast.success("Your leave application has been successfully submitted!");
      
      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setLeaveType("");
      setReason("");
      setAttachmentName("");
      setIsEmergency(false);
    } catch (error) {
      console.error("Error submitting leave application:", error);
      toast.error("Error submitting application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      // In a real application with Supabase, this would upload the file to storage
    }
  };

  const leaveTypes = [
    "Medical Leave",
    "Family Emergency",
    "Educational Program",
    "Personal Reasons",
    "Other"
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Card className="w-full shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-gray-800">Leave Application</CardTitle>
          <CardDescription>Fill out the form to apply for a leave</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-gray-700">Leave Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-gray-300 hover:border-blue-500 transition-colors",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-gray-700">Return Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-gray-300 hover:border-blue-500 transition-colors",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => 
                        startDate ? date < startDate : date < new Date()
                      }
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="leave-type" className="text-gray-700">Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="border-gray-300 hover:border-blue-500 transition-colors">
                  <SelectValue placeholder="Select Leave Type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-gray-700">Reason for Leave</Label>
              <Textarea
                id="reason"
                placeholder="Please provide details about your leave"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[120px] border-gray-300 hover:border-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="emergency" 
                checked={isEmergency}
                onCheckedChange={(checked) => setIsEmergency(checked === true)}
              />
              <label
                htmlFor="emergency"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                This is an emergency leave
              </label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="attachment" className="text-gray-700">Supporting Documents (Optional)</Label>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="attachment"
                  className="cursor-pointer border rounded py-2 px-4 inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Choose File</span>
                </Label>
                <Input
                  id="attachment"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-gray-500">
                  {attachmentName || "No file selected"}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Accepted file types: PDF, JPG, JPEG, PNG, DOC, DOCX. Maximum file size: 5MB.
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="bg-gray-50 rounded-b-lg">
          <Button 
            onClick={handleSubmit} 
            className="w-full sm:w-auto flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span>Submit Application</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LeaveApplicationForm;