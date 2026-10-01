import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { formatRole } from '../../utils/rbac';

export default function AccessRestricted({ currentRole = 'Recruiter', onBackToDashboard }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center p-8 bg-white dark:bg-[#0E1424] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl space-y-5 animate-modal">
        {/* Shield Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-7 h-7" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Access Restricted
          </h2>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            You don't have permission to access this section.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <Lock className="w-3 h-3" />
              <span>Current Role: <strong className="text-slate-900 dark:text-slate-200">{formatRole(currentRole)}</strong></span>
            </span>
          </div>
        </div>

        {/* Action */}
        <div className="pt-2">
          <button
            onClick={onBackToDashboard}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm btn-interactive inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
