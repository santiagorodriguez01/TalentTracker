'use client';
import * as React from 'react';
import { Paper, Typography, Box, Avatar, Stack } from '@mui/material';

export type CredentialProps = {
  tipo: 'CARNET' | 'GAFETE';
  club?: string;
  nombre?: string;
  apellido?: string;
  rol?: string;
  dni?: string;
  nroSocio?: string | number;
  vigenciaHasta?: string;
  fotoUrl?: string | null;
  qrUrl?: string | null;
  socioEstado?: 'AL_DIA' | 'MOROSO' | 'INACTIVO' | string | null;
  logoUrl?: string; 
  scale?: number;
};


const C = {
  green:  '#2FA64A',   // Verde Club
  orange: '#FF6A2A',   // Naranja Club
  yellow: '#F6D94E',   // Amarillo Club
  ink:    '#0C0C0C'    // Neutro oscuro (texto)
};

export default function CredentialCard(props: CredentialProps){
  const {
    tipo, club='Deportivo Lujan',
    nombre='', apellido='', rol='', dni, nroSocio,
    vigenciaHasta, fotoUrl, qrUrl, socioEstado,
    logoUrl = '/logo-club.png'   // colocala en /public/logo-club.png
  } = props;
  const scale = (props as any).scale as number | undefined;

  const isGafete = tipo === 'GAFETE';

 
  const cardSx = isGafete
    ? {
        width: 260, height: 400, borderRadius: 3, overflow: 'hidden',
        display: 'grid', gridTemplateRows: '84px 1fr 16px', position: 'relative',
        // Encabezado sólido verde y cuerpo con gradiente sólido naranja→amarillo
        background: `
          linear-gradient(180deg, ${C.green} 0 84px, transparent 84px),
          linear-gradient(135deg, ${C.orange} 0%, ${C.yellow} 100%)`,
      }
    : {
        width: 340, height: 210, borderRadius: 3, overflow: 'hidden',
        display: 'grid', gridTemplateRows: '64px 1fr 24px', position: 'relative',
        // Franja izquierda verde y resto con gradiente sólido naranja→amarillo
        background: `
          linear-gradient(90deg, ${C.green} 0 45%, transparent 45%),
          linear-gradient(135deg, ${C.orange} 0%, ${C.yellow} 100%)`,
      };

  return (
    <Paper elevation={5} data-export-id="cred-card" sx={{ ...cardSx, ...(scale ? { transform: `scale(${scale})`, transformOrigin: 'top center' } : {}) }}>
      {/* Header con logo + titulo */}
      <Box sx={{
        px: 5, py: 1.25, display:'flex',
        alignItems:'center', justifyContent:'space-between'
      }}>
        <Box sx={{ display:'flex', alignItems:'center', gap: 1.25 }}>
          <img
            src={logoUrl}
            alt="Logo"
            width={isGafete ? 60 : 60}
            height={isGafete ? 80 : 80}
            crossOrigin="anonymous"               
            style={{ objectFit:'contain' }}
          />
          <Typography fontWeight={900} sx={{ letterSpacing: .4, color: C.ink }}>
            {club}
          </Typography>
        </Box>

      </Box>

      {/* Cuerpo */}
      {isGafete ? (
        // ======= GAFETE (vertical, info centrada en columna) =======
        <Box sx={{
          px: 10, pb: 2, display:'grid', gridTemplateRows:'auto 1fr auto', gap: 1
        }}>
          <Avatar
            sx={{
              width: 112, height: 140, borderRadius: 2, mx: 'auto',
              border: '2px solid rgba(255,255,255,.8)', boxShadow: 1
            }}
            src={fotoUrl || '/avatar-placeholder.svg'}
            imgProps={{ crossOrigin: 'anonymous', onError: (e:any)=>{ e.currentTarget.src = '/avatar-placeholder.svg'; } }}
          />
          <Stack spacing={0.3} sx={{ textAlign:'center', alignSelf:'center' }}>
            <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.05 }}>
              {apellido}
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.05 }}>
              {nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              {rol}
            </Typography>

          </Stack>

          {/* QR abajo, centrado */}
          {qrUrl && (
            <Box sx={{ display:'grid', placeItems:'center', pb: 1 }}>
              <Box sx={{ width: 88, height: 88, bgcolor:'#fff', borderRadius: 1.5, p: 1, boxShadow: 1 }}>
                <img
                  src={qrUrl}
                  alt="QR"
                  crossOrigin="anonymous"
                  style={{ width:'100%', height:'100%', objectFit:'contain' }}
                />
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        // ======= CARNET (horizontal) =======
        <Box sx={{ display:'grid', gridTemplateColumns:'150px 1fr', gap: 2, px:2 }}>
          <Avatar
            sx={{
              width: 120, height: 120, borderRadius: 2, mt: 1,
              border: '2px solid rgba(255,255,255,.8)', boxShadow: 1
            }}
            src={fotoUrl || '/avatar-placeholder.svg'}
            imgProps={{ crossOrigin: 'anonymous', onError: (e:any)=>{ e.currentTarget.src = '/avatar-placeholder.svg'; } }}
          />
          <Stack spacing={0.4} sx={{ alignSelf:'right' }}>
            <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.05 }}>
              {apellido}
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.05 }}>
              {nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              {rol}
            </Typography>
            {typeof nroSocio !== 'undefined' && (
              <Typography variant="body2">Socio: <b>{nroSocio}</b></Typography>
            )}
            {dni && <Typography variant="body2">DNI: {dni}</Typography>}
            {rol === 'SOCIO' && typeof socioEstado === 'string' && (
              <Typography
                variant="caption"
                sx={{ color: socioEstado === 'AL_DIA' ? 'success.main' : 'error.main' }}
              >
                Estado: {socioEstado}
              </Typography>
            )}
          </Stack>

      
          {qrUrl && (
            <Box sx={{
              position:'absolute', right: 10, bottom: 130,
              width: 65, height: 65, bgcolor:'#fff', borderRadius: 1.5, p: 1, boxShadow: 1
            }}>
              <img
                src={qrUrl}
                alt="QR"
                crossOrigin="anonymous"
                style={{ width:'100%', height:'100%', objectFit:'contain' }}
              />
            </Box>
          )}
        </Box>
      )}


    </Paper>
  );
}

