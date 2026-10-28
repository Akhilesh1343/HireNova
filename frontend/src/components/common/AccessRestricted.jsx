import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, LogIn } from 'lucide-react';
import { formatRole } from '../../utils/rbac';

export default function AccessRestricted({ currentRole, onBackToDashboard, onSignIn }) {
  const isGuest = !currentRole;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center p-8 bg-[#0B1210]/95 border border-emerald-500/20 rounded-2xl shadow-2xl space-y-5 animate-modal backdrop-blur-xl">
        {/* Shield Icon */}
        <div className={`w-14 h-14 rounded-2xl ${isGuest ? 'bg-emerald-950/40 border border-emerald-500/30 text-[#34D399]' : 'bg-amber-950/50 border border-amber-800/80 text-amber-400'} flex items-center justify-center mx-auto shadow-sm`}>
          {isGuest ? <Lock className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#F8FAFC] tracking-tight">
            {isGuest ? 'Authentication Required' : 'Access Restricted'}
          </h2>
          <p className="text-sm font-medium text-[#94A3A8]">
            {isGuest
              ? 'Please sign in with your recruiter, hiring manager, or HR account to access this page.'
              : "Your current account role does not have permission to access this feature."}
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#131F1B] text-[#94A3A8] border border-emerald-500/15">
              <Lock className="w-3 h-3 text-[#34D399]" />
              <span>Current Status: <strong className="text-[#F8FAFC]">{formatRole(currentRole)}</strong></span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          {isGuest && onSignIn && (
            <button
              onClick={onSignIn}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] rounded-xl shadow-md shadow-emerald-700/25 inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Continue</span>
            </button>
          )}
          <button
            onClick={onBackToDashboard}
            className="w-full py-2.5 px-4 text-xs font-semibold text-[#94A3A8] hover:text-white bg-[#131F1B] hover:bg-[#182A24] border border-emerald-500/15 rounded-xl inline-flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}

