'use client';
import api from './api';
import { useAuthStore } from '@/store/auth';

export async function login(username: string, password: string){
  const { data } = await api.post('/auth/login', { username, password });

  const token = data?.token;
  if (token) {
    localStorage.setItem('token', token);
    const s = useAuthStore.getState();
    s.setToken(token);
    try {
      const me = await getSession();
      s.setUser(me || null);
    } catch {}
  }
  return data;
}

export async function getSession(){
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch {
    return null;
  }
}
