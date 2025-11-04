import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { contactService, ContactRequest } from '@/services/contactService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const StatusBadge = ({ status }: { status: ContactRequest['status'] }) => {
  const map: Record<ContactRequest['status'], string> = {
    new: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    closed: 'bg-green-100 text-green-700',
  };
  return <span className={`px-2 py-1 rounded text-xs font-medium ${map[status]}`}>{status.replace('_',' ')}</span>;
};

const AdminContacts: React.FC = () => {
  const [rows, setRows] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string| null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contactService.list();
      setRows(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: ContactRequest['status']) => {
    await contactService.updateStatus(id, status);
    await load();
  };

  return (
    <Layout>
      <section className="px-4 pt-24 pb-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Demo Requests</h1>
          <Button variant="secondary" onClick={load}>Refresh</Button>
        </div>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="text-left px-4 py-3">When</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Institution</th>
                  <th className="text-left px-4 py-3">Message</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-4 py-6" colSpan={7}>Loading…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td className="px-4 py-6" colSpan={7}>No demo requests yet.</td></tr>
                ) : (
                  rows.map(r => (
                    <tr key={r.id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">{r.name}</td>
                      <td className="px-4 py-3"><a className="text-indigo-600 underline" href={`mailto:${r.email}`}>{r.email}</a></td>
                      <td className="px-4 py-3">{r.institution}</td>
                      <td className="px-4 py-3 max-w-md whitespace-pre-wrap">{r.message}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => setStatus(r.id, 'in_progress')}>In progress</Button>
                        <Button size="sm" onClick={() => setStatus(r.id, 'closed')}>Close</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminContacts;
