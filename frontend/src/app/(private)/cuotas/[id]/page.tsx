'use client';
import { useParams } from 'next/navigation';
import { Box, Typography, Button, Stack, TextField, Alert, MenuItem } from '@mui/material';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { can, type Rol } from '@/lib/rbac';
import api from '@/lib/api';
import * as React from 'react';

const MEDIOS = ['EFECTIVO','MERCADO_PAGO','TRANSFERENCIA','DEBITO','CREDITO','OTRO'] as const;

export default function CuotaDetail(){
  const { id } = useParams<{id:string}>();
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;
  const puedePagar = rol ? can.pagarCuotas(rol) : false;
  const receiptUrl = React.useCallback((path:string)=>{
    try {
      const token = useAuthStore.getState().token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const q = token ? `?bearer=${encodeURIComponent(token)}` : '';
      return `/api/proxy${path}${q}`;
    } catch { return `/api/proxy${path}`; }
  },[]);
  const { data, refetch } = useQuery({
    queryKey: ['cuota', id],
    queryFn: async ()=> (await api.get(`/cuotas/${id}`)).data,
    enabled: !!id
  });

  const [monto, setMonto] = React.useState(0);
  const [medio_pago, setMedio] = React.useState<typeof MEDIOS[number]>('EFECTIVO');
  const [nro_tramite, setTramite] = React.useState('');
  const [observacion, setObs] = React.useState('');

  const { mutateAsync, error, isPending } = useMutation({
    mutationFn: async ()=> (await api.post(`/cuotas/${id}/pagar`, { monto, medio_pago, nro_tramite, observacion })).data
  });

  const requiereTramite = medio_pago==='MERCADO_PAGO' || medio_pago==='TRANSFERENCIA';

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight={700}>Detalle cuota #{id}</Typography>
        <Button size="small" variant="outlined" startIcon={<ReceiptLongRounded/>} onClick={()=> window.open(receiptUrl(`/cuotas/${id}/comprobante.pdf`), "_blank")}>
          Recibo
        </Button>
      </Stack>
      <pre>{JSON.stringify(data, null, 2)}</pre>

      <Stack gap={2} sx={{ mt:2, maxWidth: 420 }}>
        <TextField disabled={!puedePagar} type="number" label="Monto" value={monto} onChange={(e)=>setMonto(Number(e.target.value))} />
        <TextField disabled={!puedePagar} select label="Medio de pago" value={medio_pago} onChange={(e)=>setMedio(e.target.value as any)}>
          {MEDIOS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
        </TextField>
        <TextField
          label="Nro. tramite"
          value={nro_tramite}
          onChange={(e)=>setTramite(e.target.value)}
          disabled={!puedePagar}
          required={requiereTramite}
          helperText={requiereTramite ? 'Obligatorio para MP/Transferencia' : ''}
        />
        <TextField disabled={!puedePagar} label="Observacion" value={observacion} onChange={(e)=>setObs(e.target.value)} />
        {error && <Alert severity="error">Error al pagar</Alert>}
        <Button
          disabled={!puedePagar || isPending}
          variant="contained"
          onClick={async ()=>{ await mutateAsync(); await refetch(); }}
        >
          Pagar
        </Button>
      </Stack>
    </Box>
  );
}
