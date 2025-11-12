export type PersonaRol = 'SOCIO'|'ALUMNO'|'JUGADOR'|'PERSONAL'|'COORDINADOR'|'DIRECTIVO';
export type PersonaEstado = 'ACTIVO'|'INACTIVO';
export type Persona = {
  id:number; nombre:string; apellido:string; dni:string;
  fecha_nac?: string | null; email?: string | null; telefono?: string | null;
  domicilio?: string | null; foto?: string | null; rol: PersonaRol; estado: PersonaEstado;
};

export type Socio = {
  id:number; persona_id:number; nro_socio:string; fecha_alta:string; estado_cuenta: 'AL_DIA'|'MOROSO';
};

export type Cuota = {
  id:number; socio_id:number; periodo:string; total_importe:number; importe_pagado:number;
  saldo:number; importe:number; vencimiento:string; estado:'EMITIDA'|'PENDIENTE'|'PAGADA'|'VENCIDA'; comprobante_pdf?: string | null;
};

export type CajaMov = {
  id?:number; fecha:string; concepto:string; tipo:'INGRESO'|'EGRESO'; monto:number;
  medio_pago?: string | null; nro_tramite?: string | null; responsable_id?: number | null;
  validador_id?: number | null; fecha_validacion?: string | null;
};

export type Plan = { id:number; nombre:string; nivel:number; activo:1|0 };
