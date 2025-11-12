-- Adminer 5.4.1 MySQL 8.4.7 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

DELIMITER ;;

DROP FUNCTION IF EXISTS `fn_saldo_caja_actual`;;
CREATE FUNCTION `fn_saldo_caja_actual` () RETURNS decimal(12,2) LANGUAGE SQL
READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE total_ingresos DECIMAL(12,2) DEFAULT 0;
    DECLARE total_egresos DECIMAL(12,2) DEFAULT 0;

    SELECT COALESCE(SUM(monto), 0) INTO total_ingresos
    FROM caja
    WHERE tipo = 'INGRESO';

    SELECT COALESCE(SUM(monto), 0) INTO total_egresos
    FROM caja
    WHERE tipo = 'EGRESO' AND estado = 'APROBADO';

    RETURN total_ingresos - total_egresos;
END;;

DELIMITER ;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `alumno`;
CREATE TABLE `alumno` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `persona_id` bigint unsigned NOT NULL,
  `apto_medico` date DEFAULT NULL,
  `apto_pdf` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_alumno_persona` (`persona_id`),
  CONSTRAINT `fk_alumno_persona` FOREIGN KEY (`persona_id`) REFERENCES `persona` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `alumno` (`id`, `persona_id`, `apto_medico`, `apto_pdf`, `created_at`, `updated_at`) VALUES
(1,	2,	'2025-09-24',	NULL,	'2025-09-26 13:12:23',	'2025-09-26 13:12:23'),
(2,	17,	'2025-01-15',	NULL,	'2025-11-10 20:23:43',	'2025-11-10 20:23:43'),
(3,	42,	'2025-01-20',	NULL,	'2025-11-10 20:23:43',	'2025-11-10 20:23:43'),
(4,	43,	'2025-02-01',	NULL,	'2025-11-10 20:23:43',	'2025-11-10 20:23:43'),
(5,	44,	'2025-02-10',	NULL,	'2025-11-10 20:23:43',	'2025-11-10 20:23:43'),
(6,	45,	'2025-02-20',	NULL,	'2025-11-10 20:23:43',	'2025-11-10 20:23:43'),
(7,	56,	'2025-12-31',	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(8,	57,	'2025-12-31',	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(9,	58,	'2025-12-31',	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(10,	59,	'2025-12-31',	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(11,	60,	'2025-12-31',	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(12,	61,	'2025-12-31',	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(13,	62,	'2025-12-31',	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(14,	63,	'2025-12-31',	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(15,	64,	'2025-12-31',	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(16,	65,	'2025-12-31',	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(17,	66,	'2025-12-31',	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04');

DROP TABLE IF EXISTS `alumno_categoria`;
CREATE TABLE `alumno_categoria` (
  `alumno_id` bigint unsigned NOT NULL,
  `categoria_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`alumno_id`,`categoria_id`),
  KEY `fk_ac_cat` (`categoria_id`),
  CONSTRAINT `fk_ac_al` FOREIGN KEY (`alumno_id`) REFERENCES `alumno` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ac_cat` FOREIGN KEY (`categoria_id`) REFERENCES `categoria` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `alumno_categoria` (`alumno_id`, `categoria_id`) VALUES
(4,	2),
(6,	2),
(10,	2),
(2,	3),
(3,	3),
(5,	3),
(7,	3),
(8,	3),
(11,	3),
(12,	3),
(14,	3),
(15,	3),
(16,	3),
(9,	4),
(13,	4),
(17,	4);

DROP TABLE IF EXISTS `alumno_coordinador`;
CREATE TABLE `alumno_coordinador` (
  `alumno_id` bigint unsigned NOT NULL,
  `coordinador_id` bigint unsigned NOT NULL,
  `fecha_desde` date NOT NULL,
  `fecha_hasta` date DEFAULT NULL,
  PRIMARY KEY (`alumno_id`,`coordinador_id`,`fecha_desde`),
  KEY `fk_alc_coord` (`coordinador_id`),
  CONSTRAINT `fk_alc_al` FOREIGN KEY (`alumno_id`) REFERENCES `alumno` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_alc_coord` FOREIGN KEY (`coordinador_id`) REFERENCES `persona` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `alumno_coordinador` (`alumno_id`, `coordinador_id`, `fecha_desde`, `fecha_hasta`) VALUES
(1,	1,	'2025-09-26',	NULL),
(1,	35,	'2025-01-01',	NULL),
(2,	35,	'2025-01-01',	NULL),
(3,	35,	'2025-01-01',	NULL),
(4,	35,	'2025-01-01',	NULL),
(5,	35,	'2025-01-01',	NULL),
(6,	35,	'2025-01-01',	NULL),
(7,	35,	'2025-11-10',	NULL),
(8,	35,	'2025-11-10',	NULL),
(9,	35,	'2025-11-10',	NULL),
(10,	48,	'2025-11-10',	NULL),
(11,	48,	'2025-11-10',	NULL),
(12,	49,	'2025-11-10',	NULL),
(13,	49,	'2025-11-10',	NULL),
(14,	50,	'2025-11-10',	NULL),
(15,	50,	'2025-11-10',	NULL),
(16,	51,	'2025-11-10',	NULL),
(17,	51,	'2025-11-10',	NULL);

DROP TABLE IF EXISTS `alumno_deporte`;
CREATE TABLE `alumno_deporte` (
  `alumno_id` bigint unsigned NOT NULL,
  `deporte_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`alumno_id`,`deporte_id`),
  KEY `fk_ad_dep` (`deporte_id`),
  CONSTRAINT `fk_ad_al` FOREIGN KEY (`alumno_id`) REFERENCES `alumno` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ad_dep` FOREIGN KEY (`deporte_id`) REFERENCES `deporte` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `alumno_deporte` (`alumno_id`, `deporte_id`) VALUES
(5,	3),
(1,	10),
(7,	10),
(8,	10),
(9,	10),
(2,	11),
(10,	11),
(11,	11),
(3,	12),
(6,	12),
(12,	12),
(13,	12),
(4,	13),
(14,	13),
(15,	13),
(16,	14),
(17,	14);

DROP TABLE IF EXISTS `asistencia_alumno`;
CREATE TABLE `asistencia_alumno` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `alumno_id` bigint unsigned NOT NULL,
  `fecha` date NOT NULL,
  `deporte_id` bigint unsigned NOT NULL,
  `categoria_id` bigint unsigned NOT NULL,
  `turno_id` bigint unsigned DEFAULT NULL,
  `presente` tinyint(1) NOT NULL DEFAULT '1',
  `observacion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_asistencia` (`alumno_id`,`fecha`,`deporte_id`,`categoria_id`),
  UNIQUE KEY `uk_asistencia_completa` (`alumno_id`,`fecha`,`deporte_id`,`categoria_id`,`turno_id`),
  KEY `fk_as_dep` (`deporte_id`),
  KEY `fk_as_cat` (`categoria_id`),
  KEY `idx_fecha_deporte` (`fecha`,`deporte_id`),
  KEY `idx_fecha_categoria` (`fecha`,`categoria_id`),
  KEY `idx_presente` (`presente`),
  KEY `idx_turno` (`turno_id`),
  CONSTRAINT `fk_as_alumno` FOREIGN KEY (`alumno_id`) REFERENCES `alumno` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_as_cat` FOREIGN KEY (`categoria_id`) REFERENCES `categoria` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_as_dep` FOREIGN KEY (`deporte_id`) REFERENCES `deporte` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_asist_turno` FOREIGN KEY (`turno_id`) REFERENCES `turno` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `asistencia_alumno` (`id`, `date_created`, `date_modified`, `alumno_id`, `fecha`, `deporte_id`, `categoria_id`, `turno_id`, `presente`, `observacion`, `created_at`) VALUES
(1,	'2025-11-02 00:16:19',	'2025-11-10 21:03:18',	1,	'2025-10-29',	1,	2,	2,	1,	'Presente (SQL)',	'2025-10-29 16:42:05'),
(3,	'2025-11-10 20:23:43',	'2025-11-10 21:03:18',	2,	'2025-11-09',	1,	3,	2,	1,	'Buen desempe√É¬±o',	'2025-11-10 20:23:43'),
(4,	'2025-11-10 20:23:43',	'2025-11-10 21:03:18',	3,	'2025-11-09',	1,	3,	2,	1,	NULL,	'2025-11-10 20:23:43'),
(5,	'2025-11-10 20:23:43',	'2025-11-10 21:03:18',	4,	'2025-11-09',	2,	2,	2,	0,	'Falt√É¬≥ por enfermedad',	'2025-11-10 20:23:43'),
(6,	'2025-11-10 20:23:43',	'2025-11-10 21:03:18',	2,	'2025-11-08',	1,	3,	2,	1,	NULL,	'2025-11-10 20:23:43'),
(7,	'2025-11-10 20:23:43',	'2025-11-10 21:03:18',	5,	'2025-11-08',	4,	3,	2,	1,	'Excelente t√É¬©cnica',	'2025-11-10 20:23:43'),
(8,	'2025-11-10 20:23:43',	'2025-11-10 21:03:18',	6,	'2025-11-08',	2,	2,	2,	1,	NULL,	'2025-11-10 20:23:43'),
(9,	'2025-11-10 21:13:35',	'2025-11-10 21:13:35',	1,	'2025-11-10',	10,	3,	2,	1,	'Asistencia registrada desde SQL',	'2025-11-10 21:13:35'),
(10,	'2025-11-10 21:16:13',	'2025-11-10 21:16:13',	2,	'2025-11-10',	11,	3,	NULL,	1,	NULL,	'2025-11-10 21:16:13'),
(11,	'2025-11-10 22:26:00',	'2025-11-10 22:26:00',	12,	'2025-11-10',	12,	3,	NULL,	1,	NULL,	'2025-11-10 22:26:00'),
(12,	'2025-11-10 22:31:12',	'2025-11-10 22:31:12',	13,	'2025-11-10',	12,	4,	NULL,	1,	NULL,	'2025-11-10 22:31:12'),
(14,	'2025-11-10 22:32:41',	'2025-11-10 22:32:41',	9,	'2025-11-10',	10,	4,	NULL,	1,	NULL,	'2025-11-10 22:32:41'),
(15,	'2025-11-10 22:32:56',	'2025-11-10 22:32:56',	7,	'2025-11-10',	10,	3,	NULL,	0,	NULL,	'2025-11-10 22:32:56'),
(16,	'2025-11-10 22:33:31',	'2025-11-10 22:33:31',	7,	'2025-11-11',	10,	3,	NULL,	1,	NULL,	'2025-11-10 22:33:31');

DROP TABLE IF EXISTS `audit_log`;
CREATE TABLE `audit_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint unsigned DEFAULT NULL,
  `accion` varchar(60) NOT NULL,
  `entidad` varchar(60) NOT NULL,
  `entidad_id` bigint unsigned DEFAULT NULL,
  `detalle` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `audit_log` (`id`, `usuario_id`, `accion`, `entidad`, `entidad_id`, `detalle`, `created_at`, `updated_at`) VALUES
(1,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.12.1\"}',	'2025-09-21 15:59:19',	'2025-09-26 13:12:23'),
(2,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.12.1\"}',	'2025-09-21 18:40:46',	'2025-09-26 13:12:23'),
(3,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.12.1\"}',	'2025-09-21 19:21:23',	'2025-09-26 13:12:23'),
(4,	1,	'ALUMNO_CREAR',	'alumno',	1,	'{\"deporte\": \"HANDBALL\", \"categoria\": \"Mayor\", \"persona_id\": 2}',	'2025-09-21 19:21:24',	'2025-09-26 13:12:23'),
(5,	1,	'JUGADOR_CREAR',	'jugador',	1,	'{\"dorsal\": 10, \"puesto\": \"Lateral\", \"persona_id\": 2}',	'2025-09-21 19:21:25',	'2025-09-26 13:12:23'),
(6,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.12.1\"}',	'2025-09-21 20:27:49',	'2025-09-26 13:12:23'),
(7,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.12.1\"}',	'2025-09-21 20:47:19',	'2025-09-26 13:12:23'),
(8,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.12.1\"}',	'2025-09-21 20:52:45',	'2025-09-26 13:12:23'),
(9,	1,	'JUGADOR_ACTUALIZAR',	'jugador',	1,	'{\"cambiado\": [\"contrato_pdf\"]}',	'2025-09-21 20:52:46',	'2025-09-26 13:12:23'),
(10,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.12.1\"}',	'2025-09-21 21:12:05',	'2025-09-26 13:12:23'),
(11,	1,	'JUGADOR_ACTUALIZAR',	'jugador',	1,	'{\"cambiado\": [\"contrato_pdf\"]}',	'2025-09-21 21:12:05',	'2025-09-26 13:12:23'),
(12,	1,	'JUGADOR_CONTRATO_SUBIR',	'jugador',	1,	'{\"keepOld\": true}',	'2025-09-21 21:12:05',	'2025-09-26 13:12:23'),
(13,	1,	'JUGADOR_ACTUALIZAR',	'jugador',	1,	'{\"cambiado\": [\"contrato_pdf\"]}',	'2025-09-21 21:12:07',	'2025-09-26 13:12:23'),
(14,	1,	'JUGADOR_CONTRATO_BORRAR',	'jugador',	1,	NULL,	'2025-09-21 21:12:07',	'2025-09-26 13:12:23'),
(15,	1,	'JUGADOR_ACTUALIZAR',	'jugador',	1,	'{\"cambiado\": [\"contrato_pdf\"]}',	'2025-09-21 21:23:38',	'2025-09-26 13:12:23'),
(16,	1,	'JUGADOR_CONTRATO_BORRAR',	'jugador',	1,	NULL,	'2025-09-21 21:23:38',	'2025-09-26 13:12:23'),
(17,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.12.1\"}',	'2025-09-21 21:27:44',	'2025-09-26 13:12:23'),
(18,	1,	'JUGADOR_ACTUALIZAR',	'jugador',	1,	'{\"cambiado\": [\"contrato_pdf\"]}',	'2025-09-21 21:27:45',	'2025-09-26 13:12:23'),
(19,	1,	'JUGADOR_CONTRATO_SUBIR',	'jugador',	1,	'{\"keepOld\": true}',	'2025-09-21 21:27:45',	'2025-09-26 13:12:23'),
(20,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.12.1\"}',	'2025-09-24 14:23:04',	'2025-09-26 13:12:23'),
(21,	1,	'ALUMNO_ACTUALIZAR',	'alumno',	1,	'{\"cambiado\": [\"apto_pdf\", \"apto_medico\"]}',	'2025-09-24 14:23:05',	'2025-09-26 13:12:23'),
(22,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.12.1\"}',	'2025-09-24 15:27:18',	'2025-09-26 13:12:23'),
(23,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.12.1\"}',	'2025-09-24 16:04:40',	'2025-09-26 13:12:23'),
(24,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.12.1\"}',	'2025-09-24 19:51:49',	'2025-09-26 13:12:23'),
(25,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.12.1\"}',	'2025-09-24 20:30:22',	'2025-09-26 13:12:23'),
(26,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-24 21:56:24',	'2025-09-26 13:12:23'),
(27,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-25 09:32:07',	'2025-09-26 13:12:23'),
(28,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-25 10:21:40',	'2025-09-26 13:12:23'),
(29,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-25 10:24:17',	'2025-09-26 13:12:23'),
(30,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-25 10:29:30',	'2025-09-26 13:12:23'),
(31,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-25 10:35:39',	'2025-09-26 13:12:23'),
(32,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-25 10:36:38',	'2025-09-26 13:12:23'),
(33,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-25 10:40:47',	'2025-09-26 13:12:23'),
(34,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-25 10:44:20',	'2025-09-26 13:12:23'),
(35,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-25 10:49:46',	'2025-09-26 13:12:23'),
(36,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-25 20:31:13',	'2025-09-26 13:12:23'),
(37,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-26 00:19:32',	'2025-09-26 13:12:23'),
(38,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-26 00:19:35',	'2025-09-26 13:12:23'),
(39,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-26 00:42:24',	'2025-09-26 13:12:23'),
(40,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-26 01:04:13',	'2025-09-26 13:12:23'),
(41,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-26 01:24:10',	'2025-09-26 13:12:23'),
(42,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-26 01:54:01',	'2025-09-26 13:12:23'),
(43,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-26 02:12:19',	'2025-09-26 13:12:23'),
(44,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-26 02:31:18',	'2025-09-26 13:12:23'),
(45,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-26 02:31:32',	'2025-09-26 13:12:23'),
(46,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-26 02:31:45',	'2025-09-26 13:12:23'),
(47,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-26 02:33:27',	'2025-09-26 13:12:23'),
(48,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-26 02:37:14',	'2025-09-26 13:12:23'),
(49,	1,	'LOGIN',	'usuario',	1,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-26 02:38:15',	'2025-09-26 13:12:23'),
(50,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6328\"}',	'2025-09-26 14:59:45',	'2025-09-26 14:59:45'),
(51,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6328\"}',	'2025-09-26 15:03:04',	'2025-09-26 15:03:04'),
(52,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.6328\"}',	'2025-09-26 16:32:54',	'2025-09-26 16:32:54'),
(53,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-26 17:57:36',	'2025-09-26 17:57:36'),
(54,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-26 21:28:36',	'2025-09-26 21:28:36'),
(55,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-26 21:34:12',	'2025-09-26 21:34:12'),
(56,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-27 01:27:18',	'2025-09-27 01:27:18'),
(57,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-27 01:44:02',	'2025-09-27 01:44:02'),
(58,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-27 02:20:07',	'2025-09-27 02:20:07'),
(59,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-27 02:54:17',	'2025-09-27 02:54:17'),
(60,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-27 02:54:41',	'2025-09-27 02:54:41'),
(61,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-27 02:54:48',	'2025-09-27 02:54:48'),
(62,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-27 02:55:37',	'2025-09-27 02:55:37'),
(63,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-27 03:00:40',	'2025-09-27 03:00:40'),
(64,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-27 03:00:45',	'2025-09-27 03:00:45'),
(65,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-27 03:00:45',	'2025-09-27 03:00:45'),
(66,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-27 03:00:45',	'2025-09-27 03:00:45'),
(67,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-27 03:00:45',	'2025-09-27 03:00:45'),
(68,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-27 03:00:46',	'2025-09-27 03:00:46'),
(69,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-27 10:53:56',	'2025-09-27 10:53:56'),
(70,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-27 11:11:19',	'2025-09-27 11:11:19'),
(71,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-27 11:46:05',	'2025-09-27 11:46:05'),
(72,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-27 12:33:39',	'2025-09-27 12:33:39'),
(73,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-27 12:55:58',	'2025-09-27 12:55:58'),
(74,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-27 13:33:26',	'2025-09-27 13:33:26'),
(75,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-27 13:54:50',	'2025-09-27 13:54:50'),
(76,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-27 14:14:55',	'2025-09-27 14:14:55'),
(77,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-27 15:22:37',	'2025-09-27 15:22:37'),
(78,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-27 22:41:05',	'2025-09-27 22:41:05'),
(79,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-28 21:52:41',	'2025-09-28 21:52:41'),
(80,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 OPR/121.0.0.0\"}',	'2025-09-30 02:30:12',	'2025-09-30 02:30:12'),
(81,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 OPR/121.0.0.0\"}',	'2025-09-30 02:53:46',	'2025-09-30 02:53:46'),
(82,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-30 11:54:07',	'2025-09-30 11:54:07'),
(83,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 OPR/121.0.0.0\"}',	'2025-09-30 12:17:12',	'2025-09-30 12:17:12'),
(84,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-09-30 12:17:55',	'2025-09-30 12:17:55'),
(85,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36\"}',	'2025-09-30 14:09:03',	'2025-09-30 14:09:03'),
(86,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 OPR/121.0.0.0\"}',	'2025-10-01 13:50:25',	'2025-10-01 13:50:25'),
(87,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 OPR/121.0.0.0\"}',	'2025-10-02 12:19:46',	'2025-10-02 12:19:46'),
(88,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 OPR/121.0.0.0\"}',	'2025-10-09 01:52:47',	'2025-10-09 01:52:47'),
(89,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 OPR/121.0.0.0\"}',	'2025-10-09 02:09:27',	'2025-10-09 02:09:27'),
(90,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}',	'2025-10-09 02:09:50',	'2025-10-09 02:09:50'),
(91,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1\"}',	'2025-10-09 02:18:36',	'2025-10-09 02:18:36'),
(92,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1\"}',	'2025-10-09 04:40:16',	'2025-10-09 04:40:16'),
(93,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 8.1.0; SM-T837A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.80 Safari/537.36\"}',	'2025-10-09 11:13:38',	'2025-10-09 11:13:38'),
(94,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1\"}',	'2025-10-09 11:13:55',	'2025-10-09 11:13:55'),
(95,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 11.0; Surface Duo) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Mobile Safari/537.36\"}',	'2025-10-09 11:13:55',	'2025-10-09 11:13:55'),
(96,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 8.1.0; SM-T837A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.80 Safari/537.36\"}',	'2025-10-09 12:44:04',	'2025-10-09 12:44:04'),
(97,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-14 00:19:18',	'2025-10-14 00:19:18'),
(98,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-14 00:19:20',	'2025-10-14 00:19:20'),
(99,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-14 21:53:34',	'2025-10-14 21:53:34'),
(100,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-14 22:08:53',	'2025-10-14 22:08:53'),
(101,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-14 22:10:33',	'2025-10-14 22:10:33'),
(102,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-14 22:32:19',	'2025-10-14 22:32:19'),
(103,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-14 22:44:58',	'2025-10-14 22:44:58'),
(104,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-14 22:52:05',	'2025-10-14 22:52:05'),
(105,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-14 22:55:59',	'2025-10-14 22:55:59'),
(106,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-14 22:59:42',	'2025-10-14 22:59:42'),
(107,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36\"}',	'2025-10-15 02:46:17',	'2025-10-15 02:46:17'),
(108,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-15 03:01:07',	'2025-10-15 03:01:07'),
(109,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-15 03:35:40',	'2025-10-15 03:35:40'),
(110,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36\"}',	'2025-10-15 03:43:55',	'2025-10-15 03:43:55'),
(111,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-15 04:04:46',	'2025-10-15 04:04:46'),
(112,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-15 13:30:18',	'2025-10-15 13:30:18'),
(113,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-15 13:52:45',	'2025-10-15 13:52:45'),
(114,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-15 22:20:05',	'2025-10-15 22:20:05'),
(115,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36\"}',	'2025-10-15 22:42:16',	'2025-10-15 22:42:16'),
(116,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36\"}',	'2025-10-15 22:57:55',	'2025-10-15 22:57:55'),
(117,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-15 23:14:25',	'2025-10-15 23:14:25'),
(118,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-15 23:30:58',	'2025-10-15 23:30:58'),
(119,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-15 23:50:32',	'2025-10-15 23:50:32'),
(120,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-16 02:00:32',	'2025-10-16 02:00:32'),
(121,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-16 02:09:54',	'2025-10-16 02:09:54'),
(122,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-16 02:25:18',	'2025-10-16 02:25:18'),
(123,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-16 22:18:50',	'2025-10-16 22:18:50'),
(124,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-17 22:05:07',	'2025-10-17 22:05:07'),
(125,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-17 22:18:00',	'2025-10-17 22:18:00'),
(126,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-17 22:30:19',	'2025-10-17 22:30:19'),
(127,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-17 22:31:16',	'2025-10-17 22:31:16'),
(128,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-17 22:50:47',	'2025-10-17 22:50:47'),
(129,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-17 23:08:26',	'2025-10-17 23:08:26'),
(130,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-17 23:35:13',	'2025-10-17 23:35:13'),
(131,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-17 23:51:17',	'2025-10-17 23:51:17'),
(132,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-18 00:01:55',	'2025-10-18 00:01:55'),
(133,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36\"}',	'2025-10-18 00:06:51',	'2025-10-18 00:06:51'),
(134,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 11.0; Surface Duo) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/%s Mobile Safari/537.36\"}',	'2025-10-18 00:18:07',	'2025-10-18 00:18:07'),
(135,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1\"}',	'2025-10-18 00:34:51',	'2025-10-18 00:34:51'),
(136,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-18 00:35:26',	'2025-10-18 00:35:26'),
(137,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_2 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D257 Safari/9537.53\"}',	'2025-10-18 00:54:15',	'2025-10-18 00:54:15'),
(138,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_2 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D257 Safari/9537.53\"}',	'2025-10-18 00:55:22',	'2025-10-18 00:55:22'),
(139,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_2 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D257 Safari/9537.53\"}',	'2025-10-18 00:57:36',	'2025-10-18 00:57:36'),
(140,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 OPR/122.0.0.0\"}',	'2025-10-20 12:27:07',	'2025-10-20 12:27:07'),
(141,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-20 20:50:38',	'2025-10-20 20:50:38'),
(142,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-20 21:28:35',	'2025-10-20 21:28:35'),
(143,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 00:17:15',	'2025-10-21 00:17:15'),
(144,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 01:28:08',	'2025-10-21 01:28:08'),
(145,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 01:48:26',	'2025-10-21 01:48:26'),
(146,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 01:56:36',	'2025-10-21 01:56:36'),
(147,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 02:05:33',	'2025-10-21 02:05:33'),
(148,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 02:31:12',	'2025-10-21 02:31:12'),
(149,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 03:08:50',	'2025-10-21 03:08:50'),
(150,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 03:58:04',	'2025-10-21 03:58:04'),
(151,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 04:19:01',	'2025-10-21 04:19:01'),
(152,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 OPR/122.0.0.0\"}',	'2025-10-21 04:26:02',	'2025-10-21 04:26:02'),
(153,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 OPR/122.0.0.0\"}',	'2025-10-21 04:42:08',	'2025-10-21 04:42:08'),
(154,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT; Windows NT 10.0; es-AR) WindowsPowerShell/5.1.26100.6584\"}',	'2025-10-21 04:49:27',	'2025-10-21 04:49:27'),
(155,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT; Windows NT 10.0; es-AR) WindowsPowerShell/5.1.26100.6584\"}',	'2025-10-21 04:49:54',	'2025-10-21 04:49:54'),
(156,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT; Windows NT 10.0; es-AR) WindowsPowerShell/5.1.26100.6584\"}',	'2025-10-21 04:50:01',	'2025-10-21 04:50:01'),
(157,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT; Windows NT 10.0; es-AR) WindowsPowerShell/5.1.26100.6584\"}',	'2025-10-21 04:50:22',	'2025-10-21 04:50:22'),
(158,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT; Windows NT 10.0; es-AR) WindowsPowerShell/5.1.26100.6584\"}',	'2025-10-21 04:54:35',	'2025-10-21 04:54:35'),
(159,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT; Windows NT 10.0; es-AR) WindowsPowerShell/5.1.26100.6584\"}',	'2025-10-21 04:59:43',	'2025-10-21 04:59:43'),
(160,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT; Windows NT 10.0; es-AR) WindowsPowerShell/5.1.26100.6584\"}',	'2025-10-21 04:59:55',	'2025-10-21 04:59:55'),
(161,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT; Windows NT 10.0; es-AR) WindowsPowerShell/5.1.26100.6584\"}',	'2025-10-21 05:00:19',	'2025-10-21 05:00:19'),
(162,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT; Windows NT 10.0; es-AR) WindowsPowerShell/5.1.26100.6584\"}',	'2025-10-21 05:21:43',	'2025-10-21 05:21:43'),
(163,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT; Windows NT 10.0; es-AR) WindowsPowerShell/5.1.26100.6584\"}',	'2025-10-21 05:22:11',	'2025-10-21 05:22:11'),
(164,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 OPR/122.0.0.0\"}',	'2025-10-21 05:24:00',	'2025-10-21 05:24:00'),
(165,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 11:17:02',	'2025-10-21 11:17:02'),
(166,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT; Windows NT 10.0; es-AR) WindowsPowerShell/5.1.26100.6584\"}',	'2025-10-21 11:29:23',	'2025-10-21 11:29:23'),
(167,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT; Windows NT 10.0; es-AR) WindowsPowerShell/5.1.26100.6584\"}',	'2025-10-21 11:48:34',	'2025-10-21 11:48:34'),
(168,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 11:56:50',	'2025-10-21 11:56:50'),
(169,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 12:28:29',	'2025-10-21 12:28:29'),
(170,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 16:45:20',	'2025-10-21 16:45:20'),
(171,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 17:04:37',	'2025-10-21 17:04:37'),
(172,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 18:07:49',	'2025-10-21 18:07:49'),
(173,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 18:23:34',	'2025-10-21 18:23:34'),
(174,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 18:42:44',	'2025-10-21 18:42:44'),
(175,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-21 19:05:06',	'2025-10-21 19:05:06'),
(176,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 01:47:02',	'2025-10-22 01:47:02'),
(177,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 02:04:36',	'2025-10-22 02:04:36'),
(178,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 02:25:18',	'2025-10-22 02:25:18'),
(179,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 02:41:49',	'2025-10-22 02:41:49'),
(180,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 02:57:06',	'2025-10-22 02:57:06'),
(181,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 16:41:33',	'2025-10-22 16:41:33'),
(182,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 16:58:25',	'2025-10-22 16:58:25'),
(183,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 17:45:06',	'2025-10-22 17:45:06'),
(184,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 18:18:12',	'2025-10-22 18:18:12'),
(185,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 18:33:46',	'2025-10-22 18:33:46'),
(186,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 19:07:02',	'2025-10-22 19:07:02'),
(187,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 19:44:35',	'2025-10-22 19:44:35'),
(188,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 20:27:56',	'2025-10-22 20:27:56'),
(189,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 21:01:29',	'2025-10-22 21:01:29'),
(190,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 21:33:13',	'2025-10-22 21:33:13'),
(191,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 21:55:32',	'2025-10-22 21:55:32'),
(192,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 22:23:55',	'2025-10-22 22:23:55'),
(193,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36\"}',	'2025-10-22 22:39:51',	'2025-10-22 22:39:51'),
(194,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-09 22:40:13',	'2025-11-09 22:40:13'),
(195,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-09 23:02:23',	'2025-11-09 23:02:23'),
(196,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-09 23:25:35',	'2025-11-09 23:25:35'),
(197,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-09 23:31:43',	'2025-11-09 23:31:43'),
(198,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 02:02:17',	'2025-11-10 02:02:17'),
(199,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 02:19:07',	'2025-11-10 02:19:07'),
(200,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 02:34:15',	'2025-11-10 02:34:15'),
(201,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 09:37:53',	'2025-11-10 09:37:53'),
(202,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 09:56:18',	'2025-11-10 09:56:18'),
(203,	4,	'LOGIN',	'usuario',	4,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 10:10:09',	'2025-11-10 10:10:09'),
(204,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 10:10:46',	'2025-11-10 10:10:46'),
(205,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 10:28:04',	'2025-11-10 10:28:04'),
(206,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 14:28:15',	'2025-11-10 14:28:15'),
(207,	4,	'LOGIN',	'usuario',	4,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 14:45:26',	'2025-11-10 14:45:26'),
(208,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 14:45:44',	'2025-11-10 14:45:44'),
(209,	4,	'LOGIN',	'usuario',	4,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 14:47:11',	'2025-11-10 14:47:11'),
(210,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 14:47:41',	'2025-11-10 14:47:41'),
(211,	5,	'LOGIN',	'usuario',	5,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.16.0\"}',	'2025-11-10 20:32:33',	'2025-11-10 20:32:33'),
(212,	5,	'LOGIN',	'usuario',	5,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.16.0\"}',	'2025-11-10 20:33:04',	'2025-11-10 20:33:04'),
(213,	5,	'LOGIN',	'usuario',	5,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 20:34:48',	'2025-11-10 20:34:48'),
(214,	5,	'LOGIN',	'usuario',	5,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.16.0\"}',	'2025-11-10 21:08:40',	'2025-11-10 21:08:40'),
(215,	5,	'LOGIN',	'usuario',	5,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.16.0\"}',	'2025-11-10 21:10:56',	'2025-11-10 21:10:56'),
(216,	5,	'LOGIN',	'usuario',	5,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"curl/8.16.0\"}',	'2025-11-10 21:12:19',	'2025-11-10 21:12:19'),
(217,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 21:13:33',	'2025-11-10 21:13:33'),
(218,	4,	'LOGIN',	'usuario',	4,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 21:15:23',	'2025-11-10 21:15:23'),
(219,	5,	'LOGIN',	'usuario',	5,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 21:15:47',	'2025-11-10 21:15:47'),
(220,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 21:19:20',	'2025-11-10 21:19:20'),
(221,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 21:35:25',	'2025-11-10 21:35:25'),
(222,	7,	'LOGIN',	'usuario',	7,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 22:11:14',	'2025-11-10 22:11:14'),
(223,	8,	'LOGIN',	'usuario',	8,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 22:11:46',	'2025-11-10 22:11:46'),
(224,	9,	'LOGIN',	'usuario',	9,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 22:12:14',	'2025-11-10 22:12:14'),
(225,	10,	'LOGIN',	'usuario',	10,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 22:12:37',	'2025-11-10 22:12:37'),
(226,	8,	'LOGIN',	'usuario',	8,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 22:17:23',	'2025-11-10 22:17:23'),
(227,	15,	'LOGIN',	'usuario',	15,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 22:18:01',	'2025-11-10 22:18:01'),
(228,	7,	'LOGIN',	'usuario',	7,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 22:18:32',	'2025-11-10 22:18:32'),
(229,	8,	'LOGIN',	'usuario',	8,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36\"}',	'2025-11-10 22:21:37',	'2025-11-10 22:21:37'),
(230,	8,	'LOGIN',	'usuario',	8,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 22:25:17',	'2025-11-10 22:25:17'),
(231,	15,	'LOGIN',	'usuario',	15,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 22:32:07',	'2025-11-10 22:32:07'),
(232,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 22:34:09',	'2025-11-10 22:34:09'),
(233,	15,	'LOGIN',	'usuario',	15,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 22:43:32',	'2025-11-10 22:43:32'),
(234,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 22:44:43',	'2025-11-10 22:44:43'),
(235,	4,	'LOGIN',	'usuario',	4,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0\"}',	'2025-11-10 22:45:11',	'2025-11-10 22:45:11'),
(236,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 22:50:37',	'2025-11-10 22:50:37'),
(237,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-10 23:11:23',	'2025-11-10 23:11:23'),
(238,	8,	'LOGIN',	'usuario',	8,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0\"}',	'2025-11-10 23:13:12',	'2025-11-10 23:13:12'),
(239,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-11 00:35:10',	'2025-11-11 00:35:10'),
(240,	15,	'LOGIN',	'usuario',	15,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-11 00:40:04',	'2025-11-11 00:40:04'),
(241,	3,	'LOGIN',	'usuario',	3,	'{\"ip\": \"::ffff:172.18.0.1\", \"ua\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36\"}',	'2025-11-11 00:43:24',	'2025-11-11 00:43:24');

DROP TABLE IF EXISTS `beneficio`;
CREATE TABLE `beneficio` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `biometric_audit_log`;
CREATE TABLE `biometric_audit_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` bigint unsigned NOT NULL,
  `action` enum('ENROLL','VERIFY','ACCESS_GRANTED','ACCESS_DENIED') NOT NULL,
  `score` decimal(5,3) DEFAULT NULL,
  `liveness_passed` tinyint(1) DEFAULT '0',
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bio_audit_user` (`user_id`),
  CONSTRAINT `fk_bio_audit_user` FOREIGN KEY (`user_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `biometric_audit_log` (`id`, `date_created`, `date_modified`, `user_id`, `action`, `score`, `liveness_passed`, `metadata`, `created_at`, `updated_at`) VALUES
(1,	'2025-11-04 13:41:30',	'2025-11-04 13:41:30',	5,	'ENROLL',	NULL,	0,	'{\"message\": \"Enrollment successful\", \"has_embedding\": 0}',	'2025-11-04 13:41:30',	'2025-11-04 13:41:30');

DROP TABLE IF EXISTS `biometric_profile`;
CREATE TABLE `biometric_profile` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` bigint unsigned NOT NULL,
  `face_vector` longblob NOT NULL,
  `model_version` varchar(50) DEFAULT 'mediapipe_v1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bio_user` (`user_id`),
  CONSTRAINT `fk_bio_user` FOREIGN KEY (`user_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `biometric_profile` (`id`, `date_created`, `date_modified`, `user_id`, `face_vector`, `model_version`, `created_at`, `updated_at`) VALUES
(1,	'2025-11-04 13:41:30',	'2025-11-04 13:41:30',	5,	'ˇÿˇ‡\0JFIF\0\0\0\0\0\0ˇ€\0C\0			\n\n\n\n\n\n	\n\n\nˇ€\0C\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nˇ¿\0\"\0ˇƒ\0\0\0\0\0\0\0\0\0\0\0	\nˇƒ\0µ\0\0\0}\0!1AQa\"q2Åë°#B±¡R—$3brÇ	\n\Z%&\'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyzÉÑÖÜáàâäíìîïñóòôö¢£§•¶ß®©™≤≥¥µ∂∑∏π∫¬√ƒ≈∆«»… “”‘’÷◊ÿŸ⁄·‚„‰ÂÊÁËÈÍÒÚÛÙıˆ˜¯˘˙ˇƒ\0\0\0\0\0\0\0\0	\nˇƒ\0µ\0\0w\0!1AQaq\"2ÅBë°±¡	#3Rbr—\n$4·%Ò\Z&\'()*56789:CDEFGHIJSTUVWXYZcdefghijstuvwxyzÇÉÑÖÜáàâäíìîïñóòôö¢£§•¶ß®©™≤≥¥µ∂∑∏π∫¬√ƒ≈∆«»… “”‘’÷◊ÿŸ⁄‚„‰ÂÊÁËÈÍÚÛÙıˆ˜¯˘˙ˇ⁄\0\0\0?\0˝»ı£ u4à9«ÎCFXÙ5ÛÁ†E4aÿ?\\vÕ(ªä{\"Æ\núÛÕ2v`√\r◊∂(Çµ#8 }{’g_“Ù8°üXæ[tππ[h]ÛáïæÍÒ‹˚‘íÕ∆Ì‡’≥ﬂ8˛t	ﬁ⁄3.NXﬂû’‰?µÌa·oŸ”CÚŸˇ\0Zπâæ√•+úüI$«›O‘÷ÌU˚nxK‡%•◊Ö¥gèSÒFÃGjé<ª\'#áòé„ ÑÎ_õ~7¯Ø‚äû2ª’5›b‚Ú‚vvææñM√9ˇ\0Vø›–UÚË8Sswf◊∆ç˛4¯„„iuˇ\0Î2Í7!1⁄Éàmá`ãú`VŸ‡∏u[Ä¡|¨?Ó‡t˙÷r≈ßiÅm¥˚eçña&öâıKa(âıxŒ[GO¶MKZÒJ\n»⁄óT∑—·y#ƒNˇ\02À @:öÂı-v+ªñ∏ì\\!ò≥75K≈ﬁ!ö·c”Ì°çHÁ~KëÌ⁄®A•K{ı0≤2ÛÂºüÃw®îlçóºY∫∑µ◊Éi¯‚Ò>R∆+xëA˙üJÁõ¿∑ê…°%‰€∞“O.’≠[â°‘≥m¨Qí0Urõá·…¨ÌO·\\óh∑Rö›ªlú®¸Í∞ùÏ2o•º,c’Ì?Ü=∆´[ÈR\'à„ãû9˙Ç*ùﬁÉ„mq\r∂≠s,dí	∏®˜8˛Uôq®|Cw1≈¶Ÿ\\*˝‚¿*¶Ófuñ3Íñ,—¨ÒÃH¿3@?ïLó˜ëÇ⁄ûèj<4v‰˙s\\d^9ÒûçÛ∑Üåt\' ~DVn≠Ò;∆˜Úmëe$À0˝)}„®◊µÌ>cmk„’Mø5Ã^jˆS±kÌFUèiç„\rvxK][Ã¡I‹7r>ïœ›xäêΩÂ§πÏpA˙’B7eZ€ùT⁄Æïô ∏tQŒ∆Ë+\'SÒ6ùs+C\Z¸¯·áà˛)≤p|ïrG˜π™wWÕr€ˆÖ£≠h¢¨$ìfåófP»ì¸‡un“ñÀƒ7÷∏∑Ûàûˇ\0\\÷IΩ˚eˆâÁÎU_Yí›∑[∂Ô„9™åPrÍn›Õ‰ƒ…\'ñ˘˛G‚\rej÷©\r¿ù6F«Ó∫U◊\\S&˘êÁ‡‘…¨X›≥^0dnà‰„Ù4F*·≥$¥÷<Ge∂[]FP¡∞6ø–˝+≥O«iL˝V`§eô~n{q\\-¸ZeìﬁË~lÒg˜êÓ…_ÒâÆ€k§<1y,ﬂ/°\'⁄¥≤.3>Ã˝ï?l≠K·7çÌºK·õ∆±;Ò}f√tQÁïeÏ}r+ıüˆ~˝•~˛—˛Ÿu€Gq)∫≥õñå˜⁄à{˚◊Û˝·€ÉdÎ0êï^√ÆkÈ?ŸCˆãÒg¬mn€]Ê¨“≠¥°¶≥3π{è°˚RJ«5ZjGÌéqÉö ‡äÛﬂŸÀˆâ/Ì‡H<]·‡d\'Àø±ï«ôm((√˚ΩHn˘Ë§.sûﬁò¶qJ-1ò\'†ß†8àŒE=~ıTB;âE+ë∏Ú(™(ËÈàÈN⁄ÿŒ”è•2LÁ#“∏¿c6:U{©tßjëòÇ*µ‰ª#…`ºú±03ü•4ÆÇÊÓŒÂ7qéw.q˛Û_3˛€ü∑üá>iR¯+·Êπou‚I†√‹«&b”#∆áz^¡G›ÍkÀ?m€À≈rk\Zü√_É˙§ñ6V™÷⁄Ü©jÎÊ]7FDl|´ÿëÈ_¯€XÒé©pE®[¡döRÚ0œ∏ÕZÜ¢M‹ﬁÒw≈yºsÆO,∫Ö√ôZK€Ÿõ2 «ÆI<ÁÙ´\Z\\∑w1&ù°€à†çB0#$Å‹û˘Æg¬ﬁ“-·:∆°x[ÊŒ‚¯‘è^kbo›ñ:oÜ¡é\'˘à9\'‘—\' é 4‘¨ç˚´-JS˝´™‡61`3ü¨ÕCƒ\Z\rúx”4Cp‹åÃ6Ä=}sPÿxVô¡ªªY˙eâ∆k∫ó¡∏ÓJ∂•#gå\00+TV=zOcáKküi¯W{wQç´)‰{“±•5ÏwB˜ ÏIù}\rg£G∑R ±wc◊`Õ?˛Ê•≠¥9\Z\"9\r?“πﬁ\"7;cóM-èüÇıïèÕÇITÅ÷2y®ü√û î—í\\uÜÊFø†Ø~ˇ\0Ögiê≤+¬‰˝—¿GP¯a=∞iíUeæ3RÒ±¿Mt<\"ﬁ√Z”¶\'˚ +«ÓÂﬁ\r3W’.%.¥h7(dê√ÚØR÷˛…$ÅÃå†rJäƒæ¯x#„êªêqê>µQ¨§sº#Ïy.•}$D…\"ùº„Øœj:Õã?öÒç›	≈z÷≠‡-R0”Cn≠Îî»ÆC^≤Kˆ ú`™‡Vëö2˙º„–Û≠JÍ⁄Ô\";v_ò‰Ù±nÄÚ…D€Å‹fªM[¡∫ù≥Ìö2§úÄF+õ’t+˚iõŒ”ú‡rTûµº$àï\'mNRqá˘Â€ì∆W°‚l`èz“‘¸˚( æü\"Ü.y‚π≠n{∏≠|€]¸±Ë3ÉTñß?+LöÒÃ#jÉìﬂ5JKË›àñ‡c(+òπÒGä∑õj¨çƒUx¸LÏAöŸÅ#™∑ÙÆÖ&Ït7öú ø∏å`Ku™âØBeˇ\0JF\0\Z∫~ùÍ¥zÆüu\Zˇ\0§»	eËj§÷V*Îm~Äek\niìÃé∑G◊!Ñ+€ﬁ«+dP{z˚U•”¢’u‘4	<õ¥Pœoå+Ø˜≈pëC=í±ç˜8⁄(”¸K{£jQ‹4ŒÒ«&Â;πN‹~µníZ[”·[‰æÄ(åÖˇ\0XπÍqÈZ˙^±u†kˆ˙Ñw1ªP‡c‹W·Oâ:lóÒ}≠Äg‚+≠ø|c£ﬁªŸùÆ⁄â * À∑(>ÎW;Öôiu>ã˝îkwˆv¯°k‚[Y]Ùõ≤´1€\"§ènøZ˝Ö¯UÒ√ü|a„/\rÍâwkw∫Jçû£°Ù9‚øûÎ[ΩOI”ö;ﬁZ IåáC«_“øB?‡êˇ\0∂]≈§ã[∫GÜÍC.í≥?¬Â£’Ä$}1‹RÂ9kA^ÁÈÇù√ v£#¶jñè¨ÿj—¢HÖ·l_≠[‰æXıÈÕ5±»∑Å›“ä} :ádHˆÜœ„P»Wå\Zs!aúÆ*3éıƒ›Ñ›à&;Tπ<Õ|◊ˇ\0\0˝®Â¯)Óo¯[YÚ|C¨€º6b,é2>fˆ?”ö˜øâ^)>F©‚t@ZŒ IQO®^ø8‚ø&?lã˛4ÒWƒÌBÔ≈WêÕq¶;dTâ¡W°\'π´Ü„LÒ\Zx√ƒ7ÆÒÀ©¨-∏˘Éq$±ÍOækåI\"7À{}®Kq\"Ùvn·]Øa‚T3	V9◊ûN˙’o\n]ﬂ>Ë·W g1Ú„])+Àr3≠I©∂V}°≥¥7ﬂ¸>Ÿ‘äGcÊ,í+ï”º-2Iª˚>E∆fW∞¸èZ¥ñ;\rKägê£‹√ﬂÀ_Dzx\ZNSIùÁÅ~	]_2\\HOQÇÀ«Á^≈·/ÑzNû†ﬁ´>9#Uüá:.µmß@5¡ñÿ1ÖÌÈ]Œü¨wØü´ZN•è¥°Bé∆MØÖÙ{Dƒ\Z|cÍπ©„“ÏPÁÏ®=F¡ä÷hTÆ\0®\ZŒBO?•`Á+)$ÃMC¡ﬁ‘¡˚Fô	c—ïqäÂ|AóLu\'Oùó ÂeaéïﬂÕF{{÷^¶ƒ¸∏Èö®NHRHÚãøÜ◊q¬wŸy®GÃc\\‚∞o˛iW@≈\rÿà„ŒÜΩëU’~F«’B∆“ÍB≥Aú/-¥◊D*HÀŸ≈Ωè?	å“4):»:úW=Ø¸‘vë°\0Òëë^Òu·Õ>wVéÑÍjùˇ\0Ü„(|≤q∑åö—Uí\'ÍÙÂ∫>_ÒW¬Îπ‚kMB’	\0a—≠yáçº®h«òâ!XÉÄ+Î˝s√6˜2¥S78‡Ì‚ºÎ‚/√πæÃ“$J„êπÕu“´°«_≤>G’ÙS\"ΩµÃ¥ß‹WßÕc;√%¶¯$˘H+˙ÊæÅÒ«ÅÓ°-Ìq*©cxzØ¯Wók˙DSK\"GV+åm¡˜¸k≤LÒj—iÏyçœÑ,ZyxÿÇ\\∫{qﬁπ©t+[9e¥∏àù«ÓÉÇØˇ\0ZΩ\Z˙%û⁄‡u\'©ÊπùgLéiÍI ÁäÈU\Z8\\.ÏrÛhP¨•£W„Ô¡_Ø†ß«·t6Ó¯›ï8\'≠l8d∂g◊ ãi--‰)	cô	…å˜¸?∆µçFàˆw9{ü\r^Zì±Ãjò¯÷e¸öÖù«óyâØØËó0≈wn^›”*‰◊5®hˆÓ≈»»`7\'°˛ï”	ÛÏ›åÕ]Ò4v¡è$…?ëÎˇ\0\nıÜ∏”üIør\'»_≥Wì[i“È€£ë∏l‰èÃ{ÒÕzWÑØCŸÓôV)‡p%ëO\r‹ßJä…^Ë5HÌLÓ–õK©\nù§\0«©«O“Æ|ÒV≥√∆ˆzæü©œ€îky#m≠o(`UÅÙü¬±nÔÖK©.„ÑR&®ç\ZÀ+rﬂ.}˝+dÆèﬂ_Ÿá‚Æó˚A|—ºstÈ&¶÷√˚B‚‹Ïa0·úc¶‚2G©5È¨—†éi∑ï8‹G\'Î_îˇ\0Iﬂ€wL¯e‚ò~xˇ\0Ré€G’%H°ªô≤∂Ûúû<_´∏#p ˚É≈CÇI©QLÛ	‰bä	Ê:ôê˘jπ\0T\r\"G˜Û◊“ßπR[!±∆?ZÀ÷.¢µB”π≤?˙ı»ï∆›è˝∂>>Ÿ¯¡≥¯v€MÛÍº2/ü≤8á¶9Œ+Ú„‚∂ΩäuiµGX§ìŒ`ÚDN“›àœj˚´ˆ€ç|k{´¯é∆ÂõggèÏÈÜù…ñ6Èú±Ø_ü~&∏≥µù`âYÜ‚qéGj⁄EA{«%ÃöV®ã-∏(¸Ó€˙WM·€kkπÏ7”⁄ªîÚ∑>ïè™CoqpÆTÌ$OjÙèÉﬁ≤’µ¨•$\0[‚™s‰â◊á¶ß+3Ø¯{∑ƒû*ñ4∂)òbY9∏Î_V|1¯+·ø\0È±˝ìNY.å`µ√cvq–z\nÕ¯9‡=\'√p[e]FNﬁ:ıt¥fPr1–Wœ‚±rîπQˆ,-:QR±ê∫\\àﬂ:…´∂–*®ßö0ô\\Ê¢âÇıØ9FÓÏıb— Ö≥¿»®‰∑ëIÓ=EN∑AFÚ•iñU¿∆kEìπüsmÊ!RO?Z ‘Ï‰*\nƒpzë[◊Fx<˙UB£x‹3ÏkHƒ§Æérm>q–(¿˛*•,F÷#9¡ÆõT∑@\0åå„¶*ÉXÜM¨Ω}+Hƒ99…‡HÜÎ”5V‰ BKˆ≠ΩJ»@æa\0®Î\"˛Ú˛^3œ5N7ÀÍˆ>d˛heœNïJÛCÇÓ‹´≈íGß“>ûª∑:‰˙ëQMj£r≥c–b™*»áœÒœ¬õKŸgÛ≠z£{ÉÎ^ÒG·•k9∏˚;Kj¸ôÌ◊DGr;◊ÿ⁄ΩåWëú®ô(qﬁπ\rK¬ê›´≤(äby‹†´}AÌ]êìG%L<f~~¯œ¬zµúÓZ1\"ÇÃ˙œsËkâû5ÜM≥©p~µˆ«≈/Åön∞eπáMXn‰¡ IÔé’Û∑ƒüŸÁ_”ﬁKÌ2ÿNÿ\"HïTv85Ÿ	]=L#mÿÚ{≠¨Ö-¬ñ^JçÌÌ\\˛†”4‡√@ˇ\0‹aÄ}´[Z±ª“.MÆ°k,.ΩVT\"≤ÔüŸg⁄A˘üª]0≥G¢÷åÜ⁄˙0ˇ\0fv`‰êÍ‹úp=*‘÷ﬁ]œõÅ£\',¨y˚øJ«øimä6£8Y≠˘»ı4œÌã€IÃÆπ¿py–é‚∫)£ûNÃ‘∫∑H¬¥ª•ÖÜ#‰)?◊ﬂ\Z‰∫[¶Èw¬Álç˛œl~4ëÍP_[ºQH£?y◊™Ñ∂°mö÷Aëû}Uª\ZRMêïœS—5};U≤M>i¿∏x∑YÃÕç«¸ø\n ˛“{Ÿ.4âfÚÆ~1±«C\\NÉ‚%“&[;ÈõÀ‹6 ‹l√⁄ªOiâ©ÿØã¥π6‹˘>U‡â±ÊÇßk„◊†§‡–úR6¸\'‚À˝1SYÜFÜ‚—¸ªƒ…¡=è„åÉÿö˝ùˇ\0ÇQ˛⁄…˚C¸3?\nºg´,û(Õ≤G˘ı\r?\0$¿˜xŒ˝AS_Ü~÷„÷˜î}´ÀÚß IÎÔû˛ıÌ?≤g«œ~Õü¥Oâæ∫hÆ4;Zlããfl<OÍ•r§{äÉö¨˝Ö)Úúdu≈œ|/¯É¢¸^¯{£¸M⁄‹i\Z›ÑwVR √ï?Ì+eO∫ö(8πYÈì´»•b¯í÷	lÂöÎ;S†›Ä∆∑’bÂáOZÛO⁄GPÒ<^\0∫”º%Áª¿\"Clπî‰q∑˚ß#ÔvÆHÓ6|ù˚t~—z∆Å¨¸=”uÌÓ°O&⁄y<…é7Óo‡“ø<\ZyØıô\"ïÀlîÌ¿ÔﬁΩk‚‰È~+∫∞ﬁ≠$ºsÃ∑öÍ~sü˜≤3^kßZÔÒ⁄‰ã\n”d‡tÙ≠ñ∆∞ZÖØÜ^kœ-î`˚Wº|Öå≤˘≈IëXP2X\n„|+·À{ç]Ê›[£Ø£˛¯›Æñ‚8º¢ÉÊ87ÙÆ<MWûﬁ]áãùœYà∂ˆ]L∏¬Ç©Ë1]å®	Qé2W∑âl¢X#Ë™\0…Ù™∫œàl4ò∑wÆ9oÁ^\rùI‹˙î·M$…ÆÁçOÃpMWÛ‘íS?ïyØèˇ\0ho\nhvßÏóû}∆ÚÆ∞∞ƒg˝™Ú~÷~(ÖÌƒ6√8i\'üqcÏ˙◊\\0ï$sU«“•Ê}M5‚¡v«<ÒT·ÒÜì|Îò∑¬Q_xõˆä¯ç®ºáPÒ}¡F%Çn¬Ø∞«j„5_ãöÓ•àµõç˝ÿ‹ëöÍÜ≠Y¬ÛÑûà˝\'ü∆ö<Ák_[›.,‘\\≤ªP–L§v(’˘••¸YÒVï;\\ùb}€JÇ&$.{Êªo˛—~6”\Z8_UπHô≤»Ú{\Z”Íà⁄éo)ª8ü{è4Ó/üAötôêO=0k√˛¸qóƒÍ∂◊◊mì˜KûN;{◊ÆC¨º—+á\\ëÙ¨*R‰=zXèkç÷]!ÅáÂYìZyq‰Å¿ÔW‰ò;uÕVºêygµbµ6(∏‡#5VˆﬁsÅÈS	B…ÄyÔTºEv[ôA¡ÍqMj5‡XŸÜzV=‹äÀìÅÉ€ΩXæ÷°öfp~yÀﬂxíﬁœqñÔÅÍq]î‡‰ÏbÂ≤Õ«ÿ$»∏à§‹◊/‚ØÈ:∫˘Ü ≤vtΩΩÈ∫«ƒ?\r€0˚V©\Zûﬂ8¨è¯[>ñSZ¸\'·•∫£hr µ=O7¯ß˚<i\Z—w∏±ÃÅ2(?·_?x˜ˆkº±ïÕäJ#ÍcØ≥&ÒVè™€‡ºÜDaÀ,ÅáÉÆË:^¶\r l!∆6Æ:◊E8›û}JtÊÓ|™|9÷ÙŸZŒuic9»d‰V5ﬂ√Ë£g≥2DÎ»Wæ–◊˛\ZEˆ«g”Fq&‹Ç+\"OÜ\Z∞äkT˚ÿ≈tß pT√∆˙M·›n“Pe∂up}?\\“K%‰3\"MπÄXúˇ\0ú◊÷.˝ûÙÎ§i ÉpaÚ„öÒü¸÷t€Õ∂Q≥.q¥©„öév›ÃﬁKû_©È≥ÀQTps]W√Cueq‡üÃ—=ƒe-Æ}ﬂE#Îﬁú|3}õk\"™…- Òë–W5{≠}öÒ.Ø-H∏B7å`„±Õ]ÓrŒ,H‰’|‚	lÁ9“\\HïaúÇ=èjÙ˝\ZHıãU’roëÚ	<é˝1ÈYz¶ï°¯˜¬pj®j\0Y@ˇ\0XΩ≥ÙÈM–˜@µëgXƒg(9;™Z1ìª=√¿µßÌÔ¬6ûoƒ{Àm2«z⁄¬ì6é1˛”¯—^e¶ñ∆9QYCqÉ«&äÉS˙$cÔVvΩak{lIùÌ˘rœó∆ÌZT&ˆ#èS\\o≈/iﬁ	”ù°2=ı‘LbÜZGU·z\0;±‡W ∑?.?mo	Èﬁ¯˚´xC∞ˆ6ˇ\0-ë-ùé\\∞l◊ïxA[ããâcÛﬁÿˆØb˝¨µõè|WªÒ5›ì¿’bÜpƒÅ¸Dé3÷º‚’hì†AÑ∏FŒy¡ÎW–Îßö:èÜ∂ ]≈rCØﬁÙ<W÷üÙØÏ›%7c0;WÕ?t;ÕzÍﬁ∆⁄—§Ûâ6ı?Ã\n˙À¬>Ω“Ù-.›$ï\0…QéOWôåóCÈ4˘aÃM¨^-ï¥∑í\\$P@õ•ë»Î_5¸qÒ>∑Ò\\\'CøñﬂM¥à™…î3úÛÅ◊œÏ†º◊nﬂ@Y[»çˆÀ∞ëº˙{◊1k≤[ô‘«¶õx—qπ«ﬁ˜¡5£N\nÏÍ©÷vGÕzñÉ}fœç*W*r_k≥π˜›ﬂÈ\\Nµßk:µŸâ·	Û`&÷_œ≠}°Ä\\ƒZk•v« \0äÂoøgèƒM⁄ŸD%$Âî`ìÎ]qƒB÷9%óNG«zÔÉ¸L±36@£Âëé‡GßÎï_\rk¶c:tÅ…˛1◊ÛØ≥µoÑ∫rF 0√±Z„<A∂÷…∑çÆ$c≠&$<•⁄˜>iá¬⁄‹s¨¢…õÁâÜA5Ëﬁ›≠‹ =èñXx\\úqÈ]”xr∆÷uÛmc»ŒAÕuæ“¥gâŸ!RG$ö&/B©eÚãπù˚√c@e{V8,	T\'=yØqŒ∑%≈öoSÄò\0ûï…Ë±Û2†Ïd◊·ﬂ\n\\]∞[D^GÃkö≠Tœo\rA¬ ∑∑J´ÂaI¡«jìYüÏV\r+®»s]~ü‡cm˝ﬂ9‡ïŒk∆v>T>Dà3∆:◊$ZG_)««¨∆Ás8œZÃÒFΩê¿d~u¢ûTÕ¥`g˚◊‚˝m#ﬂù–ÒÕoIs37+^-Òåö{∫F0pk≈>#|\\‘∂…ªeUπP9…Æ´«˙î∑Ö¸π $z◊êx∑√˜◊Ïb¥ÜMÑÚr0O©&Ω*1KSÃ≠);¥p˛(¯çØ›ª….ß.9rp+Ñ’|™¡ï}O©ÂsŒ+π÷~xÇr–Ahƒ˜Òµs\\Æ∑èƒ Z+ y?Œ∫†£\'©ÂO⁄ﬂcK¯…‚m‰œg<ës»ä^£ÒÆ˜¿?µ∏∫ä˘˜wä>dë∏Õy÷ß∑ƒ˙|F‚˛œÀZ∆ó√öïégÜÙ¡ö›SÇÿQrä‘˚¬ﬂ4mr4˚<ÎÊ∞ÃñÛ∞˙Ì&∫›;Qèä°#Õ0\\)ˇ\0SÎ_x[ƒZùåª5\0P.?ÑÄk—t?Í0:‹√|ÍQ7B¿ü îíÿ´∂œ¶b„⁄Ák3!Á\rÈ\\˜ã|ﬂÔ#åg9´\'·ˇ\0≈Î∑≥â5	C$†eèüÈ^â˛â´⁄,ˆƒ¯ ‘[îgá¯◊‡åw¿Í6ysî ÖË∆æq¯©·&–f{kËŸfÖ»ÛsÉ_}Õ†˘ë‡/#?ùx7ÌuöﬁÛG:›§H$˚Ãp;‘≈∂Ãj“N>káàÆto\r^∆bﬁä¿∆9˘2s]ÑºEàÏñGåÔW\"aé’…hÒ¥7“hÛÄbπå°9Ë›çY¯W;Èû.ìBô◊nLì¡aZ⁄ËÚ”=ö”¡íΩ≤:`π\\7j+≥‹>ÖjÃyÚFsEdd€π˝ºÖ!vU…U$S^}‚_K{c®Í∫îÌ=≈ƒ/s‘#û¿p8Ù&ª˘≤·îésQ]DóñRZƒ@%88˚µ∆r9X¸ª˝±4Õ≈÷ﬂmµmîL\0©ÖÎ‹Á95‚7∑Ç√Jñ <‰O∑5ˆG¸/¬QZK†jöm°X„Å“]£Üfbƒ˛uÒ^∞YÁH–sü≠hï—’	]&}q˚|<ç¸3o„î$J<»Û”=	ÔèKwH„‰°	ııØ:˝í¢U¯!°¢Æ7[∑O˜´÷Ì¢èÀ˝‡=:◊ãàó5Fè≥√Fÿx˙võ·¶ÜÛÌ⁄ö#ñ⁄GCÎNæ{9òE&zn≈]ÒMÍÈ·¬ÆËr÷˛ ∑G/pÂ9G&≥RhÈÇåzöwZ01e∆=HÆk]õ√ZPw‘5x°\n2C6IÌ“ØÍÛxõƒ∞Zı¥˚\"8Ü.eóÍ{W-\'áÙ]Ï‹hÃƒÕ1ÀcÍzSÊlﬂK\\‰º[„	∆Ÿ∑ñiW8ÃVÌœÈäÛü¯„√æa ú≥€◊§¸@◊4˚Ñâí∏Í†zÔxé÷IúÑFÉ…‚µßNF~—\\Õ‘¸]°›»D†êx\rï8ßiæ!€ À¥ÁÇ≠\\vß{√wàÊü§1Yêâ8Í9≠}õJ‚RÏ{∑√ﬂÕs(∂º;≥ågä˙K·40Íñ»ä“2HÚo√ïúÃí∫:W’ü\0%JÜ¿⁄sÙÆJç#j5õ–ı—ÃQg…€∆Eyèƒõ!ˆÉ!⁄\0°ØRΩ‘ôónÓvØ1¯àDéÃÕ”$÷ï›éÿ¬˚û5‚–∂˚ˆı«µxˇ\0çÓ\\ pI%≥^≥Òh°äGaÇ ◊àxØT2ª0#∂kÿ¬¡8‹·Æ˘Y«xíÚ8òâ\\.O!Ör”œlÃˇ\02Ú{äΩ‚©ÃÛœ\'≠s≠#Öf\'øJÔQ≤9¨Ó[;$`Jí€Gäˇ\0˜R¿zqT,/“KïâÜ9‰„•zÑl¥,Iu$Ä„Ê˝Ÿ\"πÁ7\rq¥û«8ü¨ıp!ìKY˝£ö[ˇ\0Ÿ√F’!√h…€À@ü5zÓãˇ\0T)ï‘J1¿H»Õl,⁄AQïÙë¸*√4°^Iâ–§˜GÀ^#˝òÁ”≤⁄}Õ¡RNVf\\“∏˚øÖ⁄ŒëyZÆûÈ≥\"ê˝—ÙÔ__kvÒÃI0€–c5 j∫%ÑÛá1©>å†◊\\*_sût ûáÄÈﬁª∞à˝™&0∂>xé<≥˝‚=kø¯I‚msJ◊A‘¬Àe:ÜS&‚rG#≠víx7Kû2$µè$v„˘kü∏	—/ô¥∂pØ\'ò±∂p†#•j›’ŒY“q‘Ù[x„ñëGZ‡h≠	Ô~\ZjsEÃPœ|`◊°ÈVÃt∏d«1èΩ◊=«Ù™ﬁ,¸\Z˜Üo¥õûV{gR?‡&≥N⁄ô4πOÃ˚»$m\\yƒá‡`‡åVèÑ4õ©|i°Lﬂ8%Ò∆OƒõÏ/àZÜû¨B≈pp;ÉÈ^ÉDé{$øúÇ0ˆ´Æ÷Öœ\"™\\ÃˆØ	|2÷uØZjV“∏I#‡(8‡êQE}/˚;˛œZﬂà˛\rhö’Ωç√$ÒJUñ2AißµÃ€π…Ã~¡±m∏Õ®EcÅœ#ök∏\'h=:“í!&	ÙÆ5±ƒ’—Û?¸?¬ëÎü\nfækbœo:pπ€íF>µ˘√®⁄cRíü˝S¸π5˙€˚C¯^”ƒﬂ\r5/£i1;«n8˝3_ïﬁ\"Ù„∆ã£¬Õ∫Ω0ë?≈é*πÏta◊5ëˆ◊Ï¡k%Ø¡ﬂD¿k2NL±5ÈÓÖ˙÷∞æ¯^?\r¯GM—£P>«eG>°@5π}(ÜŒqÚ˙◊É^i’l˚Ã:Wä}é«M>ÊBYÅ?/8≈`ÿ«mdÕÙä˝4<V◊äµ{Äÿ É…˜Ø¯Î™¸A÷≠_G5°gëvâˆ$~Á÷àrÀrúZ7˛%˛”|g*ﬁÍ∞4®º*?N’Û≈/€√Q’“hº§OpUà2Fx)Õ&•˚$xö¸?à¸ØõˆWÛ>À¬c?ƒQû1ﬁóRáá≠<\'&áˇ\0ıµ∑ù≈kDU±¡«lW´Bçjq’ïd¨èù|y˚b¸K’&∏e	\nåÏ]¯#§˙◊´|{ÒÃóÒ[Ë˛4ÉPF≤äygKBÅóÊáÊÂägªú˙WC‚èŸ€‚¥∆{x|(ó∂ÂéŸ£ù~aÍA äÃ–e_à≥Õ€!≤”!9ﬁfπÛLÌ^øJÌP§∂<ı*◊’öøºiÒ\'∆∑wÑÈf·]¬ÄA#=+”>¯Œ9µ+mƒ∞àå≤à“d<ÉÍGaÔXﬁ¯æ”ﬂO≤Ò$ÛyÛ˘∑Ñ	ºÙ∆+ø¯u˚;ÿﬁÎpÍÆ“ CÇC\\∞⁄πÎ8∆\rûé⁄5©Ù√-µä@ÒÜ%AÛíFk›~i◊:xvhä©\0ÙÆ+·èÅÂx`âîî\0cûúW≤izri∂´q^ÂÕ#⁄√Qæ‰˙˛±ˆ[<∆∏;yØ/ÒØà‚ñVâ¶À8ËMw⁄ÚîÑ≥‰üCÈ^U„2.öEÁ9¡Ùˆ®ßg;ìÇGõ|Lª[»˛ékƒ5g‹“#Á<W¥|@Ä≠±ì\';yØ’`€w*H1Û\r})DÚ1ëI›ÆªÊd8∆H9Æ_Tπ{lƒ´∏1¬◊eØ€y2IΩqûÜº„‚?àÔt-0À•Zâ%9î\'ÈıÆ…´´ú	◊√ù¿M˝´©√Â,¯€¯}kÿ¸7≠XCGÊ√ÜPPÁ_È:≥¯é‚(üZΩÇG]dîÌgí0~Ôµr_¸AÒ[·_ã\"“¨¸k{⁄¨±•8¡=ÛÌè•r å™Hâ÷Tïœ—KπÌ|∞fee~åTkQÉBªåâ¨#¿<<gkpE~{xoˆ√¯’·Ω6XOå&∏r‡,W0Ü\\w9Î]ßÉønœO\"A‚ªP	oûXõ\0˛®éiôS«¬§¨è´uã[›6A.è¨ÀÅúC;Ô}j§:˘íA£ë68=â˙◊ôxwˆ†?àZ05-üèô¡ﬁ[jzoàlç›ï‰råp»¿„ÚÆÖOî›NÍÊ‡ΩÈ∞Òﬂö‹“‡∑ªÄ	ê7í:Wmu$N\"bXÊ∫≠Á(ÏgU.ƒTmƒËç™€¡AÚ„†=*\rQLZTÛm»XòzÒW‡Dö‹F\0ü„g‘nœ\rì∑CIjyÚvãgÊ˜≈Õ0‹¸L‘n|∑:É`˙◊ß¸9–¢∑—¬%ÊH‘/ìª∑‘◊	Ø£jﬁ!ñÙåÊ‡ù«Î_G~…ø\nÔ>(|qoÅ≠,ûe∫øÖÆ—z”Á$˚WTù†è\Z¨ıgÏóÏÅ_√ﬁ˝ôº¢köj≠⁄Ë©4Í˝CJZ_˝ûäı{]:⁄“÷+HHDÜ5çTp\0QÅèn(¨RLÛ›MNÅó9;y˙RÚ≈¥©Úy‰ı™ö∆µ¶h6jZΩ‚¡oÓyXèóÈÎ^{ïëíÊõQH·˛>ﬂj\Zg¬˚ÀmC_j/ˆ@√!$ì?9ˇ\0ur\Z¯./Ä\Zááøi≠¡:€õçÎ˙JúÉ‹¸„›q_[¸X˝¢<6Øl√O‘Óm-f¥–€Áûô⁄NO·\\éµ‡ﬂâø¥T^8Æ¢Ú≠èáL+ëx≤¡FAÁ¯ö∞ùH®6z∏L\"5cu•œP”†Ú`¡å|ƒú’ô‚9ïa*ôŒﬁEm√FÅG>òã≠¬“3c∞„äg\'ÕsÌ¢¨î{w´∆Ô3ñ=˘≤o, ï	í‡}+∞ø–úí¿n…Á\"≥•ÃÕû1–Q2“‘‡5].ﬁÓ3dﬂ\";ÏP;W\r„/á∫}·yV\0Ã_ÄæïÏ˜^\nëê¸ºˆÕeK‡»˜ÒÇ›Û]4±ÉJ/Vèû5/á3\ræù·Ÿd-¸O.‹ı¨Y~xÜW2\\¨p´7›\rí?\Z˙VoÖ~Ã5A¸\"≥àrs Ì≠˛π7‘ïÜßΩè”æCnQ$Ö•JÙÔÖˇ\0Áö˘m\Z5R2Mz/Ö˛«sp≥MoÖœÕû’ËZOál¥∏º´Kp\Z¬uÂ5kù4p ◊\"◊Ü`“mR(bjkn⁄ÇXqÔU]°`F~ˆz’∑ªä8»zÁπÈSäé¶Oäˆ˝ò≈y/å¶Úôˆ∂y&Ω#ƒzä∞,≤‡◊ïx“4∂”UI{≈Œ]8Òµ‰s∆WcëöÚ]z:â)“Ω?∆§à›Ü:q^c´d]«´fæã\nöâ„b^∂15Õo¨ﬂ)ñÁ%ÏˆÓ¬Xrº„+öˆÖ$N:éûıó≠¯~\rB&éhzé8≈vß•ô¿”<cH—¥®nÚ˙bêN’ËjÔƒÅ~¯¡ß@oÕƒW–E∂ﬁ˙Ê1ú·Å‡äÔ¨ºÖNKó?ÖjßÇ\ZUS\Z¥N::/Ù¨ØÀ+ô í©£>?ÒøÏQÒDòI·mN«TâéHi.øÅ‡‘\r˛xó√∫ˇ\0ˆáé¥8cÜ›N»Aob:8€ä˙„QàdaÂîï}sŒ+&Î¿7Reg∞(ﬂÌ9Ê¥Öhˇ\0Så%xü<xü·Üü´˙§Z[1k ˛‰Uo«Ò¿~\"[MÓÖ¨ür‚YÍ?Üæàè·«ŸõsY)ˆaS/É!pbû -åÂeÎ[]3xE«qû‘Á‘,„[§√\0\nú{wÆ„E…@G`+ü≤¸pBp\0∆1“∫?\rA$j»‹„öœ®ÊÏéøI˘≠~nrkù¯ﬂ4ñˇ\0	u˘°·Üû·HÿÆèJB#∆1ö≈¯’jd¯EØ™¶„ˆ”ø4†Æœ:´¥Y«á<7=ﬁªR∆Z-˚•!s∆1ÅÓ{{◊Ï_¸Wˆ8”æÈzO≈˝cAHµC√È*M!‹TÃÕÄ=0äÙœ5˘7¬è‚èâZ\'áaUﬂ{©[D©∑9,„Ø·_øﬁ\n‘>∆ù†@T•ï§pÄ\0Q«Áö⁄NÒ±Ûÿöú≥±¨?ù!Høº?:+Ãqﬁ&ûˆ«lıØùˇ\0lÔ⁄œ·µ¨V∫iªç?ŸMæcüS⁄æäecÉÂı#9ÈåÛ_õøP_¸Rº“°ü1√pUT7WùSUcË¯_ı¸zMlz√Oåû¯◊•)±U≥‘P?OôÅe˜S¸CﬁªèÇﬁµ–¸i©ÍÈ©πÅUd®›í?J˘kˆGLö∑ƒ{[Ÿ7à£måTÒ€È_exyZΩÕî@«‹ııØ>§yO—±x8PÜ«RÀÜ+ûUπ“‚ù≤™så„5†ê‰äô!$™2\\W#çœ&÷Á#u£1êÇá§S$”cE\0]-‹B1µªÛ«j≈‘$Ç7\'wn*yluBúZπãjäÖX~ïÖuá˘T\nÿ’ı(úÌçÅ¿‰nÈYe√å≤S4ˆq±K˚4\\»K6•Ok£⁄«púÉ‹ı©W`|\n±on%m≈±èJ,âPI⁄∆ÆôQ˝≈ñÎZ,r¿ ®Èpø0»ıÕiLë[⁄¥≤∞Õ+#hËP∫∏V‡Å«ZÁµΩZP\nB	3ZÚ∏æî,\r«ÒjÕ6mì$ˆÙ•\"Ôcã’ÓßhJì⁄∏’G◊¢xÇﬁfë8Èä‡<T%ïâ1ê	Áäﬁåo\"§¥<Á≈÷Î4EÅÔ^_‚8\Zú8<ì^∑‚K Ë¿„5Á~&”à$ÌuØzÇ¥O+ôÅi($ÎVö%îÂè\0V~p[ç›ÎFŸ’”Ç\ru%sâEt]\"9.\0cìû‚ª]3√ˆíB±◊>§Wc3¡ x«8ıÆ„¬óÀ:8Ä ;÷Uahõ”¶í∏ç‡®‹Â\'‘äÖæ⁄Æ_	û˘\\◊TÖXåÛ⁄¶hUÜ\n„‹W3L”ë>áu‡fÑ«˚ïó®|5µùK„ë˜01^él…»\"¢π±U<gÚ≠·VV2ù®Ú{ø^Zí¡wpEEi•Kkü26x<W®…cjG1nkU”£f;T3[¬rÍp‘çåΩ*ﬂ.G›Ójü≈;Uó·ñπni:{vÙÊµ¨°Úãdu™ﬂ‚F≤Ç£Júü˚‡÷∞nÁü8›sˇ\0Ö¯;ˇ\0_ˆº“µ[∏’¥ﬂ¿⁄Ω˜ò8`ú\"ˇ\0ﬂFøfYÂî˘Öó.Kæ”¿…Œ+ÒØˆ˝™µoŸó¿óøØ~È˜Zˆ±Ú‹ÎZ¥¨Ò«ATHóÁ©&æ≥¯Aˇ\0KÒ˘÷aµ¯Ω‡Ì2ÔOë¿ûÁHç¢ö\0{Ö,CûùÎfÙ<LFR\\…r·è8ÌESØàÙxv”≈æäÍ∆˙-¥Ë¸2ünƒÏATS√’N÷65À∂”Ù[À˛wk#qÏ§ˇ\0J¸ß¯Ûs/â>*^ÃÏ[7,	c‹ö˝XÒ\rãÍZ÷úÉ&‚LÁ»ıØÀüé>üC¯üqF‡¨Ìøz‡‰ï‰TïÆŸ˙\'\0∫qƒ‘o}Y˝ñº-ìis¨˘E_Àƒ;cπØtYä=`GÊQû~ïÂı?¡_¨ZÚB\'ªèŒ`Á¯H‡V˜Ñ~/ŸÍû5”º-g\0‡H|Â=¬è“∏¶πµ>À1÷Á∂AÅé3ZPê\0@„û+ŒÔ‰^s”ìZ÷Ú˘à\0\"∞JÁŒ/t«÷ñ`‰∆IÉÅ“πÎ˚S1€1Œ=´Æ‘ ÂÄ_qXW÷·‰CV:©J˙ÌÓìj©∫4QèΩ≈dÀî≈T]\r‘-0d\nTeµda–t\"£î€ô#¿Â´ŒkJ“(ïAìôq\0Ûß“¢öÎ „8ı®n≈)u±£´Q1$)VÓ{UMNˆÎWQ9T?ƒ;÷4jZ¨V*Z@:ı‹ç80‡búu4Â“Âo¯x≈ÊbH˙÷°“dúye0	ÍE\\∞ª¥∑A_|“xõT∑ä¿Ωú·Xu\0t¸iÚ‹I\\‡˛!¯j÷∆qñP•2¸ÛöÚ•¬Å∑±Æ„∆⁄‹”ô\Z[án€â‰Û^m‚Õn6OñE\0v=k™åUÀ{Øâa/ês\\à-’ù¯¸kwƒﬁ,O1†VŒ;W)u©µ¿*ÓÑ◊∑F>ÈÊb/\'±Àkñì$πà˜ı®tmBHÔ>«*Ú√©5ªua€Á\'#ækƒö+[[˝æÓà‰„“∫iú|ç3~‘Ú«÷xYï≥Û\0ƒkÖ˝Úﬁ⁄,¿ˆ”x~˝!∫Eg$ì¿•*õêè∫zπ ¸£æx´®ƒu™:[y—Üè@´€NyØ:i‹÷	\\rÃäpœ•E}s)\r(‡qÅUf…êæ‚9\'9¨mN‚H¡√=ÎJql ÆèB›˝¸+Ú°≈c\\∑…Ê2OsU§‘ãª9ıÕD◊E¿†Î]ÜßõSV€,D@æ*ßé#I|#}o( ÕfÒ∞ıc<S`aè´7«zîvîªÊ\r£‹÷ÒVv8¢◊=è#Êá§x>»AÇxF‚pHU”Ωr⁄ÔÌ)ìÆ«k·œâ·íÍi›˛ËÆ{W†[⁄.•k,ë,lºèj˘«\\≥[=nk4ÚÓ é=Í⁄≤>ó,¬RØ;Il¸:˝´~#Ë˛\n∞”toÀmmGÀÇ\';S,I€$—^C·\r2˙O\rYΩΩ∏(b‡ó«sEIÁ’Àpä¨¥Íœ‹·ìCc3_~›üx∫/i∂Ö`‘ùp üuÀ\0G◊Ω}ìÃõN3ÓzWÒ€¬6æ-¯uqñ¡•≤q4GnOöÛ+A8ü√ÿ˘e˘äóG°Ò∆€Î≠(4´feéﬁ›#^{∞gΩJÍ„„6ã%ƒ§¢K ?ﬁçá¯We˚A¯nkÜ]^(ˆ´\"¸£ë¯◊û|‘≠¥oâöd◊,>Kúr0Êkâ§‚~≥Q∆Ω4˜G⁄÷3ì\ZúÁéïØaz°Üqê8πÌ.W»ª«›´»¬·ò‰å\ZÂÿ˘∑tÏnO(ëx#•dﬂ€»ÃJÆsÌW!lÆI¸ÈN«8»¸E-ÕbÏé~x1’Fjé§CÇG<V∂™≈%⁄c∂+\\ôƒ ®9ëQÃuA©Ëd_8^‰Ê±5+≈l∆Å«PkB‰HI%ÛÔö´òÆ¨”)$˜Õg-çlí±õ·˝J-7ƒv∑Á $±„“∫O|H\Z5…\"Ì|¶œN¬π≠{I1Y»±É‹\ZÚﬂä∫Æ´s§Ωùìf@qû~µµõ6é«I‚ü€G·øÇu%∂◊¸R∞†8bäœÅﬂ!ïzÉÒg√?¸(û!¶Ωok:f9Ìﬂ+ÓÏ}è5Ω‡ù;ƒ>\'KYoDØ4òR†nˆÊΩ£·Ø¡\Z¸!”-µˇ\0	\\:D‡5Â¥ô1 –\ZÎt°‹ så$züéºA,\r!‹F	‚ºá≈>/y%eiq]ç¸I®Í6Ftà≈&xÿÁºw≈\ZúñÏ˜7wHÙ5Ω($ër´öŒ¶$ôÆ-≈a7ätü∑-õÎV¢f?,^zÓ?Üs\\\'åıOxö’Ù˚Kπma`UåqıØ\'_Öz^ã´õ÷GYKgÃy\\∑◊9ØJä8\\˘ﬁß’P\\&–˘»=1ﬁõ¨Ki¨É£#ë^E‡OﬂhJ∂w:ìÀ¨èí£Ík°◊<}≠l∫fó#0#Árx˙VäLÜïÕè	Í›DA¡ÅöÍt˚Ê[Öê0käΩ™˘[ÉÅŒs]=é¸Ä8¬Ü⁄)Y#”|/Æú#Æ;◊VÅ%å6pœ5Â˙&§—:ïc¿ıÆÁK÷£í∑ z◊4¢õ3-j>T@Ä„ÛÆwWïA\'p¸È|I¨üdıÏ±ßΩwRYâ˙÷¥‚í0úÙ±Ú™≈Ä…ÔP}±Cm»ÁæjΩÏÃ‰)5±÷±‹ÛÍøt◊¸∏œ·\\ÁƒMN∆u¥“.n÷9fr—°<∂ﬂˇ\0]mG2®9¸+∆˛7Íóá‚=É£X,…èπ`OÚ´ZjaÖáµ≠c±∂åZû`g˘WŒ^!ç&Ò¨—«É∫Ù˛¨kÿ¸9„‘n#µúù≈˘«•y¨û∏’æ0›i÷÷ÏÎ\rÔßíO#â™úî£f}Ü]BMΩèØ>|∞◊>Ë⁄≠»ÊÅÀ§å?•Ùﬂ¡Ñ∫Å~Ë>÷¢›wm`¶‡„£π.G·ªÖ(h|›lt}¥µÍœ≤\";A∆9¶^[≈qm%º≠Öñ2ç«®ß\'_¬â#Ú≈p5t~uÀ%#Êﬂ¯\'D÷o.º3¨J\"ñ)HçIe=8Ø;∂˝ñ|1•k‚E∫òΩ¥À4jå\0$6GË+Ÿˇ\0j¥˜qkˆ3µªÕFhŒ\n∞Ë\ZÛÔá∑z÷ïñzﬁ∞◊àI≥éﬁïÂWãÑè’2Ã\\´Â—îYﬁxtI%≤37^˙’•Âπêúïô†∞6ÍË\0›	≠ÿ·¿ªW=”2’ªíZç†Û◊‘‘°?7ç1\0 Rª@⁄jMà£´€n‘ÙÌäÂu≤¡∂mÎ]Ü£\"Ï¡#ßzÁuX<Ï,j	\'Æj∫é∫j Á5>lá‰„=*vâQztˆ≠”·≥à¥ƒeæÌQ∏∏P∏ uÎQ∏ÁQ$cjÍ$W©+∑ê+é’¥≠\ZÛ\"XÉ‹+åäËı˘ÿN &¿U‹W<‚π{£q$ÂvÏ$dÒ⁄µÇ±√W(hä· ıY4ãPﬂx?ê2>ï–ÎZÕ§\Zÿ›”k∏b†∑ÅÆ\0yYC*ï+Í+‚\r¬Gv—¬¿8!∏5¥[≥8æ≥Z£‘ÛﬂywO2⁄…∑#Â«5Â~*¯a´Î0æ¥%wâ91®Ì]ÊØ©›∂´ˆkî^ÅüZÌº%¶Z∂ïÂK*O*GQöÓMRI£¶ü-ôÚ€hs⁄3!à™°Ó1\\◊ã|7a®0Y|›ppE}EÒ?·ûÖ,ëﬂ,\")$8 \0È“ºÉ∆?$¥ú≤L$Q◊hØBÜ\"5Vß-J“ã∫<vM¡£‘§ÿO\nOjÍ<;·X·Xlûß=k@ior‚˘q¡5°i¿è\0n+©$ÀßärZö:&õ∫Ì^˝´ZX0*\0ÔTtŸêr1Z÷ÖqÜÓ)J)£™N;ñ≠d0êq€ö›∞’ú@Á#π¨$]Ï†~5~6⁄0ZÀŸ+‹ß¢π5Û	õq\'>∆´LTn~¥ˆêÓ¿ ”X9\"´·–¬RπJ‡~_üzE\\ÿÁ¥€ôIπÿ÷•ÖC0„ß^*‡ñÁ⁄nƒ—3àÀæ=Ú+∆~5ÍZMˆØ	Gù0b>Ω+ÿ5)çΩì:ıÎ«oz˘√[∑èu_\\ôÙ9÷9.íVËÀûi7`À“é\"Ê˜√±ˆçNPyœ®Ø~˝å>A„åwﬁ8÷l7ÿiW+<ŸLâßÍì<üa^_Á·’Êàâ5ÌæÈ•pë∆K1˚£ÛØª˛x€·w√˚/\rC2†üQïWóùÜNO˚<¿◊E(FnÁ^kö}Zåí›ùÃ◊ÇYLç…nI˜¢±€S¡¿b}ËÆıIùºEI;‹˙—≥ùßÚ•*XÏ `ûr*E˚¥◊|sÅ¯◊Õ¶ﬁá+wV<{ˆÑñÚÔƒ1YºÑƒ∞ÇäΩ3^AvöÖåÅ¢Ûª5Ùüƒˇ\0øäÙ—}ßÙªu·¸¥_J?Ã∂W[^€ù6\\äÛqpìw?J·ÃFYz§ù§éè·˚‹M§!ù∑0}ŸÆ≈@Ú◊q\\?¬›N-N¬Uåap&ª\\∞‡ö‡GmHÚM¢T g4Ÿ$RF)äyÂ©m<˛´Rí*j{ŸIΩb]KÂ1œ˜IŒ+oP$°P;÷µ2[ƒY∞«i*OcFçÿ⁄s‰ßsù÷¸_ìyM-»c“©YﬁÕt˛t 1Îö∆˛ º÷.û[€ëÊ+üïF\0∏≠ã-ˆ ˚QòÇ1åU8§¥<óZsëì¨ã‘KÂŸ…∞8≈I7ÜmÔÓLÏ†1@Ñ©„Ω\\∂—|ôò‹«Ûo˘rj]VÚœK∑Û@=â‰‘Û+\n©%qö~ãgl·‰Ñ3ëè¬∏Ôä˙1hÂhÂP:÷¥ˇ\0ÙÀ8öy§\nc$Û\\_ã>\'h⁄€5£ÍIûäªá5PÖ›œFÙ<{Ryf◊ö6Sê„ü∆Ωk¿vÎukìáa\\¥æ“ÓØÜ£i:#ììí0k©Ê£ßhe∫Ωã)Œ]≥ùÈ⁄¡,¢Y¯ô¶Bñ≠\n*ÇH8=ˇ\0¬ºG≈J.fÄsÈ«ZÙàü4ÕBbˆ3£¸ò^ysy§M¿QíOç^J+SñæÚ›úÿ\"πgY\"˝‡l/R\r‹Bœp@oóÂ\n;WY=§iôí<;\n©€ﬂ$pAΩ(T‘Û’%ëaqﬁAÏ≠M\Zıg\")ü:ıß]Èé˜NdåÄ√Â*3Yø`ïÅ%pŸ$ı≠÷®j£ã:Ëôá ˝j‚ñ\0ÁäÁtMf†#ƒé#É[÷” OSSÃvFØ4I~rC§ê∏\0{”∑/≠\rÜ^?\ZOVD§ëû—6˝›¯´„“.Ô⁄¶Å“¥Z#œ©=t)k”kÂ´ìäÁºg„\r¡sYÈó±4∑W0˘ë≈\Zdëü–VØà%À¨KÄsúg⁄®	!‘gQ®Ÿ£≤,éÄ≤åv°Í¨máè*ª=\'ˆSmˇ\0çºV<wØÿ∞“ò4∫Ø)˚£ﬂö˙V‚È˙˘áë^˚=_Ë≤|4Ü€J∑1yS2‹¸Ny…¸Î±ít\'\0ÙÌäÙ‘◊-œöÕkŒ¶#ïΩ1πP~˜ÎESgf9Õ⁄yûŒ\'€à˝∏¶Õ…»•ÄNqÌM}« \n˘$¨Œ[j\n§së«CXû#¯}·í5˝÷‰ü‚ë0ﬂÅZ‹Ur∏«¶ÏPºöRåeπ≠<E\\2Ω7cÃıèÜû»πÆúm÷Îâ‘»Xdt∆jª2„`˝k¥ÒÌ∞õEgPî¡âÓpÃ€∆·«Êbh∆–˚\\õWAπª±Cûπ¢ÊoîsÅ÷òøt‘wãfø¯◊ÓSnÂkô|∆Î”©Æ{_0&I˜A=˝´ZÙÀÂ≤´‡ûıÕÎ6Úy~f‚N}jS±u„bÑˆVQùÆÕ#Y€˘Ukœ⁄ÈÓ©-“!œsY^)‘ÆmÌ›c 2©+^Òs«:∑qìc<œ1¬€\0ëÍMmM)ËŒ8R‘ˆàÙm“GäÍ2€Ny∆\rxoçøi»Ôï¢∑ª∆ﬁÔ^KÆË¥/çÔºçVx¥ÎVn]íPΩ¯‡\n€–ˇ\0f5Ççv{€˘H·§üh$Á›KLıp‘/b‡¯≥{¨ÜR.,f±ı?πú\\Gtså∑ZŸ‘f/Ÿ⁄≠∆áswãp\\,«ÔÁ¸+ÜÒG¡Ôÿk?…¬ÒÁ®*9‰ıÎÆ4©£›£á≥ÿ”ó‚Ê©•è.=E é∏l◊/‚ﬂé^&∏?f≤‘ô##w=kô‘|Ò v˚˝úÂò‰Jºé‚®›|\'¯•©o∫π‘¥¯¬®*$ÛWÏ†k:kcZﬂ‚.±ôÓ5cÍX÷÷ÖÒæÍ⁄@.%R†`úÊº∆„·_≈∑ ˇ\0hŸ(›√5õsª‚‰,Œ∫’≥ÎÉ]£è:Ω*rÖôÙûÖÒ7M◊G% £úä”éÓÂﬂä√‘\Z˘º[„ø\0]÷ iT^8¸´—>~—ZN†Ç)oQd€Û#˛53¢‡Ù<<F0wâÔ◊]*èîW3Æ¡=‹r+¬TëÚÒÉLÔèÙÌacA+|À”5Ø+Cu¸CÒ°6ëÊŒ›∏6ÜHÆ≥ê[Ωu∂ÆèÛ£ ä¡˛ 	9õVVŒûQS\0E8Ö6÷Ößy:ÇjkwbÑ\Zã#8ïa…KrÊÓâ»…†`‰ıÙˆ¶£o≠i∂ün∫äŸ\0ﬂ$™âÓI\0÷¥∂ßÌvpZû∂≥¯ÆÊ…%‚\nTˆ=ˇ\0Z’“¢Fl¸ß8…Ø•¸O˚2¸\'Ò-ú1ÍûHo#Å#k˚G1J≈T\rÃs…œ≠QﬂÏ’Á¬sãÙ7óÆåqﬂN‘(¸kXaÍ7v5ö`„=»?gÕ&ˇ\0L¨˜◊±4kwsòQÅ™ÒªıﬁéïI¥yiUT`ÈRÅÅäıÈGí>[Z5Î9 ¢ä+C£Ì–9˘∫S$ìi!jS˜?\nÇnµÚI‹„N‚#\rÃƒ\nA!€èZFìrlcH\0\0”Æ¨V’,íˆ¬{wÎ\"#ÒÎ^fvÇ—¸§åjı9NF”ú{Wù¯Æ≈t›veQÑï∑/∑äÂ∆A∏\\˙.≠ÏÍ:}ÃSëMp60«÷ûy\\˙ää¯ïPA+«{ic6˘Ib∏ÌX\ZûDnÉìÉ≈mj3Ïçõ?7lW?uƒœí¯^sÅÕI{ú¶Øßæß)èa…nt™≠ªMæçeπÖK)» Áª{Kc|cwØz±%ºq«ÖıE∏ä)Eûc©|,µFFF”ú®Æsƒ\rÆ#∑\rd∏9Ëz‹¯W`ÎŒ:VV´.ÿp™Ôj⁄ÂvwQ¨£©‰Qxrˇ\0Kê¨Ò´˙´’Å„/\nXÍÒyügHäp1¡Ø[’ƒ-\0óÀVa¿\'äÛ_âû!“Ì¢daµ’9\"ª©b‘œNû9.ßìÍ_Ñ7Ê4›oõΩgj˛H◊˝‡º+º∑’Ù´øÕsˆê\Z.™Es©*^e—Å⁄∫cU\Zº}6∑8-gKïj($Úkˇ\0Hπx∞±ë‹„ΩzFßfêc§éjáˆDsµO|äÍßàQ<Í¯àIûU?Ä\"÷íÚ›\'£’ès˚9¯nYö·l¬πÔ¡ï{2hˆ¨Ã“CÜœJrÈˆi˜Pgß5o§yU*kπ¿x·t˛ïZ+˘ﬁ0~Ïíg€™òHè9«Sö∂ÄCÚ¢è °πOﬁ	1‘säœöÁ#íìåf@„5zÃ2Ú™6†)€û¸VïßÛT`ÙcÚCn\"úXz–ƒ84âﬁ¥ÇÊD∂“%ä^Ì?ùvüÙ!Ø|B±∂ñÒ@∆‚\\ûÅGÎ\\LjKzí{Wª~Ã>∫=ˇ\0ãn°⁄◊-Ìúˇ\0pr«Ò<~∫hÆi#Õ∆TˆplÙ{˜‹Ï≈π&®\\0*T0‡˙’ª¬Lgé∆≥Æ	W$W∞ññ>U›…±™&ñõº˙\nP¿éHß}JI±h¢ä9á }º]v„=™ºŒ`EÚh„DnABóö(™)nGq!QπZÁæ!i&ˇ\0M\Zå6ÿdú}·˛4QQ[ZnÁF§Ë‚c(˜8∏/h˜#˙ˇ\0*Ø{r•ÄË\\QEx54ïè“ÈIŒ7}å´‘ÛFZCÅœNµü9N=(¢†“˙ë,ªF‹TwW~LD‰Ú;—EZòó\Zå{èÃ	ıÕakZ‰jø,§`„•T∑°–¢π_ƒ~\"Slæ[dÁêx«≈ùr·VR£nF:QEuaïŒjç§pû’›ÏgÇ·ÿ189<’Ø·˘7I∑ΩWZ9·9\\∑Ø‹€⁄⁄ÚA\'†Æ~”U‹\r‹dQETrwq\ZÆPÇ}™Ø⁄âm˝=≥E—9´≠E7ÆO.iﬁa˘öä+e±íäHñ›Amﬁï~∆N*(≠3{í+éVûùË¢µ¶Ïå¶⁄4|3°ﬂxóZ∑–¥»ã‹]L±B;d˜¸:◊÷⁄\'Ö-º/·€OZ∆°- XŒ?âÄÂøì¯—Ev·“ΩœûÕß-\nw—∂˛ù\rg‹É∏úw¢äı\"›è=QC.#î∂8QE\"èˇŸ',	'mediapipe_v1',	'2025-11-04 13:41:30',	'2025-11-04 13:41:30');

DROP TABLE IF EXISTS `caja`;
CREATE TABLE `caja` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `fecha` datetime NOT NULL,
  `concepto` varchar(200) NOT NULL,
  `tipo` enum('INGRESO','EGRESO') NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `medio_pago` varchar(40) DEFAULT NULL,
  `nro_tramite` varchar(80) DEFAULT NULL,
  `responsable_id` bigint unsigned DEFAULT NULL,
  `validador_id` bigint unsigned DEFAULT NULL,
  `fecha_validacion` datetime DEFAULT NULL,
  `estado` enum('APROBADO','PENDIENTE','RECHAZADO') DEFAULT 'APROBADO',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_caja_responsable` (`responsable_id`),
  KEY `fk_caja_validador` (`validador_id`),
  CONSTRAINT `fk_caja_responsable` FOREIGN KEY (`responsable_id`) REFERENCES `persona` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_caja_validador` FOREIGN KEY (`validador_id`) REFERENCES `persona` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `caja` (`id`, `fecha`, `concepto`, `tipo`, `monto`, `medio_pago`, `nro_tramite`, `responsable_id`, `validador_id`, `fecha_validacion`, `estado`, `created_at`, `updated_at`) VALUES
(1,	'2025-09-21 15:03:26',	'Venta rifas',	'INGRESO',	12345.67,	'transferencia',	NULL,	1,	NULL,	NULL,	'APROBADO',	'2025-09-26 13:12:23',	'2025-09-26 13:12:23'),
(2,	'2025-09-21 15:13:27',	'Pago cuota 2025-09 socio_id 1',	'INGRESO',	5000.00,	'efectivo',	NULL,	1,	NULL,	NULL,	'APROBADO',	'2025-09-26 13:12:23',	'2025-09-26 13:12:23'),
(3,	'2025-09-26 14:01:34',	'Apertura',	'INGRESO',	1000.00,	'EFECTIVO',	NULL,	1,	NULL,	NULL,	'APROBADO',	'2025-09-26 14:01:34',	'2025-09-26 14:01:34'),
(4,	'2025-09-26 14:01:34',	'Compra insumos',	'EGRESO',	100.00,	'TRANSFERENCIA',	'TRX-001',	1,	2,	'2025-09-26 14:01:34',	'APROBADO',	'2025-09-26 14:01:34',	'2025-09-26 14:01:34'),
(5,	'2025-09-26 14:02:41',	'Apertura',	'INGRESO',	1000.00,	'EFECTIVO',	NULL,	1,	NULL,	NULL,	'APROBADO',	'2025-09-26 14:02:41',	'2025-09-26 14:02:41'),
(6,	'2025-09-26 14:02:41',	'Compra insumos',	'EGRESO',	100.00,	'TRANSFERENCIA',	'TRX-001',	1,	2,	'2025-09-26 14:02:41',	'APROBADO',	'2025-09-26 14:02:41',	'2025-09-26 14:02:41'),
(7,	'2025-09-26 14:59:59',	'Apertura',	'INGRESO',	1000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-09-26 14:59:59',	'2025-09-26 14:59:59'),
(8,	'2025-09-26 15:00:06',	'Compra insumos',	'EGRESO',	100.00,	'TRANSFERENCIA',	'TRX-001',	NULL,	2,	'2025-09-26 14:02:41',	'APROBADO',	'2025-09-26 15:00:06',	'2025-09-26 15:00:06'),
(9,	'2025-09-26 15:03:11',	'Apertura',	'INGRESO',	1000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-09-26 15:03:10',	'2025-09-26 15:03:10'),
(10,	'2025-09-26 15:03:11',	'Compra insumos',	'EGRESO',	100.00,	'TRANSFERENCIA',	'TRX-001',	NULL,	2,	'2025-09-26 14:02:41',	'APROBADO',	'2025-09-26 15:03:10',	'2025-09-26 15:03:10'),
(11,	'2025-09-26 15:06:26',	'Apertura',	'INGRESO',	1000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-09-26 15:06:26',	'2025-09-26 15:06:26'),
(12,	'2025-09-26 15:06:26',	'Compra insumos',	'EGRESO',	100.00,	'TRANSFERENCIA',	'TRX-001',	NULL,	2,	'2025-09-26 14:02:41',	'APROBADO',	'2025-09-26 15:06:26',	'2025-09-26 15:06:26'),
(13,	'2025-09-26 15:09:37',	'Pago cuota 2025-10 socio_id 1 (pago_id 4)',	'INGRESO',	1500.00,	'MERCADO_PAGO',	'MP-0001',	NULL,	NULL,	NULL,	'APROBADO',	'2025-09-26 15:09:37',	'2025-09-26 15:09:37'),
(14,	'2025-10-21 19:15:55',	'Venta Entrada Local - Socio 40000001 - AL_DIA - DNI: 40000001',	'INGRESO',	1000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-21 19:15:55',	'2025-10-21 19:15:55'),
(15,	'2025-10-21 23:31:25',	'Venta Entrada Local',	'INGRESO',	1500.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 02:31:25',	'2025-10-22 02:31:25'),
(16,	'2025-10-21 23:32:47',	'Venta Entrada Local',	'INGRESO',	1500.00,	'MERCADO_PAGO',	'MP-123456',	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 02:32:47',	'2025-10-22 02:32:47'),
(17,	'2025-10-21 23:40:10',	'Venta Entrada Local',	'INGRESO',	3000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 02:40:10',	'2025-10-22 02:40:10'),
(18,	'2025-10-21 23:42:05',	'Venta Entrada Local',	'INGRESO',	3000.00,	'MERCADO_PAGO',	'MP-1234567',	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 02:42:05',	'2025-10-22 02:42:05'),
(19,	'2025-10-21 23:57:30',	'Pago cuota 2025-10 - Socio ID 3',	'INGRESO',	3000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 02:57:30',	'2025-10-22 02:57:30'),
(20,	'2025-10-21 23:58:42',	'Pago cuota 2025-10 - Socio ID 3',	'INGRESO',	3000.00,	'MERCADO_PAGO',	'MP-12345678',	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 02:58:42',	'2025-10-22 02:58:42'),
(21,	'2025-10-22 13:59:51',	'Venta Entrada Local',	'INGRESO',	1500.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 16:59:51',	'2025-10-22 16:59:51'),
(22,	'2025-10-22 14:00:16',	'Venta Entrada Local',	'INGRESO',	1500.00,	'MERCADO_PAGO',	'MP-1234567',	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 17:00:16',	'2025-10-22 17:00:16'),
(23,	'2025-10-22 14:00:26',	'Venta Entrada Local',	'INGRESO',	3000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 17:00:26',	'2025-10-22 17:00:26'),
(24,	'2025-10-22 14:00:45',	'Venta Entrada Local',	'INGRESO',	3000.00,	'MERCADO_PAGO',	'MP-12345',	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 17:00:45',	'2025-10-22 17:00:45'),
(25,	'2025-10-22 14:01:11',	'Pago cuota 2025-10 - Socio ID 1',	'INGRESO',	3000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 17:01:11',	'2025-10-22 17:01:11'),
(26,	'2025-10-22 15:18:43',	'compra equipamiento deportivo',	'EGRESO',	5000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	'2025-10-22 15:24:32',	'APROBADO',	'2025-10-22 18:18:43',	'2025-10-22 18:24:32'),
(27,	'2025-10-22 15:25:23',	'Pago de Luz y Agua',	'EGRESO',	15000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'RECHAZADO',	'2025-10-22 18:25:23',	'2025-10-22 18:25:29'),
(28,	'2025-10-22 15:34:21',	'Pagar WIFI',	'EGRESO',	12000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	'2025-10-22 15:34:26',	'APROBADO',	'2025-10-22 18:34:21',	'2025-10-22 18:34:26'),
(29,	'2025-10-22 15:35:14',	'Compra de Pelotas',	'EGRESO',	10000.00,	'TRANSFERENCIA',	'TRX-1234567',	NULL,	NULL,	NULL,	'RECHAZADO',	'2025-10-22 18:35:14',	'2025-10-22 18:35:19'),
(30,	'2025-10-22 16:11:31',	'Pago cuota 2025-06 - Socio ID 1',	'INGRESO',	1000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 19:11:31',	'2025-10-22 19:11:31'),
(31,	'2025-10-22 16:12:34',	'comprar botines',	'EGRESO',	1000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	'2025-10-22 16:12:39',	'APROBADO',	'2025-10-22 19:12:34',	'2025-10-22 19:12:39'),
(32,	'2025-10-22 18:33:21',	'Venta Entrada Visitante',	'INGRESO',	5000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 21:33:21',	'2025-10-22 21:33:21'),
(33,	'2025-10-22 18:35:39',	'Venta Entrada Visitante',	'INGRESO',	5000.00,	'MERCADO_PAGO',	'MP-123456',	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 21:35:39',	'2025-10-22 21:35:39'),
(34,	'2025-10-22 18:36:18',	'Venta Entrada Local',	'INGRESO',	1500.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 21:36:18',	'2025-10-22 21:36:18'),
(35,	'2025-10-22 18:37:01',	'Venta Entrada Local',	'INGRESO',	3000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 21:37:01',	'2025-10-22 21:37:01'),
(36,	'2025-10-22 18:37:21',	'Pago cuota 2025-10 - Socio ID 5',	'INGRESO',	1000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 21:37:21',	'2025-10-22 21:37:21'),
(37,	'2025-10-22 18:38:09',	'Pago Entrenadores',	'EGRESO',	5000.00,	'TRANSFERENCIA',	'TRX-12345',	NULL,	NULL,	'2025-10-22 18:38:12',	'APROBADO',	'2025-10-22 21:38:09',	'2025-10-22 21:38:12'),
(38,	'2025-10-22 19:01:21',	'Venta Entrada Visitante',	'INGRESO',	5000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 22:01:21',	'2025-10-22 22:01:21'),
(39,	'2025-10-22 19:26:58',	'Venta Entrada Local',	'INGRESO',	1500.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 22:26:58',	'2025-10-22 22:26:58'),
(40,	'2025-10-22 19:28:53',	'Pago cuota 2025-02 - Socio ID 1',	'INGRESO',	1000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 22:28:53',	'2025-10-22 22:28:53'),
(41,	'2025-10-22 19:30:26',	'Pagar Insumos',	'EGRESO',	10000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	'2025-10-22 19:30:54',	'APROBADO',	'2025-10-22 22:30:26',	'2025-10-22 22:30:54'),
(42,	'2025-10-22 19:38:29',	'Venta Entrada Visitante',	'INGRESO',	5000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-10-22 22:38:29',	'2025-10-22 22:38:29'),
(43,	'2025-11-09 20:09:44',	'Venta Entrada Local',	'INGRESO',	1500.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-11-09 23:09:44',	'2025-11-09 23:09:44'),
(44,	'2025-11-09 23:31:51',	'Pago cuota 2025-09 socio_id 1 (pago_id 5)',	'INGRESO',	5000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-11-09 23:31:51',	'2025-11-09 23:31:51'),
(45,	'2025-11-09 23:38:03',	'Pago cuota 2025-10 socio_id 5 (pago_id 6)',	'INGRESO',	4000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-11-09 23:38:03',	'2025-11-09 23:38:03'),
(46,	'2025-11-10 02:19:57',	'Pago cuota 2025-02 socio_id 1 (pago_id 7)',	'INGRESO',	4000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-11-10 02:19:57',	'2025-11-10 02:19:57'),
(47,	'2025-11-10 02:19:57',	'Pago cuota 2025-06 socio_id 1 (pago_id 8)',	'INGRESO',	4000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-11-10 02:19:57',	'2025-11-10 02:19:57'),
(48,	'2025-11-10 02:19:57',	'Pago cuota 2025-10 socio_id 1 (pago_id 9)',	'INGRESO',	500.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-11-10 02:19:57',	'2025-11-10 02:19:57'),
(49,	'2025-11-09 23:21:01',	'Pago cuota 2025-02 - Socio ID 6',	'INGRESO',	1000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-11-10 02:21:01',	'2025-11-10 02:21:01'),
(50,	'2025-11-09 23:31:32',	'Venta Entrada Visitante',	'INGRESO',	5000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-11-10 02:31:32',	'2025-11-10 02:31:32'),
(51,	'2025-11-09 23:31:35',	'Venta Entrada Visitante',	'INGRESO',	5000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-11-10 02:31:35',	'2025-11-10 02:31:35'),
(52,	'2025-11-09 23:31:36',	'Venta Entrada Visitante',	'INGRESO',	5000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-11-10 02:31:36',	'2025-11-10 02:31:36'),
(53,	'2025-11-09 23:31:52',	'Venta Entrada Visitante',	'INGRESO',	10000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-11-10 02:31:52',	'2025-11-10 02:31:52'),
(54,	'2025-11-09 23:32:49',	'Venta Entrada Local',	'INGRESO',	1500.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-11-10 02:32:49',	'2025-11-10 02:32:49'),
(55,	'2025-11-09 23:33:14',	'Pago cuota 2025-03 - Socio ID 2',	'INGRESO',	5000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-11-10 02:33:14',	'2025-11-10 02:33:14'),
(56,	'2025-11-10 07:10:30',	'Venta Entrada Local',	'INGRESO',	1500.00,	'EFECTIVO',	NULL,	16,	NULL,	NULL,	'APROBADO',	'2025-11-10 10:10:30',	'2025-11-10 10:10:30'),
(57,	'2025-11-10 11:45:37',	'Pago cuota 2025-11 - Socio ID 1',	'INGRESO',	5000.00,	'EFECTIVO',	NULL,	33,	NULL,	NULL,	'APROBADO',	'2025-11-10 14:45:37',	'2025-11-10 14:45:37'),
(58,	'2025-11-10 11:46:50',	'pago de luz',	'EGRESO',	10000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'PENDIENTE',	'2025-11-10 14:46:50',	'2025-11-10 14:46:50'),
(59,	'2025-11-10 11:47:35',	'pago de agua',	'EGRESO',	50000.00,	'EFECTIVO',	NULL,	33,	NULL,	NULL,	'PENDIENTE',	'2025-11-10 14:47:35',	'2025-11-10 14:47:35'),
(60,	'2025-11-10 19:49:45',	'Venta Entrada Local',	'INGRESO',	1500.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-11-10 22:49:45',	'2025-11-10 22:49:45'),
(61,	'2025-11-10 19:50:46',	'Venta Entrada Visitante',	'INGRESO',	5000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	NULL,	'APROBADO',	'2025-11-10 22:50:46',	'2025-11-10 22:50:46');

DELIMITER ;;

CREATE TRIGGER `trg_caja_bi` BEFORE INSERT ON `caja` FOR EACH ROW
BEGIN
  IF (SELECT COUNT(*) FROM caja)=0 AND NEW.tipo<>'INGRESO' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='El primer movimiento de caja debe ser un INGRESO';
  END IF;
  
  IF NEW.tipo='EGRESO' AND NEW.estado='APROBADO' THEN
    IF NEW.validador_id IS NULL OR NEW.fecha_validacion IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='EGRESO aprobado requiere validador_id y fecha_validacion';
    END IF;
  END IF;
  
  IF NEW.tipo='EGRESO' AND NEW.estado='PENDIENTE' THEN
    SET NEW.validador_id = NULL;
    SET NEW.fecha_validacion = NULL;
  END IF;
  
  IF NEW.medio_pago IN ('MERCADO_PAGO','TRANSFERENCIA') AND (NEW.nro_tramite IS NULL OR NEW.nro_tramite='') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='nro_tramite obligatorio para el medio de pago seleccionado';
  END IF;
  
  IF NEW.tipo='EGRESO' AND NEW.estado='APROBADO' THEN
    IF fn_saldo_caja_actual() - NEW.monto < 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='No se permite egresar: saldo de caja insuficiente';
    END IF;
  END IF;
END;;

CREATE TRIGGER `trg_caja_ai` AFTER INSERT ON `caja` FOR EACH ROW
BEGIN
  INSERT INTO caja_audit (accion, caja_id, snapshot)
  VALUES ('INSERT', NEW.id, JSON_OBJECT('fecha',NEW.fecha,'concepto',NEW.concepto,'tipo',NEW.tipo,'monto',NEW.monto,
          'medio_pago',NEW.medio_pago,'nro_tramite',NEW.nro_tramite,'responsable_id',NEW.responsable_id,
          'validador_id',NEW.validador_id,'fecha_validacion',NEW.fecha_validacion));
END;;

CREATE TRIGGER `trg_caja_au` AFTER UPDATE ON `caja` FOR EACH ROW
BEGIN
  INSERT INTO caja_audit (accion, caja_id, snapshot)
  VALUES ('UPDATE', NEW.id, JSON_OBJECT('fecha',NEW.fecha,'concepto',NEW.concepto,'tipo',NEW.tipo,'monto',NEW.monto,
          'medio_pago',NEW.medio_pago,'nro_tramite',NEW.nro_tramite,'responsable_id',NEW.responsable_id,
          'validador_id',NEW.validador_id,'fecha_validacion',NEW.fecha_validacion));
END;;

CREATE TRIGGER `trg_caja_ad` AFTER DELETE ON `caja` FOR EACH ROW
BEGIN
  INSERT INTO caja_audit (accion, caja_id, snapshot)
  VALUES ('DELETE', OLD.id, JSON_OBJECT('fecha',OLD.fecha,'concepto',OLD.concepto,'tipo',OLD.tipo,'monto',OLD.monto,
          'medio_pago',OLD.medio_pago,'nro_tramite',OLD.nro_tramite,'responsable_id',OLD.responsable_id,
          'validador_id',OLD.validador_id,'fecha_validacion',OLD.fecha_validacion));
END;;

DELIMITER ;

DROP TABLE IF EXISTS `caja_audit`;
CREATE TABLE `caja_audit` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `accion` enum('INSERT','UPDATE','DELETE') NOT NULL,
  `caja_id` bigint unsigned DEFAULT NULL,
  `snapshot` json DEFAULT NULL,
  `realizado_por` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `caja_audit` (`id`, `accion`, `caja_id`, `snapshot`, `realizado_por`, `created_at`) VALUES
(1,	'INSERT',	3,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-09-26 14:01:34.000000\", \"monto\": 1000.0, \"concepto\": \"Apertura\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": 1, \"fecha_validacion\": null}',	NULL,	'2025-09-26 14:01:34'),
(2,	'INSERT',	4,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-09-26 14:01:34.000000\", \"monto\": 100.0, \"concepto\": \"Compra insumos\", \"medio_pago\": \"TRANSFERENCIA\", \"nro_tramite\": \"TRX-001\", \"validador_id\": 2, \"responsable_id\": 1, \"fecha_validacion\": \"2025-09-26 14:01:34.000000\"}',	NULL,	'2025-09-26 14:01:34'),
(3,	'INSERT',	5,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-09-26 14:02:41.000000\", \"monto\": 1000.0, \"concepto\": \"Apertura\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": 1, \"fecha_validacion\": null}',	NULL,	'2025-09-26 14:02:41'),
(4,	'INSERT',	6,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-09-26 14:02:41.000000\", \"monto\": 100.0, \"concepto\": \"Compra insumos\", \"medio_pago\": \"TRANSFERENCIA\", \"nro_tramite\": \"TRX-001\", \"validador_id\": 2, \"responsable_id\": 1, \"fecha_validacion\": \"2025-09-26 14:02:41.000000\"}',	NULL,	'2025-09-26 14:02:41'),
(5,	'INSERT',	7,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-09-26 14:59:59.000000\", \"monto\": 1000.0, \"concepto\": \"Apertura\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-09-26 14:59:59'),
(6,	'INSERT',	8,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-09-26 15:00:06.000000\", \"monto\": 100.0, \"concepto\": \"Compra insumos\", \"medio_pago\": \"TRANSFERENCIA\", \"nro_tramite\": \"TRX-001\", \"validador_id\": 2, \"responsable_id\": null, \"fecha_validacion\": \"2025-09-26 14:02:41.000000\"}',	NULL,	'2025-09-26 15:00:06'),
(7,	'INSERT',	9,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-09-26 15:03:11.000000\", \"monto\": 1000.0, \"concepto\": \"Apertura\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-09-26 15:03:10'),
(8,	'INSERT',	10,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-09-26 15:03:11.000000\", \"monto\": 100.0, \"concepto\": \"Compra insumos\", \"medio_pago\": \"TRANSFERENCIA\", \"nro_tramite\": \"TRX-001\", \"validador_id\": 2, \"responsable_id\": null, \"fecha_validacion\": \"2025-09-26 14:02:41.000000\"}',	NULL,	'2025-09-26 15:03:10'),
(9,	'INSERT',	11,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-09-26 15:06:26.000000\", \"monto\": 1000.0, \"concepto\": \"Apertura\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-09-26 15:06:26'),
(10,	'INSERT',	12,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-09-26 15:06:26.000000\", \"monto\": 100.0, \"concepto\": \"Compra insumos\", \"medio_pago\": \"TRANSFERENCIA\", \"nro_tramite\": \"TRX-001\", \"validador_id\": 2, \"responsable_id\": null, \"fecha_validacion\": \"2025-09-26 14:02:41.000000\"}',	NULL,	'2025-09-26 15:06:26'),
(11,	'INSERT',	13,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-09-26 15:09:37.000000\", \"monto\": 1500.0, \"concepto\": \"Pago cuota 2025-10 socio_id 1 (pago_id 4)\", \"medio_pago\": \"MERCADO_PAGO\", \"nro_tramite\": \"MP-0001\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-09-26 15:09:37'),
(12,	'INSERT',	14,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-21 19:15:55.000000\", \"monto\": 1000.0, \"concepto\": \"Venta Entrada Local - Socio 40000001 - AL_DIA - DNI: 40000001\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-21 19:15:55'),
(13,	'INSERT',	15,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-21 23:31:25.000000\", \"monto\": 1500.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 02:31:25'),
(14,	'INSERT',	16,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-21 23:32:47.000000\", \"monto\": 1500.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"MERCADO_PAGO\", \"nro_tramite\": \"MP-123456\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 02:32:47'),
(15,	'INSERT',	17,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-21 23:40:10.000000\", \"monto\": 3000.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 02:40:10'),
(16,	'INSERT',	18,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-21 23:42:05.000000\", \"monto\": 3000.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"MERCADO_PAGO\", \"nro_tramite\": \"MP-1234567\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 02:42:05'),
(17,	'INSERT',	19,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-21 23:57:30.000000\", \"monto\": 3000.0, \"concepto\": \"Pago cuota 2025-10 - Socio ID 3\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 02:57:30'),
(18,	'INSERT',	20,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-21 23:58:42.000000\", \"monto\": 3000.0, \"concepto\": \"Pago cuota 2025-10 - Socio ID 3\", \"medio_pago\": \"MERCADO_PAGO\", \"nro_tramite\": \"MP-12345678\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 02:58:42'),
(19,	'INSERT',	21,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 13:59:51.000000\", \"monto\": 1500.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 16:59:51'),
(20,	'INSERT',	22,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 14:00:16.000000\", \"monto\": 1500.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"MERCADO_PAGO\", \"nro_tramite\": \"MP-1234567\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 17:00:16'),
(21,	'INSERT',	23,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 14:00:26.000000\", \"monto\": 3000.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 17:00:26'),
(22,	'INSERT',	24,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 14:00:45.000000\", \"monto\": 3000.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"MERCADO_PAGO\", \"nro_tramite\": \"MP-12345\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 17:00:45'),
(23,	'INSERT',	25,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 14:01:11.000000\", \"monto\": 3000.0, \"concepto\": \"Pago cuota 2025-10 - Socio ID 1\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 17:01:11'),
(24,	'UPDATE',	1,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-09-21 15:03:26.000000\", \"monto\": 12345.67, \"concepto\": \"Venta rifas\", \"medio_pago\": \"transferencia\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": 1, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(25,	'UPDATE',	2,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-09-21 15:13:27.000000\", \"monto\": 5000.0, \"concepto\": \"Pago cuota 2025-09 socio_id 1\", \"medio_pago\": \"efectivo\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": 1, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(26,	'UPDATE',	3,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-09-26 14:01:34.000000\", \"monto\": 1000.0, \"concepto\": \"Apertura\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": 1, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(27,	'UPDATE',	4,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-09-26 14:01:34.000000\", \"monto\": 100.0, \"concepto\": \"Compra insumos\", \"medio_pago\": \"TRANSFERENCIA\", \"nro_tramite\": \"TRX-001\", \"validador_id\": 2, \"responsable_id\": 1, \"fecha_validacion\": \"2025-09-26 14:01:34.000000\"}',	NULL,	'2025-10-22 18:16:13'),
(28,	'UPDATE',	5,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-09-26 14:02:41.000000\", \"monto\": 1000.0, \"concepto\": \"Apertura\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": 1, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(29,	'UPDATE',	6,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-09-26 14:02:41.000000\", \"monto\": 100.0, \"concepto\": \"Compra insumos\", \"medio_pago\": \"TRANSFERENCIA\", \"nro_tramite\": \"TRX-001\", \"validador_id\": 2, \"responsable_id\": 1, \"fecha_validacion\": \"2025-09-26 14:02:41.000000\"}',	NULL,	'2025-10-22 18:16:13'),
(30,	'UPDATE',	7,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-09-26 14:59:59.000000\", \"monto\": 1000.0, \"concepto\": \"Apertura\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(31,	'UPDATE',	8,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-09-26 15:00:06.000000\", \"monto\": 100.0, \"concepto\": \"Compra insumos\", \"medio_pago\": \"TRANSFERENCIA\", \"nro_tramite\": \"TRX-001\", \"validador_id\": 2, \"responsable_id\": null, \"fecha_validacion\": \"2025-09-26 14:02:41.000000\"}',	NULL,	'2025-10-22 18:16:13'),
(32,	'UPDATE',	9,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-09-26 15:03:11.000000\", \"monto\": 1000.0, \"concepto\": \"Apertura\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(33,	'UPDATE',	10,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-09-26 15:03:11.000000\", \"monto\": 100.0, \"concepto\": \"Compra insumos\", \"medio_pago\": \"TRANSFERENCIA\", \"nro_tramite\": \"TRX-001\", \"validador_id\": 2, \"responsable_id\": null, \"fecha_validacion\": \"2025-09-26 14:02:41.000000\"}',	NULL,	'2025-10-22 18:16:13'),
(34,	'UPDATE',	11,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-09-26 15:06:26.000000\", \"monto\": 1000.0, \"concepto\": \"Apertura\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(35,	'UPDATE',	12,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-09-26 15:06:26.000000\", \"monto\": 100.0, \"concepto\": \"Compra insumos\", \"medio_pago\": \"TRANSFERENCIA\", \"nro_tramite\": \"TRX-001\", \"validador_id\": 2, \"responsable_id\": null, \"fecha_validacion\": \"2025-09-26 14:02:41.000000\"}',	NULL,	'2025-10-22 18:16:13'),
(36,	'UPDATE',	13,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-09-26 15:09:37.000000\", \"monto\": 1500.0, \"concepto\": \"Pago cuota 2025-10 socio_id 1 (pago_id 4)\", \"medio_pago\": \"MERCADO_PAGO\", \"nro_tramite\": \"MP-0001\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(37,	'UPDATE',	14,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-21 19:15:55.000000\", \"monto\": 1000.0, \"concepto\": \"Venta Entrada Local - Socio 40000001 - AL_DIA - DNI: 40000001\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(38,	'UPDATE',	15,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-21 23:31:25.000000\", \"monto\": 1500.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(39,	'UPDATE',	16,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-21 23:32:47.000000\", \"monto\": 1500.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"MERCADO_PAGO\", \"nro_tramite\": \"MP-123456\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(40,	'UPDATE',	17,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-21 23:40:10.000000\", \"monto\": 3000.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(41,	'UPDATE',	18,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-21 23:42:05.000000\", \"monto\": 3000.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"MERCADO_PAGO\", \"nro_tramite\": \"MP-1234567\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(42,	'UPDATE',	19,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-21 23:57:30.000000\", \"monto\": 3000.0, \"concepto\": \"Pago cuota 2025-10 - Socio ID 3\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(43,	'UPDATE',	20,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-21 23:58:42.000000\", \"monto\": 3000.0, \"concepto\": \"Pago cuota 2025-10 - Socio ID 3\", \"medio_pago\": \"MERCADO_PAGO\", \"nro_tramite\": \"MP-12345678\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(44,	'UPDATE',	21,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 13:59:51.000000\", \"monto\": 1500.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(45,	'UPDATE',	22,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 14:00:16.000000\", \"monto\": 1500.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"MERCADO_PAGO\", \"nro_tramite\": \"MP-1234567\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(46,	'UPDATE',	23,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 14:00:26.000000\", \"monto\": 3000.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(47,	'UPDATE',	24,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 14:00:45.000000\", \"monto\": 3000.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"MERCADO_PAGO\", \"nro_tramite\": \"MP-12345\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(48,	'UPDATE',	25,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 14:01:11.000000\", \"monto\": 3000.0, \"concepto\": \"Pago cuota 2025-10 - Socio ID 1\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:16:13'),
(49,	'INSERT',	26,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-10-22 15:18:43.000000\", \"monto\": 5000.0, \"concepto\": \"compra equipamiento deportivo\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:18:43'),
(50,	'UPDATE',	26,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-10-22 15:18:43.000000\", \"monto\": 5000.0, \"concepto\": \"compra equipamiento deportivo\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": \"2025-10-22 15:24:32.000000\"}',	NULL,	'2025-10-22 18:24:32'),
(51,	'INSERT',	27,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-10-22 15:25:23.000000\", \"monto\": 15000.0, \"concepto\": \"Pago de Luz y Agua\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:25:23'),
(52,	'UPDATE',	27,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-10-22 15:25:23.000000\", \"monto\": 15000.0, \"concepto\": \"Pago de Luz y Agua\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:25:29'),
(53,	'INSERT',	28,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-10-22 15:34:21.000000\", \"monto\": 12000.0, \"concepto\": \"Pagar WIFI\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:34:21'),
(54,	'UPDATE',	28,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-10-22 15:34:21.000000\", \"monto\": 12000.0, \"concepto\": \"Pagar WIFI\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": \"2025-10-22 15:34:26.000000\"}',	NULL,	'2025-10-22 18:34:26'),
(55,	'INSERT',	29,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-10-22 15:35:14.000000\", \"monto\": 10000.0, \"concepto\": \"Compra de Pelotas\", \"medio_pago\": \"TRANSFERENCIA\", \"nro_tramite\": \"TRX-1234567\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:35:14'),
(56,	'UPDATE',	29,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-10-22 15:35:14.000000\", \"monto\": 10000.0, \"concepto\": \"Compra de Pelotas\", \"medio_pago\": \"TRANSFERENCIA\", \"nro_tramite\": \"TRX-1234567\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 18:35:19'),
(57,	'INSERT',	30,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 16:11:31.000000\", \"monto\": 1000.0, \"concepto\": \"Pago cuota 2025-06 - Socio ID 1\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 19:11:31'),
(58,	'INSERT',	31,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-10-22 16:12:34.000000\", \"monto\": 1000.0, \"concepto\": \"comprar botines\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 19:12:34'),
(59,	'UPDATE',	31,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-10-22 16:12:34.000000\", \"monto\": 1000.0, \"concepto\": \"comprar botines\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": \"2025-10-22 16:12:39.000000\"}',	NULL,	'2025-10-22 19:12:39'),
(60,	'INSERT',	32,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 18:33:21.000000\", \"monto\": 5000.0, \"concepto\": \"Venta Entrada Visitante\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 21:33:21'),
(61,	'INSERT',	33,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 18:35:39.000000\", \"monto\": 5000.0, \"concepto\": \"Venta Entrada Visitante\", \"medio_pago\": \"MERCADO_PAGO\", \"nro_tramite\": \"MP-123456\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 21:35:39'),
(62,	'INSERT',	34,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 18:36:18.000000\", \"monto\": 1500.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 21:36:18'),
(63,	'INSERT',	35,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 18:37:01.000000\", \"monto\": 3000.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 21:37:01'),
(64,	'INSERT',	36,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 18:37:21.000000\", \"monto\": 1000.0, \"concepto\": \"Pago cuota 2025-10 - Socio ID 5\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 21:37:21'),
(65,	'INSERT',	37,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-10-22 18:38:09.000000\", \"monto\": 5000.0, \"concepto\": \"Pago Entrenadores\", \"medio_pago\": \"TRANSFERENCIA\", \"nro_tramite\": \"TRX-12345\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 21:38:09'),
(66,	'UPDATE',	37,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-10-22 18:38:09.000000\", \"monto\": 5000.0, \"concepto\": \"Pago Entrenadores\", \"medio_pago\": \"TRANSFERENCIA\", \"nro_tramite\": \"TRX-12345\", \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": \"2025-10-22 18:38:12.000000\"}',	NULL,	'2025-10-22 21:38:12'),
(67,	'INSERT',	38,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 19:01:21.000000\", \"monto\": 5000.0, \"concepto\": \"Venta Entrada Visitante\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 22:01:21'),
(68,	'INSERT',	39,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 19:26:58.000000\", \"monto\": 1500.0, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 22:26:58'),
(69,	'INSERT',	40,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 19:28:53.000000\", \"monto\": 1000.0, \"concepto\": \"Pago cuota 2025-02 - Socio ID 1\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 22:28:53'),
(70,	'INSERT',	41,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-10-22 19:30:26.000000\", \"monto\": 10000.0, \"concepto\": \"Pagar Insumos\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 22:30:26'),
(71,	'UPDATE',	41,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-10-22 19:30:26.000000\", \"monto\": 10000.0, \"concepto\": \"Pagar Insumos\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": \"2025-10-22 19:30:54.000000\"}',	NULL,	'2025-10-22 22:30:54'),
(72,	'INSERT',	42,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-10-22 19:38:29.000000\", \"monto\": 5000.0, \"concepto\": \"Venta Entrada Visitante\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-10-22 22:38:29'),
(73,	'INSERT',	43,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-09 20:09:44.000000\", \"monto\": 1500.00, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-09 23:09:44'),
(74,	'INSERT',	44,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-09 23:31:51.000000\", \"monto\": 5000.00, \"concepto\": \"Pago cuota 2025-09 socio_id 1 (pago_id 5)\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-09 23:31:51'),
(75,	'INSERT',	45,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-09 23:38:03.000000\", \"monto\": 4000.00, \"concepto\": \"Pago cuota 2025-10 socio_id 5 (pago_id 6)\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-09 23:38:03'),
(76,	'INSERT',	46,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-10 02:19:57.000000\", \"monto\": 4000.00, \"concepto\": \"Pago cuota 2025-02 socio_id 1 (pago_id 7)\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-10 02:19:57'),
(77,	'INSERT',	47,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-10 02:19:57.000000\", \"monto\": 4000.00, \"concepto\": \"Pago cuota 2025-06 socio_id 1 (pago_id 8)\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-10 02:19:57'),
(78,	'INSERT',	48,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-10 02:19:57.000000\", \"monto\": 500.00, \"concepto\": \"Pago cuota 2025-10 socio_id 1 (pago_id 9)\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-10 02:19:57'),
(79,	'INSERT',	49,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-09 23:21:01.000000\", \"monto\": 1000.00, \"concepto\": \"Pago cuota 2025-02 - Socio ID 6\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-10 02:21:01'),
(80,	'INSERT',	50,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-09 23:31:32.000000\", \"monto\": 5000.00, \"concepto\": \"Venta Entrada Visitante\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-10 02:31:32'),
(81,	'INSERT',	51,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-09 23:31:35.000000\", \"monto\": 5000.00, \"concepto\": \"Venta Entrada Visitante\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-10 02:31:35'),
(82,	'INSERT',	52,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-09 23:31:36.000000\", \"monto\": 5000.00, \"concepto\": \"Venta Entrada Visitante\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-10 02:31:36'),
(83,	'INSERT',	53,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-09 23:31:52.000000\", \"monto\": 10000.00, \"concepto\": \"Venta Entrada Visitante\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-10 02:31:52'),
(84,	'INSERT',	54,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-09 23:32:49.000000\", \"monto\": 1500.00, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-10 02:32:49'),
(85,	'INSERT',	55,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-09 23:33:14.000000\", \"monto\": 5000.00, \"concepto\": \"Pago cuota 2025-03 - Socio ID 2\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-10 02:33:14'),
(86,	'INSERT',	56,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-10 07:10:30.000000\", \"monto\": 1500.00, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": 16, \"fecha_validacion\": null}',	NULL,	'2025-11-10 10:10:30'),
(87,	'INSERT',	57,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-10 11:45:37.000000\", \"monto\": 5000.00, \"concepto\": \"Pago cuota 2025-11 - Socio ID 1\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": 33, \"fecha_validacion\": null}',	NULL,	'2025-11-10 14:45:37'),
(88,	'INSERT',	58,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-11-10 11:46:50.000000\", \"monto\": 10000.00, \"concepto\": \"pago de luz\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-10 14:46:50'),
(89,	'INSERT',	59,	'{\"tipo\": \"EGRESO\", \"fecha\": \"2025-11-10 11:47:35.000000\", \"monto\": 50000.00, \"concepto\": \"pago de agua\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": 33, \"fecha_validacion\": null}',	NULL,	'2025-11-10 14:47:35'),
(90,	'INSERT',	60,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-10 19:49:45.000000\", \"monto\": 1500.00, \"concepto\": \"Venta Entrada Local\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-10 22:49:45'),
(91,	'INSERT',	61,	'{\"tipo\": \"INGRESO\", \"fecha\": \"2025-11-10 19:50:46.000000\", \"monto\": 5000.00, \"concepto\": \"Venta Entrada Visitante\", \"medio_pago\": \"EFECTIVO\", \"nro_tramite\": null, \"validador_id\": null, \"responsable_id\": null, \"fecha_validacion\": null}',	NULL,	'2025-11-10 22:50:46');

DROP TABLE IF EXISTS `categoria`;
CREATE TABLE `categoria` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) NOT NULL,
  `edad_min` tinyint DEFAULT NULL,
  `edad_max` tinyint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `categoria` (`id`, `nombre`, `edad_min`, `edad_max`, `created_at`, `updated_at`) VALUES
(1,	'Sub-8',	6,	8,	'2025-11-10 20:22:06',	'2025-11-10 20:22:06'),
(2,	'Sub-10',	9,	10,	'2025-11-10 20:22:06',	'2025-11-10 20:22:06'),
(3,	'Sub-12',	11,	12,	'2025-11-10 20:22:06',	'2025-11-10 20:22:06'),
(4,	'Sub-14',	13,	14,	'2025-11-10 20:22:06',	'2025-11-10 20:22:06'),
(5,	'Sub-16',	15,	16,	'2025-11-10 20:22:06',	'2025-11-10 20:22:06'),
(6,	'Mayores',	17,	NULL,	'2025-11-10 20:22:06',	'2025-11-10 20:22:06');

DROP TABLE IF EXISTS `config_financiera`;
CREATE TABLE `config_financiera` (
  `id` tinyint NOT NULL,
  `mora_diaria` decimal(8,2) NOT NULL DEFAULT '0.00',
  `dia_vencimiento` tinyint NOT NULL DEFAULT '10',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `config_financiera_chk_1` CHECK ((`id` = 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `config_financiera` (`id`, `mora_diaria`, `dia_vencimiento`, `updated_at`) VALUES
(1,	0.00,	10,	'2025-09-26 13:29:59');

DROP TABLE IF EXISTS `coordinador_deporte`;
CREATE TABLE `coordinador_deporte` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `coordinador_id` bigint unsigned NOT NULL COMMENT 'ID de la persona que es coordinador',
  `deporte_id` bigint unsigned NOT NULL COMMENT 'ID del deporte asignado',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_coord_deporte` (`coordinador_id`,`deporte_id`),
  KEY `fk_cd_coord` (`coordinador_id`),
  KEY `fk_cd_deporte` (`deporte_id`),
  CONSTRAINT `fk_cd_coord` FOREIGN KEY (`coordinador_id`) REFERENCES `persona` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cd_deporte` FOREIGN KEY (`deporte_id`) REFERENCES `deporte` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `coordinador_deporte` (`id`, `coordinador_id`, `deporte_id`, `activo`, `created_at`, `updated_at`) VALUES
(1,	35,	10,	1,	'2025-11-10 21:53:02',	'2025-11-10 21:53:02'),
(3,	48,	11,	1,	'2025-11-10 21:57:56',	'2025-11-10 21:57:56'),
(4,	49,	12,	1,	'2025-11-10 21:57:56',	'2025-11-10 21:57:56'),
(5,	50,	13,	1,	'2025-11-10 21:57:56',	'2025-11-10 21:57:56'),
(6,	51,	14,	1,	'2025-11-10 21:57:56',	'2025-11-10 21:57:56');

DROP TABLE IF EXISTS `cuota`;
CREATE TABLE `cuota` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `socio_id` bigint unsigned NOT NULL,
  `periodo` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `total_importe` decimal(12,2) NOT NULL DEFAULT '0.00',
  `importe_pagado` decimal(12,2) NOT NULL DEFAULT '0.00',
  `saldo` decimal(12,2) GENERATED ALWAYS AS (round(greatest((`total_importe` - `importe_pagado`),0),2)) STORED,
  `importe` decimal(12,2) NOT NULL,
  `vencimiento` date NOT NULL,
  `estado` enum('EMITIDA','PENDIENTE','PAGADA','VENCIDA') NOT NULL DEFAULT 'EMITIDA',
  `comprobante_pdf` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_socio_periodo` (`socio_id`,`periodo`),
  CONSTRAINT `fk_cuota_socio` FOREIGN KEY (`socio_id`) REFERENCES `socio` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `cuota` (`id`, `socio_id`, `periodo`, `total_importe`, `importe_pagado`, `importe`, `vencimiento`, `estado`, `comprobante_pdf`, `created_at`, `updated_at`) VALUES
(1,	1,	'2025-09',	5000.00,	5000.00,	5000.00,	'2025-10-10',	'PAGADA',	NULL,	'2025-09-26 13:12:23',	'2025-11-09 23:31:51'),
(3,	1,	'2025-10',	5000.00,	5000.00,	5000.00,	'2025-11-10',	'PAGADA',	NULL,	'2025-09-26 13:12:23',	'2025-11-10 02:19:57'),
(4,	3,	'2025-10',	5000.00,	6000.00,	5000.00,	'2025-11-10',	'PENDIENTE',	NULL,	'2025-10-22 02:57:30',	'2025-10-22 02:58:42'),
(5,	1,	'2025-06',	5000.00,	5000.00,	5000.00,	'2025-07-10',	'PAGADA',	NULL,	'2025-10-22 19:11:31',	'2025-11-10 02:19:57'),
(6,	5,	'2025-10',	5000.00,	5000.00,	5000.00,	'2025-11-10',	'PAGADA',	NULL,	'2025-10-22 21:37:21',	'2025-11-09 23:38:03'),
(7,	1,	'2025-02',	5000.00,	5000.00,	5000.00,	'2025-03-10',	'PAGADA',	NULL,	'2025-10-22 22:28:53',	'2025-11-10 02:19:57'),
(8,	6,	'2025-02',	5000.00,	1000.00,	5000.00,	'2025-03-10',	'PENDIENTE',	NULL,	'2025-11-10 02:21:01',	'2025-11-10 02:21:01'),
(9,	2,	'2025-03',	5000.00,	5000.00,	5000.00,	'2025-04-10',	'PENDIENTE',	NULL,	'2025-11-10 02:33:14',	'2025-11-10 02:33:14'),
(10,	1,	'2025-11',	5000.00,	5000.00,	5000.00,	'2025-12-10',	'PENDIENTE',	NULL,	'2025-11-10 14:45:37',	'2025-11-10 14:45:37');

DROP TABLE IF EXISTS `cuota_alumno`;
CREATE TABLE `cuota_alumno` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `persona_id` bigint unsigned DEFAULT NULL,
  `alumno_id` bigint unsigned NOT NULL,
  `periodo` varchar(200) NOT NULL,
  `total_importe` decimal(12,2) NOT NULL DEFAULT '0.00',
  `importe_pagado` decimal(12,2) NOT NULL DEFAULT '0.00',
  `saldo` decimal(12,2) GENERATED ALWAYS AS (round(greatest((`total_importe` - `importe_pagado`),0),2)) STORED,
  `importe` decimal(12,2) NOT NULL,
  `vencimiento` date NOT NULL,
  `estado` enum('EMITIDA','PENDIENTE','PAGADA','VENCIDA') NOT NULL DEFAULT 'EMITIDA',
  `comprobante_pdf` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cuota_alumno` (`alumno_id`),
  CONSTRAINT `fk_cuota_alumno` FOREIGN KEY (`alumno_id`) REFERENCES `alumno` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `deporte`;
CREATE TABLE `deporte` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `deporte` (`id`, `nombre`, `created_at`, `updated_at`) VALUES
(1,	'F√É¬∫tbol',	'2025-11-10 20:22:06',	'2025-11-10 20:22:06'),
(2,	'Basquet',	'2025-11-10 20:22:06',	'2025-11-10 20:22:06'),
(3,	'Voley',	'2025-11-10 20:22:06',	'2025-11-10 20:22:06'),
(4,	'Nataci√É¬≥n',	'2025-11-10 20:22:06',	'2025-11-10 20:22:06'),
(10,	'Futbol',	'2025-11-10 21:03:18',	'2025-11-10 21:03:18'),
(11,	'Boxeo',	'2025-11-10 21:03:18',	'2025-11-10 21:03:18'),
(12,	'Futbol Femenino',	'2025-11-10 21:03:18',	'2025-11-10 21:03:18'),
(13,	'Handball',	'2025-11-10 21:03:18',	'2025-11-10 21:03:18'),
(14,	'Hockey',	'2025-11-10 21:53:02',	'2025-11-10 21:53:02');

DROP TABLE IF EXISTS `jugador`;
CREATE TABLE `jugador` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `persona_id` bigint unsigned NOT NULL,
  `puesto` varchar(40) DEFAULT NULL,
  `dorsal` int DEFAULT NULL,
  `contrato_pdf` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dorsal` (`dorsal`),
  KEY `fk_jugador_persona` (`persona_id`),
  CONSTRAINT `fk_jugador_persona` FOREIGN KEY (`persona_id`) REFERENCES `persona` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `jugador` (`id`, `persona_id`, `puesto`, `dorsal`, `contrato_pdf`, `created_at`, `updated_at`) VALUES
(1,	2,	'Lateral',	10,	'/files/jugadores/1/contrato.pdf',	'2025-09-26 13:12:23',	'2025-09-26 13:12:23'),
(2,	29,	NULL,	NULL,	NULL,	'2025-10-22 18:40:24',	'2025-10-22 18:40:24'),
(3,	30,	NULL,	NULL,	NULL,	'2025-10-22 20:42:05',	'2025-10-22 20:42:05'),
(4,	31,	NULL,	NULL,	NULL,	'2025-10-22 21:41:39',	'2025-10-22 21:41:39'),
(5,	32,	NULL,	NULL,	NULL,	'2025-10-22 22:32:46',	'2025-10-22 22:32:46');

DROP TABLE IF EXISTS `pago_cuota`;
CREATE TABLE `pago_cuota` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cuota_id` bigint unsigned NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monto` decimal(12,2) NOT NULL,
  `medio_pago` enum('EFECTIVO','MERCADO_PAGO','TRANSFERENCIA','DEBITO','CREDITO','OTRO') NOT NULL,
  `nro_tramite` varchar(80) DEFAULT NULL,
  `comprobante_pdf` varchar(255) DEFAULT NULL,
  `observacion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pc_cuota` (`cuota_id`),
  CONSTRAINT `fk_pc_cuota` FOREIGN KEY (`cuota_id`) REFERENCES `cuota` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `pago_cuota` (`id`, `cuota_id`, `fecha`, `monto`, `medio_pago`, `nro_tramite`, `comprobante_pdf`, `observacion`, `created_at`, `updated_at`) VALUES
(4,	3,	'2025-09-26 15:09:37',	1500.00,	'MERCADO_PAGO',	'MP-0001',	NULL,	'pago parcial',	'2025-09-26 15:09:37',	'2025-09-26 15:09:37'),
(5,	1,	'2025-11-09 23:31:51',	5000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	'2025-11-09 23:31:51',	'2025-11-09 23:31:51'),
(6,	6,	'2025-11-09 23:38:03',	4000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	'2025-11-09 23:38:03',	'2025-11-09 23:38:03'),
(7,	7,	'2025-11-10 02:19:57',	4000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	'2025-11-10 02:19:57',	'2025-11-10 02:19:57'),
(8,	5,	'2025-11-10 02:19:57',	4000.00,	'EFECTIVO',	NULL,	NULL,	NULL,	'2025-11-10 02:19:57',	'2025-11-10 02:19:57'),
(9,	3,	'2025-11-10 02:19:57',	500.00,	'EFECTIVO',	NULL,	NULL,	NULL,	'2025-11-10 02:19:57',	'2025-11-10 02:19:57');

DROP TABLE IF EXISTS `pago_cuota_alumno`;
CREATE TABLE `pago_cuota_alumno` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cuota_id` bigint unsigned NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monto` decimal(12,2) NOT NULL,
  `medio_pago` enum('EFECTIVO','MERCADO_PAGO','TRANSFERENCIA','DEBITO','CREDITO','OTRO') NOT NULL,
  `nro_tramite` varchar(80) DEFAULT NULL,
  `comprobante_pdf` varchar(255) DEFAULT NULL,
  `observacion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pca_cuota` (`cuota_id`),
  CONSTRAINT `fk_pca_cuota` FOREIGN KEY (`cuota_id`) REFERENCES `cuota_alumno` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `persona`;
CREATE TABLE `persona` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) NOT NULL,
  `apellido` varchar(80) NOT NULL,
  `genero` enum('MASCULINO','FEMENINO','NO ESPECIFICADO') DEFAULT NULL,
  `dni` varchar(12) NOT NULL,
  `fecha_nac` date DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `telefono` varchar(40) DEFAULT NULL,
  `domicilio` varchar(200) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `rol` enum('SOCIO','ALUMNO','JUGADOR','PERSONAL','PERSONAL_CAJA','REVISOR_CUENTA','COORDINADOR','DIRECTIVO') NOT NULL DEFAULT 'SOCIO',
  `estado` enum('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  `qr_ver` int unsigned NOT NULL DEFAULT '1',
  `qr_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dni` (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `persona` (`id`, `nombre`, `apellido`, `genero`, `dni`, `fecha_nac`, `email`, `telefono`, `domicilio`, `foto`, `rol`, `estado`, `qr_ver`, `qr_url`, `created_at`, `updated_at`) VALUES
(1,	'Admin',	'Root',	'NO ESPECIFICADO',	'00000000',	NULL,	NULL,	NULL,	NULL,	NULL,	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-09-21 05:29:50',	'2025-10-21 03:14:06'),
(2,	'Juan',	'P√É¬©rez',	'NO ESPECIFICADO',	'40000001',	NULL,	NULL,	NULL,	NULL,	NULL,	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-09-21 05:30:20',	'2025-10-21 03:14:06'),
(6,	'Juan',	'P√É¬©rez',	'NO ESPECIFICADO',	'40000002',	NULL,	NULL,	NULL,	NULL,	NULL,	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-09-21 06:00:32',	'2025-10-21 03:14:06'),
(8,	'Juan',	'Zacar√≠as',	'NO ESPECIFICADO',	'34795699',	'1989-09-30',	'juanza_designer@hotmail.com',	'4125125125125',	'asdasdd111',	'/files/personas/8/foto_600.jpg',	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-09-27 13:56:15',	'2025-10-21 03:14:06'),
(11,	'Juan',	'Zacar√≠as',	'NO ESPECIFICADO',	'43346343',	NULL,	NULL,	NULL,	NULL,	'/files/personas/11/foto_600.jpg',	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-09-27 15:23:10',	'2025-10-21 03:14:06'),
(12,	'asdasd',	'pepe',	'NO ESPECIFICADO',	'5009639933',	'9999-02-10',	NULL,	NULL,	NULL,	'/files/personas/12/foto_600.jpg',	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-09-28 21:53:26',	'2025-10-21 03:14:06'),
(13,	'Santiago',	'Osuna',	'NO ESPECIFICADO',	'70123456',	'2021-06-15',	'osuna@mail.com',	'3624123456',	'av. italia 123',	'/files/personas/13/foto_600.jpg',	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-09-30 02:33:27',	'2025-10-21 03:14:06'),
(14,	'Fuentes',	'Miguel',	'NO ESPECIFICADO',	'1345678',	'2025-10-02',	'migue_f@mail.com',	'3624123456',	'av falsa 123',	'/files/personas/14/foto_600.jpg',	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-09-30 14:10:55',	'2025-10-21 03:14:06'),
(15,	'Perez',	'Pepe',	'NO ESPECIFICADO',	'40321654',	'2000-06-15',	'triple_p@gmail.com',	'3624123466',	'av falsa 465',	'/files/personas/15/foto_600.jpg',	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-10-02 12:21:22',	'2025-10-21 03:14:06'),
(16,	'Martin',	'Kordi',	'MASCULINO',	'40250369',	'1998-05-25',	'mk4oficial@gmail.com',	'3624112233',	'av falsa 456',	'/files/personas/16/foto_600.jpg',	'JUGADOR',	'ACTIVO',	2,	'http://localhost:3000/qr/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOjE2LCJpYXQiOjE3NjEwNTAwMTYsImV4cCI6MTc3NjYwMjAxNn0.RWPXClEPFdNGBSY63dgQkUZSBX7yRHMin7Uga5HPVcA.png',	'2025-10-09 01:54:09',	'2025-10-21 12:33:36'),
(17,	'Cristian',	'Benetti',	'NO ESPECIFICADO',	'45123456',	'1999-09-06',	'benetti1@mail.com',	'3624778899',	'goya 456',	'/files/personas/17/foto_600.jpg',	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-10-09 01:59:00',	'2025-10-21 03:14:06'),
(19,	'asd',	'asd',	'NO ESPECIFICADO',	'32456789',	'2025-10-05',	'asd@mail.com',	'345213314',	'ssa false',	'/files/personas/19/foto_600.jpg',	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-10-09 12:45:31',	'2025-10-21 03:14:06'),
(20,	'Cristiano',	'Ronaldo',	'NO ESPECIFICADO',	'77777777',	'1977-07-07',	'cr7_elbicho@mail.com',	'3624777777',	'av falsa 777',	NULL,	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-10-20 20:56:02',	'2025-10-21 12:36:02'),
(21,	'Ezequiel',	'Molina',	NULL,	'12345678',	'1990-01-02',	'updated@example.com',	'987',	'Calle Falsa',	NULL,	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-10-21 04:59:43',	'2025-10-21 05:25:30'),
(22,	'Fernanda',	'Gomez',	'FEMENINO',	'99900001',	'1991-11-05',	'laura@example.com',	'999999',	'Calle 123',	'/files/personas/22/foto_600.jpg',	'SOCIO',	'ACTIVO',	3,	'http://localhost:3000/qr/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOjIyLCJpYXQiOjE3NjEwNDk5NzUsImV4cCI6MTc3NjYwMTk3NX0.QeGVm1HGHpI_Z7mCCD6UYavBin8-F7MdRycrfMXnFzk.png',	'2025-10-21 11:48:55',	'2025-10-21 12:32:55'),
(23,	'Nicolas',	'Andrada',	'MASCULINO',	'37123456',	'1994-04-07',	'nico@mail.com',	'3624445566',	'La Plata 456',	NULL,	'SOCIO',	'ACTIVO',	3,	'http://localhost:3000/qr/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOjIzLCJpYXQiOjE3NjEwNDg1MjIsImV4cCI6MTc3NjYwMDUyMn0.Ha1EZIEO8eFGRAZQV2RtZbkycUGAybIMzXbbVO1KlTw.png',	'2025-10-21 11:59:56',	'2025-10-21 12:08:42'),
(24,	'Santiago',	'Osuna',	'MASCULINO',	'44567777',	'2002-11-06',	'osuna@gmail.com',	'3624778899',	'avenida falsa 123',	NULL,	'SOCIO',	'ACTIVO',	3,	'http://localhost:3000/qr/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOjI0LCJpYXQiOjE3NjEwNzEwMjAsImV4cCI6MTc3NjYyMzAyMH0.Oqh5xT-r8hPOXBYm3drX_VZC8bgyBU3_nyLNtRzbJ7Q.png',	'2025-10-21 18:21:49',	'2025-10-21 18:23:40'),
(25,	'Santiago',	'Rodriguez',	'MASCULINO',	'44123456',	'2000-11-11',	'rodrisanti@gmail.com',	'3624112233',	'avenida falsa 222',	NULL,	'SOCIO',	'ACTIVO',	2,	'http://localhost:3000/qr/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOjI1LCJpYXQiOjE3NjEwNzE2MTIsImV4cCI6MTc3NjYyMzYxMn0.QyVB7QdD1_Ni-gNuXWVwf-lrlyE0rVkO_fdW_TB8FKg.png',	'2025-10-21 18:33:32',	'2025-10-21 18:33:32'),
(26,	'Juan',	'Zacarias',	'MASCULINO',	'23987654',	'1999-10-10',	'juanza@gmail.com',	'3614717171',	'avenida real 123',	NULL,	'SOCIO',	'ACTIVO',	2,	'http://localhost:3000/qr/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOjI2LCJpYXQiOjE3NjEwNzIyMjgsImV4cCI6MTc3NjYyNDIyOH0.DV6hjeYX4TD61qYAJ2RwLJOuS3QnEAWKsblzrKyikyc.png',	'2025-10-21 18:43:47',	'2025-10-21 18:43:48'),
(27,	'Juan Martin',	'Kordi',	'MASCULINO',	'12345679',	'2000-01-01',	'juanmar@gmail.com',	'3624111111',	'avenida real 111',	NULL,	'JUGADOR',	'ACTIVO',	2,	'http://localhost:3000/qr/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOjI3LCJpYXQiOjE3NjEwNzIzMzMsImV4cCI6MTc3NjYyNDMzM30.lBUQwf0114K9RUEJ06a5nVE4yrgqOP2WattLD8Cb35M.png',	'2025-10-21 18:45:33',	'2025-10-21 18:45:33'),
(28,	'gonzalo',	'gomez',	'MASCULINO',	'44444444',	'2001-02-20',	'gonza@gmail.com',	'3624899889',	'avenida siempre viva 123',	NULL,	'SOCIO',	'ACTIVO',	2,	'http://localhost:3000/qr/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOjI4LCJpYXQiOjE3NjEwNzMwMDgsImV4cCI6MTc3NjYyNTAwOH0.GMwZfzxQnb62OOeUaZR-_F3o8v_6f2tI5BF9tGvHyw4.png',	'2025-10-21 18:56:48',	'2025-10-21 18:56:48'),
(29,	'Roberto',	'Zacaria',	'MASCULINO',	'12345987',	'1988-02-01',	'rober@gmai.com',	'3624716622',	'Avenida alver 123',	NULL,	'JUGADOR',	'ACTIVO',	2,	'http://localhost:3000/qr/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOjI5LCJpYXQiOjE3NjExNTg0MjQsImV4cCI6MTc3NjcxMDQyNH0.TSa9bdxRX_-cDvk5SBxnafEtpBLnfn1eZllYf98LuY8.png',	'2025-10-22 18:40:24',	'2025-10-22 18:40:24'),
(30,	'Lautaro',	'Martinez',	'MASCULINO',	'24294943',	'2000-10-10',	'toro@gmail.com',	'3261821910',	'avenida falsa 1213',	NULL,	'JUGADOR',	'ACTIVO',	3,	'http://localhost:3000/qr/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOjMwLCJpYXQiOjE3NjI3NDEyMjEsImV4cCI6MTc3ODI5MzIyMX0.ULu5O1VyfUYjtweRCDFkQLK60beaw7xl-JLXsn4yQLk.png',	'2025-10-22 20:42:05',	'2025-11-10 02:20:21'),
(31,	'Lionel Andres',	'Messi',	'MASCULINO',	'12345609',	'1979-11-20',	'leo@gmail.com',	'3624612234',	'Avenida Miami 123',	NULL,	'SOCIO',	'ACTIVO',	4,	'http://localhost:3000/qr/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOjMxLCJpYXQiOjE3NjI4MDk2NDAsImV4cCI6MTc3ODM2MTY0MH0.BAJXei42fEjf4N8CV6DM1SaSaxV6Pe2vhcgaAFjoUgg.png',	'2025-10-22 21:41:39',	'2025-11-10 21:20:40'),
(32,	'Lucas',	'Pablovich',	'MASCULINO',	'45678532',	'1999-10-10',	'luc@gmail.com',	'3624112233',	'avenida falsa',	NULL,	'SOCIO',	'ACTIVO',	2,	'http://localhost:3000/qr/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOjMyLCJpYXQiOjE3NjExNzIzNjYsImV4cCI6MTc3NjcyNDM2Nn0.5tO6WGp5SU2IJlG8xgcZgTKdymVM4ngZ8MMf8C7TEos.png',	'2025-10-22 22:32:46',	'2025-10-22 22:42:27'),
(33,	'Cajero',	'Test',	'NO ESPECIFICADO',	'99999999',	NULL,	NULL,	NULL,	NULL,	NULL,	'PERSONAL',	'ACTIVO',	2,	'http://localhost:3000/qr/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOjMzLCJpYXQiOjE3NjI4MDk4NDksImV4cCI6MTc3ODM2MTg0OX0.os1qR9ghgSUMUWKL0ykrb2YPqjRE-4YT6GWPXQFDfWI.png',	'2025-11-10 10:22:27',	'2025-11-10 21:24:09'),
(35,	'Carlos',	'Rodr√É¬≠guez',	'MASCULINO',	'35789456',	'1990-05-15',	'carlos.rodriguez@clublujan.com',	'2323-456789',	'Av. San Martin 456, Luj√É¬°n',	NULL,	'SOCIO',	'ACTIVO',	2,	'http://localhost:3000/qr/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOjM1LCJpYXQiOjE3NjI4MDk4MTgsImV4cCI6MTc3ODM2MTgxOH0.MNCzfisq0dtEgKZas-OV1PB8HNG-ZC5BJ3p--1TS8ww.png',	'2025-11-10 20:22:06',	'2025-11-10 21:23:38'),
(42,	'Martina',	'L√É¬≥pez',	'FEMENINO',	'45234567',	'2013-07-22',	'martina.lopez@gmail.com',	'2323-222222',	'Calle 2 234, Luj√É¬°n',	NULL,	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-11-10 20:23:43',	'2025-11-10 20:23:43'),
(43,	'Tom√É¬°s',	'Fern√É¬°ndez',	'MASCULINO',	'45345678',	'2015-01-15',	'tomas.fernandez@gmail.com',	'2323-333333',	'Calle 3 345, Luj√É¬°n',	NULL,	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-11-10 20:23:43',	'2025-11-10 20:23:43'),
(44,	'Sof√É¬≠a',	'Mart√É¬≠nez',	'FEMENINO',	'45456789',	'2014-09-05',	'sofia.martinez@gmail.com',	'2323-444444',	'Calle 4 456, Luj√É¬°n',	NULL,	'SOCIO',	'ACTIVO',	1,	NULL,	'2025-11-10 20:23:43',	'2025-11-10 20:23:43'),
(45,	'Valentina',	'G√É¬≥mez',	'FEMENINO',	'45678901',	'2015-04-18',	'valentina.gomez@gmail.com',	'2323-666666',	'Calle 6 678, Luj√É¬°n',	NULL,	'SOCIO',	'ACTIVO',	3,	'http://localhost:3000/qr/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaWQiOjQ1LCJpYXQiOjE3NjI4MDk2MzMsImV4cCI6MTc3ODM2MTYzM30.9cVDDvROyb_anfThI3QV4-5S1py4ko11ybgOi7L0DW8.png',	'2025-11-10 20:23:43',	'2025-11-10 21:20:33'),
(46,	'Nombre',	'Apellido',	NULL,	'DNI_UNICO',	NULL,	NULL,	NULL,	NULL,	NULL,	'COORDINADOR',	'ACTIVO',	1,	NULL,	'2025-11-10 21:54:20',	'2025-11-10 21:54:20'),
(48,	'Roberto',	'Mart√≠nez',	'MASCULINO',	'50000001',	'1985-08-20',	'roberto.boxeo@clublujan.com',	'2323-111111',	'Calle 25 de Mayo 123, Luj√°n',	NULL,	'COORDINADOR',	'ACTIVO',	1,	NULL,	'2025-11-10 21:57:56',	'2025-11-10 21:57:56'),
(49,	'Mar√≠a',	'Gonz√°lez',	'FEMENINO',	'50000002',	'1992-03-10',	'maria.futbolfem@clublujan.com',	'2323-222222',	'Av. Constituci√≥n 789, Luj√°n',	NULL,	'COORDINADOR',	'ACTIVO',	1,	NULL,	'2025-11-10 21:57:56',	'2025-11-10 21:57:56'),
(50,	'Diego',	'Fern√°ndez',	'MASCULINO',	'50000003',	'1988-11-25',	'diego.handball@clublujan.com',	'2323-333333',	'Calle Mitre 456, Luj√°n',	NULL,	'COORDINADOR',	'ACTIVO',	1,	NULL,	'2025-11-10 21:57:56',	'2025-11-10 21:57:56'),
(51,	'Ana',	'L√≥pez',	'FEMENINO',	'50000004',	'1991-07-18',	'ana.hockey@clublujan.com',	'2323-444444',	'Av. Libertador 321, Luj√°n',	NULL,	'COORDINADOR',	'ACTIVO',	1,	NULL,	'2025-11-10 21:57:56',	'2025-11-10 21:57:56'),
(56,	'Lucas',	'Garc√≠a',	'MASCULINO',	'51000001',	'2012-05-10',	'lucas.garcia@email.com',	'2323-1001',	'Calle 1, Luj√°n',	NULL,	'ALUMNO',	'ACTIVO',	1,	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(57,	'Mateo',	'Rodr√≠guez',	'MASCULINO',	'51000002',	'2011-08-15',	'mateo.rodriguez@email.com',	'2323-1002',	'Calle 2, Luj√°n',	NULL,	'ALUMNO',	'ACTIVO',	1,	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(58,	'Santiago',	'L√≥pez',	'MASCULINO',	'51000003',	'2010-03-20',	'santiago.lopez@email.com',	'2323-1003',	'Calle 3, Luj√°n',	NULL,	'ALUMNO',	'ACTIVO',	1,	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(59,	'Diego',	'Mart√≠nez',	'MASCULINO',	'52000001',	'2013-07-12',	'diego.martinez@email.com',	'2323-2001',	'Calle 4, Luj√°n',	NULL,	'ALUMNO',	'ACTIVO',	1,	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(60,	'Nicol√°s',	'Fern√°ndez',	'MASCULINO',	'52000002',	'2012-11-25',	'nicolas.fernandez@email.com',	'2323-2002',	'Calle 5, Luj√°n',	NULL,	'ALUMNO',	'ACTIVO',	1,	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(61,	'Valentina',	'Gonz√°lez',	'FEMENINO',	'53000001',	'2011-04-18',	'valentina.gonzalez@email.com',	'2323-3001',	'Calle 6, Luj√°n',	NULL,	'ALUMNO',	'ACTIVO',	1,	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(62,	'Sof√≠a',	'P√©rez',	'FEMENINO',	'53000002',	'2010-09-30',	'sofia.perez@email.com',	'2323-3002',	'Calle 7, Luj√°n',	NULL,	'ALUMNO',	'ACTIVO',	1,	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(63,	'Tom√°s',	'S√°nchez',	'MASCULINO',	'54000001',	'2012-06-22',	'tomas.sanchez@email.com',	'2323-4001',	'Calle 8, Luj√°n',	NULL,	'ALUMNO',	'ACTIVO',	1,	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(64,	'Benjam√≠n',	'Torres',	'MASCULINO',	'54000002',	'2011-12-05',	'benjamin.torres@email.com',	'2323-4002',	'Calle 9, Luj√°n',	NULL,	'ALUMNO',	'ACTIVO',	1,	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(65,	'Martina',	'D√≠az',	'FEMENINO',	'55000001',	'2011-02-14',	'martina.diaz@email.com',	'2323-5001',	'Calle 10, Luj√°n',	NULL,	'ALUMNO',	'ACTIVO',	1,	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04'),
(66,	'Emma',	'Ram√≠rez',	'FEMENINO',	'55000002',	'2010-10-08',	'emma.ramirez@email.com',	'2323-5002',	'Calle 11, Luj√°n',	NULL,	'ALUMNO',	'ACTIVO',	1,	NULL,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04');

DROP TABLE IF EXISTS `persona_rol`;
CREATE TABLE `persona_rol` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `persona_id` bigint unsigned NOT NULL,
  `rol` enum('SOCIO','ALUMNO','JUGADOR','PERSONAL','PERSONAL_CAJA','REVISOR_CUENTA','COORDINADOR','DIRECTIVO') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `persona_id` (`persona_id`),
  CONSTRAINT `persona_rol_ibfk_1` FOREIGN KEY (`persona_id`) REFERENCES `persona` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `persona_rol` (`id`, `persona_id`, `rol`) VALUES
(1,	1,	'DIRECTIVO'),
(2,	2,	'ALUMNO'),
(3,	6,	'JUGADOR'),
(4,	8,	'SOCIO'),
(5,	11,	'COORDINADOR'),
(6,	12,	'COORDINADOR'),
(7,	13,	'SOCIO'),
(8,	14,	'SOCIO'),
(9,	15,	'SOCIO'),
(11,	17,	'ALUMNO'),
(12,	19,	'DIRECTIVO'),
(13,	20,	'JUGADOR'),
(16,	1,	'SOCIO'),
(17,	19,	'SOCIO'),
(18,	2,	'SOCIO'),
(19,	6,	'SOCIO'),
(21,	11,	'SOCIO'),
(22,	17,	'SOCIO'),
(23,	12,	'SOCIO'),
(24,	20,	'SOCIO'),
(46,	22,	'SOCIO'),
(47,	22,	'COORDINADOR'),
(48,	22,	'JUGADOR'),
(50,	23,	'SOCIO'),
(51,	23,	'JUGADOR'),
(52,	23,	'REVISOR_CUENTA'),
(54,	16,	'JUGADOR'),
(55,	16,	'SOCIO'),
(56,	16,	'PERSONAL_CAJA'),
(59,	24,	'SOCIO'),
(62,	25,	'SOCIO'),
(65,	26,	'SOCIO'),
(68,	27,	'JUGADOR'),
(71,	28,	'SOCIO'),
(74,	29,	'JUGADOR'),
(77,	30,	'JUGADOR'),
(78,	30,	'SOCIO'),
(81,	31,	'SOCIO'),
(82,	31,	'JUGADOR'),
(85,	32,	'SOCIO'),
(86,	32,	'JUGADOR'),
(87,	33,	'PERSONAL_CAJA'),
(88,	35,	'COORDINADOR'),
(89,	17,	'ALUMNO'),
(90,	42,	'ALUMNO'),
(91,	43,	'ALUMNO'),
(92,	44,	'ALUMNO'),
(93,	45,	'ALUMNO'),
(95,	48,	'COORDINADOR'),
(96,	49,	'COORDINADOR'),
(97,	50,	'COORDINADOR'),
(98,	51,	'COORDINADOR'),
(99,	35,	'COORDINADOR'),
(104,	35,	'COORDINADOR'),
(105,	48,	'COORDINADOR'),
(106,	49,	'COORDINADOR'),
(107,	50,	'COORDINADOR'),
(108,	51,	'COORDINADOR'),
(109,	56,	'ALUMNO'),
(110,	57,	'ALUMNO'),
(111,	58,	'ALUMNO'),
(112,	59,	'ALUMNO'),
(113,	60,	'ALUMNO'),
(114,	61,	'ALUMNO'),
(115,	62,	'ALUMNO'),
(116,	63,	'ALUMNO'),
(117,	64,	'ALUMNO'),
(118,	65,	'ALUMNO'),
(119,	66,	'ALUMNO');

DROP TABLE IF EXISTS `personal_cred`;
CREATE TABLE `personal_cred` (
  `persona_id` bigint unsigned NOT NULL,
  `legajo` varchar(32) DEFAULT NULL,
  `cargo` varchar(80) DEFAULT NULL,
  `area` varchar(80) DEFAULT NULL,
  `valido_desde` date DEFAULT NULL,
  `valido_hasta` date DEFAULT NULL,
  `emergencia_contacto` varchar(80) DEFAULT NULL,
  `emergencia_tel` varchar(40) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`persona_id`),
  UNIQUE KEY `legajo` (`legajo`),
  CONSTRAINT `fk_pcred_persona` FOREIGN KEY (`persona_id`) REFERENCES `persona` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `personal_cred` (`persona_id`, `legajo`, `cargo`, `area`, `valido_desde`, `valido_hasta`, `emergencia_contacto`, `emergencia_tel`, `created_at`, `updated_at`) VALUES
(2,	'0001',	'Web Developer',	'Sistemas',	'2024-01-01',	'2026-12-31',	'Mar√É¬≠a P√É¬©rez',	'11-5555-0000',	'2025-09-26 13:12:23',	'2025-09-26 13:12:23'),
(6,	'0002',	'Web Developer',	'Sistemas',	'2024-01-01',	'2026-12-31',	'Mar√É¬≠a P√É¬©rez',	'11-5555-0000',	'2025-09-26 13:12:23',	'2025-09-26 13:12:23');

DROP TABLE IF EXISTS `physical_metric`;
CREATE TABLE `physical_metric` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `session_id` bigint unsigned NOT NULL,
  `metric_type` enum('SPEED','JUMP_HEIGHT','REACTION_TIME','BALANCE','POSTURE') NOT NULL,
  `value` decimal(8,3) NOT NULL,
  `unit` varchar(20) DEFAULT 'm/s',
  `frame_reference` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pm_session` (`session_id`),
  CONSTRAINT `fk_pm_session` FOREIGN KEY (`session_id`) REFERENCES `physical_session` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `physical_session`;
CREATE TABLE `physical_session` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `alumno_id` bigint unsigned NOT NULL,
  `coordinador_id` bigint unsigned DEFAULT NULL,
  `video_path` varchar(255) DEFAULT NULL,
  `analyzed` tinyint(1) DEFAULT '0',
  `analysis_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ps_alumno` (`alumno_id`),
  KEY `fk_ps_coord` (`coordinador_id`),
  CONSTRAINT `fk_ps_alumno` FOREIGN KEY (`alumno_id`) REFERENCES `alumno` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ps_coord` FOREIGN KEY (`coordinador_id`) REFERENCES `persona` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `plan`;
CREATE TABLE `plan` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) NOT NULL,
  `nivel` int NOT NULL,
  `antig_min_meses` int NOT NULL DEFAULT '0',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `plan_beneficio`;
CREATE TABLE `plan_beneficio` (
  `plan_id` bigint unsigned NOT NULL,
  `beneficio_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`plan_id`,`beneficio_id`),
  KEY `fk_pb_benef` (`beneficio_id`),
  CONSTRAINT `fk_pb_benef` FOREIGN KEY (`beneficio_id`) REFERENCES `beneficio` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pb_plan` FOREIGN KEY (`plan_id`) REFERENCES `plan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `schema_migrations`;
CREATE TABLE `schema_migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `executed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `schema_migrations` (`id`, `name`, `executed_at`) VALUES
(1,	'001_init.sql',	'2025-09-21 05:20:47'),
(2,	'002_alumno_apto_pdf.sql',	'2025-09-24 14:16:37'),
(3,	'003_refactor_resume.sql',	'2025-09-26 13:35:11'),
(4,	'004_personal_caja_vistas.sql',	'2025-11-10 10:07:29'),
(5,	'005_fix_cajero_test.sql',	'2025-11-10 10:25:56');

DROP TABLE IF EXISTS `socio`;
CREATE TABLE `socio` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `persona_id` bigint unsigned NOT NULL,
  `nro_socio` varchar(20) NOT NULL,
  `fecha_alta` date NOT NULL,
  `estado_cuenta` enum('AL_DIA','MOROSO') DEFAULT 'AL_DIA',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nro_socio` (`nro_socio`),
  UNIQUE KEY `uq_socio_persona` (`persona_id`),
  CONSTRAINT `fk_socio_persona` FOREIGN KEY (`persona_id`) REFERENCES `persona` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `socio` (`id`, `persona_id`, `nro_socio`, `fecha_alta`, `estado_cuenta`, `created_at`, `updated_at`) VALUES
(1,	2,	'40000001',	'2025-09-21',	'AL_DIA',	'2025-09-26 13:12:23',	'2025-09-26 13:12:23'),
(2,	24,	'40000002',	'2025-10-21',	'AL_DIA',	'2025-10-21 18:41:17',	'2025-10-21 18:41:17'),
(3,	25,	'40000003',	'2025-10-21',	'AL_DIA',	'2025-10-21 18:41:17',	'2025-10-21 18:41:17'),
(5,	30,	'40000004',	'2025-10-22',	'AL_DIA',	'2025-10-22 20:42:05',	'2025-10-22 20:42:05'),
(6,	31,	'40000005',	'2025-10-22',	'AL_DIA',	'2025-10-22 21:41:39',	'2025-10-22 21:41:39'),
(7,	32,	'40000006',	'2025-10-22',	'AL_DIA',	'2025-10-22 22:32:46',	'2025-10-22 22:32:46');

DROP TABLE IF EXISTS `socio_plan`;
CREATE TABLE `socio_plan` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `socio_id` bigint unsigned NOT NULL,
  `plan_id` bigint unsigned NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_socio_plan_vigente` (`socio_id`,`plan_id`,`fecha_inicio`),
  KEY `fk_sp_plan` (`plan_id`),
  CONSTRAINT `fk_sp_plan` FOREIGN KEY (`plan_id`) REFERENCES `plan` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_sp_socio` FOREIGN KEY (`socio_id`) REFERENCES `socio` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `tarifa_actividad`;
CREATE TABLE `tarifa_actividad` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deporte_id` bigint unsigned NOT NULL,
  `categoria_id` bigint unsigned NOT NULL,
  `importe` decimal(12,2) NOT NULL,
  `vigente_desde` date NOT NULL,
  `vigente_hasta` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tarifa` (`deporte_id`,`categoria_id`,`vigente_desde`),
  KEY `fk_tarifa_cat` (`categoria_id`),
  CONSTRAINT `fk_tarifa_cat` FOREIGN KEY (`categoria_id`) REFERENCES `categoria` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_tarifa_dep` FOREIGN KEY (`deporte_id`) REFERENCES `deporte` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `tarifa_actividad` (`id`, `date_created`, `date_modified`, `deporte_id`, `categoria_id`, `importe`, `vigente_desde`, `vigente_hasta`) VALUES
(1,	'2025-11-02 00:16:20',	'2025-11-02 00:16:20',	1,	2,	4000.00,	'2025-01-01',	NULL),
(2,	'2025-11-02 00:16:20',	'2025-11-02 00:16:20',	1,	3,	4500.00,	'2025-01-01',	NULL),
(3,	'2025-11-02 00:16:20',	'2025-11-02 00:16:20',	2,	1,	3500.00,	'2025-01-01',	NULL),
(4,	'2025-11-02 00:16:20',	'2025-11-02 00:16:20',	3,	3,	3800.00,	'2025-01-01',	NULL);

DROP TABLE IF EXISTS `turno`;
CREATE TABLE `turno` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hora_inicio` time DEFAULT NULL,
  `hora_fin` time DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_turno_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `turno` (`id`, `nombre`, `hora_inicio`, `hora_fin`, `activo`, `created_at`, `updated_at`) VALUES
(1,	'Ma√É¬±ana',	'08:00:00',	'12:00:00',	1,	'2025-11-10 21:02:52',	'2025-11-10 21:02:52'),
(2,	'Tarde',	'14:00:00',	'18:00:00',	1,	'2025-11-10 21:02:52',	'2025-11-10 21:02:52'),
(3,	'Noche',	'18:00:00',	'22:00:00',	1,	'2025-11-10 21:02:52',	'2025-11-10 21:02:52');

DROP TABLE IF EXISTS `usuario`;
CREATE TABLE `usuario` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(60) NOT NULL,
  `password_hash` varchar(120) NOT NULL,
  `rol_sistema` enum('ADMIN','TESORERIA','COORDINADOR','STAFF','DIRECTIVO','REVISOR_CUENTA','PERSONAL_CAJA') NOT NULL,
  `persona_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `fk_usuario_persona` (`persona_id`),
  CONSTRAINT `fk_usuario_persona` FOREIGN KEY (`persona_id`) REFERENCES `persona` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `usuario` (`id`, `username`, `password_hash`, `rol_sistema`, `persona_id`, `created_at`, `updated_at`) VALUES
(3,	'admin',	'$2b$10$Z91w2QEajK3NAY26xJgk3OcQYQiUMVDjDuibwbD33Hg4Uao9bmcXy',	'ADMIN',	NULL,	'2025-09-26 14:59:17',	'2025-09-26 14:59:17'),
(4,	'cajero_test',	'$2b$10$Z91w2QEajK3NAY26xJgk3OcQYQiUMVDjDuibwbD33Hg4Uao9bmcXy',	'PERSONAL_CAJA',	33,	'2025-11-10 10:09:29',	'2025-11-10 10:22:27'),
(5,	'coordinador',	'$2a$10$EmX7S8ho7FBkkwvq9Z5rr.xwhtgFMuct.Zze4Nlo22iLaRXZKe/HK',	'COORDINADOR',	35,	'2025-11-10 20:22:06',	'2025-11-10 20:25:18'),
(7,	'coord_boxeo',	'$2a$10$2FJnr49Qs0t8HzfzS8b.eeLPztv9gkQwsiqd2rgBa.hwBHf2c.M5C',	'COORDINADOR',	48,	'2025-11-10 21:57:56',	'2025-11-10 22:09:30'),
(8,	'coord_futbolfem',	'$2a$10$2FJnr49Qs0t8HzfzS8b.eeLPztv9gkQwsiqd2rgBa.hwBHf2c.M5C',	'COORDINADOR',	49,	'2025-11-10 21:57:56',	'2025-11-10 22:09:30'),
(9,	'coord_handball',	'$2a$10$2FJnr49Qs0t8HzfzS8b.eeLPztv9gkQwsiqd2rgBa.hwBHf2c.M5C',	'COORDINADOR',	50,	'2025-11-10 21:57:56',	'2025-11-10 22:09:30'),
(10,	'coord_hockey',	'$2a$10$2FJnr49Qs0t8HzfzS8b.eeLPztv9gkQwsiqd2rgBa.hwBHf2c.M5C',	'COORDINADOR',	51,	'2025-11-10 21:57:56',	'2025-11-10 22:09:30'),
(15,	'coord_futbol',	'$2a$10$2FJnr49Qs0t8HzfzS8b.eeLPztv9gkQwsiqd2rgBa.hwBHf2c.M5C',	'COORDINADOR',	35,	'2025-11-10 22:16:04',	'2025-11-10 22:16:04');

DROP VIEW IF EXISTS `v_caja_detallada`;
CREATE TABLE `v_caja_detallada` (`id` bigint unsigned, `fecha` datetime, `concepto` varchar(200), `tipo` enum('INGRESO','EGRESO'), `monto` decimal(12,2), `medio_pago` varchar(40), `nro_tramite` varchar(80), `estado` enum('APROBADO','PENDIENTE','RECHAZADO'), `responsable_id` bigint unsigned, `responsable_nombre` varchar(161), `validador_id` bigint unsigned, `validador_nombre` varchar(161), `fecha_validacion` datetime, `created_at` timestamp, `updated_at` timestamp);


DROP VIEW IF EXISTS `v_cuota_alumno_con_mora`;
CREATE TABLE `v_cuota_alumno_con_mora` (`id` bigint unsigned, `persona_id` bigint unsigned, `periodo` varchar(200), `total_importe` decimal(12,2), `importe_pagado` decimal(12,2), `saldo` decimal(12,2), `vencimiento` date, `estado` enum('EMITIDA','PENDIENTE','PAGADA','VENCIDA'), `comprobante_pdf` varchar(255), `created_at` timestamp, `updated_at` timestamp, `dias_atraso` int, `mora_diaria` decimal(8,2), `saldo_con_mora` decimal(17,2));


DROP VIEW IF EXISTS `v_cuota_con_mora`;
CREATE TABLE `v_cuota_con_mora` (`id` bigint unsigned, `socio_id` bigint unsigned, `periodo` varchar(200), `total_importe` decimal(12,2), `importe_pagado` decimal(12,2), `saldo` decimal(12,2), `importe` decimal(12,2), `vencimiento` date, `estado` enum('EMITIDA','PENDIENTE','PAGADA','VENCIDA'), `comprobante_pdf` varchar(255), `created_at` timestamp, `updated_at` timestamp, `dias_atraso` int, `mora_diaria` decimal(8,2), `saldo_con_mora` decimal(17,2));


DROP VIEW IF EXISTS `v_cuotas_detallada`;
CREATE TABLE `v_cuotas_detallada` (`cuota_id` bigint unsigned, `socio_id` bigint unsigned, `nro_socio` varchar(20), `persona_id` bigint unsigned, `socio_nombre` varchar(161), `dni` varchar(12), `telefono` varchar(40), `email` varchar(120), `periodo` varchar(200), `total_importe` decimal(12,2), `importe_pagado` decimal(12,2), `saldo` decimal(12,2), `importe` decimal(12,2), `vencimiento` date, `estado_cuota` enum('EMITIDA','PENDIENTE','PAGADA','VENCIDA'), `estado_cuenta` enum('AL_DIA','MOROSO'), `comprobante_pdf` varchar(255), `created_at` timestamp, `updated_at` timestamp);


DROP VIEW IF EXISTS `v_cuotas_proximas_vencer`;
CREATE TABLE `v_cuotas_proximas_vencer` (`cuota_id` bigint unsigned, `nro_socio` varchar(20), `socio_nombre` varchar(161), `telefono` varchar(40), `email` varchar(120), `periodo` varchar(200), `saldo` decimal(12,2), `vencimiento` date, `dias_para_vencer` int, `prioridad` varchar(7));


DROP VIEW IF EXISTS `v_cuotas_vencidas`;
CREATE TABLE `v_cuotas_vencidas` (`cuota_id` bigint unsigned, `nro_socio` varchar(20), `socio_nombre` varchar(161), `telefono` varchar(40), `email` varchar(120), `periodo` varchar(200), `total_importe` decimal(12,2), `importe_pagado` decimal(12,2), `saldo` decimal(12,2), `vencimiento` date, `dias_vencidos` int, `estado` enum('EMITIDA','PENDIENTE','PAGADA','VENCIDA'));


DROP VIEW IF EXISTS `v_estadisticas_cajero`;
CREATE TABLE `v_estadisticas_cajero` (`cajero_id` bigint unsigned, `cajero_nombre` varchar(161), `fecha` date, `tipo` enum('INGRESO','EGRESO'), `cantidad_movimientos` bigint, `total_monto` decimal(34,2));


DROP VIEW IF EXISTS `v_historico_pagos`;
CREATE TABLE `v_historico_pagos` (`pago_id` bigint unsigned, `cuota_id` bigint unsigned, `socio_id` bigint unsigned, `nro_socio` varchar(20), `socio_nombre` varchar(161), `periodo` varchar(200), `fecha_pago` datetime, `monto_pagado` decimal(12,2), `medio_pago` enum('EFECTIVO','MERCADO_PAGO','TRANSFERENCIA','DEBITO','CREDITO','OTRO'), `nro_tramite` varchar(80), `observacion` varchar(255), `importe_total_cuota` decimal(12,2), `saldo_restante` decimal(12,2), `created_at` timestamp);


DROP VIEW IF EXISTS `v_resumen_caja_hoy`;
CREATE TABLE `v_resumen_caja_hoy` (`fecha` date, `tipo` enum('INGRESO','EGRESO'), `estado` enum('APROBADO','PENDIENTE','RECHAZADO'), `cantidad_movimientos` bigint, `total_monto` decimal(34,2), `promedio_monto` decimal(16,6), `monto_minimo` decimal(12,2), `monto_maximo` decimal(12,2));


DROP VIEW IF EXISTS `v_resumen_caja_mes`;
CREATE TABLE `v_resumen_caja_mes` (`periodo` varchar(7), `tipo` enum('INGRESO','EGRESO'), `estado` enum('APROBADO','PENDIENTE','RECHAZADO'), `cantidad_movimientos` bigint, `total_monto` decimal(34,2), `promedio_monto` decimal(16,6));


DROP VIEW IF EXISTS `vw_performance_history`;
CREATE TABLE `vw_performance_history` (`alumno_id` bigint unsigned, `alumno_nombre` varchar(161), `session_id` bigint unsigned, `metric_type` enum('SPEED','JUMP_HEIGHT','REACTION_TIME','BALANCE','POSTURE'), `value` decimal(8,3), `unit` varchar(20), `analysis_date` timestamp, `coordinador_id` bigint unsigned, `coordinador_nombre` varchar(161), `video_path` varchar(255), `analyzed` tinyint(1), `notes` text, `metric_created_at` timestamp, `metric_updated_at` timestamp);


DROP VIEW IF EXISTS `vw_physical_summary`;
CREATE TABLE `vw_physical_summary` (`alumno_id` bigint unsigned, `alumno_nombre` varchar(161), `session_id` bigint unsigned, `analysis_date` timestamp, `video_path` varchar(255), `analyzed` tinyint(1), `velocidad_maxima` decimal(8,3), `salto_maximo` decimal(8,3), `velocidad_promedio` decimal(12,7), `tiempo_reaccion_promedio` decimal(12,7), `equilibrio_promedio` decimal(12,7), `postura_promedio` decimal(12,7), `notes` text, `created_at` timestamp, `updated_at` timestamp);


DROP TABLE IF EXISTS `v_caja_detallada`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_caja_detallada` AS select `c`.`id` AS `id`,`c`.`fecha` AS `fecha`,`c`.`concepto` AS `concepto`,`c`.`tipo` AS `tipo`,`c`.`monto` AS `monto`,`c`.`medio_pago` AS `medio_pago`,`c`.`nro_tramite` AS `nro_tramite`,`c`.`estado` AS `estado`,`c`.`responsable_id` AS `responsable_id`,concat(coalesce(`p_resp`.`apellido`,''),' ',coalesce(`p_resp`.`nombre`,'')) AS `responsable_nombre`,`c`.`validador_id` AS `validador_id`,concat(coalesce(`p_valid`.`apellido`,''),' ',coalesce(`p_valid`.`nombre`,'')) AS `validador_nombre`,`c`.`fecha_validacion` AS `fecha_validacion`,`c`.`created_at` AS `created_at`,`c`.`updated_at` AS `updated_at` from ((`caja` `c` left join `persona` `p_resp` on((`c`.`responsable_id` = `p_resp`.`id`))) left join `persona` `p_valid` on((`c`.`validador_id` = `p_valid`.`id`))) order by `c`.`fecha` desc,`c`.`id` desc;

DROP TABLE IF EXISTS `v_cuota_alumno_con_mora`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_cuota_alumno_con_mora` AS select `c`.`id` AS `id`,`c`.`persona_id` AS `persona_id`,`c`.`periodo` AS `periodo`,`c`.`total_importe` AS `total_importe`,`c`.`importe_pagado` AS `importe_pagado`,`c`.`saldo` AS `saldo`,`c`.`vencimiento` AS `vencimiento`,`c`.`estado` AS `estado`,`c`.`comprobante_pdf` AS `comprobante_pdf`,`c`.`created_at` AS `created_at`,`c`.`updated_at` AS `updated_at`,greatest((to_days(curdate()) - to_days(`c`.`vencimiento`)),0) AS `dias_atraso`,(select `config_financiera`.`mora_diaria` from `config_financiera` where (`config_financiera`.`id` = 1)) AS `mora_diaria`,round((`c`.`saldo` + (greatest((to_days(curdate()) - to_days(`c`.`vencimiento`)),0) * (select `config_financiera`.`mora_diaria` from `config_financiera` where (`config_financiera`.`id` = 1)))),2) AS `saldo_con_mora` from `cuota_alumno` `c`;

DROP TABLE IF EXISTS `v_cuota_con_mora`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_cuota_con_mora` AS select `c`.`id` AS `id`,`c`.`socio_id` AS `socio_id`,`c`.`periodo` AS `periodo`,`c`.`total_importe` AS `total_importe`,`c`.`importe_pagado` AS `importe_pagado`,`c`.`saldo` AS `saldo`,`c`.`importe` AS `importe`,`c`.`vencimiento` AS `vencimiento`,`c`.`estado` AS `estado`,`c`.`comprobante_pdf` AS `comprobante_pdf`,`c`.`created_at` AS `created_at`,`c`.`updated_at` AS `updated_at`,greatest((to_days(curdate()) - to_days(`c`.`vencimiento`)),0) AS `dias_atraso`,(select `config_financiera`.`mora_diaria` from `config_financiera` where (`config_financiera`.`id` = 1)) AS `mora_diaria`,round((`c`.`saldo` + (greatest((to_days(curdate()) - to_days(`c`.`vencimiento`)),0) * (select `config_financiera`.`mora_diaria` from `config_financiera` where (`config_financiera`.`id` = 1)))),2) AS `saldo_con_mora` from `cuota` `c`;

DROP TABLE IF EXISTS `v_cuotas_detallada`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_cuotas_detallada` AS select `c`.`id` AS `cuota_id`,`c`.`socio_id` AS `socio_id`,`s`.`nro_socio` AS `nro_socio`,`p`.`id` AS `persona_id`,concat(`p`.`apellido`,' ',`p`.`nombre`) AS `socio_nombre`,`p`.`dni` AS `dni`,`p`.`telefono` AS `telefono`,`p`.`email` AS `email`,`c`.`periodo` AS `periodo`,`c`.`total_importe` AS `total_importe`,`c`.`importe_pagado` AS `importe_pagado`,`c`.`saldo` AS `saldo`,`c`.`importe` AS `importe`,`c`.`vencimiento` AS `vencimiento`,`c`.`estado` AS `estado_cuota`,`s`.`estado_cuenta` AS `estado_cuenta`,`c`.`comprobante_pdf` AS `comprobante_pdf`,`c`.`created_at` AS `created_at`,`c`.`updated_at` AS `updated_at` from ((`cuota` `c` join `socio` `s` on((`c`.`socio_id` = `s`.`id`))) join `persona` `p` on((`s`.`persona_id` = `p`.`id`))) order by `c`.`vencimiento` desc,`c`.`id` desc;

DROP TABLE IF EXISTS `v_cuotas_proximas_vencer`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_cuotas_proximas_vencer` AS select `c`.`id` AS `cuota_id`,`s`.`nro_socio` AS `nro_socio`,concat(`p`.`apellido`,' ',`p`.`nombre`) AS `socio_nombre`,`p`.`telefono` AS `telefono`,`p`.`email` AS `email`,`c`.`periodo` AS `periodo`,`c`.`saldo` AS `saldo`,`c`.`vencimiento` AS `vencimiento`,(to_days(`c`.`vencimiento`) - to_days(curdate())) AS `dias_para_vencer`,(case when ((to_days(`c`.`vencimiento`) - to_days(curdate())) < 0) then 'VENCIDA' when ((to_days(`c`.`vencimiento`) - to_days(curdate())) <= 3) then 'URGENTE' else 'PR√ìXIMA' end) AS `prioridad` from ((`cuota` `c` join `socio` `s` on((`c`.`socio_id` = `s`.`id`))) join `persona` `p` on((`s`.`persona_id` = `p`.`id`))) where ((`c`.`estado` in ('EMITIDA','PENDIENTE','VENCIDA')) and (`c`.`saldo` > 0) and (`c`.`vencimiento` <= (curdate() + interval 7 day))) order by `c`.`vencimiento`,`c`.`saldo` desc;

DROP TABLE IF EXISTS `v_cuotas_vencidas`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_cuotas_vencidas` AS select `c`.`id` AS `cuota_id`,`s`.`nro_socio` AS `nro_socio`,concat(`p`.`apellido`,' ',`p`.`nombre`) AS `socio_nombre`,`p`.`telefono` AS `telefono`,`p`.`email` AS `email`,`c`.`periodo` AS `periodo`,`c`.`total_importe` AS `total_importe`,`c`.`importe_pagado` AS `importe_pagado`,`c`.`saldo` AS `saldo`,`c`.`vencimiento` AS `vencimiento`,abs((to_days(curdate()) - to_days(`c`.`vencimiento`))) AS `dias_vencidos`,`c`.`estado` AS `estado` from ((`cuota` `c` join `socio` `s` on((`c`.`socio_id` = `s`.`id`))) join `persona` `p` on((`s`.`persona_id` = `p`.`id`))) where ((`c`.`vencimiento` < curdate()) and (`c`.`saldo` > 0) and (`c`.`estado` in ('PENDIENTE','VENCIDA'))) order by `c`.`vencimiento`,`c`.`saldo` desc;

DROP TABLE IF EXISTS `v_estadisticas_cajero`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_estadisticas_cajero` AS select `p`.`id` AS `cajero_id`,concat(`p`.`apellido`,' ',`p`.`nombre`) AS `cajero_nombre`,cast(`c`.`fecha` as date) AS `fecha`,`c`.`tipo` AS `tipo`,count(0) AS `cantidad_movimientos`,sum(`c`.`monto`) AS `total_monto` from (`caja` `c` join `persona` `p` on((`c`.`responsable_id` = `p`.`id`))) group by `p`.`id`,concat(`p`.`apellido`,' ',`p`.`nombre`),cast(`c`.`fecha` as date),`c`.`tipo` order by cast(`c`.`fecha` as date) desc,`p`.`id`;

DROP TABLE IF EXISTS `v_historico_pagos`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_historico_pagos` AS select `pc`.`id` AS `pago_id`,`pc`.`cuota_id` AS `cuota_id`,`c`.`socio_id` AS `socio_id`,`s`.`nro_socio` AS `nro_socio`,concat(`p`.`apellido`,' ',`p`.`nombre`) AS `socio_nombre`,`c`.`periodo` AS `periodo`,`pc`.`fecha` AS `fecha_pago`,`pc`.`monto` AS `monto_pagado`,`pc`.`medio_pago` AS `medio_pago`,`pc`.`nro_tramite` AS `nro_tramite`,`pc`.`observacion` AS `observacion`,`c`.`total_importe` AS `importe_total_cuota`,`c`.`saldo` AS `saldo_restante`,`pc`.`created_at` AS `created_at` from (((`pago_cuota` `pc` join `cuota` `c` on((`pc`.`cuota_id` = `c`.`id`))) join `socio` `s` on((`c`.`socio_id` = `s`.`id`))) join `persona` `p` on((`s`.`persona_id` = `p`.`id`))) order by `pc`.`fecha` desc,`pc`.`id` desc;

DROP TABLE IF EXISTS `v_resumen_caja_hoy`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_resumen_caja_hoy` AS select cast(`caja`.`fecha` as date) AS `fecha`,`caja`.`tipo` AS `tipo`,`caja`.`estado` AS `estado`,count(0) AS `cantidad_movimientos`,sum(`caja`.`monto`) AS `total_monto`,avg(`caja`.`monto`) AS `promedio_monto`,min(`caja`.`monto`) AS `monto_minimo`,max(`caja`.`monto`) AS `monto_maximo` from `caja` where (cast(`caja`.`fecha` as date) = curdate()) group by cast(`caja`.`fecha` as date),`caja`.`tipo`,`caja`.`estado`;

DROP TABLE IF EXISTS `v_resumen_caja_mes`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_resumen_caja_mes` AS select date_format(`caja`.`fecha`,'%Y-%m') AS `periodo`,`caja`.`tipo` AS `tipo`,`caja`.`estado` AS `estado`,count(0) AS `cantidad_movimientos`,sum(`caja`.`monto`) AS `total_monto`,avg(`caja`.`monto`) AS `promedio_monto` from `caja` where ((year(`caja`.`fecha`) = year(curdate())) and (month(`caja`.`fecha`) = month(curdate()))) group by date_format(`caja`.`fecha`,'%Y-%m'),`caja`.`tipo`,`caja`.`estado`;

DROP TABLE IF EXISTS `vw_performance_history`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_performance_history` AS select `a`.`id` AS `alumno_id`,concat(`p`.`nombre`,' ',`p`.`apellido`) AS `alumno_nombre`,`ps`.`id` AS `session_id`,`pm`.`metric_type` AS `metric_type`,`pm`.`value` AS `value`,`pm`.`unit` AS `unit`,`ps`.`analysis_date` AS `analysis_date`,`ps`.`coordinador_id` AS `coordinador_id`,concat(`pc`.`nombre`,' ',`pc`.`apellido`) AS `coordinador_nombre`,`ps`.`video_path` AS `video_path`,`ps`.`analyzed` AS `analyzed`,`ps`.`notes` AS `notes`,`pm`.`created_at` AS `metric_created_at`,`pm`.`updated_at` AS `metric_updated_at` from ((((`physical_metric` `pm` join `physical_session` `ps` on((`pm`.`session_id` = `ps`.`id`))) join `alumno` `a` on((`ps`.`alumno_id` = `a`.`id`))) join `persona` `p` on((`a`.`persona_id` = `p`.`id`))) left join `persona` `pc` on((`ps`.`coordinador_id` = `pc`.`id`))) order by `a`.`id`,`ps`.`analysis_date`,`pm`.`metric_type`;

DROP TABLE IF EXISTS `vw_physical_summary`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vw_physical_summary` AS select `a`.`id` AS `alumno_id`,concat(`p`.`nombre`,' ',`p`.`apellido`) AS `alumno_nombre`,`ps`.`id` AS `session_id`,`ps`.`analysis_date` AS `analysis_date`,`ps`.`video_path` AS `video_path`,`ps`.`analyzed` AS `analyzed`,max((case when (`pm`.`metric_type` = 'SPEED') then `pm`.`value` end)) AS `velocidad_maxima`,max((case when (`pm`.`metric_type` = 'JUMP_HEIGHT') then `pm`.`value` end)) AS `salto_maximo`,avg((case when (`pm`.`metric_type` = 'SPEED') then `pm`.`value` end)) AS `velocidad_promedio`,avg((case when (`pm`.`metric_type` = 'REACTION_TIME') then `pm`.`value` end)) AS `tiempo_reaccion_promedio`,avg((case when (`pm`.`metric_type` = 'BALANCE') then `pm`.`value` end)) AS `equilibrio_promedio`,avg((case when (`pm`.`metric_type` = 'POSTURE') then `pm`.`value` end)) AS `postura_promedio`,`ps`.`notes` AS `notes`,`ps`.`created_at` AS `created_at`,`ps`.`updated_at` AS `updated_at` from (((`physical_session` `ps` join `alumno` `a` on((`a`.`id` = `ps`.`alumno_id`))) join `persona` `p` on((`p`.`id` = `a`.`persona_id`))) left join `physical_metric` `pm` on((`pm`.`session_id` = `ps`.`id`))) group by `a`.`id`,`ps`.`id`,`p`.`nombre`,`p`.`apellido`,`ps`.`analysis_date`,`ps`.`video_path`,`ps`.`analyzed`,`ps`.`notes`,`ps`.`created_at`,`ps`.`updated_at` order by `ps`.`analysis_date` desc;

-- 2025-11-11 00:54:27 UTC
