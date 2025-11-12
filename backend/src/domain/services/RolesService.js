import { query, getConnection } from '../../db/connection.js';

/**
 * Genera el siguiente numero de socio disponible
 */
async function generarNroSocio() {
  const rows = await query(
    'SELECT nro_socio FROM socio ORDER BY nro_socio DESC LIMIT 1'
  );
  
  if (!rows.length) {
    return '40000001'; // Primer socio
  }
  
  const ultimoNro = rows[0].nro_socio;
  const numero = parseInt(ultimoNro) + 1;
  return numero.toString().padStart(8, '0');
}

/**
 * Crea un registro en la tabla socio para una persona
 */
async function crearSocio(personaId, conn) {
  const connection = conn || await getConnection();
  const shouldRelease = !conn;
  
  try {
    // Verificar si ya existe
    const [existing] = await connection.execute(
      'SELECT id FROM socio WHERE persona_id = ?',
      [personaId]
    );
    
    if (existing.length > 0) {
      return { existe: true, id: existing[0].id };
    }
    
    // Generar numero de socio
    const nroSocio = await generarNroSocio();
    
    // Insertar en tabla socio
    const [result] = await connection.execute(
      `INSERT INTO socio (persona_id, nro_socio, fecha_alta, estado_cuenta)
       VALUES (?, ?, CURDATE(), 'AL_DIA')`,
      [personaId, nroSocio]
    );
    
    return { existe: false, id: result.insertId, nro_socio: nroSocio };
  } finally {
    if (shouldRelease) connection.release();
  }
}

/**
 * Crea un registro en la tabla alumno para una persona
 */
async function crearAlumno(personaId, conn) {
  const connection = conn || await getConnection();
  const shouldRelease = !conn;
  
  try {
    // Verificar si ya existe
    const [existing] = await connection.execute(
      'SELECT id FROM alumno WHERE persona_id = ?',
      [personaId]
    );
    
    if (existing.length > 0) {
      return { existe: true, id: existing[0].id };
    }
    
    // Insertar en tabla alumno
    const [result] = await connection.execute(
      `INSERT INTO alumno (persona_id)
       VALUES (?)`,
      [personaId]
    );
    
    return { existe: false, id: result.insertId };
  } finally {
    if (shouldRelease) connection.release();
  }
}

/**
 * Crea un registro en la tabla jugador para una persona
 */
async function crearJugador(personaId, conn) {
  const connection = conn || await getConnection();
  const shouldRelease = !conn;
  
  try {
    // Verificar si ya existe
    const [existing] = await connection.execute(
      'SELECT id FROM jugador WHERE persona_id = ?',
      [personaId]
    );
    
    if (existing.length > 0) {
      return { existe: true, id: existing[0].id };
    }
    
    // Insertar en tabla jugador (sin dorsal ni puesto por ahora)
    const [result] = await connection.execute(
      `INSERT INTO jugador (persona_id)
       VALUES (?)`,
      [personaId]
    );
    
    return { existe: false, id: result.insertId };
  } finally {
    if (shouldRelease) connection.release();
  }
}

/**
 * Elimina un registro de la tabla socio
 */
async function eliminarSocio(personaId, conn) {
  const connection = conn || await getConnection();
  const shouldRelease = !conn;
  
  try {
    await connection.execute(
      'DELETE FROM socio WHERE persona_id = ?',
      [personaId]
    );
  } finally {
    if (shouldRelease) connection.release();
  }
}

/**
 * Elimina un registro de la tabla alumno
 */
async function eliminarAlumno(personaId, conn) {
  const connection = conn || await getConnection();
  const shouldRelease = !conn;
  
  try {
    await connection.execute(
      'DELETE FROM alumno WHERE persona_id = ?',
      [personaId]
    );
  } finally {
    if (shouldRelease) connection.release();
  }
}

/**
 * Elimina un registro de la tabla jugador
 */
async function eliminarJugador(personaId, conn) {
  const connection = conn || await getConnection();
  const shouldRelease = !conn;
  
  try {
    await connection.execute(
      'DELETE FROM jugador WHERE persona_id = ?',
      [personaId]
    );
  } finally {
    if (shouldRelease) connection.release();
  }
}

/**
 * Sincroniza los roles de una persona con las tablas especificas
 * Crea/elimina registros en socio, alumno, jugador segun corresponda
 */
export async function sincronizarRolesConTablas(personaId, roles, conn) {
  const connection = conn || await getConnection();
  const shouldRelease = !conn;
  
  try {
    const rolesNormalizados = roles.map(r => r.toUpperCase());
    const resultados = {};
    
    // SOCIO
    if (rolesNormalizados.includes('SOCIO')) {
      resultados.socio = await crearSocio(personaId, connection);
      console.log(` Socio creado/verificado para persona ${personaId}:`, resultados.socio);
    } else {
      await eliminarSocio(personaId, connection);
    }
    
    // ALUMNO
    if (rolesNormalizados.includes('ALUMNO')) {
      resultados.alumno = await crearAlumno(personaId, connection);
      console.log(` Alumno creado/verificado para persona ${personaId}`);
    } else {
      await eliminarAlumno(personaId, connection);
    }
    
    // JUGADOR
    if (rolesNormalizados.includes('JUGADOR')) {
      resultados.jugador = await crearJugador(personaId, connection);
      console.log(` Jugador creado/verificado para persona ${personaId}`);
    } else {
      await eliminarJugador(personaId, connection);
    }
    
    // Los demas roles (PERSONAL, PERSONAL_CAJA, REVISOR_CUENTA, COORDINADOR, DIRECTIVO)
    // solo necesitan estar en persona_rol, no tienen tabla especifica
    
    return resultados;
  } catch (error) {
    console.error(` Error sincronizando roles para persona ${personaId}:`, error.message);
    console.error(`Stack:`, error.stack);
    throw error;
  } finally {
    if (shouldRelease) connection.release();
  }
}

export { crearSocio, crearAlumno, crearJugador, eliminarSocio, eliminarAlumno, eliminarJugador };

