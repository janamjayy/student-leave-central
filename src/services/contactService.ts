import { supabase } from '@/integrations/supabase/client';

export type ContactRequest = {
  id: string;
  name: string;
  email: string;
  institution: string;
  message: string;
  status: 'new' | 'in_progress' | 'closed';
  handled_by?: string | null;
  created_at: string;
};

export const contactService = {
  async submit(data: { name: string; email: string; institution: string; message: string; }) {
    // 1) Insert request
    const { error } = await supabase
      .from('contact_requests' as any)
      .insert({ ...data });
    if (error) throw error;

    // 2) Notify admins in-app
    try {
      const { data: admins } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'admin');
      const list = (admins || []) as Array<{ id: string; full_name?: string }>;
      if (list.length > 0) {
        const rows = list.map((a) => ({
          user_id: a.id,
          title: 'New Demo Request',
          message: `From ${data.name} (${data.institution}) – ${data.email}`,
        }));
        await (supabase as any).from('notifications').insert(rows);
      }
    } catch {}
  },

  async list(): Promise<ContactRequest[]> {
    const { data, error } = await supabase
      .from('contact_requests' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as unknown as ContactRequest[];
    return rows;
  },

  async updateStatus(id: string, status: ContactRequest['status']) {
    const { error } = await supabase
      .from('contact_requests' as any)
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  },
};
