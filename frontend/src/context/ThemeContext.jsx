import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEME_STORAGE_KEY = 'hirenova_theme';

export const THEMES = [
  {
    id: 'light',
    name: 'Light',
    tagline: 'Warm White & Emerald',
    description: 'Clean warm-white backgrounds, dark readable text, subtle gray borders, emerald accents.',
    accentColor: '#059669',
    surfaceColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    type: 'light',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    tagline: 'Obsidian & Metallic Emerald',
    description: 'Signature obsidian and metallic diagonal emerald bands with luminous mint highlights.',
    accentColor: '#34D399',
    surfaceColor: '#0B1210',
    borderColor: 'rgba(52, 211, 153, 0.35)',
    type: 'dark',
  },
  {
    id: 'purple',
    name: 'Purple',
    tagline: 'Obsidian & Neon Purple',
    description: 'Deep obsidian surfaces with radiant neon purple curves and metallic violet highlights.',
    accentColor: '#C084FC',
    surfaceColor: '#120A1C',
    borderColor: 'rgba(192, 132, 252, 0.35)',
    type: 'dark',
  },
  {
    id: 'gold',
    name: 'Gold',
    tagline: 'Charcoal & Metallic Gold Bands',
    description: 'Dark charcoal surfaces with diagonal gold bands, stippled gold accents, and champagne glow.',
    accentColor: '#FBBF24',
    surfaceColor: '#12141A',
    borderColor: 'rgba(251, 191, 36, 0.35)',
    type: 'dark',
  },
  {
    id: 'orange',
    name: 'Orange',
    tagline: 'Obsidian & Copper Waves',
    description: 'Deep obsidian surfaces with flowing copper metallic waves and bright amber highlights.',
    accentColor: '#FB923C',
    surfaceColor: '#160B07',
    borderColor: 'rgba(251, 146, 60, 0.35)',
    type: 'dark',
  },
];

const VALID_THEME_IDS = THEMES.map(t => t.id);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) ||
                         localStorage.getItem('hirenova_preferred_theme') ||
                         localStorage.getItem('airecruitx_theme') ||
                         localStorage.getItem('reqretx_theme');
      if (savedTheme && VALID_THEME_IDS.includes(savedTheme)) {
        return savedTheme;
      }
      // Migrate legacy 5-theme entries if previously stored
      if (savedTheme === 'dark' || savedTheme === 'dim') {
        return 'emerald';
      }
      if (savedTheme === 'rose') {
        return 'purple';
      }
      if (savedTheme === 'light') {
        return 'light';
      }
    } catch (e) {
      // Ignore localStorage access errors
    }
    return 'emerald'; // Default HireNova branding is signature emerald
  });

  // Apply theme to DOM (data-theme attribute and dark/light classes) and save to localStorage
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      // Ignore storage errors
    }
  }, [theme]);

  // Optional: Listen to OS system color-scheme changes if no manual preference stored
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      try {
        const hasSavedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (!hasSavedTheme) {
          setTheme(e.matches ? 'emerald' : 'light');
        }
      } catch (err) {
        // Ignore
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const toggleTheme = () => {
    // Quick toggle switches between light and signature emerald (or cycles)
    setTheme(prev => (prev === 'light' ? 'emerald' : 'light'));
  };

  const isDark = theme !== 'light';
  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[1];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
        toggleTheme,
        themes: THEMES,
        currentTheme: currentThemeObj
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
