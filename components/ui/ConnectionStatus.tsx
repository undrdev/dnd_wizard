import React, { useState, useEffect } from 'react';
import { useConnectionState, useOptimisticUpdates } from '@/hooks/useRealtime';
import type { ConnectionState, OptimisticUpdate } from '@/types';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function ConnectionStatus({ 
  className = '',
  showDetails = false,
  position = 'top-right'
}: ConnectionStatusProps) {
  const connectionState = useConnectionState();
  const { optimisticUpdates } = useOptimisticUpdates();
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusColor = (state: ConnectionState) => {
    if (!state.isOnline) return 'bg-gray-500';
    if (!state.isConnected) return 'bg-red-500';
    if (state.retryCount > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = (state: ConnectionState) => {
    if (!state.isOnline) return 'Offline';
    if (!state.isConnected) return 'Disconnected';
    if (state.retryCount > 0) return 'Reconnecting';
    return 'Connected';
  };

  const getStatusIcon = (state: ConnectionState) => {
    if (!state.isOnline) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (!state.isConnected) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (state.retryCount > 0) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const pendingOperations = optimisticUpdates.filter(update => !update.error);
  const failedOperations = optimisticUpdates.filter(update => update.error);

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <div 
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Main Status Indicator */}
        <div className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg
          ${getStatusColor(connectionState)} text-white
          transition-all duration-200 hover:shadow-xl
        `}>
          {getStatusIcon(connectionState)}
          {showDetails && (
            <span className="text-sm font-medium">
              {getStatusText(connectionState)}
            </span>
          )}
          
          {/* Pending Operations Badge */}
          {pendingOperations.length > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
              <span className="text-xs">{pendingOperations.length}</span>
            </div>
          )}
          
          {/* Failed Operations Badge */}
          {failedOperations.length > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-300 rounded-full" />
              <span className="text-xs">{failedOperations.length}</span>
            </div>
          )}
        </div>

        {/* Detailed Tooltip */}
        {showTooltip && (
          <div className={`
            absolute ${position.includes('right') ? 'right-0' : 'left-0'}
            ${position.includes('top') ? 'top-full mt-2' : 'bottom-full mb-2'}
            w-64 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border
            border-gray-200 dark:border-gray-700 z-10
          `}>
            <div className="space-y-3">
              {/* Connection Details */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Connection Status
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Online:</span>
                    <span className={connectionState.isOnline ? 'text-green-600' : 'text-red-600'}>
                      {connectionState.isOnline ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Connected:</span>
                    <span className={connectionState.isConnected ? 'text-green-600' : 'text-red-600'}>
                      {connectionState.isConnected ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {connectionState.lastConnected && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last Connected:</span>
                      <span className="text-gray-900 dark:text-white">
                        {connectionState.lastConnected.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  {connectionState.retryCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Retry Count:</span>
                      <span className="text-yellow-600">{connectionState.retryCount}</span>
                    </div>
                  )}
                  {connectionState.error && (
                    <div className="mt-2">
                      <span className="text-gray-600 dark:text-gray-400">Error:</span>
                      <p className="text-red-600 text-xs mt-1">{connectionState.error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Operations */}
              {pendingOperations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Pending Operations ({pendingOperations.length})
                  </h4>
                  <div className="space-y-1 text-sm max-h-20 overflow-y-auto">
                    {pendingOperations.slice(0, 3).map((update) => (
                      <div key={update.id} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {update.operation} {update.collection}
                        </span>
                      </div>
                    ))}
                    {pendingOperations.length > 3 && (
                      <div className="text-gray-500 text-xs">
                        +{pendingOperations.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Failed Operations */}
              {failedOperations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Failed Operations ({failedOperations.length})
                  </h4>
                  <div className="space-y-1 text-sm max-h-20 overflow-y-auto">
                    {failedOperations.slice(0, 3).map((update) => (
                      <div key={update.id} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {update.operation} {update.collection}
                        </span>
                      </div>
                    ))}
                    {failedOperations.length > 3 && (
                      <div className="text-gray-500 text-xs">
                        +{failedOperations.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Message */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {connectionState.isOnline && connectionState.isConnected
                    ? 'All systems operational'
                    : connectionState.isOnline
                    ? 'Attempting to reconnect...'
                    : 'Working offline - changes will sync when online'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for use in headers/navbars
export function ConnectionStatusCompact({ className = '' }: { className?: string }) {
  const connectionState = useConnectionState();
  const { optimisticUpdates } = useOptimisticUpdates();

  const pendingCount = optimisticUpdates.filter(update => !update.error).length;
  const failedCount = optimisticUpdates.filter(update => update.error).length;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Connection Dot */}
      <div className={`
        w-3 h-3 rounded-full
        ${connectionState.isOnline && connectionState.isConnected 
          ? 'bg-green-500' 
          : connectionState.isOnline 
          ? 'bg-yellow-500 animate-pulse' 
          : 'bg-red-500'
        }
      `} />
      
      {/* Operation Counters */}
      {(pendingCount > 0 || failedCount > 0) && (
        <div className="flex items-center space-x-1 text-xs">
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              {pendingCount}
            </span>
          )}
          {failedCount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full">
              {failedCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
