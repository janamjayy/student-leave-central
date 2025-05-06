
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
import { Calendar as CalendarIcon, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const LeaveApplicationForm = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !leaveType || !reason) {
      toast.error("कृपया सभी आवश्यक जानकारी भरें");
      return;
    }
    
    if (startDate > endDate) {
      toast.error("वापसी की तिथि छुट्टी शुरू होने की तिथि से पहले नहीं हो सकती");
      return;
    }
    
    // In a real application, this would make an API call
    toast.success("आपका छुट्टी का आवेदन सफलतापूर्वक जमा किया गया है!");
    console.log({ startDate, endDate, leaveType, reason, attachmentName, isEmergency });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      // In a real application, this would handle file upload
    }
  };

  const leaveTypes = [
    "चिकित्सा अवकाश",
    "पारिवारिक आपातकाल",
    "शैक्षिक कार्यक्रम",
    "व्यक्तिगत कारण",
    "अन्य"
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Card className="w-full shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-gray-800">छुट्टी के लिए आवेदन</CardTitle>
          <CardDescription>छुट्टी के लिए आवेदन करने के लिए फॉर्म भरें</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-gray-700">छुट्टी शुरू होने की तिथि</Label>
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
                      {startDate ? format(startDate, "PPP") : "तिथि चुनें"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto">
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
                <Label htmlFor="end-date" className="text-gray-700">वापसी की तिथि</Label>
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
                      {endDate ? format(endDate, "PPP") : "तिथि चुनें"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto">
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
              <Label htmlFor="leave-type" className="text-gray-700">छुट्टी का प्रकार</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="border-gray-300 hover:border-blue-500 transition-colors">
                  <SelectValue placeholder="छुट्टी का प्रकार चुनें" />
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
              <Label htmlFor="reason" className="text-gray-700">छुट्टी का कारण</Label>
              <Textarea
                id="reason"
                placeholder="कृपया अपनी छुट्टी के बारे में विस्तार से बताएं"
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
                यह एक आपातकालीन छुट्टी है
              </label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="attachment" className="text-gray-700">सहायक दस्तावेज़ (वैकल्पिक)</Label>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="attachment"
                  className="cursor-pointer border rounded py-2 px-4 inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>फ़ाइल चुनें</span>
                </Label>
                <Input
                  id="attachment"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <span className="text-sm text-gray-500">
                  {attachmentName || "कोई फ़ाइल नहीं चुनी गई"}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                स्वीकृत फ़ाइल प्रकार: PDF, JPG, JPEG, PNG, DOC, DOCX. अधिकतम फ़ाइल का साइज़: 5MB.
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="bg-gray-50 rounded-b-lg">
          <Button onClick={handleSubmit} className="w-full sm:w-auto flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 transition-colors">
            <Check className="h-4 w-4" />
            <span>आवेदन जमा करें</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LeaveApplicationForm;
