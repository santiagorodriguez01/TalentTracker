'use client';
import * as React from 'react';
import { useParams } from 'next/navigation';
import { Box, Typography, Stack, Button, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import CredentialCard from '@/components/credencial/CredentialCard';
import { formatRoles, roleLabel } from '@/lib/roles';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const toFiles = (url?: string | null) => {
  if (!url) return null;
  let uStr = url;
  if (/^https?:\/\//i.test(uStr)) {
    try { uStr = new URL(uStr).pathname; } catch {}
  }
  let u = uStr.replace(/\\/g, '/');
  u = u.replace(/^\/??uploads\//, '/files/');
  if (u.startsWith('files/')) u = '/' + u;
  if (!u.startsWith('/files/')) u = '/files' + (u.startsWith('/') ? '' : '/') + u.replace(/^\/?/, '');
  return u;
};
const toAbs   = (raw?: string | null) => {
  if (!raw) return null;
  return `${API_BASE}${raw}`;
};
const toAbsQr = (raw?: string | null) => {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${API_BASE}${raw.startsWith('/') ? '' : '/'}${raw}`;
};

// ---- Export helpers ----
async function exportNodeToPDF(node: HTMLElement, filename: string, mmWidth: number, mmHeight: number, orientation: 'p'|'l') {
  // 1) Rasterizamos a 2x para nitidez
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: null, // sin fondo
    onclone: (doc) => {
      const el = doc.querySelector('[data-export-id="cred-card"]') as HTMLElement | null;
      if (el) {
        // Quitar sombras/filters que agrandan bbox
        el.style.boxShadow = 'none';
        el.style.filter = 'none';
        el.style.transform = 'none';
      }
    }
  });

  const imgData = canvas.toDataURL('image/png');

  // 2) Creamos PDF con el tamaAo exacto del soporte
  const pdf = new jsPDF({ orientation, unit: 'mm', format: [mmWidth, mmHeight] });

  // 3) Insertamos a pAgina llena
  pdf.addImage(imgData, 'PNG', 0, 0, mmWidth, mmHeight, undefined, 'FAST');
  pdf.save(filename);
}

export default function CredencialesPage(){
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const { personaId } = useParams<{ personaId: string }>();
  const id = Number(personaId);

  const { data: persona } = useQuery({
    queryKey: ['persona', id],
    queryFn: async ()=> (await api.get(`/personas/${id}`)).data,
    enabled: !!id
  });

  const { data: socioResp } = useQuery({
    queryKey: ['socioByPersona', id],
    queryFn: async ()=> (await api.get('/socios', { params: { persona_id: id, page:1, size:1 } })).data,
    enabled: !!id
  });
  const socio: any = (socioResp?.data?.[0]) || (socioResp?.rows?.[0]) || null;

  const { data: qr } = useQuery({
    queryKey: ['qr', id],
    queryFn: async ()=> (await api.get(`/personas/${id}/qr`)).data,
    enabled: !!id
  });

  const fotoAbs = toAbs(toFiles(persona?.foto ?? null));
  const roleFromArray = (p: any) => {
  const arr = Array.isArray(p?.roles)
    ? (p.roles as any[]).map((r) => r?.rol || r).filter(Boolean)
    : (p?.rol ? [p.rol] : []);
  const labels = formatRoles(arr as string[]);
  if (labels.length) return labels.join(', ');
  if (p?.rol) return roleLabel(p.rol);
  return socio ? roleLabel('SOCIO') : '';
};
  const qrAbs   = toAbsQr(qr?.url_png ?? null);
  // Bust de cache para reflejar cambios recientes de foto
  const [imgBust] = React.useState(() => Date.now());
  const fotoBusted = React.useMemo(()=>{
    if (!fotoAbs) return null;
    return `${fotoAbs}${fotoAbs.includes('?') ? '&' : '?'}_=${imgBust}`;
  },[fotoAbs, imgBust]);

  const refCarnet = React.useRef<HTMLDivElement>(null);
  const refGafete = React.useRef<HTMLDivElement>(null);

  // Mostrar CARNET solo para socios y GAFETE para coordinadores
  const rolesRaw: string[] = React.useMemo(()=>{
    const arr = Array.isArray(persona?.roles)
      ? (persona!.roles as any[]).map((r)=> r?.rol || r).filter(Boolean)
      : (persona?.rol ? [persona.rol] : []);
    return arr.map((s:any)=> String(s).toUpperCase());
  }, [persona]);
  const isSocio = !!socio || rolesRaw.includes('SOCIO');
  const isCoordinador = rolesRaw.includes('COORDINADOR');
  // Si no hay datos de rol ni socio, mostramos Carnet como fallback
  const showCarnet = isSocio || (!isSocio && !isCoordinador);
  const showGafete = isCoordinador;

  return (
    <Box sx={{ display:'grid', gap:2 }}>
      <Typography variant="h6" fontWeight={700}>Credenciales</Typography>

      {/* Dos columnas en fila, cada una con su boton debajo, centrados */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: { xs: 2, sm: 3, md: 4 }, flexWrap: 'wrap' }}>
        {/* Columna CARNET (izquierda) */}
        {showCarnet && (
        <Stack spacing={2} alignItems="center" sx={{ width: { xs: '100%', sm: 420, md: 480 } }}>
          <Box sx={{ width: '100%', maxWidth: { xs: 300, sm: 392, md: 442 }, height: { xs: 300, sm: 360, md: 400 }, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <Box ref={refCarnet} sx={{ display: 'inline-block' }}>
              <CredentialCard
                tipo="CARNET"
                scale={isXs ? 0.88 : (isMdUp ? 1.3 : 1.15)}
                club={"Deportivo Luj\u00E1n"}
                nombre={persona?.nombre}
                apellido={persona?.apellido}
            rol={roleFromArray(persona)}
                dni={persona?.dni}
                nroSocio={socio?.nro_socio}
                socioEstado={socio?.estado_cuenta}
                fotoUrl={fotoBusted}
                qrUrl={qrAbs}
              />
            </Box>
          </Box>
          <Button
            variant="contained"
            onClick={async ()=> {
              if (refCarnet.current) {
                // 86 x 54 mm (CR80)
                await exportNodeToPDF(refCarnet.current, `carnet_${id}.pdf`, 86, 54, 'l');
              }
            }}
          >
            Descargar Carnet (PDF)
          </Button>
        </Stack>
        )}

        {/* Columna GAFETE (derecha) */}
        {showGafete && (
        <Stack spacing={2} alignItems="center" sx={{ width: { xs: '100%', sm: 360, md: 420 } }}>
          <Box sx={{ width: { xs: 280, sm: 320, md: 340 }, height: { xs: 320, sm: 360, md: 400 }, display: 'grid', placeItems: 'center' }}>
            <Box ref={refGafete}>
              <CredentialCard
                tipo="GAFETE"
                scale={isXs ? 0.95 : 1.0}
                club={"Deportivo Luj\u00E1n"}
                nombre={persona?.nombre}
                apellido={persona?.apellido}
            rol={roleFromArray(persona)}
                dni={persona?.dni}
                nroSocio={socio?.nro_socio}
                socioEstado={socio?.estado_cuenta}
                fotoUrl={fotoBusted}
                qrUrl={qrAbs}
              />
            </Box>
          </Box>
          <Button
            variant="outlined"
            onClick={async ()=> {
              if (refGafete.current) {
                // 64 x 100 mm (vertical)
                await exportNodeToPDF(refGafete.current, `gafete_${id}.pdf`, 64, 100, 'p');
              }
            }}
          >
            Descargar Gafete (PDF)
          </Button>
        </Stack>
        )}
      </Box>

      {/* Enlaces de prueba de la vista publica del QR */}
      <Box sx={{ display:'grid', placeItems:'center', mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Vista publica: <a href={`/qr/${id}`} style={{ color: 'inherit', textDecoration: 'underline' }}>{`/qr/${id}`}</a>
        </Typography>
      </Box>
    </Box>
  );
}





