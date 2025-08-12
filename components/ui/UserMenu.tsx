import React, { useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { AISettingsModal } from '@/components/ai/AISettingsModal';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  if (!user) return null;

  return (
    <>
      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || user.email || 'User'}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <UserCircleIcon className="w-8 h-8" />
          )}
        </Menu.Button>

        <Transition
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setShowSettings(true)}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                >
                  <Cog6ToothIcon className="w-4 h-4 mr-2" />
                  Settings
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={signOut}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>

      <AISettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
