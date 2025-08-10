import React, { useEffect, useState, useCallback } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';
import { AccessibleModal } from './AccessibleModal';

// Keyboard shortcut types
export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  action: () => void;
  category: 'navigation' | 'editing' | 'accessibility' | 'general';
  enabled?: boolean;
}

interface KeyboardShortcutsProps {
  shortcuts?: KeyboardShortcut[];
  showHelp?: boolean;
  onToggleHelp?: () => void;
}

// Default keyboard shortcuts
const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation shortcuts
  {
    id: 'help',
    keys: ['?'],
    description: 'Show keyboard shortcuts help',
    action: () => {},
    category: 'general',
  },
  {
    id: 'escape',
    keys: ['Escape'],
    description: 'Close modal or cancel current action',
    action: () => {},
    category: 'navigation',
  },
  {
    id: 'focus-search',
    keys: ['/', 'Ctrl+K'],
    description: 'Focus search input',
    action: () => {},
    category: 'navigation',
  },
  
  // Accessibility shortcuts
  {
    id: 'toggle-high-contrast',
    keys: ['Alt+H'],
    description: 'Toggle high contrast mode',
    action: () => {},
    category: 'accessibility',
  },
  {
    id: 'increase-font-size',
    keys: ['Ctrl+='],
    description: 'Increase font size',
    action: () => {},
    category: 'accessibility',
  },
  {
    id: 'decrease-font-size',
    keys: ['Ctrl+-'],
    description: 'Decrease font size',
    action: () => {},
    category: 'accessibility',
  },
  
  // General shortcuts
  {
    id: 'save',
    keys: ['Ctrl+S'],
    description: 'Save current changes',
    action: () => {},
    category: 'editing',
  },
  {
    id: 'undo',
    keys: ['Ctrl+Z'],
    description: 'Undo last action',
    action: () => {},
    category: 'editing',
  },
  {
    id: 'redo',
    keys: ['Ctrl+Y', 'Ctrl+Shift+Z'],
    description: 'Redo last undone action',
    action: () => {},
    category: 'editing',
  },
];

export function KeyboardShortcuts({ 
  shortcuts = DEFAULT_SHORTCUTS, 
  showHelp = false, 
  onToggleHelp 
}: KeyboardShortcutsProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(showHelp);
  const [activeShortcuts, setActiveShortcuts] = useState<KeyboardShortcut[]>(shortcuts);
  const { announceToScreenReader, toggleHighContrast, setFontSize, preferences } = useAccessibility();

  // Update shortcuts with accessibility actions
  useEffect(() => {
    const updatedShortcuts = shortcuts.map(shortcut => {
      switch (shortcut.id) {
        case 'help':
          return { ...shortcut, action: () => setIsHelpOpen(true) };
        case 'toggle-high-contrast':
          return { ...shortcut, action: toggleHighContrast };
        case 'increase-font-size':
          return { 
            ...shortcut, 
            action: () => {
              const sizes: Array<typeof preferences.fontSize> = ['small', 'medium', 'large', 'extra-large'];
              const currentIndex = sizes.indexOf(preferences.fontSize);
              const nextIndex = Math.min(currentIndex + 1, sizes.length - 1);
              setFontSize(sizes[nextIndex]);
              announceToScreenReader(`Font size increased to ${sizes[nextIndex]}`, 'polite');
            }
          };
        case 'decrease-font-size':
          return { 
            ...shortcut, 
            action: () => {
              const sizes: Array<typeof preferences.fontSize> = ['small', 'medium', 'large', 'extra-large'];
              const currentIndex = sizes.indexOf(preferences.fontSize);
              const nextIndex = Math.max(currentIndex - 1, 0);
              setFontSize(sizes[nextIndex]);
              announceToScreenReader(`Font size decreased to ${sizes[nextIndex]}`, 'polite');
            }
          };
        default:
          return shortcut;
      }
    });
    
    setActiveShortcuts(updatedShortcuts);
  }, [shortcuts, toggleHighContrast, setFontSize, preferences.fontSize, announceToScreenReader]);

  // Parse key combination
  const parseKeyCombo = useCallback((keys: string): { 
    ctrl: boolean; 
    alt: boolean; 
    shift: boolean; 
    meta: boolean; 
    key: string; 
  } => {
    const parts = keys.toLowerCase().split('+');
    return {
      ctrl: parts.includes('ctrl'),
      alt: parts.includes('alt'),
      shift: parts.includes('shift'),
      meta: parts.includes('meta') || parts.includes('cmd'),
      key: parts[parts.length - 1],
    };
  }, []);

  // Check if key event matches shortcut
  const matchesShortcut = useCallback((event: KeyboardEvent, keys: string[]): boolean => {
    return keys.some(keyCombo => {
      const parsed = parseKeyCombo(keyCombo);
      const eventKey = event.key.toLowerCase();
      
      // Handle special keys
      let targetKey = parsed.key;
      if (targetKey === '=' && event.key === '=') targetKey = '=';
      if (targetKey === '-' && event.key === '-') targetKey = '-';
      if (targetKey === '/' && event.key === '/') targetKey = '/';
      if (targetKey === '?' && event.key === '?') targetKey = '?';
      
      return (
        event.ctrlKey === parsed.ctrl &&
        event.altKey === parsed.alt &&
        event.shiftKey === parsed.shift &&
        event.metaKey === parsed.meta &&
        (eventKey === targetKey || eventKey === parsed.key)
      );
    });
  }, [parseKeyCombo]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      for (const shortcut of activeShortcuts) {
        if (shortcut.enabled !== false && matchesShortcut(event, shortcut.keys)) {
          event.preventDefault();
          shortcut.action();
          announceToScreenReader(`Keyboard shortcut activated: ${shortcut.description}`, 'polite');
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeShortcuts, matchesShortcut, announceToScreenReader]);

  // Format key combination for display
  const formatKeys = (keys: string[]): string => {
    return keys.map(keyCombo => {
      return keyCombo
        .split('+')
        .map(key => {
          switch (key.toLowerCase()) {
            case 'ctrl': return '⌃';
            case 'alt': return '⌥';
            case 'shift': return '⇧';
            case 'meta':
            case 'cmd': return '⌘';
            case 'escape': return 'Esc';
            case 'enter': return '↵';
            case 'space': return 'Space';
            default: return key.toUpperCase();
          }
        })
        .join('');
    }).join(' or ');
  };

  // Group shortcuts by category
  const groupedShortcuts = activeShortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, KeyboardShortcut[]>);

  const categoryLabels = {
    navigation: 'Navigation',
    editing: 'Editing',
    accessibility: 'Accessibility',
    general: 'General',
  };

  return (
    <>
      {/* Help Modal */}
      <AccessibleModal
        isOpen={isHelpOpen}
        onClose={() => {
          setIsHelpOpen(false);
          onToggleHelp?.();
        }}
        title="Keyboard Shortcuts"
        size="lg"
      >
        <div className="space-y-6">
          <p className="text-gray-600">
            Use these keyboard shortcuts to navigate and interact with the application more efficiently.
          </p>
          
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h3>
              
              <div className="space-y-2">
                {shortcuts.map(shortcut => (
                  <div 
                    key={shortcut.id}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50"
                  >
                    <span className="text-gray-700 flex-1">
                      {shortcut.description}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((keyCombo, index) => (
                        <React.Fragment key={keyCombo}>
                          {index > 0 && (
                            <span className="text-gray-400 text-sm mx-1">or</span>
                          )}
                          <kbd className="inline-flex items-center px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                            {formatKeys([keyCombo])}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Press <kbd className="px-1 py-0.5 text-xs bg-gray-100 border rounded">?</kbd> to show this help dialog again.
            </p>
          </div>
        </div>
      </AccessibleModal>

      {/* Skip link for screen readers */}
      <a
        href="#main-content"
        className="skip-link"
        onFocus={() => announceToScreenReader('Skip to main content link focused', 'polite')}
      >
        Skip to main content
      </a>
    </>
  );
}

// Hook for using keyboard shortcuts in components
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const [registeredShortcuts, setRegisteredShortcuts] = useState<KeyboardShortcut[]>([]);

  useEffect(() => {
    setRegisteredShortcuts(shortcuts);
  }, [shortcuts]);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setRegisteredShortcuts(prev => [...prev, shortcut]);
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setRegisteredShortcuts(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    shortcuts: registeredShortcuts,
    registerShortcut,
    unregisterShortcut,
  };
}
