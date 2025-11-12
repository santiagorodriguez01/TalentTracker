'use client';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Stack, MenuItem, TextField, Alert, Button } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { can, type Rol } from '@/lib/rbac';
import api from '@/lib/api';

export default function SocioDetail(){
  const { id } = useParams<{id:string}>();
  const router = useRouter();
  const qc = useQueryClient();
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;
  const puedeEditar = rol ? can.editarSocio(rol) : false;

  const { data: socio } = useQuery({
    queryKey: ['socio', id],
    queryFn: async ()=> (await api.get(`/socios/${id}`)).data,
    enabled: !!id
  });

  const { data: planes } = useQuery({
    queryKey:['planes'],
    queryFn: async()=> (await api.get('/planes')).data
  });

  const { mutateAsync, error } = useMutation({
    mutationFn: async (plan_id: number)=> (await api.post(`/socios/${id}/plan`, { plan_id })).data,
    onSuccess: ()=> qc.invalidateQueries({ queryKey: ['socio', id] })
  });

  const personaId: number | undefined =
    socio?.persona_id ?? socio?.persona?.id ?? undefined;

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb:2 }}>
        <Typography variant="h6" fontWeight={700}>Detalle socio #{id}</Typography>
        <Button
          disabled={!personaId}
          variant="contained"
          onClick={()=> personaId && router.push(`/credenciales/${personaId}`)}
        >
          Ver credencial
        </Button>
      </Stack>

      <pre>{JSON.stringify(socio, null, 2)}</pre>

      <Stack direction="row" gap={2} sx={{ mt:2 }}>
        <TextField
          select
          label="Cambiar plan"
          onChange={async (e)=>{ if (puedeEditar) await mutateAsync(Number(e.target.value)); }}
          disabled={!puedeEditar}
          sx={{ minWidth: 240 }}
        >
          {(planes || []).map((p:any)=>(<MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>))}
        </TextField>
        {error && <Alert severity="error">Error al cambiar plan</Alert>}
      </Stack>
    </Box>
  );
}
