'use client';
import { Box, TextField, Button, Stack, Typography, Alert, MenuItem } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plan } from '@/types';
import { useAuthStore } from '@/store/auth';
import { can, type Rol } from '@/lib/rbac';

const schema = z.object({
  nro_socio: z.string().min(1,'Requerido'),
  persona_id: z.coerce.number().int().positive('Persona ID invalido'),
  plan_id: z.coerce.number().int().optional(),
  fecha_alta: z.string().min(1,'Requerido')
});
type FormData = z.infer<typeof schema>;

export default function NewSocio(){
  const router = useRouter();
  const qc = useQueryClient();
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;
  const puedeCrear = rol ? can.crearSocio(rol) : false;
  const { data: planes } = useQuery({
    queryKey: ['planes'],
    queryFn: async ()=> (await api.get('/planes')).data as Plan[]
  });

  const { register, handleSubmit, formState:{ errors, isSubmitting }, setError, reset } = useForm<FormData>({
    resolver: zodResolver(schema), defaultValues: { nro_socio:'', persona_id:0, plan_id:undefined, fecha_alta: new Date().toISOString().slice(0,10) }
  });

  const { mutateAsync } = useMutation({
    mutationFn: async (payload: FormData)=> (await api.post('/socios', payload)).data,
    onSuccess: ()=> qc.invalidateQueries({ queryKey: ['socios'] })
  });

  const onSubmit = handleSubmit(async (values)=>{
    try{
      await mutateAsync(values);
      reset();
      router.push('/socios');
    }catch(e:any){
      setError('root', { message: e?.response?.data?.message || 'Error al guardar' });
    }
  });

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ p:1 }}>
      <Typography variant="h6" fontWeight={700}>Alta de socio</Typography>
      {errors.root?.message && <Alert severity="error">{errors.root?.message}</Alert>}
      <Stack gap={2} sx={{ mt:2 }}>
        <TextField label="N Socio" {...register('nro_socio')} error={!!errors.nro_socio} helperText={errors.nro_socio?.message} />
        <TextField label="Persona ID" type="number" {...register('persona_id', { valueAsNumber: true })} error={!!errors.persona_id} helperText={errors.persona_id?.message} />
        <TextField type="date" label="Fecha de alta" InputLabelProps={{shrink:true}} {...register('fecha_alta')} error={!!errors.fecha_alta} helperText={errors.fecha_alta?.message} />
        <TextField select label="Plan" {...register('plan_id')}>
          <MenuItem value="">(Sin plan)</MenuItem>
          {(planes || []).map(p => (<MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>))}
        </TextField>
        <Stack direction="row" gap={1}>
          <Button disabled={!puedeCrear || isSubmitting} variant="contained" type="submit">Guardar</Button>
          <Button
            variant="outlined"
            color="error"
            sx={{ bgcolor: 'common.white', borderColor: 'error.main', color: 'error.main', '&:hover': { bgcolor: 'error.main', borderColor: 'error.main', color: 'common.white' } }}
            onClick={()=>router.back()}
          >
            Cancelar
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
