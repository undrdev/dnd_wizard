/**
 * Centralized Error Handling Service
 * Provides comprehensive error handling, logging, and recovery mechanisms
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  campaignId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  timestamp: Date;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAgent?: string;
  url?: string;
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'redirect' | 'refresh' | 'manual';
  label: string;
  action: () => Promise<void> | void;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  recoveryActions?: RecoveryAction[];
  canDismiss: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

class ErrorHandlingService {
  private errorLogs: ErrorLog[] = [];
  private errorListeners: ((error: UserFriendlyError) => void)[] = [];
  private maxLogSize = 100;

  /**
   * Handle any error with context and automatic recovery attempts
   */
  handleError(error: Error, context: ErrorContext = {}): void {
    const errorLog = this.createErrorLog(error, context);
    this.logError(errorLog);
    
    const userFriendlyError = this.convertToUserFriendlyError(error, context);
    this.notifyErrorListeners(userFriendlyError);
    
    // Attempt automatic recovery for certain error types
    this.attemptAutoRecovery(error, context);
  }

  /**
   * Show user-friendly error message
   */
  showUserFriendlyError(error: Error, context: ErrorContext = {}): UserFriendlyError {
    const userFriendlyError = this.convertToUserFriendlyError(error, context);
    this.notifyErrorListeners(userFriendlyError);
    return userFriendlyError;
  }

  /**
   * Log error with metadata
   */
  logError(errorLog: ErrorLog): void {
    this.errorLogs.unshift(errorLog);
    
    // Keep only the most recent errors
    if (this.errorLogs.length > this.maxLogSize) {
      this.errorLogs = this.errorLogs.slice(0, this.maxLogSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorLog);
    }

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogging(errorLog);
    }
  }

  /**
   * Attempt to recover from error automatically
   */
  async recoverFromError(error: Error, context: ErrorContext = {}): Promise<void> {
    const errorType = this.categorizeError(error);
    
    switch (errorType) {
      case 'network':
        await this.handleNetworkError(error, context);
        break;
      case 'auth':
        await this.handleAuthError(error, context);
        break;
      case 'validation':
        await this.handleValidationError(error, context);
        break;
      case 'storage':
        await this.handleStorageError(error, context);
        break;
      default:
        await this.handleGenericError(error, context);
    }
  }

  /**
   * Subscribe to error notifications
   */
  onError(listener: (error: UserFriendlyError) => void): () => void {
    this.errorListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get recent error logs
   */
  getErrorLogs(limit = 10): ErrorLog[] {
    return this.errorLogs.slice(0, limit);
  }

  /**
   * Clear error logs
   */
  clearErrorLogs(): void {
    this.errorLogs = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    recent: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recent = this.errorLogs.filter(log => log.timestamp > oneHourAgo).length;
    
    const bySeverity = this.errorLogs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = this.errorLogs.reduce((acc, log) => {
      const type = this.categorizeError(log.error);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.errorLogs.length,
      bySeverity,
      byType,
      recent
    };
  }

  private createErrorLog(error: Error, context: ErrorContext): ErrorLog {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      error,
      context,
      severity: this.determineSeverity(error, context),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };
  }

  private convertToUserFriendlyError(error: Error, context: ErrorContext): UserFriendlyError {
    const errorType = this.categorizeError(error);
    
    switch (errorType) {
      case 'network':
        return this.createNetworkErrorMessage(error, context);
      case 'auth':
        return this.createAuthErrorMessage(error, context);
      case 'validation':
        return this.createValidationErrorMessage(error, context);
      case 'storage':
        return this.createStorageErrorMessage(error, context);
      default:
        return this.createGenericErrorMessage(error, context);
    }
  }

  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('auth') || message.includes('permission') || message.includes('unauthorized') ||
        message.includes('session') || message.includes('expired') || message.includes('login')) {
      return 'auth';
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation';
    }
    if (message.includes('storage') || message.includes('quota') || message.includes('disk')) {
      return 'storage';
    }

    return 'generic';
  }

  private determineSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    const errorType = this.categorizeError(error);
    
    if (errorType === 'auth' || error.message.includes('critical')) {
      return 'critical';
    }
    if (errorType === 'network' || errorType === 'storage') {
      return 'high';
    }
    if (errorType === 'validation') {
      return 'medium';
    }
    
    return 'low';
  }

  private createNetworkErrorMessage(error: Error, context: ErrorContext): UserFriendlyError {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      recoveryActions: [
        {
          type: 'retry',
          label: 'Retry',
          action: () => window.location.reload()
        },
        {
          type: 'fallback',
          label: 'Work Offline',
          action: () => {
            // Switch to offline mode
            console.log('Switching to offline mode');
          }
        }
      ],
      canDismiss: true,
      severity: 'error'
    };
  }

  private createAuthErrorMessage(error: Error, context: ErrorContext): UserFriendlyError {
    return {
      title: 'Authentication Required',
      message: 'Your session has expired. Please sign in again to continue.',
      recoveryActions: [
        {
          type: 'redirect',
          label: 'Sign In',
          action: () => {
            window.location.href = '/auth/signin';
          }
        }
      ],
      canDismiss: false,
      severity: 'critical'
    };
  }

  private createValidationErrorMessage(error: Error, context: ErrorContext): UserFriendlyError {
    return {
      title: 'Invalid Input',
      message: error.message || 'Please check your input and try again.',
      canDismiss: true,
      severity: 'warning'
    };
  }

  private createStorageErrorMessage(error: Error, context: ErrorContext): UserFriendlyError {
    return {
      title: 'Storage Error',
      message: 'Unable to save your changes. Please try again or contact support if the problem persists.',
      recoveryActions: [
        {
          type: 'retry',
          label: 'Try Again',
          action: async () => {
            // Retry the failed operation
            if (context.action) {
              console.log(`Retrying action: ${context.action}`);
            }
          }
        }
      ],
      canDismiss: true,
      severity: 'error'
    };
  }

  private createGenericErrorMessage(error: Error, context: ErrorContext): UserFriendlyError {
    return {
      title: 'Something went wrong',
      message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      recoveryActions: [
        {
          type: 'refresh',
          label: 'Refresh Page',
          action: () => window.location.reload()
        }
      ],
      canDismiss: true,
      severity: 'error'
    };
  }

  private notifyErrorListeners(error: UserFriendlyError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  private async attemptAutoRecovery(error: Error, context: ErrorContext): Promise<void> {
    const errorType = this.categorizeError(error);
    
    // Only attempt auto-recovery for certain error types
    if (errorType === 'network') {
      // Wait a bit and retry
      setTimeout(() => {
        this.recoverFromError(error, context);
      }, 2000);
    }
  }

  private async handleNetworkError(error: Error, context: ErrorContext): Promise<void> {
    // Implement network error recovery logic
    console.log('Attempting network error recovery');
  }

  private async handleAuthError(error: Error, context: ErrorContext): Promise<void> {
    // Implement auth error recovery logic
    console.log('Attempting auth error recovery');
  }

  private async handleValidationError(error: Error, context: ErrorContext): Promise<void> {
    // Implement validation error recovery logic
    console.log('Attempting validation error recovery');
  }

  private async handleStorageError(error: Error, context: ErrorContext): Promise<void> {
    // Implement storage error recovery logic
    console.log('Attempting storage error recovery');
  }

  private async handleGenericError(error: Error, context: ErrorContext): Promise<void> {
    // Implement generic error recovery logic
    console.log('Attempting generic error recovery');
  }

  private async sendToExternalLogging(errorLog: ErrorLog): Promise<void> {
    // In production, send to external logging service like Sentry, LogRocket, etc.
    console.log('Would send to external logging service:', errorLog);
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandlingService();

// Convenience functions
export const handleError = (error: Error, context?: ErrorContext) => 
  errorHandler.handleError(error, context);

export const showError = (error: Error, context?: ErrorContext) => 
  errorHandler.showUserFriendlyError(error, context);

export const logError = (error: Error, context?: ErrorContext) => 
  errorHandler.logError(errorHandler['createErrorLog'](error, context || {}));
