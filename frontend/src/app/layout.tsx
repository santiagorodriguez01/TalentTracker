import Providers from './providers';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Club Deportivo', description: 'Administracion del Club' };

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Prepara el color scheme para que SSR/CSR coincidan y use el mismo storageKey */}
        { /* @ts-expect-error Server Component can include this script */ }
        <InitColorSchemeScript defaultMode="system" storageKey="app-color-scheme" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
