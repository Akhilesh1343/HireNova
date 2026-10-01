import React from 'react';

/**
 * HireNova Status & Alignment Badge
 * Clear, restrained indicators without loud cartoonish pills.
 * Styled with HireNova Electric Cyan, Electric Violet, and Warm Orange accents.
 */
export function RecommendationBadge({ recommendation, size = 'sm' }) {
  const rec = (recommendation || '').toLowerCase();

  let badgeStyle = 'border-slate-200 dark:border-navy-700 text-slate-600 dark:text-navy-400 bg-slate-100 dark:bg-navy-850';
  let dotStyle = 'bg-slate-400 dark:bg-navy-500';
  let label = recommendation || 'Unranked';

  if (rec.includes('strong')) {
    badgeStyle = 'border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40';
    dotStyle = 'bg-emerald-500';
    label = 'Strong Match';
  } else if (rec.includes('good')) {
    badgeStyle = 'border-sky-200 dark:border-cyan-500/30 text-sky-700 dark:text-cyan-300 bg-sky-50 dark:bg-cyan-950/40';
    dotStyle = 'bg-sky-500';
    label = 'Good Match';
  } else if (rec.includes('moderate')) {
    badgeStyle = 'border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40';
    dotStyle = 'bg-amber-500';
    label = 'Moderate Match';
  } else if (rec.includes('low') || rec.includes('unmatched') || rec.includes('review')) {
    badgeStyle = 'border-slate-200 dark:border-navy-700 text-slate-600 dark:text-navy-400 bg-slate-100 dark:bg-navy-850';
    dotStyle = 'bg-slate-400';
    label = 'Low Match';
  }

  const sizeClass = size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium border rounded-md ${badgeStyle} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle}`} />
      <span>{label}</span>
    </span>
  );
}

/**
 * Technical Role Domain Tag
 */
export function CategoryBadge({ category, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono rounded border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-cyan-300 bg-slate-100 dark:bg-navy-850 ${className}`}>
      {category || 'GENERAL'}
    </span>
  );
}

/**
 * Technical Skill Item
 */
export function SkillTag({ name, matched = true, onRemove }) {
  if (matched) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-sky-200 dark:border-cyan-500/30 bg-sky-50 dark:bg-cyan-950/40 text-sky-700 dark:text-cyan-200 text-xs">
        <span className="text-sky-600 dark:text-cyan-400 font-bold">✓</span>
        <span>{name}</span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="ml-1 text-sky-500 dark:text-cyan-400/70 hover:text-red-500 focus:outline-none"
            title="Remove skill"
          >
            &times;
          </button>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 dark:border-navy-800 bg-slate-100 dark:bg-navy-900/60 text-slate-500 dark:text-navy-400 text-xs line-through">
      <span>{name}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-navy-200 focus:outline-none"
          title="Remove skill"
        >
          &times;
        </button>
      )}
    </span>
  );
}
