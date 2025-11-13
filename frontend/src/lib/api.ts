import axios, { type AxiosRequestHeaders } from 'axios';
import { useAuthStore } from '@/store/auth';

const DEFAULT_API = process.env.NEXT_PUBLIC_FRONT_API_PREFIX || '/api/proxy';

const api = axios.create({ baseURL: DEFAULT_API });

api.interceptors.request.use((cfg) => {
  if (api.defaults.baseURL !== DEFAULT_API) api.defaults.baseURL = DEFAULT_API;

  const c: any = cfg as any;
  const skipAuth = !!c.skipAuth || c.headers?.['X-Skip-Auth'] === '1';

  // Normalizamos headers a un objeto tipado
  let headers = (cfg.headers ?? {}) as AxiosRequestHeaders;

  if (!skipAuth) {
    const token =
      useAuthStore.getState().token ||
      (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } else {
    // Nos aseguramos de no mandar Authorization
    delete (headers as any)['Authorization'];
    delete (headers as any)['authorization'];
  }

  headers['Accept'] = 'application/json';
  cfg.headers = headers;

  if ((cfg.method || 'get').toLowerCase() === 'get') {
    const params = (cfg.params ?? {}) as any;
    params['_t'] = Date.now();
    cfg.params = params;
  }

  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const cfg: any = err?.config || {};
    const allow401 =
      !!cfg.allow401 || !!cfg.skipAuth || cfg.headers?.['X-Skip-Auth'] === '1';

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
