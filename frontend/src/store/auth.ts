import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type User = { id: number; username: string; rol_sistema: string } | null;

type AuthState = {
  token: string | null;
  user: User;
  setToken: (t: string | null) => void;
  setUser: (u: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist((set) => ({
    token: null,
    user: null,
    setToken: (token) => set({ token }),
    setUser: (user) => set({ user }),
    logout: () => {
  localStorage.removeItem("token");
  set({ token: null, user: null });
}

  }), { name: 'auth' })
);
export const useAuth = useAuthStore;
