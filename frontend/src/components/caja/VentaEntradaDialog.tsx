'use client';
import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, MenuItem, Alert, CircularProgress, Chip, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, IconButton, Tooltip, Typography } from '@mui/material';
import QrScanDialog from '@/components/media/QrScanDialog';
import QrCodeScannerRounded from '@mui/icons-material/QrCodeScannerRounded';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';

const schema = z.object({
  nro_socio: z.string().optional(),
  cantidad: z.coerce.number().min(1, 'La cantidad debe ser al menos 1'),
  medio_pago: z.enum(['EFECTIVO','MERCADO_PAGO']),
  nro_tramite: z.string().optional()
});

type FormData = z.infer<typeof schema>;

interface SocioValidacion {
  existe: boolean;
  estado: 'AL_DIA' | 'MOROSO' | 'NO_SOCIO';
  nombre?: string;
  apellido?: string;
  dni?: string;
}

export default function VentaEntradaDialog({ open, onClose, onSave, initialNroSocio, forceNoSocio, qrMode }:{ open:boolean; onClose:()=>void; onSave:(v:any)=>void; initialNroSocio?: string; forceNoSocio?: boolean; qrMode?: boolean }){
  const { register, handleSubmit, reset, watch, formState:{ errors, isSubmitting }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nro_socio: '',
      cantidad: 1,
      medio_pago: 'EFECTIVO',
      nro_tramite: ''
    }
  });

  const [validacionSocio, setValidacionSocio] = React.useState<SocioValidacion | null>(null);
  const [validando, setValidando] = React.useState(false);
  const [errorValidacion, setErrorValidacion] = React.useState<string>('');
  const [esSocio, setEsSocio] = React.useState<'SI' | 'NO'>('SI');
  const [qrOpen, setQrOpen] = React.useState(false);

  const nroSocio = watch('nro_socio');
  const medioPago = watch('medio_pago');
  const cantidad = watch('cantidad');

  // Calcular monto según tipo de socio y cantidad
  const calcularMonto = () => {
    let precioUnitario = 0;
    if (esSocio === 'SI') {
      if (validacionSocio?.estado === 'AL_DIA') {
        precioUnitario = 1500;
      } else if (validacionSocio?.estado === 'MOROSO') {
        precioUnitario = 1500; // Mismo precio para morosos
      } else {
        precioUnitario = 1500;
      }
    } else {
      precioUnitario = 3000; // No socio
    }
    return precioUnitario * (cantidad || 1);
  };

  // Limpiar error cuando cambia es_socio
  React.useEffect(() => {
    setErrorValidacion('');
  }, [esSocio]);

  // Validar número de socio cuando cambie (solo si es socio)
  React.useEffect(() => {
    if (esSocio !== 'SI') {
      setValidacionSocio(null);
      setErrorValidacion('');
      return;
    }

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
        setValidacionSocio(data);
      } catch (err: any) {
        setErrorValidacion(err.response?.data?.error?.message || 'Error al validar número de socio');
        setValidacionSocio(null);
      } finally {
        setValidando(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [nroSocio, esSocio]);

  const submit = handleSubmit((v)=>{ 
    // Validaciones manuales
    if (esSocio === 'SI' && !validacionSocio) {
      setErrorValidacion('Debe ingresar un número de socio válido');
      return;
    }
    
    if (v.medio_pago === 'MERCADO_PAGO' && !v.nro_tramite) {
      setErrorValidacion('El número de trámite es obligatorio para Mercado Pago');
      return;
    }

    const monto = calcularMonto();
    onSave({
      ...v,
      es_socio: esSocio,
      monto,
      cantidad: cantidad || 1,
      estado_socio: esSocio === 'SI' ? (validacionSocio?.estado || 'NO_SOCIO') : 'NO_SOCIO',
      dni: validacionSocio?.dni
    }); 
    reset({
      nro_socio: '',
      cantidad: 1,
      medio_pago: 'EFECTIVO',
      nro_tramite: ''
    }); 
    setEsSocio('SI');
    setValidacionSocio(null);
    setErrorValidacion('');
  });

  const handleClose = () => {
    reset({
      nro_socio: '',
      cantidad: 1,
      medio_pago: 'EFECTIVO',
      nro_tramite: ''
    });
    setEsSocio('SI');
    setValidacionSocio(null);
    setErrorValidacion('');
    onClose();
  };

  const getEstadoChip = () => {
    if (!validacionSocio) return null;
    
    if (validacionSocio.estado === 'AL_DIA') {
      return <Chip label="Socio al Día" color="success" />;
    } else if (validacionSocio.estado === 'MOROSO') {
      return <Chip label="Socio Moroso" color="warning" />;
    } else {
      return <Chip label="No es Socio" color="error" />;
    }
  };

  const monto = calcularMonto();

  // Pre-cargar número de socio cuando se pasa desde props (ej: desde QR)
  React.useEffect(() => {
    if (initialNroSocio && initialNroSocio !== nroSocio) {
      setValue('nro_socio', initialNroSocio);
      setEsSocio('SI');
    }
  }, [initialNroSocio, setValue, nroSocio]);

  // Forzar modo NO socio cuando se abre desde botón de no socios
  React.useEffect(() => {
    if (forceNoSocio && open) {
      setEsSocio('NO');
      setValue('nro_socio', '');
    }
  }, [forceNoSocio, open, setValue]);

  // Forzar modo SI socio cuando es modo QR
  React.useEffect(() => {
    if (qrMode && open) {
      setEsSocio('SI');
    }
  }, [qrMode, open]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{qrMode ? 'Venta Entrada - Socio' : 'Venta Entrada Local'}</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 1 }}>
          {errorValidacion && <Alert severity="error">{errorValidacion}</Alert>}

          {/* Modo QR Simplificado - Solo para socios escaneados */}
          {qrMode ? (
            <>
              {validando && (
                <Alert severity="info" icon={<CircularProgress size={20} />}>
                  Validando socio...
                </Alert>
              )}

              {validacionSocio && validacionSocio.existe && (
                <Alert severity="success">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body1">
                      <strong>{validacionSocio.nombre} {validacionSocio.apellido}</strong>
                    </Typography>
                    {getEstadoChip()}
                  </Stack>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    DNI: {validacionSocio.dni} | N° Socio: {nroSocio}
                  </Typography>
                </Alert>
              )}
            </>
          ) : (
            <>
              {/* Modo Normal - Formulario completo */}
              {!forceNoSocio && (
                <FormControl component="fieldset">
                  <FormLabel component="legend">¿Es socio del club?</FormLabel>
                  <RadioGroup
                    row
                    value={esSocio}
                    onChange={(e) => {
                      setEsSocio(e.target.value as 'SI' | 'NO');
                      if (e.target.value === 'NO') {
                        setValidacionSocio(null);
                        setErrorValidacion('');
                      }
                    }}
                  >
                    <FormControlLabel value="SI" control={<Radio />} label="Sí, es socio" />
                    <FormControlLabel value="NO" control={<Radio />} label="No es socio" />
                  </RadioGroup>
                </FormControl>
              )}

              {forceNoSocio && (
                <Alert severity="info">
                  Modo: <strong>Venta para NO socios</strong>
                </Alert>
              )}

              {esSocio === 'SI' && (
                <>

                  <Stack direction="row" spacing={2} alignItems="center">
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

                  {validacionSocio && validacionSocio.existe && (
                    <Alert severity="info">
                      <strong>{validacionSocio.nombre} {validacionSocio.apellido}</strong>
                      <br />
                      DNI: {validacionSocio.dni}
                    </Alert>
                  )}
                </>
              )}
            </>
          )}

          <TextField 
            label="Cantidad de Entradas" 
            type="number"
            inputProps={{ min: 1, step: 1 }}
            {...register('cantidad', { valueAsNumber: true })}
            error={!!errors.cantidad}
            helperText={errors.cantidad?.message || 'Mínimo 1 entrada'}
            defaultValue={1}
          />

          <TextField 
            label="Monto Total" 
            type="number"
            value={monto}
            disabled
            InputProps={{
              readOnly: true,
            }}
            helperText={`${cantidad || 1} entrada(s) × $${esSocio === 'SI' ? '1,500' : '3,000'} = $${monto.toLocaleString('es-AR')}`}
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
          disabled={isSubmitting || validando} 
          variant="contained" 
          onClick={submit}
        >
          Registrar Venta
        </Button>
      </DialogActions>
      {!qrMode && (
        <QrScanDialog open={qrOpen} onClose={()=> setQrOpen(false)} onDetected={async (raw)=>{
        try {
          const s = String(raw||'').trim();
          let token = '';
          try {
            const u = new URL(s);
            const p = u.pathname || '';
            const idx = p.toLowerCase().indexOf('/qr/');
            if (idx >= 0) {
              let rest = p.slice(idx + 4); // after '/qr/'
              if (rest.startsWith('/')) rest = rest.slice(1);
              token = rest.split('/')[0];
              if (token.toLowerCase().endsWith('.png')) token = token.slice(0, -4);
            }
          } catch {}
          if (!token && s.toLowerCase().includes('/qr/')) {
            // Fallback simple cuando es un path relativo
            let rest = s.slice(s.toLowerCase().indexOf('/qr/') + 4);
            if (rest.startsWith('/')) rest = rest.slice(1);
            token = rest.split('/')[0];
            if (token.toLowerCase().endsWith('.png')) token = token.slice(0, -4);
          }
          if (!token) token = s;
          if (!token) return;
          if (/^\d{4,}$/.test(token)) { setValue('nro_socio', token); return; }
          try{ const resp = await api.get(`/qr/${token}`, { // evitar logout si 401
            // @ts-ignore
            skipAuth: true, allow401: true, headers: { 'X-Skip-Auth': '1' }
          } as any);
            const pid = resp?.data?.pid || resp?.data?.persona_id || resp?.data?.payload?.pid;
            const nro = resp?.data?.nro_socio;
            if (nro){ setValue('nro_socio', String(nro)); }
            else if (pid){
              try{ const { data } = await api.get('/socios', { params: { persona_id: pid, page:1, size:1 } });
                const row = (data?.data || data?.rows || [])[0]; if (row?.nro_socio){ setValue('nro_socio', row.nro_socio); }
              } catch {}
            } } catch {}
        } finally { setQrOpen(false); }
      }} />
      )}
    </Dialog>
  );
}

