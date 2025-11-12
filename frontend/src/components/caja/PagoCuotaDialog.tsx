'use client';

import * as React from 'react';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, MenuItem, Alert, CircularProgress, Chip, IconButton, Tooltip, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

import QrScanDialog from '@/components/media/QrScanDialog';

import QrCodeScannerRounded from '@mui/icons-material/QrCodeScannerRounded';

import { useForm } from 'react-hook-form';

import { z } from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';

import api from '@/lib/api';

const schema = z.object({
  nro_socio: z.string().min(1, 'Número de socio es requerido'),
  periodo: z.string().min(1, 'Periodo es requerido'),
  importe_a_pagar: z.coerce.number().positive('El importe debe ser mayor a 0'),
  medio_pago: z.enum(['EFECTIVO','MERCADO_PAGO']),
  nro_tramite: z.string().optional()
}).superRefine((v, ctx)=>{
  if (v.medio_pago === 'MERCADO_PAGO' && !v.nro_tramite) {
    ctx.addIssue({
      code:'custom',
      path: ['nro_tramite'],
      message:'Número de trámite es obligatorio para Mercado Pago'
    });
  }
});

type FormData = z.infer<typeof schema>;

interface SocioValidacion {
  existe: boolean;
  estado: 'AL_DIA' | 'MOROSO';
  nombre?: string;
  apellido?: string;
  dni?: string;
  socio_id?: number;
  saldo_total?: number;
}

export default function PagoCuotaDialog({ open, onClose, onSave }:{ open:boolean; onClose:()=>void; onSave:(v:any)=>void }){
  const { register, handleSubmit, reset, watch, formState:{ errors, isSubmitting }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nro_socio: '',
      periodo: new Date().toISOString().slice(0,7), // YYYY-MM
      importe_a_pagar: 5000,
      medio_pago: 'EFECTIVO',
      nro_tramite: ''
    }
  });

  const [validacionSocio, setValidacionSocio] = React.useState<SocioValidacion | null>(null);
  const [validando, setValidando] = React.useState(false);
  const [errorValidacion, setErrorValidacion] = React.useState<string>('');
  const [qrOpen, setQrOpen] = React.useState(false);
  const [busqueda, setBusqueda] = React.useState('');
  const [sugerencias, setSugerencias] = React.useState<any[]>([]);
  const [buscando, setBuscando] = React.useState(false);

  const nroSocio = watch('nro_socio');
  const medioPago = watch('medio_pago');
  const totalImporte = 5000; // Cuota mensual fija

  // Validar número de socio cuando cambie
  React.useEffect(() => {
    if (!nroSocio || nroSocio.length < 3) {
      setValidacionSocio(null);
      setErrorValidacion('');
      return;
    }

    const timer = setTimeout(async () => {
      setValidando(true);
      setErrorValidacion('');
      try {
        const { data } = await api.get(`/socios/validar-nro-socio/${nroSocio}`);
        if (!data.existe) {
          setErrorValidacion('Número de socio no encontrado');
          setValidacionSocio(null);
        } else {
          setValidacionSocio({
            ...data,
            socio_id: data.socio_id
          });
        }
      } catch (err: any) {
        setErrorValidacion(err.response?.data?.error?.message || 'Error al validar número de socio');
        setValidacionSocio(null);
      } finally {
        setValidando(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [nroSocio]);

  // Búsqueda por DNI/Apellido/Nombre (sugerencias)
  React.useEffect(()=>{
    const term = (busqueda || '').trim();
    if (term.length < 2) { setSugerencias([]); return; }
    const timer = setTimeout(async ()=>{
      setBuscando(true);
      try {
        if (/^\d{5,}$/.test(term)){
          try {
            const { data } = await api.get(`/socios/validar-dni/${term}`);
            if (data?.existe && data?.nro_socio){
              setSugerencias([{ label: `${data.apellido}, ${data.nombre} (DNI ${data.dni})`, nro_socio: data.nro_socio }]);
              return;
            }
          } catch {}
        }
        const { data } = await api.get('/socios', { params: { q: term, page:1, size:10 } });
        const rows = data?.data || data?.rows || [];
        setSugerencias(rows.map((r:any)=> ({ label: `${r.apellido}, ${r.nombre} (N° ${r.nro_socio || '-'})`, nro_socio: r.nro_socio })));
      } finally { setBuscando(false); }
    }, 400);
    return ()=> clearTimeout(timer);
  }, [busqueda]);

  const submit = handleSubmit((v)=>{ 
    if (!validacionSocio) {
      setErrorValidacion('Debe ingresar un número de socio válido');
      return;
    }

    onSave({
      ...v,
      socio_id: validacionSocio.socio_id,
      total_importe: totalImporte,
      estado_socio: validacionSocio.estado,
      nombre_socio: `${validacionSocio.nombre} ${validacionSocio.apellido}`
    }); 
    reset({
      nro_socio: '',
      periodo: new Date().toISOString().slice(0,7),
      importe_a_pagar: 5000,
      medio_pago: 'EFECTIVO',
      nro_tramite: ''
    }); 
    setValidacionSocio(null);
    setErrorValidacion('');
  });

  const handleClose = () => {
    reset({
      nro_socio: '',
      periodo: new Date().toISOString().slice(0,7),
      importe_a_pagar: 5000,
      medio_pago: 'EFECTIVO',
      nro_tramite: ''
    });
    setValidacionSocio(null);
    setErrorValidacion('');
    setBusqueda('');
    setSugerencias([]);
    onClose();
  };

  const getEstadoChip = () => {
    if (!validacionSocio) return null;
    if (validacionSocio.estado === 'AL_DIA') {
      return <Chip label="Socio al día" color="success" />;
    } else if (validacionSocio.estado === 'MOROSO') {
      return <Chip label="Socio Moroso" color="warning" />;
    }
    return null;
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Pago de Cuota</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 1 }}>
          {errorValidacion && <Alert severity="error">{errorValidacion}</Alert>}

          <Stack direction="row" spacing={1} alignItems="center">
            <TextField 
              label="Número de Socio" 
              fullWidth
              placeholder="Ej: 40000001"
              {...register('nro_socio')} 
              error={!!errors.nro_socio}
              helperText={errors.nro_socio?.message}
              InputProps={{
                endAdornment: validando ? <CircularProgress size={20} /> : null
              }}
            />
            <Tooltip title="Escanear QR">
              <span>
                <IconButton size="small" color="primary" onClick={()=> setQrOpen(true)}>
                  <QrCodeScannerRounded />
                </IconButton>
              </span>
            </Tooltip>
            {validacionSocio && getEstadoChip()}
          </Stack>

          <TextField 
            label="Buscar socio (DNI, nombre o apellido)"
            fullWidth
            placeholder="Ej: 34795699 o Perez Juan"
            value={busqueda}
            onChange={(e)=> setBusqueda(e.target.value)}
            InputProps={{ endAdornment: buscando ? <CircularProgress size={20} /> : null }}
          />
          {sugerencias.length > 0 && (
            <List dense sx={{ maxHeight: 160, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              {sugerencias.map((s, idx)=> (
                <ListItem key={idx} disablePadding>
                  <ListItemButton onClick={()=>{ if (s.nro_socio){ setValue('nro_socio', s.nro_socio); setBusqueda(''); setSugerencias([]); } }}>
                    <ListItemText primary={s.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}

          {validacionSocio && validacionSocio.existe && (
            <>
              <Alert severity="info">
                <strong>{validacionSocio.nombre} {validacionSocio.apellido}</strong>
                <br />
                DNI: {validacionSocio.dni}
              </Alert>
              
              <Alert severity={validacionSocio.saldo_total && validacionSocio.saldo_total > 0 ? "warning" : "success"}>
                <strong>Saldo Total: ${validacionSocio.saldo_total?.toFixed(2) || '0.00'}</strong>
                {validacionSocio.saldo_total && validacionSocio.saldo_total > 0 ? (
                  <><br />Tiene cuotas pendientes de pago</>
                ) : (
                  <><br />No tiene deuda</>
                )}
              </Alert>
            </>
          )}

          <TextField 
            label="Periodo (Mes/Año)" 
            type="month"
            InputLabelProps={{ shrink: true }}
            {...register('periodo')} 
            error={!!errors.periodo}
            helperText={errors.periodo?.message || 'Formato: YYYY-MM'}
          />

          <TextField 
            label="Total Importe (Cuota Mensual)" 
            type="number"
            value={totalImporte}
            disabled
            InputProps={{
              readOnly: true,
              startAdornment: <span style={{marginRight: '8px'}}>$</span>
            }}
            helperText="Valor fijo de cuota mensual"
          />

          <TextField 
            label="Importe a Pagar" 
            type="number"
            inputProps={{ step: '0.01', min: '0' }}
            {...register('importe_a_pagar', { valueAsNumber: true })} 
            error={!!errors.importe_a_pagar}
            helperText={errors.importe_a_pagar?.message || 'Puede ser pago parcial o total'}
            InputProps={{
              startAdornment: <span style={{marginRight: '8px'}}>$</span>
            }}
          />

          <TextField 
            select 
            label="Medio de Pago"
            defaultValue="EFECTIVO"
            {...register('medio_pago')}
            error={!!errors.medio_pago}
            helperText={errors.medio_pago?.message}
          >
            <MenuItem value="EFECTIVO">Efectivo</MenuItem>
            <MenuItem value="MERCADO_PAGO">Mercado Pago</MenuItem>
          </TextField>

          {medioPago === 'MERCADO_PAGO' && (
            <TextField 
              label="Número de Trámite (Mercado Pago)" 
              fullWidth
              placeholder="Ej: MP-123456"
              {...register('nro_tramite')} 
              error={!!errors.nro_tramite}
              helperText={errors.nro_tramite?.message}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button 
          disabled={isSubmitting || validando || !validacionSocio} 
          variant="contained" 
          onClick={submit}
        >
          Registrar Pago
        </Button>
      </DialogActions>
      <QrScanDialog open={qrOpen} onClose={()=> setQrOpen(false)} onDetected={async (raw)=>{
        try {
          const s = String(raw||'').trim();
          let token = '';
          try {
            const u = new URL(s);
            const p = u.pathname || '';
            const idx = p.toLowerCase().indexOf('/qr/');
            if (idx >= 0) {
              let rest = p.slice(idx + 4);
              if (rest.startsWith('/')) rest = rest.slice(1);
              token = rest.split('/')[0];
              if (token.toLowerCase().endsWith('.png')) token = token.slice(0, -4);
            }
          } catch {}
          if (!token && s.toLowerCase().includes('/qr/')) {
            let rest = s.slice(s.toLowerCase().indexOf('/qr/') + 4);
            if (rest.startsWith('/')) rest = rest.slice(1);
            token = rest.split('/')[0];
            if (token.toLowerCase().endsWith('.png')) token = token.slice(0, -4);
          }
          if (!token) token = s;
          if (!token) return;
          try{ const resp = await api.get(`/qr/${token}`, { // evitar logout si 401
            // @ts-ignore
            skipAuth: true, allow401: true, headers: { 'X-Skip-Auth': '1' }
          } as any);
            const pid = resp?.data?.pid || resp?.data?.persona_id || resp?.data?.payload?.pid;
            const nro = resp?.data?.nro_socio;
            if (nro){ setValue('nro_socio', String(nro)); }
            else if (pid){
              try{ const { data } = await api.get('/socios', { params: { persona_id: pid, page:1, size:1 } });
                const row = (data?.data || data?.rows || [])[0]; if (row?.nro_socio){ setValue('nro_socio', row.nro_socio); } } catch {}
            } } catch {}
        } finally { setQrOpen(false); }
      }} />
    </Dialog>
  );
}
