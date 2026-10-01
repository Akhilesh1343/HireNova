import React from 'react';
import AnimatedNumber from './AnimatedNumber';

/**
 * HireNova Match Score Indicator
 * Architectural circular meter with restrained stroke, glow, and tabular figures.
 */
export default function ScoreDial({ score, size = 120, strokeWidth = 5, label = "MATCH SCORE" }) {
  const normalizedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let strokeColor = '#475569'; // navy-500 (low)
  let scoreClass = 'text-navy-300';
  let filterGlow = 'none';

  if (normalizedScore >= 70) {
    strokeColor = '#4FD1FF'; // Electric Cyan
    scoreClass = 'text-cyan-300';
    filterGlow = 'drop-shadow(0 0 6px rgba(79, 209, 255, 0.5))';
  } else if (normalizedScore >= 50) {
    strokeColor = '#8B5CF6'; // Electric Violet
    scoreClass = 'text-violet-300';
    filterGlow = 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.5))';
  } else if (normalizedScore >= 30) {
    strokeColor = '#FF6B35'; // Warm Orange
    scoreClass = 'text-orange-300';
    filterGlow = 'drop-shadow(0 0 6px rgba(255, 107, 53, 0.4))';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Subtle Hairline Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1A2642"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active Stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ filter: filterGlow }}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Central Metric Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-2xl font-display font-bold tracking-tight ${scoreClass} tabular-nums leading-none`}>
            <AnimatedNumber value={Math.round(normalizedScore)} duration={400} />%
          </span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-navy-400 mt-1">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
