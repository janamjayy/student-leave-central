
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Calendar as CalendarIcon, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const LeaveApplicationForm = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !leaveType || !reason) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (startDate > endDate) {
      toast.error("End date cannot be before start date");
      return;
    }
    
    // In a real application, this would make an API call
    toast.success("Leave application submitted successfully!");
    console.log({ startDate, endDate, leaveType, reason, attachmentName });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      // In a real application, this would handle file upload
    }
  };

  const leaveTypes = [
    "Medical Leave",
    "Family Emergency",
    "Educational Event",
    "Personal Leave",
    "Other"
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Apply for Leave</CardTitle>
        <CardDescription>Fill out the form to submit a leave application</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => 
                      startDate ? date < startDate : false
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="leave-type">Leave Type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
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
            <Label htmlFor="reason">Reason for Leave</Label>
            <Textarea
              id="reason"
              placeholder="Please provide details about your leave request"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[120px]"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="attachment">Supporting Documents (Optional)</Label>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="attachment"
                className="cursor-pointer border rounded py-2 px-4 inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                <FileText className="h-4 w-4" />
                <span>Choose file</span>
              </Label>
              <Input
                id="attachment"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <span className="text-sm text-gray-500">
                {attachmentName || "No file chosen"}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Accepted file types: PDF, JPG, JPEG, PNG, DOC, DOCX. Max file size: 5MB.
            </p>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} className="w-full sm:w-auto flex items-center gap-1.5">
          <Check className="h-4 w-4" />
          <span>Submit Application</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LeaveApplicationForm;
