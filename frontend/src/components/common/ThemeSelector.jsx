import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown } from 'lucide-react';
import { useTheme, THEMES } from '../../context/ThemeContext';

export default function ThemeSelector({
  variant = 'compact', // 'compact' for navbar, 'full' for settings or mobile bar
  align = 'right',
  className = ''
}) {
  const { theme, setTheme, themes = THEMES } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation & escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const currentThemeObj = themes.find(t => t.id === theme) || themes[1] || themes[0];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Trigger Button with Palette Icon */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current theme: ${currentThemeObj.name}. Click to change theme`}
        title={`Theme: ${currentThemeObj.name}`}
        className="btn-interactive inline-flex items-center gap-1.5 p-2 rounded-xl text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 select-none"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <Palette className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-bright)' }} />
        {variant !== 'icon-only' && (
          <>
            <span className="hidden sm:inline-block font-semibold tracking-tight text-xs">
              {currentThemeObj.name}
            </span>
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: currentThemeObj.accentColor }}
            />
            <ChevronDown
              className={`w-3 h-3 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {/* Floating Theme Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Color themes"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-64 rounded-2xl shadow-2xl p-1.5 z-50 animate-dropdown focus:outline-none backdrop-blur-xl`}
          style={{
            backgroundColor: 'var(--theme-dropdown-bg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b flex items-center justify-between text-[11px] font-bold uppercase tracking-wider"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)'
            }}
          >
            <span>Appearance Theme</span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent-text)'
              }}
            >
              5 Themes
            </span>
          </div>

          {/* Theme list */}
          <div className="py-1 space-y-0.5">
            {themes.map((t) => {
              const isSelected = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition-all ${
                    isSelected
                      ? 'font-bold shadow-xs'
                      : 'font-medium opacity-85 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-hover)' : 'transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Visual Color Swatch */}
                    <div
                      className="w-5 h-5 rounded-lg flex items-center justify-center p-0.5 shrink-0 shadow-xs ring-1 ring-black/10"
                      style={{
                        backgroundColor: t.surfaceColor,
                        border: `1px solid ${t.borderColor}`,
                      }}
                      title={`${t.name} preview`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: t.accentColor }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-bold truncate text-xs"
                          style={{
                            color: isSelected ? 'var(--text-primary)' : 'inherit'
                          }}
                        >
                          {t.name}
                        </span>
                        {t.id === 'emerald' && (
                          <span className="text-[9px] uppercase px-1 py-0.2 rounded font-extrabold bg-emerald-500/20 text-emerald-400">
                            Brand
                          </span>
                        )}
                      </div>
                      <p
                        className="text-[11px] truncate leading-tight mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {t.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Active Checkmark */}
                  {isSelected && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: 'var(--accent-subtle)',
                        color: 'var(--accent-bright)'
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

