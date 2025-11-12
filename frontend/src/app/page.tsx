'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default function Landing(){
  const router = useRouter();
  useEffect(()=>{ (async()=>{ const s = await getSession(); router.replace(s ? '/dashboard' : '/login'); })(); },[router]);
  return null;
}
