import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, LogIn } from 'lucide-react';
import { formatRole } from '../../utils/rbac';

export default function AccessRestricted({ currentRole, onBackToDashboard, onSignIn }) {
  const isGuest = !currentRole;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div
        className="max-w-md w-full text-center p-8 rounded-2xl shadow-2xl space-y-5 animate-modal backdrop-blur-xl border theme-card"
        style={{
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Shield Icon */}
        <div
          className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto shadow-xs`}
          style={{
            backgroundColor: isGuest ? 'var(--accent-subtle)' : 'rgba(245, 158, 11, 0.12)',
            borderColor: isGuest ? 'var(--border-subtle)' : 'rgba(245, 158, 11, 0.3)',
            color: isGuest ? 'var(--accent-bright)' : '#F59E0B'
          }}
        >
          {isGuest ? <Lock className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {isGuest ? 'Authentication Required' : 'Access Restricted'}
          </h2>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {isGuest
              ? 'Please sign in with your recruiter, hiring manager, or HR account to access this page.'
              : "Your current account role does not have permission to access this feature."}
          </p>
          <div className="pt-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <Lock className="w-3 h-3" style={{ color: 'var(--accent-bright)' }} />
              <span>Current Status: <strong style={{ color: 'var(--text-primary)' }}>{formatRole(currentRole)}</strong></span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          {isGuest && onSignIn && (
            <button
              onClick={onSignIn}
              className="w-full py-2.5 px-4 text-xs font-bold text-white rounded-xl shadow-md inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              style={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Continue</span>
            </button>
          )}
          <button
            onClick={onBackToDashboard}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl inline-flex items-center justify-center gap-2 transition-all border hover:opacity-90"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}

