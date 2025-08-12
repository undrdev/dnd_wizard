import React, { ReactNode, useState } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useAppStore } from '@/stores/useAppStore';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserMenu } from './UserMenu';
import { ThemeProvider } from './ThemeProvider';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useMobile } from '@/hooks/useMobile';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuthContext();
  const { currentCampaign } = useAppStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const { announceToScreenReader } = useAccessibility();
  const { isMobile, getTouchTargetSize } = useMobile();

  const touchTargetSize = getTouchTargetSize();

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 safe-area-inset-top safe-area-inset-bottom">
        {/* Keyboard Shortcuts */}
        <KeyboardShortcuts
          showHelp={showKeyboardHelp}
          onToggleHelp={() => setShowKeyboardHelp(!showKeyboardHelp)}
        />

        {/* Navigation */}
        <nav
          className="bg-white shadow-sm border-b safe-area-inset-left safe-area-inset-right"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center min-w-0 flex-1">
                <div className="flex-shrink-0">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                    <span role="img" aria-label="Dice">🎲</span> 
                    <span className="hidden sm:inline"> DnD Wizard</span>
                    <span className="sm:hidden"> DnD</span>
                  </h1>
                </div>
                {currentCampaign && (
                  <div className="ml-2 sm:ml-6 flex items-center min-w-0">
                    <span className="hidden sm:inline text-sm text-gray-500">Campaign:</span>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {currentCampaign.title}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {/* Accessibility Settings Button */}
                <button
                  onClick={() => setShowKeyboardHelp(true)}
                  className={`p-2 text-gray-500 hover:text-gray-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    isMobile ? `min-w-[${touchTargetSize}px] min-h-[${touchTargetSize}px]` : ''
                  }`}
                  aria-label="Show accessibility settings and keyboard shortcuts"
                  title="Accessibility Settings"
                >
                  <span className="sr-only">Accessibility Settings</span>
                  ⚙️
                </button>

                {user ? (
                  <UserMenu />
                ) : (
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      announceToScreenReader('Sign in modal opened', 'polite');
                    }}
                    className={`bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      isMobile ? `min-h-[${touchTargetSize}px]` : ''
                    }`}
                    aria-label="Sign in to your account"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main
          id="main-content"
          className="flex-1"
          role="main"
          aria-label="Main content"
        >
          {children}
        </main>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            announceToScreenReader('Sign in modal closed', 'polite');
          }}
        />
      </div>
    </ThemeProvider>
  );
}
