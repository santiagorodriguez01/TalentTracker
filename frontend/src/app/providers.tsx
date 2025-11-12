'use client';
import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { CssBaseline } from '@mui/material';
import { CssVarsProvider } from '@mui/material/styles';
import theme from '@/theme/mui-theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppProgress from '@/components/shell/AppProgress';

const qc = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } });

export default function Providers({ children }: { children: React.ReactNode }){
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <CssVarsProvider theme={theme} defaultMode="system" disableTransitionOnChange>
        <CssBaseline />
        <QueryClientProvider client={qc}>
          <AppProgress />
          {children}
        </QueryClientProvider>
      </CssVarsProvider>
    </AppRouterCacheProvider>
  );
}
