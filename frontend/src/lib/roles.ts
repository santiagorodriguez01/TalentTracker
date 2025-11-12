export const ROLE_CODES = [
  'SOCIO',
  'ALUMNO',
  'JUGADOR',
  'PERSONAL_CAJA',
  'REVISOR_CUENTA',
  'COORDINADOR',
  'DIRECTIVO',
  'BOLETERIA',
] as const;

export type RoleCode = typeof ROLE_CODES[number];

export const ROLE_LABELS: Record<RoleCode, string> = {
  SOCIO: 'Socio',
  ALUMNO: 'Alumno',
  JUGADOR: 'Jugador',
  PERSONAL_CAJA: 'Personal de Caja',
  REVISOR_CUENTA: 'Revisor de Cuenta',
  COORDINADOR: 'Coordinador',
  DIRECTIVO: 'Directivo',
  BOLETERIA: 'Boletería',
};

export const ROLE_OPTIONS: Array<{ value: RoleCode; label: string }> = ROLE_CODES.map(
  (value) => ({ value, label: ROLE_LABELS[value] })
);

export function roleLabel(role?: string | null): string {
  if (!role) return '';
  return ROLE_LABELS[role as RoleCode] ?? role;
}

export function formatRoles(roles?: Array<string | null>): string[] {
  if (!Array.isArray(roles)) return [];
  return roles
    .map((role) => roleLabel(role))
    .filter((label): label is string => Boolean(label));
}
