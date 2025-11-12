import bcrypt from 'bcryptjs';
import { query } from './src/db/connection.js';

async function crearUsuarioBoleteria() {
  try {
    // Hash de la contraseña
    const password = 'boleteria123';
    const hash = await bcrypt.hash(password, 10);

    console.log('Hash generado:', hash);

    // Buscar o crear persona
    let persona = await query('SELECT id FROM persona WHERE dni = ?', ['88888888']);

    if (persona.length === 0) {
      await query(
        'INSERT INTO persona (nombre, apellido, dni, genero, rol, estado) VALUES (?, ?, ?, ?, ?, ?)',
        ['Juan', 'Boletero', '88888888', 'MASCULINO', 'BOLETERIA', 'ACTIVO']
      );
      persona = await query('SELECT id FROM persona WHERE dni = ?', ['88888888']);
    }

    const personaId = persona[0].id;

    // Verificar si usuario existe
    const usuarioExiste = await query('SELECT id FROM usuario WHERE username = ?', ['boleteria']);

    if (usuarioExiste.length > 0) {
      // Actualizar
      await query(
        'UPDATE usuario SET password_hash = ?, persona_id = ? WHERE username = ?',
        [hash, personaId, 'boleteria']
      );
      console.log('Usuario actualizado');
    } else {
      // Crear
      await query(
        'INSERT INTO usuario (username, password_hash, rol_sistema, persona_id) VALUES (?, ?, ?, ?)',
        ['boleteria', hash, 'BOLETERIA', personaId]
      );
      console.log('Usuario creado');
    }

    // Agregar rol a persona_rol
    const rolExiste = await query('SELECT id FROM persona_rol WHERE persona_id = ? AND rol = ?', [personaId, 'BOLETERIA']);

    if (rolExiste.length === 0) {
      await query('INSERT INTO persona_rol (persona_id, rol) VALUES (?, ?)', [personaId, 'BOLETERIA']);
      console.log('Rol agregado a persona_rol');
    }

    console.log('\n✅ Usuario boleteria creado/actualizado exitosamente');
    console.log('Usuario: boleteria');
    console.log('Contraseña: boleteria123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearUsuarioBoleteria();
