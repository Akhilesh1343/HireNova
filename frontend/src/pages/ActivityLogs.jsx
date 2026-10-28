import React, { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  Search,
  RefreshCw,
  Clock,
  User,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { getActivityLogsApi } from '../services/api';
import { formatRole } from '../utils/rbac';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActivityLogsApi(100);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      log.action?.toLowerCase().includes(q) ||
      log.user_email?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q) ||
      log.user_role?.toLowerCase().includes(q);

    const matchAction =
      actionFilter === 'ALL' ||
      log.action?.toUpperCase() === actionFilter.toUpperCase();

    return matchSearch && matchAction;
  });

  const getActionBadge = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('LOGIN') || act.includes('AUTH')) {
      return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
    }
    if (act.includes('ROLE') || act.includes('SECURITY')) {
      return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
    }
    if (act.includes('SCREEN') || act.includes('UPLOAD')) {
      return 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
    }
    if (act.includes('DELETE') || act.includes('RESTRICTED') || act.includes('DENIED')) {
      return 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60';
    }
    return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Activity & Security Audit Logs
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
              Admin Only
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time immutable audit trail tracking logins, role adjustments, screening executions, and system events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="btn-interactive inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action, email, role, details..."
            className="w-full pl-8 pr-4 py-2 text-xs bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121A2F] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Event Types</option>
            <option value="LOGIN">Logins</option>
            <option value="ROLE_UPDATED">Role Changes</option>
            <option value="SCREEN">Screenings</option>
            <option value="JOB">Job Postings</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-slate-50/75 dark:bg-[#121A2F] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Event Action</th>
                <th className="py-3 px-4 font-medium">Actor</th>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Details</th>
                <th className="py-3 px-4 font-medium text-right">Origin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Reading immutable audit stream...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No activity logs recorded matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr
                    key={log.id}
                    style={{ '--row-index': idx }}
                    className="animate-row-enter hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span>
                          {log.created_at
                            ? new Date(log.created_at).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })
                            : 'Just now'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{log.user_email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {formatRole(log.user_role)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <p className="line-clamp-2 max-w-md">{log.details || 'System event recorded'}</p>
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                      <div className="flex items-center justify-end gap-1">
                        <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{log.ip_address || '127.0.0.1'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
