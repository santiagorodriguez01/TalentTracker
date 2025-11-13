'use client';
import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Stack, Button, Avatar, Alert, MenuItem, Snackbar, TextField } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { ROLE_CODES, ROLE_OPTIONS, roleLabel } from '@/lib/roles';
import { useAuthStore } from '@/store/auth';
import { can, type Rol } from '@/lib/rbac';

const CameraCapture = dynamic(() => import('@/components/media/CameraCapture'), { ssr: false });

const ALL_GENEROS = ['MASCULINO','FEMENINO','NO_ESPECIFICADO'] as const;

const schema = z.object({
  nombre: z.string().min(1,'Requerido'),
  apellido: z.string().min(1,'Requerido'),
  dni: z.string().min(6,'DNI invalido'),
  fecha_nac: z.string().optional().or(z.literal('')).transform(v => v || undefined),
  email: z.string().email().optional().or(z.literal('')).transform(v => v || undefined),
  telefono: z.string().optional().or(z.literal('')).transform(v => v || undefined),
  domicilio: z.string().optional().or(z.literal('')).transform(v => v || undefined),
  genero: z.enum(ALL_GENEROS),
  roles: z.array(z.enum(ROLE_CODES)).min(0),
});

type FormData = z.infer<typeof schema>;

export default function PersonaEdit(){
  const { id } = useParams<{id:string}>();
  const personaId = Number(id);
  const router = useRouter();
  const qc = useQueryClient();

  // 🔹 ESTO ANTES ESTABA AFUERA DEL COMPONENTE: lo traemos adentro
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;
  const puedeEditar = rol ? can.editarPersona(rol) : false;

  const [cameraOpen, setCameraOpen] = React.useState(false);
  const [fotoFile, setFotoFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState(false);

  async function getPersona(id: number){
    const paths = [`/personas/${id}`, `/api/personas/${id}`];
    let lastErr: any;
    for (const p of paths){
      try { return (await api.get(p)).data; } catch(e){ lastErr = e; }
    }
    throw lastErr;
  }

  const { data: persona, isLoading, isError, error } = useQuery({
    queryKey: ['persona', personaId],
    queryFn: async ()=> getPersona(personaId),
    enabled: Number.isFinite(personaId),
    retry: false,
  });

  const { register, handleSubmit, formState:{ errors, isSubmitting }, setError, reset, control } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre:'', apellido:'', dni:'', fecha_nac:'', email:'', telefono:'', domicilio:'', genero:'NO_ESPECIFICADO', roles: [] }
  });

  React.useEffect(()=>{
    if (persona) {
      const rolesArr = Array.isArray((persona as any)?.roles)
        ? ((persona as any).roles as any[]).map(r=> r?.rol || r).filter(Boolean)
        : ((persona as any)?.rol ? [ (persona as any).rol ] : []);
      reset({
        nombre: persona.nombre || '',
        apellido: persona.apellido || '',
        dni: persona.dni || '',
        fecha_nac: persona.fecha_nac || '',
        email: persona.email || '',
        telefono: persona.telefono || '',
        domicilio: persona.domicilio || '',
        genero: (persona as any)?.genero || 'NO_ESPECIFICADO',
        roles: rolesArr
      });
      setPreview(persona.foto || null);
    }
  },[persona, reset]);

  const updatePersona = useMutation({
    mutationFn: async (payload: any)=> {
      const tryPaths = async (method: 'put'|'patch')=>{
        const paths = [`/personas/${personaId}`, `/api/personas/${personaId}`];
        let lastErr: any;
        for (const p of paths){
          try { return (await (api as any)[method](p, payload)).data; } catch(e){ lastErr = e; }
        }
        throw lastErr;
      };
      try { return await tryPaths('put'); } catch { return await tryPaths('patch'); }
    },
    onSuccess: ()=> {
      qc.invalidateQueries({ queryKey: ['personas'] });
      qc.invalidateQueries({ queryKey: ['persona', personaId] });
    }
  });

  const uploadFoto = useMutation({
    mutationFn: async (file: File)=>{
      const fd = new FormData(); fd.append('file', file);
      const paths = [`/personas/${personaId}/foto`, `/api/personas/${personaId}/foto`];
      let lastErr: any;
      for (const p of paths){
        try { return (await api.post(p, fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data; } catch(e){ lastErr = e; }
      }
      throw lastErr;
    },
    onSuccess: ()=> qc.invalidateQueries({ queryKey: ['persona', personaId] })
  });

  const onCapture = (file: File)=>{
    setFotoFile(file);
    const url = URL.createObjectURL(file); setPreview(url);
  };

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
    try{
      const base: any = {
        nombre: persona?.nombre ?? '',
        apellido: persona?.apellido ?? '',
        dni: persona?.dni ?? '',
        fecha_nac: persona?.fecha_nac ?? undefined,
        email: persona?.email ?? undefined,
        telefono: persona?.telefono ?? undefined,
        domicilio: persona?.domicilio ?? undefined,
        genero: (persona as any)?.genero ?? 'NO_ESPECIFICADO',
      };
      const next: any = { ...values };
      ['fecha_nac','email','telefono','domicilio'].forEach((k)=>{ if ((next as any)[k] === '' || typeof (next as any)[k] === 'undefined') delete (next as any)[k]; });
      const changed: any = {};
      Object.keys(base).forEach((k)=>{ if (next[k] !== base[k]) changed[k] = next[k]; });
      if (Object.keys(changed).length) {
        await updatePersona.mutateAsync(changed);
      }
      await savePersonaRoles(personaId, values.roles || []);
      if (fotoFile) await uploadFoto.mutateAsync(fotoFile);
      await qc.invalidateQueries({ queryKey: ['persona', personaId] });
      setOk(true);
      router.push('/personas');
    }catch(e:any){
      setError('root', { message: e?.response?.data?.message || e?.message || 'Error al guardar' });
    }
  });

  if (isLoading) return <Box sx={{ p:2 }}><Typography>Cargando...</Typography></Box>;
  if (isError) {
    const msg = (error as any)?.response?.data?.message || (error as any)?.message || 'Error';
    return (
      <Box sx={{ p:2, display:'grid', gap:2 }}>
        <Alert severity="error">No se pudo cargar la persona. {msg}</Alert>
        <Button variant="outlined" onClick={()=>router.back()}>Volver</Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ p:1, display:'grid', gap:2 }}>
      <Typography variant="h6" fontWeight={700}>Editar persona #{personaId}</Typography>
      {errors.root?.message && <Alert severity="error">{errors.root?.message}</Alert>}

      <Stack direction="row" gap={2} sx={{ alignItems:'center' }}>
        <Avatar src={preview || persona?.foto || '/avatar-placeholder.svg'} sx={{ width: 96, height: 96 }} />
        {puedeEditar && (
          <Button variant="outlined" onClick={()=>setCameraOpen(true)}>Tomar nueva foto</Button>
        )}
      </Stack>

      <Stack gap={2}>
        <TextField disabled={!puedeEditar} label="Apellido" {...register('apellido')} error={!!errors.apellido} helperText={errors.apellido?.message} />
        <TextField disabled={!puedeEditar} label="Nombre" {...register('nombre')} error={!!errors.nombre} helperText={errors.nombre?.message} />
        <TextField disabled={!puedeEditar} label="DNI" {...register('dni')} error={!!errors.dni} helperText={errors.dni?.message} />
        <TextField disabled={!puedeEditar} type="date" label="Fecha de nacimiento" InputLabelProps={{shrink:true}} {...register('fecha_nac')} />
        <TextField disabled={!puedeEditar} label="Email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
        <TextField disabled={!puedeEditar} label="Telefono" {...register('telefono')} />
        <TextField disabled={!puedeEditar} label="Domicilio" {...register('domicilio')} />

        <Controller name="genero" control={control} render={({ field })=> (
          <TextField disabled={!puedeEditar} select label="Genero" value={field.value} onChange={field.onChange} error={!!(errors as any).genero} helperText={(errors as any).genero?.message}>
            {ALL_GENEROS.map(g => (<MenuItem key={g} value={g}>{g.replace('_',' ')}</MenuItem>))}
          </TextField>
        )} />

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
              onChange={puedeEditar ? field.onChange : ()=>{}}
              disabled={!puedeEditar}
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
          <Button disabled={!puedeEditar || isSubmitting || updatePersona.isPending || uploadFoto.isPending} variant="contained" type="submit">Guardar cambios</Button>
          <Button variant="outlined" color="error" sx={{ bgcolor: 'common.white', borderColor: 'error.main', color: 'error.main', '&:hover': { bgcolor: 'error.main', borderColor: 'error.main', color: 'common.white' } }} onClick={()=>router.back()}>
            Cancelar
          </Button>
        </Stack>
      </Stack>

      <CameraCapture open={cameraOpen} onClose={()=>setCameraOpen(false)} onCapture={onCapture} facingMode="environment" />
      <Snackbar open={ok} autoHideDuration={2500} onClose={()=>setOk(false)} message="Persona actualizada" />
    </Box>
  );
}
