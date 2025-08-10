import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useMobile } from '@/hooks/useMobile';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorScheme = 'blue' | 'purple' | 'green' | 'orange';

export interface ThemeConfig {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
}

export interface ThemeContextValue {
  // Current theme state
  theme: ThemeConfig;
  isDark: boolean;
  
  // Theme actions
  setThemeMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  setFontSize: (size: ThemeConfig['fontSize']) => void;
  
  // Utility functions
  getThemeClasses: () => string;
  resetToDefaults: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Partial<ThemeConfig>;
}

const DEFAULT_THEME: ThemeConfig = {
  mode: 'auto',
  colorScheme: 'blue',
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
};

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeConfig>(() => ({
    ...DEFAULT_THEME,
    ...defaultTheme,
  }));
  
  const [isDark, setIsDark] = useState(false);
  const { preferences, toggleHighContrast: toggleA11yHighContrast, setFontSize: setA11yFontSize } = useAccessibility();
  const { isMobile } = useMobile();

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedTheme = localStorage.getItem('theme-config');
      if (savedTheme) {
        const parsed = JSON.parse(savedTheme);
        setTheme(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('theme-config', JSON.stringify(theme));
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [theme]);

  // Sync with accessibility preferences
  useEffect(() => {
    setTheme(prev => ({
      ...prev,
      highContrast: preferences.highContrast,
      reducedMotion: preferences.reducedMotion,
      fontSize: preferences.fontSize,
    }));
  }, [preferences]);

  // Determine if dark mode should be active
  useEffect(() => {
    if (theme.mode === 'dark') {
      setIsDark(true);
    } else if (theme.mode === 'light') {
      setIsDark(false);
    } else {
      // Auto mode - check system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme.mode]);

  // Apply theme classes to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'theme-blue', 'theme-purple', 'theme-green', 'theme-orange');
    
    // Apply current theme classes
    root.classList.add(isDark ? 'dark' : 'light');
    root.classList.add(`theme-${theme.colorScheme}`);
    
    // Apply mobile-specific classes
    if (isMobile) {
      root.classList.add('mobile');
    } else {
      root.classList.remove('mobile');
    }
  }, [isDark, theme.colorScheme, isMobile]);

  // Theme action handlers
  const setThemeMode = (mode: ThemeMode) => {
    setTheme(prev => ({ ...prev, mode }));
  };

  const setColorScheme = (colorScheme: ColorScheme) => {
    setTheme(prev => ({ ...prev, colorScheme }));
  };

  const toggleHighContrast = () => {
    toggleA11yHighContrast();
  };

  const toggleReducedMotion = () => {
    setTheme(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const setFontSize = (fontSize: ThemeConfig['fontSize']) => {
    setA11yFontSize(fontSize);
  };

  const getThemeClasses = (): string => {
    const classes = [];
    
    if (isDark) classes.push('dark');
    else classes.push('light');
    
    classes.push(`theme-${theme.colorScheme}`);
    
    if (theme.highContrast) classes.push('high-contrast');
    if (theme.reducedMotion) classes.push('reduce-motion');
    if (isMobile) classes.push('mobile');
    
    classes.push(`font-${theme.fontSize}`);
    
    return classes.join(' ');
  };

  const resetToDefaults = () => {
    setTheme(DEFAULT_THEME);
  };

  const contextValue: ThemeContextValue = {
    theme,
    isDark,
    setThemeMode,
    setColorScheme,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    getThemeClasses,
    resetToDefaults,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Theme selector component
export function ThemeSelector() {
  const { theme, setThemeMode, setColorScheme, toggleHighContrast, setFontSize } = useTheme();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Theme Mode
        </label>
        <select
          value={theme.mode}
          onChange={(e) => setThemeMode(e.target.value as ThemeMode)}
          className="input-primary"
          aria-label="Select theme mode"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto (System)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color Scheme
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['blue', 'purple', 'green', 'orange'] as ColorScheme[]).map((color) => (
            <button
              key={color}
              onClick={() => setColorScheme(color)}
              className={`p-3 rounded-md border-2 transition-colors ${
                theme.colorScheme === color
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-label={`Select ${color} color scheme`}
              aria-pressed={theme.colorScheme === color}
            >
              <div className={`w-4 h-4 rounded-full mx-auto bg-${color}-500`} />
              <span className="text-xs mt-1 block capitalize">{color}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Font Size
        </label>
        <select
          value={theme.fontSize}
          onChange={(e) => setFontSize(e.target.value as ThemeConfig['fontSize'])}
          className="input-primary"
          aria-label="Select font size"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="extra-large">Extra Large</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={theme.highContrast}
            onChange={toggleHighContrast}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            aria-describedby="high-contrast-description"
          />
          <span className="ml-2 text-sm text-gray-700">High Contrast Mode</span>
        </label>
        <p id="high-contrast-description" className="text-xs text-gray-500">
          Increases color contrast for better visibility
        </p>
      </div>
    </div>
  );
}
