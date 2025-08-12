import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import type { AIError } from '@/lib/aiErrorHandling';
import { getErrorIcon, getErrorColor, getRetrySuggestion } from '@/lib/aiErrorHandling';

interface AIErrorDisplayProps {
  error: AIError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function AIErrorDisplay({ error, onRetry, onDismiss, className = '' }: AIErrorDisplayProps) {
  const errorColor = getErrorColor(error.type);
  const errorIcon = getErrorIcon(error.type);
  const retrySuggestion = getRetrySuggestion(error);

  return (
    <div className={`border rounded-lg p-4 ${errorColor} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">{errorIcon}</span>
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {error.provider === 'openai' ? 'OpenAI' : 
               error.provider === 'anthropic' ? 'Anthropic' : 'AI'} Error
            </h3>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="mt-1">
            <p className="text-sm font-medium">
              {error.userMessage}
            </p>
            
            {error.statusCode && (
              <p className="text-xs mt-1 opacity-75">
                Error {error.statusCode}
              </p>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="mt-3 flex items-center space-x-3">
            {onRetry && error.retryable && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowPathIcon className="h-3 w-3 mr-1" />
                Try Again
              </button>
            )}
            
            {error.type === 'authentication' && (
              <button
                onClick={() => {
                  // This would typically open AI settings modal
                  console.log('Open AI settings');
                }}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                Check Settings
              </button>
            )}
            
            {error.type === 'quota' && (
              <a
                href={error.provider === 'openai' ? 'https://platform.openai.com/account/billing' : 'https://console.anthropic.com/billing'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Check Billing
              </a>
            )}
          </div>
          
          {/* Retry suggestion */}
          {retrySuggestion && (
            <div className="mt-2 p-2 bg-white bg-opacity-50 rounded border border-current border-opacity-20">
              <p className="text-xs">
                <span className="font-medium">Suggestion:</span> {retrySuggestion}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function AIErrorDisplayCompact({ error, onRetry, onDismiss, className = '' }: AIErrorDisplayProps) {
  const errorColor = getErrorColor(error.type);
  const errorIcon = getErrorIcon(error.type);

  return (
    <div className={`border rounded-lg p-3 ${errorColor} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-lg mr-2">{errorIcon}</span>
          <div>
            <p className="text-sm font-medium">
              {error.userMessage}
            </p>
            {error.statusCode && (
              <p className="text-xs opacity-75">
                Error {error.statusCode}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onRetry && error.retryable && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <ArrowPathIcon className="h-3 w-3 mr-1" />
              Retry
            </button>
          )}
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
