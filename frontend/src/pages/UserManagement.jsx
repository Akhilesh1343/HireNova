import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Search,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Building,
  Mail,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { getUsersApi, updateUserRoleApi } from '../services/api';
import { ROLES, formatRole } from '../utils/rbac';
import { useAuth } from '../context/AuthContext';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsersApi();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load system users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    setSuccessMsg('');
    setError(null);
    try {
      const updated = await updateUserRoleApi(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u))
      );
      setSuccessMsg(`Successfully updated role to ${formatRole(newRole)}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update user role.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.company_name?.toLowerCase().includes(q)
    );
  });

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
      case 'recruiter':
        return 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
      case 'hiring_manager':
        return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
      case 'hr_lead':
        return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              User & Role Management
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
              Admin Only
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Govern workspace access, assign permissions across the 4 canonical roles, and maintain system integrity.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="btn-interactive inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/80">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/80">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, company, or role..."
            className="w-full pl-8 pr-4 py-2 text-xs bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredUsers.length}</span> registered accounts
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-slate-50/75 dark:bg-[#121A2F] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-medium">User Profile</th>
                <th className="py-3 px-4 font-medium">Organization</th>
                <th className="py-3 px-4 font-medium">Current Role</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Joined</th>
                <th className="py-3 px-4 font-medium text-right">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Loading user directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const isSelf = currentUser?.id === u.id || currentUser?.email === u.email;
                  return (
                    <tr
                      key={u.id}
                      style={{ '--row-index': idx }}
                      className="animate-row-enter hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center shrink-0">
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : <UserCheck className="w-4 h-4" />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                              {u.full_name}
                              {isSelf && (
                                <span className="ml-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">
                                  (You)
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{u.email}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.company_name || 'HireNova Enterprise'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getRoleBadge(u.role)}`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {formatRole(u.role)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          u.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60'
                        }`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>
                            {u.created_at
                              ? new Date(u.created_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'System Initial'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={u.role?.toLowerCase()}
                          disabled={updatingId === u.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121A2F] text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                        >
                          <option value={ROLES.ADMIN}>Admin</option>
                          <option value={ROLES.RECRUITER}>Recruiter</option>
                          <option value={ROLES.HIRING_MANAGER}>Hiring Manager</option>
                          <option value={ROLES.HR_LEAD}>HR Lead</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
