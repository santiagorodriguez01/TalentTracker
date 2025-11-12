export type Rol = 'ADMIN'|'TESORERIA'|'COORDINADOR'|'STAFF'|'DIRECTIVO'|'PERSONAL_CAJA'|'REVISOR_CUENTA'|'BOLETERIA';
export const can = {
  verCaja: (r: Rol) => ['ADMIN','TESORERIA','DIRECTIVO','REVISOR_CUENTA','PERSONAL_CAJA'].includes(r),
  altaEgreso: (r: Rol) => ['ADMIN','TESORERIA','PERSONAL_CAJA'].includes(r),
  verAudit: (r: Rol) => ['ADMIN','DIRECTIVO'].includes(r),
  gestionarSocios: (r: Rol) => ['ADMIN','STAFF','DIRECTIVO','TESORERIA'].includes(r),
  gestionarAlumnos: (r: Rol) => ['ADMIN','COORDINADOR','STAFF'].includes(r),
  // Caja
  cajaCrear: (r: Rol) => ['ADMIN','TESORERIA','PERSONAL_CAJA'].includes(r),
  cajaReportes: (r: Rol) => ['ADMIN','TESORERIA','DIRECTIVO','REVISOR_CUENTA'].includes(r),
  aprobarEgreso: (r: Rol) => ['ADMIN','DIRECTIVO','REVISOR_CUENTA'].includes(r),
  // Cuotas
  verCuotas: (r: Rol) => ['ADMIN','TESORERIA','DIRECTIVO','REVISOR_CUENTA','PERSONAL_CAJA'].includes(r),
  pagarCuotas: (r: Rol) => ['ADMIN','TESORERIA','PERSONAL_CAJA'].includes(r),
  // Personas
  verPersonas: (r: Rol) => ['ADMIN','TESORERIA','STAFF','DIRECTIVO'].includes(r),
  crearPersona: (r: Rol) => ['ADMIN','TESORERIA'].includes(r),
  editarPersona: (r: Rol) => ['ADMIN','TESORERIA'].includes(r),
  // Jugadores / Alumnos
  verAlumnos: (r: Rol) => ['ADMIN','COORDINADOR','STAFF','DIRECTIVO'].includes(r),
  verJugadores: (r: Rol) => ['ADMIN','STAFF','DIRECTIVO'].includes(r),
  // Reportes/cuotas
  verReportes: (r: Rol) => ['ADMIN','TESORERIA','DIRECTIVO','REVISOR_CUENTA'].includes(r),
  // Credenciales/QR
  verCredenciales: (r: Rol) => ['ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO'].includes(r),
  // Socios
  crearSocio: (r: Rol) => ['ADMIN','TESORERIA'].includes(r),
  editarSocio: (r: Rol) => ['ADMIN','TESORERIA'].includes(r),
  // Boletería
  verBoleteria: (r: Rol) => ['ADMIN','BOLETERIA','TESORERIA','PERSONAL_CAJA'].includes(r),
  ventaEntradas: (r: Rol) => ['ADMIN','BOLETERIA','TESORERIA','PERSONAL_CAJA'].includes(r),
};

export function canAccessPath(role: Rol | undefined, path: string): boolean {
  if (!role) return false;
  // Public within privado: 'no autorizado' y dashboard para autenticados
  if (path.startsWith('/unauthorized')) return true;
  if (path.startsWith('/dashboard')) return true;
  // Acciones específicas por subruta
  if (path.startsWith('/personas/new')) return can.crearPersona(role);
  if (/^\/personas\/[0-9]+/.test(path)) return can.editarPersona(role);
  if (path.startsWith('/caja')) return can.verCaja(role);
  if (path.startsWith('/cuotas')) return can.verCuotas(role);
  if (path.startsWith('/socios')) return can.gestionarSocios(role);
  if (path.startsWith('/socios/new')) return can.crearSocio(role);
  if (/^\/socios\/[0-9]+/.test(path)) return can.editarSocio(role);
  if (path.startsWith('/personas')) return can.verPersonas(role);
  if (path.startsWith('/alumnos')) return can.verAlumnos(role);
  if (path.startsWith('/asistencias')) return can.verAlumnos(role); // Coordinadores y admins pueden ver asistencias
  if (path.startsWith('/jugadores')) return can.verJugadores(role);
  if (path.startsWith('/reportes')) return can.verReportes(role);
  if (path.startsWith('/audit')) return can.verAudit(role);
  if (path.startsWith('/credenciales')) return can.verCredenciales(role);
  // Perfil del usuario (biometría, ajustes personales)
  if (path.startsWith('/perfil')) return true;
  // IA: panel y herramientas de inteligencia artificial
  if (path.startsWith('/ia')) return ['ADMIN','COORDINADOR','STAFF'].includes(role);
  if (path.startsWith('/qr')) return true; // QR públicos con token o roles permitidos
  // Boletería
  if (path.startsWith('/boleteria')) return can.verBoleteria(role);
  // Por defecto, negar
  return false;
}

export function homeForRole(role: Rol | undefined): string {
  if (!role) return '/dashboard';
  if (role === 'PERSONAL_CAJA') return '/caja';
  if (role === 'BOLETERIA') return '/boleteria';
  return '/dashboard';
}

export function allowedPathsForRole(role: Rol | undefined): Array<{ href: string; label: string }>{
  if (!role) return [{ href: '/dashboard', label: 'Inicio' }];
  const items: Array<{ href: string; label: string }> = [];
  const add = (ok: boolean, href: string, label: string) => { if (ok) items.push({ href, label }); };
  add(true, '/dashboard', 'Inicio');
  add(can.verCuotas(role), '/cuotas', 'Cuotas');
  add(can.verCaja(role), '/caja', 'Caja');
  add(can.verBoleteria(role), '/boleteria', 'Boletería');
  add(can.gestionarSocios(role), '/socios', 'Socios');
  add(can.verPersonas(role), '/personas', 'Personas');
  add(can.verAlumnos(role), '/alumnos', 'Alumnos');
  add(can.verJugadores(role), '/jugadores', 'Jugadores');
  add(can.verReportes(role), '/reportes', 'Reportes');
  add(can.verAudit(role), '/audit', 'Auditoría');
  add(can.verCredenciales(role), '/credenciales', 'Credenciales');
  return items;
}
