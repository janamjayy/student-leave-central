
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabaseService, LeaveApplication } from '@/services/supabaseService';
import { toast } from 'sonner';

interface Holiday {
  id: string;
  title: string;
  date: string;
  description?: string;
  created_by: string;
}

const LeaveCalendar = () => {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [holidayTitle, setHolidayTitle] = useState('');
  const [holidayDescription, setHolidayDescription] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { isAdmin, isFaculty } = useAuth();
  const canManageHolidays = isAdmin() || isFaculty();

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const [leavesData, holidaysData] = await Promise.all([
        supabaseService.getAllLeaves(),
        fetchHolidays()
      ]);
      
      setLeaves(leavesData);
      setHolidays(holidaysData);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async (): Promise<Holiday[]> => {
    // For now, return mock data - this would be replaced with actual Supabase query
    return [
      {
        id: '1',
        title: 'New Year\'s Day',
        date: '2024-01-01',
        description: 'National Holiday',
        created_by: 'admin'
      },
      {
        id: '2',
        title: 'Independence Day',
        date: '2024-07-04',
        description: 'National Holiday',
        created_by: 'admin'
      }
    ];
  };

  const handleDateClick = (info: any) => {
    if (canManageHolidays) {
      setSelectedDate(info.dateStr);
      setIsAddingHoliday(true);
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayTitle.trim() || !selectedDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // This would be replaced with actual Supabase insertion
      const newHoliday: Holiday = {
        id: Date.now().toString(),
        title: holidayTitle,
        date: selectedDate,
        description: holidayDescription,
        created_by: 'current_user'
      };

      setHolidays([...holidays, newHoliday]);
      toast.success('Holiday added successfully');
      setIsAddingHoliday(false);
      setHolidayTitle('');
      setHolidayDescription('');
      setSelectedDate('');
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast.error('Failed to add holiday');
    }
  };

  const getCalendarEvents = () => {
    const leaveEvents = leaves
      .filter(leave => leave.status === 'approved')
      .map(leave => ({
        id: `leave-${leave.id}`,
        title: `${leave.student?.full_name || 'Student'} - ${leave.leave_type}`,
        start: leave.start_date,
        end: leave.end_date,
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        extendedProps: {
          type: 'leave',
          student: leave.student?.full_name,
          reason: leave.reason
        }
      }));

    const holidayEvents = holidays.map(holiday => ({
      id: `holiday-${holiday.id}`,
      title: holiday.title,
      start: holiday.date,
      backgroundColor: '#ef4444',
      borderColor: '#dc2626',
      extendedProps: {
        type: 'holiday',
        description: holiday.description
      }
    }));

    return [...leaveEvents, ...holidayEvents];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p>Loading calendar...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Calendar
          </CardTitle>
          {canManageHolidays && (
            <Dialog open={isAddingHoliday} onOpenChange={setIsAddingHoliday}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Holiday
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Holiday</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="holiday-date">Date</Label>
                    <Input
                      id="holiday-date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="holiday-title">Title *</Label>
                    <Input
                      id="holiday-title"
                      value={holidayTitle}
                      onChange={(e) => setHolidayTitle(e.target.value)}
                      placeholder="e.g., Christmas Day"
                    />
                  </div>
                  <div>
                    <Label htmlFor="holiday-description">Description</Label>
                    <Textarea
                      id="holiday-description"
                      value={holidayDescription}
                      onChange={(e) => setHolidayDescription(e.target.value)}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddHoliday}>Add Holiday</Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddingHoliday(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Approved Leaves</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Holidays</span>
          </div>
        </div>
        
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          events={getCalendarEvents()}
          dateClick={handleDateClick}
          eventClick={(info) => {
            const { extendedProps } = info.event;
            if (extendedProps.type === 'leave') {
              toast.info(`Leave: ${extendedProps.student} - ${extendedProps.reason}`);
            } else if (extendedProps.type === 'holiday') {
              toast.info(`Holiday: ${info.event.title}${extendedProps.description ? ` - ${extendedProps.description}` : ''}`);
            }
          }}
          height="auto"
          dayMaxEvents={3}
          moreLinkClick="popover"
        />
        
        {canManageHolidays && (
          <p className="text-sm text-muted-foreground mt-4">
            Click on any date to add a holiday or event.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveCalendar;
