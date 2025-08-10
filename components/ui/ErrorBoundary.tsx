/**
 * React Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { errorHandler, ErrorContext } from '../../lib/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: ErrorContext;
  level?: 'page' | 'section' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: crypto.randomUUID()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context: ErrorContext = {
      ...this.props.context,
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundaryLevel: this.props.level || 'component',
        retryCount: this.retryCount,
        ...errorInfo
      }
    };

    // Log error through centralized error handling
    errorHandler.handleError(error, context);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    this.setState({
      errorInfo
    });
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReportError = () => {
    if (this.state.error && this.state.errorId) {
      const errorReport = {
        errorId: this.state.errorId,
        error: this.state.error.message,
        stack: this.state.error.stack,
        componentStack: this.state.errorInfo?.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      // In a real app, you'd send this to your error reporting service
      console.log('Error report:', errorReport);
      
      // Copy to clipboard for easy reporting
      navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
        .then(() => alert('Error report copied to clipboard'))
        .catch(() => console.log('Could not copy error report'));
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render different UI based on error boundary level
      return this.renderErrorUI();
    }

    return this.props.children;
  }

  private renderErrorUI() {
    const { level = 'component' } = this.props;
    const { error, errorId } = this.state;
    const canRetry = this.retryCount < this.maxRetries;

    if (level === 'page') {
      return this.renderPageLevelError(error, errorId, canRetry);
    }

    if (level === 'section') {
      return this.renderSectionLevelError(error, errorId, canRetry);
    }

    return this.renderComponentLevelError(error, errorId, canRetry);
  }

  private renderPageLevelError(error: Error | null, errorId: string | null, canRetry: boolean) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Something went wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              
              {process.env.NODE_ENV === 'development' && error && (
                <div className="mt-4 p-4 bg-red-50 rounded-md text-left">
                  <h3 className="text-sm font-medium text-red-800">Error Details:</h3>
                  <p className="mt-1 text-xs text-red-700 font-mono">{error.message}</p>
                  {errorId && (
                    <p className="mt-1 text-xs text-red-600">Error ID: {errorId}</p>
                  )}
                </div>
              )}

              <div className="mt-6 space-y-3">
                {canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </button>
                )}
                
                <button
                  onClick={this.handleReload}
                  className="w-full flex justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Refresh Page
                </button>

                <button
                  onClick={this.handleReportError}
                  className="w-full flex justify-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Report Error
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private renderSectionLevelError(error: Error | null, errorId: string | null, canRetry: boolean) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Section Error
            </h3>
            <p className="mt-1 text-sm text-red-700">
              This section encountered an error and couldn't load properly.
            </p>
            
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 font-mono">
                {error.message}
              </div>
            )}

            <div className="mt-4 flex space-x-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <ArrowPathIcon className="h-3 w-3 mr-1" />
                  Retry
                </button>
              )}
              
              <button
                onClick={this.handleReportError}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private renderComponentLevelError(error: Error | null, errorId: string | null, canRetry: boolean) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              Component failed to load
            </p>
            
            {process.env.NODE_ENV === 'development' && error && (
              <p className="mt-1 text-xs text-yellow-700 font-mono">
                {error.message}
              </p>
            )}

            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="mt-2 inline-flex items-center text-xs font-medium text-yellow-800 hover:text-yellow-900"
              >
                <ArrowPathIcon className="h-3 w-3 mr-1" />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for functional components to trigger error boundary
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // This will be caught by the nearest error boundary
    throw error;
  };
}

export default ErrorBoundary;
