import React, { useState } from 'react';
import { Menu } from '@headlessui/react';
import { ChevronDownIcon, UserIcon, CogIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuthContext } from '@/components/auth/AuthProvider';
import type { User } from '@/types';

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const { logout } = useAuthContext();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <div className="flex items-center">
            {user.photoURL ? (
              <img
                className="h-6 w-6 rounded-full mr-2"
                src={user.photoURL}
                alt={user.displayName || user.email}
              />
            ) : (
              <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
            )}
            <span className="truncate max-w-32">
              {user.displayName || user.email}
            </span>
          </div>
          <ChevronDownIcon className="h-4 w-4 ml-2 text-gray-400" />
        </Menu.Button>
      </div>

      <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <div className="px-4 py-3">
          <p className="text-sm text-gray-900">Signed in as</p>
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.email}
          </p>
        </div>

        <div className="py-1">
          <Menu.Item>
            {({ active }) => (
              <button
                className={`${
                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } group flex items-center w-full px-4 py-2 text-sm`}
                onClick={() => {
                  // TODO: Implement settings modal
                  console.log('Open settings');
                }}
              >
                <CogIcon className="h-4 w-4 mr-3 text-gray-400" />
                Settings
              </button>
            )}
          </Menu.Item>
        </div>

        <div className="py-1">
          <Menu.Item>
            {({ active }) => (
              <button
                className={`${
                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                } group flex items-center w-full px-4 py-2 text-sm`}
                onClick={handleLogout}
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-gray-400" />
                Sign out
              </button>
            )}
          </Menu.Item>
        </div>
      </Menu.Items>
    </Menu>
  );
}
