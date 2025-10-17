import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  created_at: string;
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data } = await (supabase as any).from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
      setLogs((data as AuditLog[]) || []);
    } catch (error) {
      toast.error("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const channel = supabase.channel('audit').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, fetchLogs).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Audit Logs</CardTitle>
        <Button onClick={fetchLogs} size="sm" variant="outline"><RefreshCw className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Type</TableHead><TableHead>User</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
          <TableBody>
            {logs.map(log => (
              <TableRow key={log.id}>
                <TableCell><Badge>{log.action}</Badge></TableCell>
                <TableCell>{log.entity_type}</TableCell>
                <TableCell className="font-mono text-xs">{log.user_id.substring(0, 8)}</TableCell>
                <TableCell className="text-sm">{new Date(log.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AuditLogs;
