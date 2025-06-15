
import { supabase } from "@/integrations/supabase/client";

export interface AdminUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  created_at: string;
}

/**
 * Authenticate admin login credentials using the admin_users table.
 *
 * Note: password is stored in plain text for demo bootstrap only!
 * In real apps, always hash/store securely.
 */
export const adminService = {
  login: async (email: string, password: string): Promise<{ admin: AdminUser | null; error: string | null }> => {
    // Query the admin_users table for matching email and password.
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .maybeSingle();

    if (error) {
      return { admin: null, error: error.message };
    }
    if (!data) {
      return { admin: null, error: "Invalid email or password." };
    }
    return { admin: data as AdminUser, error: null };
  }
};
