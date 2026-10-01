import React from 'react';

/**
 * Structural Content Container
 * Uses hairline borders, crisp typography, and dark navy surfaces.
 */
export function Card({ children, className = '', header, title, subtitle, action, footer, noPadding = false }) {
  return (
    <div className={`bg-navy-900 border border-navy-800 rounded-xl shadow-card-dark ${className}`}>
      {(header || title) && (
        <div className="px-5 py-3.5 border-b border-navy-800 flex items-center justify-between gap-4 bg-navy-900/60">
          <div className="min-w-0">
            {title && (
              <h3 className="font-display font-bold text-white text-sm tracking-tight truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-navy-400 mt-0.5 tracking-tight truncate font-sans">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-navy-950 border-t border-navy-800 rounded-b-xl text-xs text-navy-400">
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
    <div className={`bg-navy-900 border border-navy-800 rounded-xl p-4 shadow-card-dark flex flex-col justify-between ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-navy-400">
          {title}
        </span>
        {Icon && <Icon className="w-3.5 h-3.5 text-navy-500 shrink-0" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-display font-extrabold text-white tracking-tight tabular-nums">
          {value}
        </span>
      </div>
      {(subtext || change) && (
        <div className="mt-1 text-[11px] text-navy-400 font-sans tracking-tight">
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
