import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { User, Session } from "@supabase/supabase-js";

export interface LeaveApplication {
  id: string;
  student_id: string;
  leave_type: string;
  reason: string;
  start_date: string;
  end_date: string;
  is_emergency: boolean;
  attachment_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  reviewed_by?: string;
  applied_on: string;
  updated_at: string;
  student_name: string;
  student?: {
    full_name: string;
    student_id: string;
    email: string;
  }
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'student' | 'admin' | 'faculty';
  student_id?: string;
  department?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  related_to?: string;
  is_read: boolean;
  created_at: string;
}

export const supabaseService = {
  // Auth functions
  getCurrentSession: async (): Promise<{ user: User | null; session: Session | null }> => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error.message);
      return { user: null, session: null };
    }
    return { 
      user: data.session?.user || null,
      session: data.session || null 
    };
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  getUserProfile: async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching user profile:", error.message);
      return null;
    }
    
    return data as UserProfile;
  },

  login: async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  },

  signUp: async (
    email: string, 
    password: string, 
    fullName: string, 
    studentId: string
  ): Promise<{ user: User | null; error: string | null }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          student_id: studentId,
          role: 'student',
        }
      }
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

  resetPassword: async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error ? error.message : null };
  },

  // User Management functions
  getAllUsers: async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching users:", error.message);
      return [];
    }

    return data as UserProfile[];
  },

  updateUserRole: async (userId: string, newRole: 'faculty' | 'student'): Promise<{ success: boolean; error: string | null }> => {
    // Only allow updating to faculty or student roles, not admin
    if (newRole !== 'faculty' && newRole !== 'student') {
      return { success: false, error: "Invalid role. Only 'faculty' and 'student' roles can be assigned." };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error("Error updating user role:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  },

  // Leave application functions
  submitLeave: async (leaveData: Omit<LeaveApplication, 'id' | 'applied_on' | 'status' | 'updated_at' | 'student_name'>): Promise<{ data: LeaveApplication | null; error: string | null }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "User not authenticated" };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching user profile:", profileError?.message);
      return { data: null, error: "Could not fetch user profile" };
    }

    const insertData = {
      ...leaveData,
      student_name: profile.full_name
    };

    const { data, error } = await supabase
      .from('leave_applications')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error submitting leave:", error.message);
      return { data: null, error: error.message };
    }

    return { data: data as LeaveApplication, error: null };
  },

  uploadAttachment: async (file: File, userId: string): Promise<{ url: string | null; error: string | null }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('leave_attachments')
      .upload(fileName, file);

    if (error) {
      console.error("Error uploading file:", error.message);
      return { url: null, error: error.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('leave_attachments')
      .getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  },

  getStudentLeaves: async (studentId: string): Promise<LeaveApplication[]> => {
    const { data, error } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('student_id', studentId)
      .order('applied_on', { ascending: false });

    if (error) {
      console.error("Error fetching leaves:", error.message);
      return [];
    }

    return data as LeaveApplication[];
  },

  getAllLeaves: async (): Promise<LeaveApplication[]> => {
    const { data, error } = await supabase
      .from('leave_applications')
      .select(`
        *,
        student:profiles(full_name, student_id, email)
      `)
      .order('applied_on', { ascending: false });

    if (error) {
      console.error("Error fetching all leaves:", error.message);
      return [];
    }

    return data as unknown as LeaveApplication[];
  },

  getPendingLeaves: async (): Promise<LeaveApplication[]> => {
    const { data, error } = await supabase
      .from('leave_applications')
      .select(`
        *,
        student:profiles(full_name, student_id, email)
      `)
      .eq('status', 'pending')
      .order('applied_on', { ascending: false });

    if (error) {
      console.error("Error fetching pending leaves:", error.message);
      return [];
    }

    return data as unknown as LeaveApplication[];
  },

  updateLeaveStatus: async (leaveId: string, status: 'approved' | 'rejected', reviewerId: string, comments?: string): Promise<{ success: boolean; error: string | null }> => {
    const { error } = await supabase
      .from('leave_applications')
      .update({ 
        status, 
        reviewed_by: reviewerId,
        comments,
        updated_at: new Date().toISOString()
      })
      .eq('id', leaveId);

    if (error) {
      console.error("Error updating leave status:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  },

  // Notifications functions
  getNotifications: async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error.message);
      return [];
    }

    return data as Notification[];
  },

  getUnreadNotificationsCount: async (userId: string): Promise<number> => {
    const { data, error } = await supabase
      .rpc('get_unread_notification_count', { user_id: userId });

    if (error) {
      console.error("Error fetching unread notifications count:", error.message);
      return 0;
    }

    return data || 0;
  },

  markNotificationAsRead: async (notificationId: string): Promise<{ success: boolean }> => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error("Error marking notification as read:", error.message);
      return { success: false };
    }

    return { success: true };
  },

  markAllNotificationsAsRead: async (userId: string): Promise<{ success: boolean }> => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error("Error marking all notifications as read:", error.message);
      return { success: false };
    }

    return { success: true };
  },

  subscribeToNotifications: (userId: string, callback: (notification: Notification) => void) => {
    return supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }
};
