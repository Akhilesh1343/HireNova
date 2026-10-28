import React from 'react';

/**
 * Theme-aware Structural Content Container
 * Uses semantic CSS variables for instant 5-theme compatibility.
 */
export function Card({ children, className = '', header, title, subtitle, action, footer, noPadding = false }) {
  return (
    <div
      className={`theme-card rounded-2xl shadow-xs transition-all border ${className}`}
      style={{
        backgroundColor: 'var(--theme-card-bg)',
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-primary)',
      }}
    >
      {(header || title) && (
        <div
          className="px-5 py-3.5 border-b flex items-center justify-between gap-4"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="min-w-0">
            {title && (
              <h3
                className="font-display font-bold text-sm tracking-tight truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                className="text-xs mt-0.5 tracking-tight truncate font-sans"
                style={{ color: 'var(--text-secondary)' }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
      {footer && (
        <div
          className="px-5 py-3 border-t rounded-b-2xl text-xs font-medium"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * Theme-aware Editorial Metric Block
 */
export function StatCard({ title, value, change, icon: Icon, color, subtext, className = '' }) {
  return (
    <div
      className={`theme-card rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between border ${className}`}
      style={{
        backgroundColor: 'var(--theme-card-bg)',
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-primary)',
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          {title}
        </span>
        {Icon && (
          <Icon
            className="w-4 h-4 shrink-0"
            style={{ color: 'var(--accent-bright)' }}
          />
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className="text-2xl font-display font-extrabold tracking-tight tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </span>
      </div>
      {(subtext || change) && (
        <div
          className="mt-1 text-[11px] font-sans tracking-tight"
          style={{ color: 'var(--text-muted)' }}
        >
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
    <div
      className={`flex-1 py-3 px-4 sm:px-6 ${!isLast ? 'border-b sm:border-b-0 sm:border-r' : ''}`}
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <div
        className="text-[11px] font-mono uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </div>
      <div
        className="text-2xl font-display font-extrabold mt-1 tabular-nums tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </div>
      {subtext && (
        <div
          className="text-[11px] mt-0.5 tracking-tight font-sans"
          style={{ color: 'var(--text-secondary)' }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
}

export function LoadingSkeleton({ lines = 4, className = '' }) {
  return (
    <div className={`animate-pulse space-y-2.5 ${className}`}>
      <div
        className="h-3.5 rounded w-1/4"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded w-full"
          style={{ backgroundColor: 'var(--bg-hover)' }}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="animate-pulse space-y-2">
      <div
        className="h-8 rounded w-full"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      />
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="h-10 border-b flex gap-4 px-4 items-center"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-2.5 rounded flex-1"
              style={{ backgroundColor: 'var(--bg-hover)' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
