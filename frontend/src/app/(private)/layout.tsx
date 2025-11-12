'use client';
import MobileShell from '@/components/shell/MobileShell';
import { useEffect, useState } from 'react';
import { getSession } from '@/lib/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { canAccessPath, homeForRole, type Rol } from '@/lib/rbac';

export default function PrivateLayout({ children }: { children: React.ReactNode }){
  const [ok, setOk] = useState<boolean|null>(null);
  const router = useRouter();
  const pathname = usePathname() || '/dashboard';
  const store = useAuthStore();
  const authUser = store.user as any;
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;

  useEffect(()=>{
    getSession()
      .then((s)=>{
        setOk(!!s);
        if (s) {
          try { store.setUser(s as any); } catch {}
        }
      })
      .catch(()=> setOk(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{ if(ok===false) router.replace('/login'); },[ok, router]);

  useEffect(()=>{
    if (ok !== true) return;
    if (!rol) return; // aún rehidratando store
    if (canAccessPath(rol, pathname)) return;
    const from = encodeURIComponent(pathname);
    router.replace(('/unauthorized?from=' + from) as any);
  },[ok, rol, pathname, router]);
  if(ok===null) return null; // splash opcional
  return <MobileShell>{children}</MobileShell>;
}
