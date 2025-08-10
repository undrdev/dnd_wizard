/**
 * Standardized Error Message Component
 * Provides consistent error display across the application
 */

import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { UserFriendlyError, RecoveryAction } from '../../lib/errorHandling';

interface ErrorMessageProps {
  error?: UserFriendlyError | null;
  title?: string;
  message?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical' | 'success';
  canDismiss?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  onDismiss?: () => void;
  onAction?: (action: RecoveryAction) => void;
  className?: string;
  compact?: boolean;
}

const severityConfig = {
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    messageColor: 'text-blue-700',
    buttonColor: 'bg-blue-100 hover:bg-blue-200 text-blue-800'
  },
  success: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    titleColor: 'text-green-800',
    messageColor: 'text-green-700',
    buttonColor: 'bg-green-100 hover:bg-green-200 text-green-800'
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-800',
    messageColor: 'text-yellow-700',
    buttonColor: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
  },
  error: {
    icon: XCircleIcon,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    messageColor: 'text-red-700',
    buttonColor: 'bg-red-100 hover:bg-red-200 text-red-800'
  },
  critical: {
    icon: XCircleIcon,
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    iconColor: 'text-red-700',
    titleColor: 'text-red-900',
    messageColor: 'text-red-800',
    buttonColor: 'bg-red-200 hover:bg-red-300 text-red-900'
  }
};

export function ErrorMessage({
  error,
  title,
  message,
  severity = 'error',
  canDismiss = true,
  autoHide = false,
  autoHideDelay = 5000,
  onDismiss,
  onAction,
  className = '',
  compact = false
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Use error object properties if provided, otherwise use individual props
  const displayTitle = error?.title || title;
  const displayMessage = error?.message || message;
  const displaySeverity = error?.severity || severity;
  const displayCanDismiss = error?.canDismiss ?? canDismiss;
  const recoveryActions = error?.recoveryActions || [];

  const config = severityConfig[displaySeverity];
  const IconComponent = config.icon;

  useEffect(() => {
    if (autoHide && displaySeverity !== 'critical') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, displaySeverity]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleAction = async (action: RecoveryAction) => {
    try {
      await action.action();
      onAction?.(action);
      
      // Auto-dismiss after successful action unless it's a critical error
      if (displaySeverity !== 'critical') {
        handleDismiss();
      }
    } catch (err) {
      console.error('Recovery action failed:', err);
    }
  };

  if (!isVisible || (!displayTitle && !displayMessage)) {
    return null;
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 p-2 rounded ${config.bgColor} ${config.borderColor} border ${className}`}>
        <IconComponent className={`h-4 w-4 ${config.iconColor} flex-shrink-0`} />
        <span className={`text-sm ${config.messageColor} flex-1`}>
          {displayMessage}
        </span>
        {displayCanDismiss && (
          <button
            onClick={handleDismiss}
            className={`${config.iconColor} hover:opacity-75`}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 ${config.bgColor} ${config.borderColor} border ${className}`}>
      <div className="flex items-start">
        <IconComponent className={`h-5 w-5 ${config.iconColor} mt-0.5 mr-3 flex-shrink-0`} />
        
        <div className="flex-1">
          {displayTitle && (
            <h3 className={`text-sm font-medium ${config.titleColor}`}>
              {displayTitle}
            </h3>
          )}
          
          {displayMessage && (
            <p className={`${displayTitle ? 'mt-1' : ''} text-sm ${config.messageColor}`}>
              {displayMessage}
            </p>
          )}

          {recoveryActions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {recoveryActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleAction(action)}
                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded ${config.buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {displayCanDismiss && (
          <button
            onClick={handleDismiss}
            className={`ml-3 ${config.iconColor} hover:opacity-75 focus:outline-none`}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// Toast-style error message for global notifications
export function ErrorToast({
  error,
  onDismiss,
  position = 'top-right'
}: {
  error: UserFriendlyError;
  onDismiss: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Auto-hide non-critical errors after 5 seconds
    if (error.severity !== 'critical') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error.severity]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300); // Animation duration
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed z-50 max-w-sm w-full ${positionClasses[position]} transition-all duration-300 ${
        isExiting ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
      }`}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <ErrorMessage
          error={error}
          onDismiss={handleDismiss}
          className="border-0 rounded-none"
        />
      </div>
    </div>
  );
}

// Error list component for displaying multiple errors
export function ErrorList({
  errors,
  onDismiss,
  onDismissAll,
  className = ''
}: {
  errors: UserFriendlyError[];
  onDismiss?: (index: number) => void;
  onDismissAll?: () => void;
  className?: string;
}) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {errors.length > 1 && onDismissAll && (
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-900">
            {errors.length} errors occurred
          </h3>
          <button
            onClick={onDismissAll}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Dismiss all
          </button>
        </div>
      )}
      
      {errors.map((error, index) => (
        <ErrorMessage
          key={index}
          error={error}
          onDismiss={() => onDismiss?.(index)}
        />
      ))}
    </div>
  );
}

// Inline error message for form fields
export function InlineError({
  message,
  className = ''
}: {
  message?: string;
  className?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p className={`mt-1 text-sm text-red-600 ${className}`}>
      {message}
    </p>
  );
}

export default ErrorMessage;
