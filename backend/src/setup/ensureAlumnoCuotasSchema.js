import { query } from '../db/connection.js';

export async function ensureAlumnoCuotasSchema(){
  // asistencia_alumno
  await query(`
    CREATE TABLE IF NOT EXISTS asistencia_alumno (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      alumno_id BIGINT UNSIGNED NOT NULL,
      fecha DATE NOT NULL,
      deporte_id BIGINT UNSIGNED NOT NULL,
      categoria_id BIGINT UNSIGNED NOT NULL,
      presente TINYINT(1) NOT NULL DEFAULT 1,
      observacion VARCHAR(255) NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_asistencia (alumno_id, fecha, deporte_id, categoria_id),
      CONSTRAINT fk_asist_alumno FOREIGN KEY (alumno_id) REFERENCES alumno(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_asist_dep FOREIGN KEY (deporte_id) REFERENCES deporte(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT fk_asist_cat FOREIGN KEY (categoria_id) REFERENCES categoria(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // tarifa_actividad
  await query(`
    CREATE TABLE IF NOT EXISTS tarifa_actividad (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      deporte_id BIGINT UNSIGNED NOT NULL,
      categoria_id BIGINT UNSIGNED NOT NULL,
      importe DECIMAL(12,2) NOT NULL,
      vigente_desde DATE NOT NULL DEFAULT (CURRENT_DATE),
      vigente_hasta DATE NULL,
      UNIQUE KEY uq_tarifa (deporte_id, categoria_id, vigente_desde),
      CONSTRAINT fk_tar_dep FOREIGN KEY (deporte_id) REFERENCES deporte(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT fk_tar_cat FOREIGN KEY (categoria_id) REFERENCES categoria(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // cuota_alumno y pago_cuota_alumno
  await query(`
    CREATE TABLE IF NOT EXISTS cuota_alumno (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      persona_id BIGINT UNSIGNED NOT NULL,
      periodo VARCHAR(200) NOT NULL,
      total_importe DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      importe_pagado DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      saldo DECIMAL(12,2) GENERATED ALWAYS AS (ROUND(GREATEST((total_importe - importe_pagado),0),2)) STORED,
      vencimiento DATE NOT NULL,
      estado ENUM('EMITIDA','PENDIENTE','PAGADA','VENCIDA') NOT NULL DEFAULT 'EMITIDA',
      comprobante_pdf VARCHAR(255) NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_persona_periodo (persona_id, periodo),
      CONSTRAINT fk_cu_al_persona FOREIGN KEY (persona_id) REFERENCES persona(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS pago_cuota_alumno (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      cuota_id BIGINT UNSIGNED NOT NULL,
      monto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      medio_pago ENUM('EFECTIVO','MERCADO_PAGO','TRANSFERENCIA') NULL,
      nro_tramite VARCHAR(60) NULL,
      observacion VARCHAR(255) NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_pago_cu_al FOREIGN KEY (cuota_id) REFERENCES cuota_alumno(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // vista de mora para alumnos (requiere config_financiera con id=1)
  await query(`
    CREATE OR REPLACE VIEW v_cuota_alumno_con_mora AS
    SELECT
      c.id, c.persona_id, c.periodo, c.total_importe, c.importe_pagado, c.saldo,
      c.vencimiento, c.estado, c.comprobante_pdf, c.created_at, c.updated_at,
      GREATEST(TO_DAYS(CURDATE()) - TO_DAYS(c.vencimiento), 0) AS dias_atraso,
      (SELECT mora_diaria FROM config_financiera WHERE id=1) AS mora_diaria,
      ROUND(c.saldo + (GREATEST(TO_DAYS(CURDATE()) - TO_DAYS(c.vencimiento),0) * (SELECT mora_diaria FROM config_financiera WHERE id=1)), 2) AS saldo_con_mora
    FROM cuota_alumno c;
  `);
}

