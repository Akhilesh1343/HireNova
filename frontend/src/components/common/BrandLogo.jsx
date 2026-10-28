import React from 'react';

/**
 * HireNova Official Brand Logo Mark (Turquoise/Cyan Gradient H)
 * Renders the official brand icon with object-fit: contain and proportional sizing.
 */
export default function BrandLogo({
  className = 'w-8 h-8',
  alt = 'HireNova Logo',
  withContainer = false,
  containerClassName = ''
}) {
  const imageElement = (
    <img
      src="/assets/hirenova-logo.png"
      alt={alt}
      className={`object-contain select-none ${className}`}
      draggable={false}
      loading="eager"
    />
  );

  if (withContainer) {
    return (
      <div
        className={`rounded-xl border p-1.5 flex items-center justify-center shadow-xs shrink-0 ${containerClassName}`}
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {imageElement}
      </div>
    );
  }

  return imageElement;
}
