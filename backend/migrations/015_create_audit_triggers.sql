-- =========================================
-- TRIGGERS DE AUDITORÍA PARA TODAS LAS TABLAS
-- Sistema de auditoría automático
-- Fecha: 2025-11-11
-- =========================================

USE club_lujan;

DELIMITER $$

-- =========================================
-- TABLA: persona
-- =========================================

DROP TRIGGER IF EXISTS trg_audit_persona_insert$$
CREATE TRIGGER trg_audit_persona_insert AFTER INSERT ON persona FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, new_values, connection_id, operation_timestamp
  ) VALUES (
    'INSERT', 'persona', NEW.id, @current_user_id,
    JSON_OBJECT(
      'nombre', NEW.nombre, 'apellido', NEW.apellido, 'genero', NEW.genero,
      'dni', NEW.dni, 'fecha_nac', NEW.fecha_nac, 'email', NEW.email,
      'telefono', NEW.telefono, 'domicilio', NEW.domicilio, 'foto', NEW.foto,
      'rol', NEW.rol, 'estado', NEW.estado, 'qr_ver', NEW.qr_ver, 'qr_url', NEW.qr_url
    ),
    CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_persona_update$$
CREATE TRIGGER trg_audit_persona_update AFTER UPDATE ON persona FOR EACH ROW
BEGIN
  DECLARE changed JSON;
  SET changed = JSON_ARRAY();

  IF OLD.nombre != NEW.nombre THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'nombre'); END IF;
  IF OLD.apellido != NEW.apellido THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'apellido'); END IF;
  IF OLD.genero != NEW.genero THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'genero'); END IF;
  IF OLD.dni != NEW.dni THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'dni'); END IF;
  IF OLD.fecha_nac != NEW.fecha_nac THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'fecha_nac'); END IF;
  IF OLD.email != NEW.email THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'email'); END IF;
  IF OLD.telefono != NEW.telefono THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'telefono'); END IF;
  IF OLD.domicilio != NEW.domicilio THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'domicilio'); END IF;
  IF OLD.foto != NEW.foto THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'foto'); END IF;
  IF OLD.rol != NEW.rol THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'rol'); END IF;
  IF OLD.estado != NEW.estado THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'estado'); END IF;

  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, new_values, changed_fields, connection_id, operation_timestamp
  ) VALUES (
    'UPDATE', 'persona', NEW.id, @current_user_id,
    JSON_OBJECT('nombre', OLD.nombre, 'apellido', OLD.apellido, 'dni', OLD.dni, 'email', OLD.email, 'telefono', OLD.telefono, 'rol', OLD.rol, 'estado', OLD.estado),
    JSON_OBJECT('nombre', NEW.nombre, 'apellido', NEW.apellido, 'dni', NEW.dni, 'email', NEW.email, 'telefono', NEW.telefono, 'rol', NEW.rol, 'estado', NEW.estado),
    changed, CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_persona_delete$$
CREATE TRIGGER trg_audit_persona_delete AFTER DELETE ON persona FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, connection_id, operation_timestamp
  ) VALUES (
    'DELETE', 'persona', OLD.id, @current_user_id,
    JSON_OBJECT('nombre', OLD.nombre, 'apellido', OLD.apellido, 'dni', OLD.dni, 'email', OLD.email, 'telefono', OLD.telefono, 'rol', OLD.rol),
    CONNECTION_ID(), NOW(6)
  );
END$$

-- =========================================
-- TABLA: usuario
-- =========================================

DROP TRIGGER IF EXISTS trg_audit_usuario_insert$$
CREATE TRIGGER trg_audit_usuario_insert AFTER INSERT ON usuario FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, new_values, connection_id, operation_timestamp
  ) VALUES (
    'INSERT', 'usuario', NEW.id, @current_user_id,
    JSON_OBJECT('username', NEW.username, 'rol_sistema', NEW.rol_sistema, 'persona_id', NEW.persona_id),
    CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_usuario_update$$
CREATE TRIGGER trg_audit_usuario_update AFTER UPDATE ON usuario FOR EACH ROW
BEGIN
  DECLARE changed JSON;
  SET changed = JSON_ARRAY();

  IF OLD.username != NEW.username THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'username'); END IF;
  IF OLD.rol_sistema != NEW.rol_sistema THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'rol_sistema'); END IF;
  IF OLD.password_hash != NEW.password_hash THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'password_hash'); END IF;

  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, new_values, changed_fields, connection_id, operation_timestamp
  ) VALUES (
    'UPDATE', 'usuario', NEW.id, @current_user_id,
    JSON_OBJECT('username', OLD.username, 'rol_sistema', OLD.rol_sistema, 'persona_id', OLD.persona_id),
    JSON_OBJECT('username', NEW.username, 'rol_sistema', NEW.rol_sistema, 'persona_id', NEW.persona_id),
    changed, CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_usuario_delete$$
CREATE TRIGGER trg_audit_usuario_delete AFTER DELETE ON usuario FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, connection_id, operation_timestamp
  ) VALUES (
    'DELETE', 'usuario', OLD.id, @current_user_id,
    JSON_OBJECT('username', OLD.username, 'rol_sistema', OLD.rol_sistema, 'persona_id', OLD.persona_id),
    CONNECTION_ID(), NOW(6)
  );
END$$

-- =========================================
-- TABLA: socio
-- =========================================

DROP TRIGGER IF EXISTS trg_audit_socio_insert$$
CREATE TRIGGER trg_audit_socio_insert AFTER INSERT ON socio FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, new_values, connection_id, operation_timestamp
  ) VALUES (
    'INSERT', 'socio', NEW.id, @current_user_id,
    JSON_OBJECT('persona_id', NEW.persona_id, 'nro_socio', NEW.nro_socio, 'fecha_alta', NEW.fecha_alta, 'estado_cuenta', NEW.estado_cuenta),
    CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_socio_update$$
CREATE TRIGGER trg_audit_socio_update AFTER UPDATE ON socio FOR EACH ROW
BEGIN
  DECLARE changed JSON;
  SET changed = JSON_ARRAY();

  IF OLD.nro_socio != NEW.nro_socio THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'nro_socio'); END IF;
  IF OLD.estado_cuenta != NEW.estado_cuenta THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'estado_cuenta'); END IF;

  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, new_values, changed_fields, connection_id, operation_timestamp
  ) VALUES (
    'UPDATE', 'socio', NEW.id, @current_user_id,
    JSON_OBJECT('nro_socio', OLD.nro_socio, 'estado_cuenta', OLD.estado_cuenta),
    JSON_OBJECT('nro_socio', NEW.nro_socio, 'estado_cuenta', NEW.estado_cuenta),
    changed, CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_socio_delete$$
CREATE TRIGGER trg_audit_socio_delete AFTER DELETE ON socio FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, connection_id, operation_timestamp
  ) VALUES (
    'DELETE', 'socio', OLD.id, @current_user_id,
    JSON_OBJECT('persona_id', OLD.persona_id, 'nro_socio', OLD.nro_socio, 'estado_cuenta', OLD.estado_cuenta),
    CONNECTION_ID(), NOW(6)
  );
END$$

-- =========================================
-- TABLA: alumno
-- =========================================

DROP TRIGGER IF EXISTS trg_audit_alumno_insert$$
CREATE TRIGGER trg_audit_alumno_insert AFTER INSERT ON alumno FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, new_values, connection_id, operation_timestamp
  ) VALUES (
    'INSERT', 'alumno', NEW.id, @current_user_id,
    JSON_OBJECT('persona_id', NEW.persona_id, 'categoria_id', NEW.categoria_id, 'apto_medico_url', NEW.apto_medico_url, 'fecha_vencimiento_apto', NEW.fecha_vencimiento_apto),
    CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_alumno_update$$
CREATE TRIGGER trg_audit_alumno_update AFTER UPDATE ON alumno FOR EACH ROW
BEGIN
  DECLARE changed JSON;
  SET changed = JSON_ARRAY();

  IF OLD.categoria_id != NEW.categoria_id THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'categoria_id'); END IF;
  IF OLD.apto_medico_url != NEW.apto_medico_url THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'apto_medico_url'); END IF;
  IF OLD.fecha_vencimiento_apto != NEW.fecha_vencimiento_apto THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'fecha_vencimiento_apto'); END IF;

  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, new_values, changed_fields, connection_id, operation_timestamp
  ) VALUES (
    'UPDATE', 'alumno', NEW.id, @current_user_id,
    JSON_OBJECT('categoria_id', OLD.categoria_id, 'apto_medico_url', OLD.apto_medico_url),
    JSON_OBJECT('categoria_id', NEW.categoria_id, 'apto_medico_url', NEW.apto_medico_url),
    changed, CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_alumno_delete$$
CREATE TRIGGER trg_audit_alumno_delete AFTER DELETE ON alumno FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, connection_id, operation_timestamp
  ) VALUES (
    'DELETE', 'alumno', OLD.id, @current_user_id,
    JSON_OBJECT('persona_id', OLD.persona_id, 'categoria_id', OLD.categoria_id),
    CONNECTION_ID(), NOW(6)
  );
END$$

-- =========================================
-- TABLA: jugador
-- =========================================

DROP TRIGGER IF EXISTS trg_audit_jugador_insert$$
CREATE TRIGGER trg_audit_jugador_insert AFTER INSERT ON jugador FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, new_values, connection_id, operation_timestamp
  ) VALUES (
    'INSERT', 'jugador', NEW.id, @current_user_id,
    JSON_OBJECT('persona_id', NEW.persona_id, 'deporte_id', NEW.deporte_id, 'contrato_url', NEW.contrato_url),
    CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_jugador_update$$
CREATE TRIGGER trg_audit_jugador_update AFTER UPDATE ON jugador FOR EACH ROW
BEGIN
  DECLARE changed JSON;
  SET changed = JSON_ARRAY();

  IF OLD.deporte_id != NEW.deporte_id THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'deporte_id'); END IF;
  IF OLD.contrato_url != NEW.contrato_url THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'contrato_url'); END IF;

  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, new_values, changed_fields, connection_id, operation_timestamp
  ) VALUES (
    'UPDATE', 'jugador', NEW.id, @current_user_id,
    JSON_OBJECT('deporte_id', OLD.deporte_id, 'contrato_url', OLD.contrato_url),
    JSON_OBJECT('deporte_id', NEW.deporte_id, 'contrato_url', NEW.contrato_url),
    changed, CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_jugador_delete$$
CREATE TRIGGER trg_audit_jugador_delete AFTER DELETE ON jugador FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, connection_id, operation_timestamp
  ) VALUES (
    'DELETE', 'jugador', OLD.id, @current_user_id,
    JSON_OBJECT('persona_id', OLD.persona_id, 'deporte_id', OLD.deporte_id),
    CONNECTION_ID(), NOW(6)
  );
END$$

-- =========================================
-- TABLA: cuota (CRÍTICA - Financiera)
-- =========================================

DROP TRIGGER IF EXISTS trg_audit_cuota_insert$$
CREATE TRIGGER trg_audit_cuota_insert AFTER INSERT ON cuota FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, new_values, connection_id, operation_timestamp
  ) VALUES (
    'INSERT', 'cuota', NEW.id, @current_user_id,
    JSON_OBJECT('socio_id', NEW.socio_id, 'periodo', NEW.periodo, 'total_importe', NEW.total_importe,
                'importe_pagado', NEW.importe_pagado, 'saldo', NEW.saldo, 'vencimiento', NEW.vencimiento,
                'estado', NEW.estado),
    CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_cuota_update$$
CREATE TRIGGER trg_audit_cuota_update AFTER UPDATE ON cuota FOR EACH ROW
BEGIN
  DECLARE changed JSON;
  SET changed = JSON_ARRAY();

  IF OLD.total_importe != NEW.total_importe THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'total_importe'); END IF;
  IF OLD.importe_pagado != NEW.importe_pagado THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'importe_pagado'); END IF;
  IF OLD.saldo != NEW.saldo THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'saldo'); END IF;
  IF OLD.estado != NEW.estado THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'estado'); END IF;

  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, new_values, changed_fields, connection_id, operation_timestamp
  ) VALUES (
    'UPDATE', 'cuota', NEW.id, @current_user_id,
    JSON_OBJECT('total_importe', OLD.total_importe, 'importe_pagado', OLD.importe_pagado, 'saldo', OLD.saldo, 'estado', OLD.estado),
    JSON_OBJECT('total_importe', NEW.total_importe, 'importe_pagado', NEW.importe_pagado, 'saldo', NEW.saldo, 'estado', NEW.estado),
    changed, CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_cuota_delete$$
CREATE TRIGGER trg_audit_cuota_delete AFTER DELETE ON cuota FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, connection_id, operation_timestamp
  ) VALUES (
    'DELETE', 'cuota', OLD.id, @current_user_id,
    JSON_OBJECT('socio_id', OLD.socio_id, 'periodo', OLD.periodo, 'total_importe', OLD.total_importe, 'estado', OLD.estado),
    CONNECTION_ID(), NOW(6)
  );
END$$

-- =========================================
-- TABLA: cuota_alumno (CRÍTICA - Financiera)
-- =========================================

DROP TRIGGER IF EXISTS trg_audit_cuota_alumno_insert$$
CREATE TRIGGER trg_audit_cuota_alumno_insert AFTER INSERT ON cuota_alumno FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, new_values, connection_id, operation_timestamp
  ) VALUES (
    'INSERT', 'cuota_alumno', NEW.id, @current_user_id,
    JSON_OBJECT('persona_id', NEW.persona_id, 'periodo', NEW.periodo, 'total_importe', NEW.total_importe,
                'importe_pagado', NEW.importe_pagado, 'saldo', NEW.saldo, 'vencimiento', NEW.vencimiento,
                'estado', NEW.estado),
    CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_cuota_alumno_update$$
CREATE TRIGGER trg_audit_cuota_alumno_update AFTER UPDATE ON cuota_alumno FOR EACH ROW
BEGIN
  DECLARE changed JSON;
  SET changed = JSON_ARRAY();

  IF OLD.total_importe != NEW.total_importe THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'total_importe'); END IF;
  IF OLD.importe_pagado != NEW.importe_pagado THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'importe_pagado'); END IF;
  IF OLD.saldo != NEW.saldo THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'saldo'); END IF;
  IF OLD.estado != NEW.estado THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'estado'); END IF;

  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, new_values, changed_fields, connection_id, operation_timestamp
  ) VALUES (
    'UPDATE', 'cuota_alumno', NEW.id, @current_user_id,
    JSON_OBJECT('total_importe', OLD.total_importe, 'importe_pagado', OLD.importe_pagado, 'saldo', OLD.saldo, 'estado', OLD.estado),
    JSON_OBJECT('total_importe', NEW.total_importe, 'importe_pagado', NEW.importe_pagado, 'saldo', NEW.saldo, 'estado', NEW.estado),
    changed, CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_cuota_alumno_delete$$
CREATE TRIGGER trg_audit_cuota_alumno_delete AFTER DELETE ON cuota_alumno FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, connection_id, operation_timestamp
  ) VALUES (
    'DELETE', 'cuota_alumno', OLD.id, @current_user_id,
    JSON_OBJECT('persona_id', OLD.persona_id, 'periodo', OLD.periodo, 'total_importe', OLD.total_importe, 'estado', OLD.estado),
    CONNECTION_ID(), NOW(6)
  );
END$$

-- =========================================
-- TABLA: pago_cuota (CRÍTICA - Financiera)
-- =========================================

DROP TRIGGER IF EXISTS trg_audit_pago_cuota_insert$$
CREATE TRIGGER trg_audit_pago_cuota_insert AFTER INSERT ON pago_cuota FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, new_values, connection_id, operation_timestamp
  ) VALUES (
    'INSERT', 'pago_cuota', NEW.id, @current_user_id,
    JSON_OBJECT('cuota_id', NEW.cuota_id, 'caja_id', NEW.caja_id, 'fecha_pago', NEW.fecha_pago,
                'monto_pagado', NEW.monto_pagado, 'medio_pago', NEW.medio_pago, 'nro_tramite', NEW.nro_tramite),
    CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_pago_cuota_update$$
CREATE TRIGGER trg_audit_pago_cuota_update AFTER UPDATE ON pago_cuota FOR EACH ROW
BEGIN
  DECLARE changed JSON;
  SET changed = JSON_ARRAY();

  IF OLD.monto_pagado != NEW.monto_pagado THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'monto_pagado'); END IF;
  IF OLD.medio_pago != NEW.medio_pago THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'medio_pago'); END IF;

  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, new_values, changed_fields, connection_id, operation_timestamp
  ) VALUES (
    'UPDATE', 'pago_cuota', NEW.id, @current_user_id,
    JSON_OBJECT('monto_pagado', OLD.monto_pagado, 'medio_pago', OLD.medio_pago),
    JSON_OBJECT('monto_pagado', NEW.monto_pagado, 'medio_pago', NEW.medio_pago),
    changed, CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_pago_cuota_delete$$
CREATE TRIGGER trg_audit_pago_cuota_delete AFTER DELETE ON pago_cuota FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, connection_id, operation_timestamp
  ) VALUES (
    'DELETE', 'pago_cuota', OLD.id, @current_user_id,
    JSON_OBJECT('cuota_id', OLD.cuota_id, 'monto_pagado', OLD.monto_pagado, 'fecha_pago', OLD.fecha_pago),
    CONNECTION_ID(), NOW(6)
  );
END$$

-- =========================================
-- TABLA: pago_cuota_alumno (CRÍTICA - Financiera)
-- =========================================

DROP TRIGGER IF EXISTS trg_audit_pago_cuota_alumno_insert$$
CREATE TRIGGER trg_audit_pago_cuota_alumno_insert AFTER INSERT ON pago_cuota_alumno FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, new_values, connection_id, operation_timestamp
  ) VALUES (
    'INSERT', 'pago_cuota_alumno', NEW.id, @current_user_id,
    JSON_OBJECT('cuota_alumno_id', NEW.cuota_alumno_id, 'caja_id', NEW.caja_id, 'fecha_pago', NEW.fecha_pago,
                'monto_pagado', NEW.monto_pagado, 'medio_pago', NEW.medio_pago),
    CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_pago_cuota_alumno_update$$
CREATE TRIGGER trg_audit_pago_cuota_alumno_update AFTER UPDATE ON pago_cuota_alumno FOR EACH ROW
BEGIN
  DECLARE changed JSON;
  SET changed = JSON_ARRAY();

  IF OLD.monto_pagado != NEW.monto_pagado THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'monto_pagado'); END IF;

  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, new_values, changed_fields, connection_id, operation_timestamp
  ) VALUES (
    'UPDATE', 'pago_cuota_alumno', NEW.id, @current_user_id,
    JSON_OBJECT('monto_pagado', OLD.monto_pagado),
    JSON_OBJECT('monto_pagado', NEW.monto_pagado),
    changed, CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_pago_cuota_alumno_delete$$
CREATE TRIGGER trg_audit_pago_cuota_alumno_delete AFTER DELETE ON pago_cuota_alumno FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, connection_id, operation_timestamp
  ) VALUES (
    'DELETE', 'pago_cuota_alumno', OLD.id, @current_user_id,
    JSON_OBJECT('cuota_alumno_id', OLD.cuota_alumno_id, 'monto_pagado', OLD.monto_pagado),
    CONNECTION_ID(), NOW(6)
  );
END$$

-- =========================================
-- TABLA: asistencia_alumno
-- =========================================

DROP TRIGGER IF EXISTS trg_audit_asistencia_alumno_insert$$
CREATE TRIGGER trg_audit_asistencia_alumno_insert AFTER INSERT ON asistencia_alumno FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, new_values, connection_id, operation_timestamp
  ) VALUES (
    'INSERT', 'asistencia_alumno', NEW.id, @current_user_id,
    JSON_OBJECT('alumno_id', NEW.alumno_id, 'fecha_hora', NEW.fecha_hora, 'metodo_registro', NEW.metodo_registro,
                'coordinador_id', NEW.coordinador_id, 'turno_id', NEW.turno_id),
    CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_asistencia_alumno_delete$$
CREATE TRIGGER trg_audit_asistencia_alumno_delete AFTER DELETE ON asistencia_alumno FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, connection_id, operation_timestamp
  ) VALUES (
    'DELETE', 'asistencia_alumno', OLD.id, @current_user_id,
    JSON_OBJECT('alumno_id', OLD.alumno_id, 'fecha_hora', OLD.fecha_hora),
    CONNECTION_ID(), NOW(6)
  );
END$$

-- =========================================
-- TABLA: deporte
-- =========================================

DROP TRIGGER IF EXISTS trg_audit_deporte_insert$$
CREATE TRIGGER trg_audit_deporte_insert AFTER INSERT ON deporte FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, new_values, connection_id, operation_timestamp
  ) VALUES (
    'INSERT', 'deporte', NEW.id, @current_user_id,
    JSON_OBJECT('nombre', NEW.nombre, 'descripcion', NEW.descripcion, 'activo', NEW.activo),
    CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_deporte_update$$
CREATE TRIGGER trg_audit_deporte_update AFTER UPDATE ON deporte FOR EACH ROW
BEGIN
  DECLARE changed JSON;
  SET changed = JSON_ARRAY();

  IF OLD.nombre != NEW.nombre THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'nombre'); END IF;
  IF OLD.activo != NEW.activo THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'activo'); END IF;

  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, new_values, changed_fields, connection_id, operation_timestamp
  ) VALUES (
    'UPDATE', 'deporte', NEW.id, @current_user_id,
    JSON_OBJECT('nombre', OLD.nombre, 'activo', OLD.activo),
    JSON_OBJECT('nombre', NEW.nombre, 'activo', NEW.activo),
    changed, CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_deporte_delete$$
CREATE TRIGGER trg_audit_deporte_delete AFTER DELETE ON deporte FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, connection_id, operation_timestamp
  ) VALUES (
    'DELETE', 'deporte', OLD.id, @current_user_id,
    JSON_OBJECT('nombre', OLD.nombre),
    CONNECTION_ID(), NOW(6)
  );
END$$

-- =========================================
-- TABLA: categoria
-- =========================================

DROP TRIGGER IF EXISTS trg_audit_categoria_insert$$
CREATE TRIGGER trg_audit_categoria_insert AFTER INSERT ON categoria FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, new_values, connection_id, operation_timestamp
  ) VALUES (
    'INSERT', 'categoria', NEW.id, @current_user_id,
    JSON_OBJECT('deporte_id', NEW.deporte_id, 'nombre', NEW.nombre, 'descripcion', NEW.descripcion, 'activo', NEW.activo),
    CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_categoria_update$$
CREATE TRIGGER trg_audit_categoria_update AFTER UPDATE ON categoria FOR EACH ROW
BEGIN
  DECLARE changed JSON;
  SET changed = JSON_ARRAY();

  IF OLD.nombre != NEW.nombre THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'nombre'); END IF;
  IF OLD.activo != NEW.activo THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'activo'); END IF;

  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, new_values, changed_fields, connection_id, operation_timestamp
  ) VALUES (
    'UPDATE', 'categoria', NEW.id, @current_user_id,
    JSON_OBJECT('nombre', OLD.nombre, 'activo', OLD.activo),
    JSON_OBJECT('nombre', NEW.nombre, 'activo', NEW.activo),
    changed, CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_categoria_delete$$
CREATE TRIGGER trg_audit_categoria_delete AFTER DELETE ON categoria FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, connection_id, operation_timestamp
  ) VALUES (
    'DELETE', 'categoria', OLD.id, @current_user_id,
    JSON_OBJECT('nombre', OLD.nombre),
    CONNECTION_ID(), NOW(6)
  );
END$$

-- =========================================
-- TABLA: plan
-- =========================================

DROP TRIGGER IF EXISTS trg_audit_plan_insert$$
CREATE TRIGGER trg_audit_plan_insert AFTER INSERT ON plan FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, new_values, connection_id, operation_timestamp
  ) VALUES (
    'INSERT', 'plan', NEW.id, @current_user_id,
    JSON_OBJECT('nombre', NEW.nombre, 'importe', NEW.importe, 'activo', NEW.activo),
    CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_plan_update$$
CREATE TRIGGER trg_audit_plan_update AFTER UPDATE ON plan FOR EACH ROW
BEGIN
  DECLARE changed JSON;
  SET changed = JSON_ARRAY();

  IF OLD.nombre != NEW.nombre THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'nombre'); END IF;
  IF OLD.importe != NEW.importe THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'importe'); END IF;
  IF OLD.activo != NEW.activo THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'activo'); END IF;

  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, new_values, changed_fields, connection_id, operation_timestamp
  ) VALUES (
    'UPDATE', 'plan', NEW.id, @current_user_id,
    JSON_OBJECT('nombre', OLD.nombre, 'importe', OLD.importe, 'activo', OLD.activo),
    JSON_OBJECT('nombre', NEW.nombre, 'importe', NEW.importe, 'activo', NEW.activo),
    changed, CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_plan_delete$$
CREATE TRIGGER trg_audit_plan_delete AFTER DELETE ON plan FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, connection_id, operation_timestamp
  ) VALUES (
    'DELETE', 'plan', OLD.id, @current_user_id,
    JSON_OBJECT('nombre', OLD.nombre, 'importe', OLD.importe),
    CONNECTION_ID(), NOW(6)
  );
END$$

-- =========================================
-- TABLA: config_financiera
-- =========================================

DROP TRIGGER IF EXISTS trg_audit_config_financiera_update$$
CREATE TRIGGER trg_audit_config_financiera_update AFTER UPDATE ON config_financiera FOR EACH ROW
BEGIN
  DECLARE changed JSON;
  SET changed = JSON_ARRAY();

  IF OLD.mora_diaria != NEW.mora_diaria THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'mora_diaria'); END IF;
  IF OLD.limite_dias_gracia != NEW.limite_dias_gracia THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'limite_dias_gracia'); END IF;

  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, new_values, changed_fields, connection_id, operation_timestamp
  ) VALUES (
    'UPDATE', 'config_financiera', NEW.id, @current_user_id,
    JSON_OBJECT('mora_diaria', OLD.mora_diaria, 'limite_dias_gracia', OLD.limite_dias_gracia),
    JSON_OBJECT('mora_diaria', NEW.mora_diaria, 'limite_dias_gracia', NEW.limite_dias_gracia),
    changed, CONNECTION_ID(), NOW(6)
  );
END$$

-- =========================================
-- TABLA: biometric_profile
-- =========================================

DROP TRIGGER IF EXISTS trg_audit_biometric_profile_insert$$
CREATE TRIGGER trg_audit_biometric_profile_insert AFTER INSERT ON biometric_profile FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, new_values, connection_id, operation_timestamp
  ) VALUES (
    'INSERT', 'biometric_profile', NEW.id, @current_user_id,
    JSON_OBJECT('persona_id', NEW.persona_id, 'profile_version', NEW.profile_version, 'activo', NEW.activo),
    CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_biometric_profile_update$$
CREATE TRIGGER trg_audit_biometric_profile_update AFTER UPDATE ON biometric_profile FOR EACH ROW
BEGIN
  DECLARE changed JSON;
  SET changed = JSON_ARRAY();

  IF OLD.activo != NEW.activo THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'activo'); END IF;
  IF OLD.profile_version != NEW.profile_version THEN SET changed = JSON_ARRAY_APPEND(changed, '$', 'profile_version'); END IF;

  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, new_values, changed_fields, connection_id, operation_timestamp
  ) VALUES (
    'UPDATE', 'biometric_profile', NEW.id, @current_user_id,
    JSON_OBJECT('activo', OLD.activo, 'profile_version', OLD.profile_version),
    JSON_OBJECT('activo', NEW.activo, 'profile_version', NEW.profile_version),
    changed, CONNECTION_ID(), NOW(6)
  );
END$$

DROP TRIGGER IF EXISTS trg_audit_biometric_profile_delete$$
CREATE TRIGGER trg_audit_biometric_profile_delete AFTER DELETE ON biometric_profile FOR EACH ROW
BEGIN
  INSERT INTO club_lujan_audit.audit_master (
    operation_type, table_name, record_id, usuario_id, old_values, connection_id, operation_timestamp
  ) VALUES (
    'DELETE', 'biometric_profile', OLD.id, @current_user_id,
    JSON_OBJECT('persona_id', OLD.persona_id),
    CONNECTION_ID(), NOW(6)
  );
END$$

DELIMITER ;

-- =========================================
-- RESUMEN DE TRIGGERS CREADOS
-- =========================================

SELECT 'Triggers de auditoría creados exitosamente' AS status;

SELECT
  TRIGGER_NAME,
  EVENT_MANIPULATION,
  EVENT_OBJECT_TABLE,
  ACTION_TIMING
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'club_lujan'
  AND TRIGGER_NAME LIKE 'trg_audit_%'
ORDER BY EVENT_OBJECT_TABLE, EVENT_MANIPULATION;
