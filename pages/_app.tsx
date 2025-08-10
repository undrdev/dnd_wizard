import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { RealtimeProvider } from '@/components/providers/RealtimeProvider';
import { Layout } from '@/components/ui/Layout';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ErrorToast } from '@/components/ui/ErrorMessage';
import { errorHandler, UserFriendlyError } from '@/lib/errorHandling';
import { backupService } from '@/lib/backup';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [globalError, setGlobalError] = useState<UserFriendlyError | null>(null);

  useEffect(() => {
    // Initialize error handling
    const unsubscribe = errorHandler.onError((error) => {
      setGlobalError(error);
    });

    // Initialize backup service
    backupService.initialize({
      autoBackupEnabled: true,
      autoBackupInterval: 60, // 1 hour
      maxBackups: 10
    });

    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      errorHandler.handleError(
        new Error(event.reason?.message || 'Unhandled promise rejection'),
        { component: 'Global', action: 'unhandledRejection' }
      );
    };

    // Global error handler for JavaScript errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global JavaScript error:', event.error);
      errorHandler.handleError(
        event.error || new Error(event.message),
        { component: 'Global', action: 'javascriptError' }
      );
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      unsubscribe();
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  const handleDismissGlobalError = () => {
    setGlobalError(null);
  };

  return (
    <ErrorBoundary
      level="page"
      context={{ component: 'App', action: 'render' }}
      onError={(error, errorInfo) => {
        console.error('App-level error boundary triggered:', error, errorInfo);
      }}
    >
      <AuthProvider>
        <Layout>
          <ErrorBoundary
            level="section"
            context={{ component: 'PageContent', action: 'render' }}
          >
            <Component {...pageProps} />
          </ErrorBoundary>
        </Layout>
      </AuthProvider>

      {/* Global error toast */}
      {globalError && (
        <ErrorToast
          error={globalError}
          onDismiss={handleDismissGlobalError}
          position="top-right"
        />
      )}
    </ErrorBoundary>
  );
}
