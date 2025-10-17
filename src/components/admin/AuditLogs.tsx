import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [actionFilter, setActionFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = (data as AuditLog[]) || [];
      setLogs(rows);

      // Resolve user names
      const ids = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));
      if (ids.length > 0) {
        const { data: profiles, error: pErr } = await (supabase as any)
          .from('profiles')
          .select('id, full_name, email')
          .in('id', ids);
        if (!pErr && profiles) {
          const map: Record<string, string> = {};
          (profiles as any[]).forEach(p => { map[p.id] = p.full_name || p.email || p.id; });
          setUserNames(map);
        }
      }
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

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesAction = actionFilter ? l.action.toLowerCase().includes(actionFilter.toLowerCase()) : true;
      const matchesType = typeFilter ? l.entity_type.toLowerCase().includes(typeFilter.toLowerCase()) : true;
      let matchesDate = true;
      if (dateFrom) {
        matchesDate = matchesDate && new Date(l.created_at) >= new Date(dateFrom);
      }
      if (dateTo) {
        const end = new Date(dateTo);
        // Include entire end day
        end.setHours(23,59,59,999);
        matchesDate = matchesDate && new Date(l.created_at) <= end;
      }
      return matchesAction && matchesType && matchesDate;
    });
  }, [logs, actionFilter, typeFilter, dateFrom, dateTo]);

  const exportCsv = () => {
    const header = ["id","action","entity_type","user","created_at"];
    const rows = filteredLogs.map(l => [
      l.id,
      l.action,
      l.entity_type,
      l.user_id ? (userNames[l.user_id] || l.user_id) : "System",
      new Date(l.created_at).toISOString()
    ]);
    const csv = [header, ...rows].map(r => r.map(field => {
      if (field == null) return "";
      const s = String(field);
      // Escape quotes and wrap if needed
      const needsWrap = s.includes(',') || s.includes('"') || s.includes('\n');
      const escaped = s.replace(/"/g, '""');
      return needsWrap ? `"${escaped}"` : escaped;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Audit Logs</CardTitle>
        <div className="flex gap-2">
          <Button onClick={fetchLogs} size="sm" variant="outline"><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          <Button onClick={exportCsv} size="sm" variant="secondary"><Download className="h-4 w-4 mr-1" />Export CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <Label>Action</Label>
            <Input placeholder="e.g. approved" value={actionFilter} onChange={e => setActionFilter(e.target.value)} />
          </div>
          <div>
            <Label>Type</Label>
            <Input placeholder="e.g. faculty_leave_application" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} />
          </div>
          <div>
            <Label>Date from</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>Date to</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map(log => (
              <TableRow key={log.id}>
                <TableCell><Badge>{log.action}</Badge></TableCell>
                <TableCell>{log.entity_type}</TableCell>
                <TableCell className="font-mono text-xs">
                  {log.user_id ? (userNames[log.user_id] || log.user_id.substring(0, 8)) : 'System'}
                </TableCell>
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
