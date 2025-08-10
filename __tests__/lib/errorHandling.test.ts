/**
 * Tests for Error Handling Service
 */

import { errorHandler, handleError, showError } from '../../lib/errorHandling';

describe('ErrorHandlingService', () => {
  beforeEach(() => {
    errorHandler.clearErrorLogs();
  });

  describe('handleError', () => {
    it('should handle basic errors', () => {
      const error = new Error('Test error');
      const context = { component: 'TestComponent', action: 'testAction' };

      errorHandler.handleError(error, context);

      const logs = errorHandler.getErrorLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].error.message).toBe('Test error');
      expect(logs[0].context.component).toBe('TestComponent');
    });

    it('should categorize network errors correctly', () => {
      const networkError = new Error('Network connection failed');
      errorHandler.handleError(networkError);

      const logs = errorHandler.getErrorLogs(1);
      expect(logs[0].severity).toBe('high');
    });

    it('should categorize auth errors as critical', () => {
      const authError = new Error('Authentication failed');
      errorHandler.handleError(authError);

      const logs = errorHandler.getErrorLogs(1);
      expect(logs[0].severity).toBe('critical');
    });

    it('should limit error log size', () => {
      // Add more errors than the max log size
      for (let i = 0; i < 150; i++) {
        errorHandler.handleError(new Error(`Error ${i}`));
      }

      const logs = errorHandler.getErrorLogs();
      expect(logs.length).toBeLessThanOrEqual(100); // Max log size
    });
  });

  describe('showUserFriendlyError', () => {
    it('should convert network errors to user-friendly messages', () => {
      const networkError = new Error('fetch failed');
      const userError = errorHandler.showUserFriendlyError(networkError);

      expect(userError.title).toBe('Connection Problem');
      expect(userError.severity).toBe('error');
      expect(userError.recoveryActions).toBeDefined();
      expect(userError.recoveryActions!.length).toBeGreaterThan(0);
    });

    it('should convert auth errors to user-friendly messages', () => {
      const authError = new Error('unauthorized access');
      const userError = errorHandler.showUserFriendlyError(authError);

      expect(userError.title).toBe('Authentication Required');
      expect(userError.severity).toBe('critical');
      expect(userError.canDismiss).toBe(false);
    });

    it('should convert validation errors to user-friendly messages', () => {
      const validationError = new Error('invalid email format');
      const userError = errorHandler.showUserFriendlyError(validationError);

      expect(userError.title).toBe('Invalid Input');
      expect(userError.severity).toBe('warning');
      expect(userError.canDismiss).toBe(true);
    });
  });

  describe('error listeners', () => {
    it('should notify error listeners', () => {
      const mockListener = jest.fn();
      const unsubscribe = errorHandler.onError(mockListener);

      const error = new Error('Test error');
      errorHandler.handleError(error);

      expect(mockListener).toHaveBeenCalledTimes(1);
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(String),
          message: expect.any(String),
          severity: expect.any(String)
        })
      );

      unsubscribe();
    });

    it('should allow unsubscribing from error listeners', () => {
      const mockListener = jest.fn();
      const unsubscribe = errorHandler.onError(mockListener);

      unsubscribe();

      const error = new Error('Test error');
      errorHandler.handleError(error);

      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('error statistics', () => {
    it('should provide accurate error statistics', () => {
      // Add various types of errors
      errorHandler.handleError(new Error('network error'));
      errorHandler.handleError(new Error('auth error'));
      errorHandler.handleError(new Error('validation error'));

      const stats = errorHandler.getErrorStats();

      expect(stats.total).toBe(3);
      expect(stats.bySeverity).toBeDefined();
      expect(stats.byType).toBeDefined();
      expect(stats.recent).toBe(3); // All errors are recent
    });
  });

  describe('convenience functions', () => {
    it('should work with handleError convenience function', () => {
      const error = new Error('Convenience test');
      handleError(error, { component: 'Test' });

      const logs = errorHandler.getErrorLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].error.message).toBe('Convenience test');
    });

    it('should work with showError convenience function', () => {
      const error = new Error('Show error test');
      const userError = showError(error);

      expect(userError).toBeDefined();
      expect(userError.title).toBeDefined();
      expect(userError.message).toBeDefined();
    });
  });

  describe('recovery actions', () => {
    it('should provide retry actions for network errors', () => {
      const networkError = new Error('Connection timeout');
      const userError = errorHandler.showUserFriendlyError(networkError);

      expect(userError.recoveryActions).toBeDefined();
      const retryAction = userError.recoveryActions!.find(action => action.type === 'retry');
      expect(retryAction).toBeDefined();
      expect(retryAction!.label).toBe('Retry');
    });

    it('should provide redirect actions for auth errors', () => {
      const authError = new Error('Session expired');
      const userError = errorHandler.showUserFriendlyError(authError);

      expect(userError.recoveryActions).toBeDefined();
      const redirectAction = userError.recoveryActions!.find(action => action.type === 'redirect');
      expect(redirectAction).toBeDefined();
      expect(redirectAction!.label).toBe('Sign In');
    });
  });

  describe('error recovery', () => {
    it('should attempt recovery for network errors', async () => {
      const networkError = new Error('Network failure');
      
      // Mock console.log to verify recovery attempt
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await errorHandler.recoverFromError(networkError);

      expect(consoleSpy).toHaveBeenCalledWith('Attempting network error recovery');
      
      consoleSpy.mockRestore();
    });

    it('should attempt recovery for auth errors', async () => {
      const authError = new Error('Authentication failed');
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await errorHandler.recoverFromError(authError);

      expect(consoleSpy).toHaveBeenCalledWith('Attempting auth error recovery');
      
      consoleSpy.mockRestore();
    });
  });
});
