import React, { ReactNode, useState } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useAppStore } from '@/stores/useAppStore';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserMenu } from './UserMenu';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuthContext();
  const { currentCampaign } = useAppStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  🎲 DnD Wizard
                </h1>
              </div>
              {currentCampaign && (
                <div className="ml-6 flex items-center">
                  <span className="text-sm text-gray-500">Campaign:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {currentCampaign.title}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <UserMenu user={user} />
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
