import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import api from './api';

type Method = 'get' | 'post' | 'put' | 'delete';

const BASES = ['/caja', '/api/caja'] as const;

function normalizeSuffix(suffix: string){
  if (!suffix) return '';
  return suffix.startsWith('/') ? suffix : `/${suffix}`;
}

async function request<T = unknown>(
  method: Method,
  suffix: string,
  payload?: unknown,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>>{
  const path = normalizeSuffix(suffix);
  let lastError: any;

  for (const base of BASES){
    const url = `${base}${path}`;
    try {
      switch (method){
        case 'get':
          return await api.get<T>(url, config);
        case 'post':
          return await api.post<T>(url, payload, config);
        case 'put':
          return await api.put<T>(url, payload, config);
        case 'delete':
          return await api.delete<T>(url, config);
        default:
          throw new Error(`Metodo no soportado: ${method}`);
      }
    } catch (error: any){
      if (error?.response?.status !== 404){
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError ?? new Error('No se pudo resolver la ruta de caja');
}

export const cajaApi = {
  get: <T = unknown>(suffix: string, config?: AxiosRequestConfig) =>
    request<T>('get', suffix, undefined, config),
  post: <T = unknown>(suffix: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>('post', suffix, data, config),
  put: <T = unknown>(suffix: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>('put', suffix, data, config),
  delete: <T = unknown>(suffix: string, config?: AxiosRequestConfig) =>
    request<T>('delete', suffix, undefined, config),
};
