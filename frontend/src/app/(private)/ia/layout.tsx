// src/app/(private)/ai/layout.tsx
'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useIAStore } from '@/store/ia';

export default function AILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const selected = useIAStore(s => s.selectedAlumno);

  React.useEffect(() => {
    if (!pathname?.startsWith('/ia')) return;
    if (pathname === '/ia/select') return;
    if (!selected) router.replace('/ia/select' as any);
  }, [pathname, selected, router]);

  return <>{children}</>;
}
