import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  reducedMotion: boolean;
  screenReaderMode: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  toggleHighContrast: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleReducedMotion: () => void;
  toggleScreenReaderMode: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  fontSize: 'medium',
  reducedMotion: false,
  screenReaderMode: false,
};

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        try {
          return { ...defaultSettings, ...JSON.parse(saved) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply font size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
    root.classList.add(`font-${settings.fontSize}`);
    
    // Apply reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // Apply screen reader mode
    if (settings.screenReaderMode) {
      root.classList.add('screen-reader-mode');
    } else {
      root.classList.remove('screen-reader-mode');
    }
  }, [settings]);

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const toggleHighContrast = () => {
    updateSettings({ highContrast: !settings.highContrast });
  };

  const increaseFontSize = () => {
    const sizes: AccessibilitySettings['fontSize'][] = ['small', 'medium', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    if (currentIndex < sizes.length - 1) {
      updateSettings({ fontSize: sizes[currentIndex + 1] });
    }
  };

  const decreaseFontSize = () => {
    const sizes: AccessibilitySettings['fontSize'][] = ['small', 'medium', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    if (currentIndex > 0) {
      updateSettings({ fontSize: sizes[currentIndex - 1] });
    }
  };

  const toggleReducedMotion = () => {
    updateSettings({ reducedMotion: !settings.reducedMotion });
  };

  const toggleScreenReaderMode = () => {
    updateSettings({ screenReaderMode: !settings.screenReaderMode });
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSettings,
        toggleHighContrast,
        increaseFontSize,
        decreaseFontSize,
        toggleReducedMotion,
        toggleScreenReaderMode,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Accessibility Controls Component
export function AccessibilityControls({ className = '' }: { className?: string }) {
  const {
    settings,
    toggleHighContrast,
    increaseFontSize,
    decreaseFontSize,
    toggleReducedMotion,
    toggleScreenReaderMode,
  } = useAccessibility();

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Accessibility Settings</h3>
      
      <div className="space-y-4">
        {/* High Contrast */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">High Contrast</label>
            <p className="text-xs text-gray-500">Increase contrast for better visibility</p>
          </div>
          <button
            onClick={toggleHighContrast}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.highContrast ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={settings.highContrast}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.highContrast ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Font Size */}
        <div>
          <label className="text-sm font-medium text-gray-700">Font Size</label>
          <div className="flex items-center space-x-2 mt-2">
            <button
              onClick={decreaseFontSize}
              disabled={settings.fontSize === 'small'}
              className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              A-
            </button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {settings.fontSize.charAt(0).toUpperCase() + settings.fontSize.slice(1)}
            </span>
            <button
              onClick={increaseFontSize}
              disabled={settings.fontSize === 'xlarge'}
              className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              A+
            </button>
          </div>
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Reduced Motion</label>
            <p className="text-xs text-gray-500">Reduce animations and transitions</p>
          </div>
          <button
            onClick={toggleReducedMotion}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={settings.reducedMotion}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Screen Reader Mode */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Screen Reader Mode</label>
            <p className="text-xs text-gray-500">Enhanced screen reader support</p>
          </div>
          <button
            onClick={toggleScreenReaderMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.screenReaderMode ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={settings.screenReaderMode}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.screenReaderMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
