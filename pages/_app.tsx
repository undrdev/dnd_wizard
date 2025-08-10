import type { AppProps } from 'next/app';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { RealtimeProvider } from '@/components/providers/RealtimeProvider';
import { Layout } from '@/components/ui/Layout';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </RealtimeProvider>
    </AuthProvider>
  );
}
