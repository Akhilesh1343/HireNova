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
        className={`rounded-xl bg-white/80 dark:bg-[#0E1526]/90 border border-[#EAE7F4] dark:border-white/[0.08] p-1.5 flex items-center justify-center shadow-sm shrink-0 ${containerClassName}`}
      >
        {imageElement}
      </div>
    );
  }

  return imageElement;
}
