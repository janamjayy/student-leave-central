import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, FileText, Loader2 } from "lucide-react";
import { reportingService, ReportFilters } from "@/services/reportingService";
import { supabaseService } from "@/services/supabaseService";
import { toast } from "sonner";

const ReportGenerator = () => {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const reportData = await reportingService.generateReport(filters);
      setReport(reportData);
      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const leaves = await supabaseService.getAllLeaves();
      const filename = `leave_report_${new Date().toISOString().split('T')[0]}.csv`;
      reportingService.exportToCSV(leaves, filename);
      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Custom Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select value={filters.leaveType || ''} onValueChange={(value) => setFilters({ ...filters, leaveType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                  <SelectItem value="Personal Leave">Personal Leave</SelectItem>
                  <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status || ''} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              Generate Report
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Export to CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-2xl font-bold text-primary">{report.totalLeaves}</div>
                <div className="text-sm text-muted-foreground">Total Leaves</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{report.approvedLeaves}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{report.rejectedLeaves}</div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </div>
              <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{report.pendingLeaves}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Key Metrics</h4>
                <p>Average Duration: {report.averageDuration} days</p>
                <p>Emergency Leaves: {report.emergencyLeaves}</p>
              </div>

              {report.topStudents.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Top 5 Students by Leave Count</h4>
                  <div className="space-y-1">
                    {report.topStudents.slice(0, 5).map((student: any) => (
                      <div key={student.studentId} className="flex justify-between text-sm">
                        <span>{student.studentName} ({student.studentId})</span>
                        <span className="font-medium">{student.count} leaves</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportGenerator;
