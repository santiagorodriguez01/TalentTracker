import axios from "axios";
import { useAuthStore } from "@/store/auth";

/**
 * Cliente Axios centralizado que:
 * - Usa el proxy interno de Next.js (/api/proxy)
 * - Adjunta automáticamente el token de Zustand
 * - Maneja expiración (401) y redirige a /login
 */
export const http = axios.create({
  baseURL: "/api/proxy", // 🔁 Todo pasa por el proxy de Next.js
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// 🧩 Interceptor de request → adjunta token desde Zustand (persistido)
http.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ⚙️ Interceptor de respuesta → maneja errores globales
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const msg =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error.message;

    // Si el token expira o es inválido, forzar logout
    if (status === 401) {
      const { logout } = useAuthStore.getState();
      logout();
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(new Error(msg));
  }
);
