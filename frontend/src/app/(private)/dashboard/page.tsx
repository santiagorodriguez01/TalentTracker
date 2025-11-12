'use client';
import * as React from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid';
import Groups2Rounded from '@mui/icons-material/Groups2Rounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import PointOfSaleRounded from '@mui/icons-material/PointOfSaleRounded';
import AssessmentRounded from '@mui/icons-material/AssessmentRounded';
import PolicyRounded from '@mui/icons-material/PolicyRounded';
import ConfirmationNumberRounded from '@mui/icons-material/ConfirmationNumberRounded';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { can, type Rol } from '@/lib/rbac';
import Link from 'next/link';

function ShortcutCard({ label, icon, href }: { label: string; icon: React.ReactNode; href: string }){
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Paper
        role="button"
        sx={{
          p: { xs: 1.5, sm: 2, md: 2.5 },
          width: '100%',
          mx: 0,
          textAlign: 'center',
          borderRadius: '12px !important',
          cursor: 'pointer',
          boxShadow: (t) => t.palette.mode === 'light'
            ? t.shadows[2]
            : '0 1px 2px rgba(255,255,255,0.06), 0 6px 18px rgba(255,255,255,0.10)',
          transition: 'transform 160ms ease, box-shadow 180ms ease, background-color 180ms ease',
          '&:hover': {
            boxShadow: (t) => t.palette.mode === 'light'
              ? t.shadows[4]
              : '0 2px 4px rgba(255,255,255,0.08), 0 10px 24px rgba(255,255,255,0.16)',
            transform: 'translateY(-2px)',
            backgroundColor: (t) => t.palette.mode === 'light'
              ? 'rgba(47,166,74,0.08)'
              : 'rgba(255,163,126,0.16)'
          },
          '&:active': { transform: 'scale(0.99)' }
        }}
        elevation={1}
      >
        <IconButton size="large" disableRipple sx={{ pointerEvents: 'none' }}>
          {icon}
        </IconButton>
        <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
          {label}
        </Typography>
      </Paper>
    </Link>
  );
}

export default function Dashboard(){
  const router = useRouter();
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;

  const shortcuts = [
    { key: 'socios', label: 'Socios', icon: <Groups2Rounded/>, href: '/socios', ok: !!rol && can.gestionarSocios(rol) },
    { key: 'personas', label: 'Personas', icon: <PersonRounded/>, href: '/personas', ok: !!rol && can.verPersonas(rol) },
    { key: 'alumnos', label: 'Alumnos', icon: <Groups2Rounded/>, href: '/alumnos', ok: !!rol && can.verAlumnos(rol) },
    { key: 'cuotas', label: 'Cuotas', icon: <ReceiptLongRounded/>, href: '/cuotas', ok: !!rol && can.verCuotas(rol) },
    { key: 'caja', label: 'Caja', icon: <PointOfSaleRounded/>, href: '/caja', ok: !!rol && can.verCaja(rol) },
    { key: 'boleteria', label: 'Boletería', icon: <ConfirmationNumberRounded/>, href: '/boleteria', ok: !!rol && can.verBoleteria(rol) },
    { key: 'reportes', label: 'Reportes', icon: <AssessmentRounded/>, href: '/reportes', ok: !!rol && can.verReportes(rol) },
    { key: 'audit', label: 'Auditoria', icon: <PolicyRounded/>, href: '/audit', ok: !!rol && can.verAudit(rol) },
  ].filter(i => i.ok);
  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Accesos rapidos
      </Typography>

      <Grid
        container
        spacing={{ xs: 1.5, sm: 2, md: 2.5 }}
        justifyContent="center"
        sx={{ px: { xs: 2, sm: 3 }, py: 2, width: '100%', mx: 'auto' }}
      >
        {shortcuts.map(item => (
          <Grid key={item.key} item xs={12} sm={6} md={4}>
            <ShortcutCard label={item.label} icon={item.icon} href={item.href} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
