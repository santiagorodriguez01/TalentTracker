import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const DEFAULT_API = process.env.NEXT_PUBLIC_FRONT_API_PREFIX || '/api/proxy';

const api = axios.create({ baseURL: DEFAULT_API });

api.interceptors.request.use((cfg) => {
  if (api.defaults.baseURL !== DEFAULT_API) api.defaults.baseURL = DEFAULT_API;

  const c: any = cfg as any;
  const skipAuth = !!c.skipAuth || c.headers?.['X-Skip-Auth'] === '1';

  if (!skipAuth) {
    const token =
      useAuthStore.getState().token ||
      (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    // 🔥 FIX: axios headers tipado estricto
    if (token) {
      if (!cfg.headers) cfg.headers = {} as any;
      (cfg.headers as any)['Authorization'] = `Bearer ${token}`;
    }

  } else {
    if (cfg.headers) {
      delete (cfg.headers as any)['Authorization'];
      delete (cfg.headers as any)['authorization'];
    }
  }

  // Parámetro anti-cache en GET
  if ((cfg.method || 'get').toLowerCase() === 'get') {
    if (!cfg.params) cfg.params = {};
    cfg.params['_t'] = Date.now();
  }

  // 🔥 FIX: headers aceptados sin romper tipos
  if (!cfg.headers) cfg.headers = {} as any;
  (cfg.headers as any)['Accept'] = 'application/json';

  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const cfg: any = err?.config || {};
    const allow401 = !!cfg.allow401 || !!cfg.skipAuth || cfg.headers?.['X-Skip-Auth'] === '1';

    if (err?.response?.status === 401 && typeof window !== 'undefined' && !allow401) {
      try {
        useAuthStore.getState().logout?.();
      } catch {}

      try {
        localStorage.removeItem('token');
      } catch {}

      if (!location.pathname.startsWith('/login')) location.replace('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
