import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Alumno = { id: number; nombre?: string } | null;

type IAState = {
  selectedAlumno: Alumno;
  setSelectedAlumno: (alumno: Alumno) => void;
  clear: () => void;
};

export const useIAStore = create<IAState>()(
  persist(
    (set) => ({
      selectedAlumno: null,
      setSelectedAlumno: (alumno) => set({ selectedAlumno: alumno }),
      clear: () => set({ selectedAlumno: null }),
    }),
    { name: 'ia' }
  )
);

