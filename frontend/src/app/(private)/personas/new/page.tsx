'use client';
import * as React from 'react';
import { Box, TextField, Button, Stack, Typography, Alert, MenuItem, Avatar, Snackbar } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth';
import { can, type Rol } from '@/lib/rbac';
import { ROLE_CODES, ROLE_OPTIONS, roleLabel } from '@/lib/roles';

const CameraCapture = dynamic(() => import('@/components/media/CameraCapture'), { ssr: false });

const ALL_GENEROS = ['MASCULINO','FEMENINO','NO_ESPECIFICADO'] as const;

const schema = z.object({
  nombre: z.string().min(1,'Requerido'),
  apellido: z.string().min(1,'Requerido'),
  dni: z.string().min(6,'DNI invAlido'),
  fecha_nac: z.string().optional().or(z.literal('')).transform(v => v || undefined),
  email: z.string().email().optional().or(z.literal('')).transform(v => v || undefined),
  telefono: z.string().optional().or(z.literal('')).transform(v => v || undefined),
  domicilio: z.string().optional().or(z.literal('')).transform(v => v || undefined),
  genero: z.enum(ALL_GENEROS),
  roles: z.array(z.enum(ROLE_CODES)).min(0)
});
type FormData = z.infer<typeof schema>;

export default function NewPersona(){
  const router = useRouter();
  const qc = useQueryClient();
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;
  const puedeCrear = rol ? can.crearPersona(rol) : false;
  const [cameraOpen, setCameraOpen] = React.useState(false);
  const [fotoFile, setFotoFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState(false);

  const { register, handleSubmit, formState:{ errors, isSubmitting }, setError, reset, control } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre:'', apellido:'', dni:'',
      fecha_nac: '', email:'', telefono:'', domicilio:'',
      genero: 'NO_ESPECIFICADO', roles: []
    }
  });

  const onLocalFile = (file?: File | null) => {
    if (!file) return;
    setFotoFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const createPersona = useMutation({
    mutationFn: async (payload: Omit<FormData,'roles'>)=>{
      try { return (await api.post('/personas', payload)).data; } catch {}
      return (await api.post('/api/personas', payload)).data;
    }
  });
  const uploadFoto = useMutation({
    mutationFn: async ({ personaId, file }: { personaId:number; file:File })=>{
      const fd = new FormData(); fd.append('file', file);
      try { return (await api.post(`/personas/${personaId}/foto`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data; } catch {}
      return (await api.post(`/api/personas/${personaId}/foto`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    }
  });

  const generateQr = useMutation({
    mutationFn: async (personaId:number)=>{
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const target = origin ? `${origin}/qr/${personaId}` : undefined;
      const params = target ? { target } : undefined as any;
      try { return (await api.get(`/personas/${personaId}/qr`, { params })).data; } catch {}
      return (await api.get(`/api/personas/${personaId}/qr`, { params })).data;
    }
  });

  async function savePersonaRoles(personaId: number, roles: string[]){
    if (!Array.isArray(roles)) roles = [];
    const delPaths = [`/personas/${personaId}/roles`, `/api/personas/${personaId}/roles`];
    let lastErr: any;
    for (const p of delPaths){ try { await api.delete(p); lastErr = null; break; } catch(e){ lastErr = e; } }
    if (lastErr) throw lastErr;
    const postPaths = [`/personas/${personaId}/roles`, `/api/personas/${personaId}/roles`];
    for (const p of postPaths){ try { return (await api.post(p, { roles })).data; } catch(e){ lastErr = e; } }
    throw lastErr;
  }

  const onSubmit = handleSubmit(async (values)=>{
    try {
      const { roles, ...rest } = values;
      const persona = await createPersona.mutateAsync(rest);
      const personaId: number = persona?.id;
      if (!personaId) throw new Error('Alta realizada sin ID');

      try { await savePersonaRoles(personaId, roles); } catch {}
      if (fotoFile) await uploadFoto.mutateAsync({ personaId, file: fotoFile });
      await generateQr.mutateAsync(personaId);

      qc.invalidateQueries({ queryKey: ['personas'] });
      reset(); setFotoFile(null); setPreview(null);
      setOk(true);
      router.push('/personas');
    } catch (e:any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message;
      if (status === 409) {
        setError('dni', { message: 'Ya existe una persona con ese DNI' });
      } else {
        setError('root', { message: msg || 'Error al guardar' });
      }
    }
  });

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ p:1 }}>
      <Typography variant="h6" fontWeight={700}>Alta de persona</Typography>
      {errors.root?.message && <Alert severity="error">{errors.root?.message}</Alert>}

      <Stack direction="row" gap={2} sx={{ mt:2, alignItems:'center' }}>
        <Avatar src={preview || '/avatar-placeholder.svg'} sx={{ width: 96, height: 96 }} />
        <Stack direction="row" gap={1} alignItems="center">
          {puedeCrear && (
            <Button variant="outlined" onClick={()=>setCameraOpen(true)}>Usar cámara</Button>
          )}
        </Stack>
      </Stack>

      <Stack gap={2} sx={{ mt:2 }}>
        <TextField label="Apellido" {...register('apellido')} error={!!errors.apellido} helperText={errors.apellido?.message} />
        <TextField label="Nombre" {...register('nombre')} error={!!errors.nombre} helperText={errors.nombre?.message} />
        <TextField label="DNI" {...register('dni')} error={!!errors.dni} helperText={errors.dni?.message} />
        <TextField type="date" label="Fecha de nacimiento" InputLabelProps={{ shrink:true }} {...register('fecha_nac')} />
        <TextField label="Email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
        <TextField label="Telefono" {...register('telefono')} />
        <TextField label="Domicilio" {...register('domicilio')} />

        <Controller
          control={control}
          name="genero"
          render={({ field }) => (
            <TextField select label="Genero" value={field.value} onChange={field.onChange} error={!!(errors as any).genero} helperText={(errors as any).genero?.message}>
              {ALL_GENEROS.map(g => (<MenuItem key={g} value={g}>{g.replace('_',' ')}</MenuItem>))}
            </TextField>
          )}
        />

        <Controller
          control={control}
          name="roles"
          render={({ field }) => (
            <TextField
              select
              label="Roles"
              SelectProps={{
                multiple: true,
                renderValue: (selected) =>
                  Array.isArray(selected) ? selected.map((value) => roleLabel(value)).join(', ') : ''
              }}
              value={Array.isArray(field.value) ? field.value : []}
              onChange={field.onChange}
              error={!!(errors as any).roles}
              helperText={(errors as any).roles ? 'Seleccione al menos un rol' : undefined}
            >
              {ROLE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Stack direction="row" gap={1}>
          <Button disabled={!puedeCrear || isSubmitting || createPersona.isPending || uploadFoto.isPending || generateQr.isPending} variant="contained" type="submit">Guardar</Button>
          <Button variant="outlined" color="error" sx={{ bgcolor: 'common.white', borderColor: 'error.main', color: 'error.main', '&:hover': { bgcolor: 'error.main', borderColor: 'error.main', color: 'common.white' } }} onClick={()=>router.back()}>
            Cancelar
          </Button>
        </Stack>
      </Stack>

      <CameraCapture open={cameraOpen} onClose={()=>setCameraOpen(false)} onCapture={onLocalFile} facingMode="environment" />
      <Snackbar open={ok} autoHideDuration={2500} onClose={()=>setOk(false)} message="Persona creada" />
    </Box>
  );
}


