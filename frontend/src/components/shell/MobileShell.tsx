'use client';
import * as React from 'react';
import {
  AppBar, Toolbar, Typography, Box,
  BottomNavigation, BottomNavigationAction, Paper, IconButton
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import HomeRounded from '@mui/icons-material/HomeRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import Groups2Rounded from '@mui/icons-material/Groups2Rounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import PointOfSaleRounded from '@mui/icons-material/PointOfSaleRounded';
// 🧠  IA: nuevo icono
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { type Rol } from '@/lib/rbac';

const baseTabs = [
  { label: 'Inicio', icon: <HomeRounded />, href: '/dashboard' },
  { label: 'Socios', icon: <Groups2Rounded />, href: '/socios' },
  { label: 'Cuotas', icon: <ReceiptLongRounded />, href: '/cuotas' },
  { label: 'Caja', icon: <PointOfSaleRounded />, href: '/caja' },
];

export default function MobileShell({ children }: { children: React.ReactNode }) {
  const MAX_W = 1200;
  const pathname = usePathname();
  const router = useRouter();
  const [value, setValue] = React.useState(0);

  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;

  const visibleTabs = React.useMemo(() => {
    if (!rol) return baseTabs;

    // PERSONAL_CAJA: solo Cuotas y Caja + Dashboard
    if (rol === 'PERSONAL_CAJA')
      return baseTabs.filter(t => ['/cuotas', '/caja'].includes(t.href))
        .concat(baseTabs.filter(t => t.href === '/dashboard'));

    // COORDINADOR: Inicio + Alumnos + Análisis
    if (rol === 'COORDINADOR') {
      const tabs = [
        { label: 'Inicio', icon: <HomeRounded />, href: '/dashboard' },
        { label: 'Alumnos', icon: <Groups2Rounded />, href: '/alumnos' },
        // 🧠  IA: nueva pestaña solo para coordinadores
        { label: 'Análisis', icon: <AutoAwesomeRounded />, href: '/ia' },
      ];
      return tabs;
    }

    // PROFESOR o ADMIN: mostrar todas las pestañas base + IA
    if ( rol === 'ADMIN') {
      return [...baseTabs, { label: 'Análisis', icon: <AutoAwesomeRounded />, href: '/ia' }];
    }

    // Otros roles: mantener tabs por defecto
    return baseTabs;
  }, [rol]);

  const { mode, setMode } = useColorScheme();
  const logout = () => {
    try {
      useAuthStore.getState().logout?.();
      localStorage.removeItem('token');
    } catch { }
    router.push('/login');
  };

  React.useEffect(() => {
    const idx = visibleTabs.findIndex(t => pathname?.startsWith(t.href));
    setValue(idx >= 0 ? idx : 0);
  }, [pathname, visibleTabs]);

  const showBack = !!pathname && !pathname.startsWith('/dashboard');

  return (
    <Box sx={{
      pb: { xs: 'calc(72px + env(safe-area-inset-bottom))', sm: 9 },
      minHeight: '100dvh',
      display: 'grid', gridTemplateRows: 'auto 1fr'
    }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{
          width: '100%', maxWidth: MAX_W, mx: 'auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showBack && (
              <IconButton size="small" color="primary" onClick={() => router.back()} aria-label="Volver">
                <ArrowBackRounded />
              </IconButton>
            )}
            <img src="/logo-club.png" alt="Logo" width={36} height={36} style={{ objectFit: 'contain' }} />
            <Typography variant="h6" fontWeight={700}>Club Deportivo</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
              aria-label="Cambiar tema"
            >
              {mode === 'light' ? <DarkModeRounded /> : <LightModeRounded />}
            </IconButton>
            {/* Quitamos Home de la barra superior */}
            <IconButton size="small" color="primary" onClick={logout} aria-label="Cerrar sesión">
              <LogoutRounded />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ p: { xs: 1, sm: 2 }, width: '100%', maxWidth: MAX_W, mx: 'auto' }}>
        {children}
      </Box>

      <Paper
        sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider',
          pb: 'env(safe-area-inset-bottom)',
          zIndex: (t) => t.zIndex.appBar
        }}
        elevation={3}
      >
        <BottomNavigation
          value={value}
          onChange={(_, v) => { setValue(v); router.push(visibleTabs[v].href as any); }}
          showLabels
          sx={{
            width: '100%',
            '& .MuiBottomNavigationAction-root': {
              transition: 'background-color 140ms ease, color 140ms ease',
              borderRadius: 1,
            },
            '& .MuiBottomNavigationAction-root:hover': {
              backgroundColor: (t) => t.palette.primary.main,
              color: (t) => t.palette.common.white,
              '& .MuiSvgIcon-root': { color: (t) => t.palette.common.white },
            },
          }}
        >
          {visibleTabs.map(t => (
            <BottomNavigationAction key={t.href} label={t.label} icon={t.icon} />
          ))}
        </BottomNavigation>
      </Paper>

    </Box>
  );
}

