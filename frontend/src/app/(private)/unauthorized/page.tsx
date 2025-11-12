'use client';
import * as React from 'react';
import { Box, Button, Card, CardContent, Stack, Typography, List, ListItem, ListItemText } from '@mui/material';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import HomeRounded from '@mui/icons-material/HomeRounded';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { allowedPathsForRole, homeForRole, type Rol } from '@/lib/rbac';

export default function UnauthorizedPage(){
  const sp = useSearchParams();
  const from = sp.get('from') || '';
  const router = useRouter();
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;
  const allowed = allowedPathsForRole(rol);
  const home = homeForRole(rol);

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', display: 'grid', gap: 2 }}>
      <Card>
        <CardContent>
          <Stack direction="row" gap={2} alignItems="center" mb={1}>
            <WarningAmberRounded color="warning" />
            <Typography variant="h6">Acceso denegado</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No tenés permisos para acceder a esta página.
          </Typography>
          {!!from && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              Ruta solicitada: <b>{from}</b>
            </Typography>
          )}
          {rol && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Tu rol: <b>{rol}</b>
            </Typography>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ mb: 2 }}>
            <Button onClick={()=> router.back()} startIcon={<ArrowBackRounded/>} variant="outlined">Volver</Button>
            <Button onClick={()=> router.replace(home as any)} startIcon={<HomeRounded/>} variant="contained">Ir a mi inicio</Button>
          </Stack>

          {allowed.length > 0 && (
            <>
              <Typography variant="subtitle2" gutterBottom>Secciones disponibles</Typography>
              <List dense disablePadding>
                {allowed.map(item => (
                  <ListItem key={item.href} disableGutters sx={{ py: 0.25 }}>
                    <ListItemText primaryTypographyProps={{ sx:{ cursor:'pointer', color:'primary.main' }, onClick:()=> router.push(item.href as any) }} primary={item.label} secondary={item.href} />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

