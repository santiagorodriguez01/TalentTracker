'use client';
import * as React from 'react';
import { Box, TextField, Button, Typography, Alert, Paper, Stack, AppBar, Toolbar, IconButton, Backdrop, CircularProgress } from '@mui/material';
import { alpha, useColorScheme } from '@mui/material/styles';
import HomeRounded from '@mui/icons-material/HomeRounded';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import { login } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  username: z.string().min(1, 'Usuario requerido'),
  password: z.string().min(1, 'Contrasena requerida')
});
type FormData = z.infer<typeof schema>;

export default function Login(){
  const router = useRouter();
  const { mode, setMode } = useColorScheme();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' }
  });

  const onSubmit = handleSubmit(async (values)=>{
    try{
      const r = await login(values.username, values.password);
      if(!r?.token) throw new Error('Login fallido');
      router.push('/dashboard');
    }catch(e:any){
      setError('root', { message: e?.response?.data?.message || e?.message || 'Login fallido' });
    }
  });

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img src="/logo-club.png" alt="Logo" width={36} height={36} style={{ objectFit: 'contain' }} />
            <Typography variant="h6" fontWeight={700}>Club Deportivo</Typography>
          </Box>
          <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
              aria-label="Cambiar tema"
            >
              {mode === 'light' ? <DarkModeRounded /> : <LightModeRounded />}
            </IconButton>
            <IconButton size="small" color="primary" onClick={()=>router.push('/dashboard')} aria-label="Ir a inicio">
              <HomeRounded />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ display: 'grid', placeItems: 'center', p: 2, position: 'relative' }}>
      {/* Aura tenue detras del login, usa el color primario del tema */}
      <Box aria-hidden sx={(theme)=>({
        position: 'absolute',
        zIndex: 0,
        width: 'min(820px, 96vw)',
        height: 'min(600px, 85vh)',
        borderRadius: 36,
        filter: 'blur(90px)',
        opacity: 0.9,
        background: `radial-gradient(76% 76% at 50% 50%, ${alpha(theme.palette.primary.main, 0.35)} 0%, transparent 85%)`,
      })} />
      <Paper elevation={1} sx={{ position:'relative', zIndex:1, width: '100%', maxWidth: 420, p: 3 }}>
        <Box component="form" onSubmit={onSubmit}>
          <Stack gap={2}>
            <Typography variant="h5" fontWeight={700}>Ingresar</Typography>
            {errors.root?.message && <Alert severity="error">{errors.root?.message}</Alert>}
            <TextField
              label="Usuario"
              placeholder="Ingresa tu usuario"
              variant="outlined"
              id="login-username"
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
              fullWidth
            />
            <TextField
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              type="password"
              variant="outlined"
              id="login-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              fullWidth
            />
            <Button disabled={isSubmitting} type="submit" variant="contained" color="primary">
              Entrar
            </Button>
          </Stack>
        </Box>
      </Paper>
      <Backdrop open={isSubmitting} sx={{ color: '#fff', zIndex: (t)=> t.zIndex.modal + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
    </Box>
  );
}
