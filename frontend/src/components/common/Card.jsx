import React from 'react';

/**
 * Structural Content Container
 * Uses hairline borders, crisp typography, and dark navy surfaces.
 */
export function Card({ children, className = '', header, title, subtitle, action, footer, noPadding = false }) {
  return (
    <div className={`bg-[#0B1210]/90 border border-emerald-500/15 rounded-2xl shadow-sm backdrop-blur-md transition-all text-[#F8FAFC] ${className}`}>
      {(header || title) && (
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h3 className="font-display font-bold text-[#F8FAFC] text-sm tracking-tight truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#94A3A8] mt-0.5 tracking-tight truncate font-sans">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-[#050807]/80 border-t border-white/[0.06] rounded-b-2xl text-xs text-[#94A3A8]">
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * Editorial Metric Block
 */
export function StatCard({ title, value, change, icon: Icon, color, subtext, className = '' }) {
  return (
    <div className={`bg-[#0B1210]/90 border border-emerald-500/15 rounded-2xl p-4 shadow-sm backdrop-blur-md flex flex-col justify-between text-[#F8FAFC] ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3A8]">
          {title}
        </span>
        {Icon && <Icon className="w-4 h-4 text-[#34D399] shrink-0" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-display font-extrabold text-[#F8FAFC] tracking-tight tabular-nums">
          {value}
        </span>
      </div>
      {(subtext || change) && (
        <div className="mt-1 text-[11px] text-[#94A3A8] font-sans tracking-tight">
          {subtext || change}
        </div>
      )}
    </div>
  );
}

/**
 * Horizontal Metric Strip Cell
 */
export function MetricStripItem({ label, value, subtext, isLast = false }) {
  return (
    <div className={`flex-1 py-3 px-4 sm:px-6 ${!isLast ? 'border-b sm:border-b-0 sm:border-r border-navy-800' : ''}`}>
      <div className="text-[11px] font-mono uppercase tracking-wider text-navy-400">
        {label}
      </div>
      <div className="text-2xl font-display font-extrabold text-white mt-1 tabular-nums tracking-tight">
        {value}
      </div>
      {subtext && (
        <div className="text-[11px] text-navy-500 mt-0.5 tracking-tight font-sans">
          {subtext}
        </div>
      )}
    </div>
  );
}

export function LoadingSkeleton({ lines = 4, className = '' }) {
  return (
    <div className={`animate-pulse space-y-2.5 ${className}`}>
      <div className="h-3.5 bg-navy-800 rounded w-1/4"></div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-navy-900 rounded w-full"></div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-8 bg-navy-850 rounded w-full"></div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="h-10 bg-navy-900 border-b border-navy-800 flex gap-4 px-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-2.5 bg-navy-800 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}
