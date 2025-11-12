'use client';
import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, MenuItem, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  concepto: z.string().min(1, 'Concepto es requerido'),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  medio_pago: z.enum(['EFECTIVO','TRANSFERENCIA']),
  nro_tramite: z.string().optional()
}).superRefine((v, ctx)=>{
  if (v.medio_pago === 'TRANSFERENCIA' && !v.nro_tramite) {
    ctx.addIssue({ 
      code:'custom', 
      path: ['nro_tramite'],
      message:'Número de trámite es obligatorio para Transferencia' 
    });
  }
});

type FormData = z.infer<typeof schema>;

export default function EgresoDialog({ open, onClose, onSave }:{ open:boolean; onClose:()=>void; onSave:(v:any)=>void }){
  const { register, handleSubmit, reset, watch, formState:{ errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      concepto: '',
      monto: 0,
      medio_pago: 'EFECTIVO',
      nro_tramite: ''
    }
  });

  const medioPago = watch('medio_pago');

  const submit = handleSubmit((v)=>{ 
    onSave(v); 
    reset({
      concepto: '',
      monto: 0,
      medio_pago: 'EFECTIVO',
      nro_tramite: ''
    }); 
  });

  const handleClose = () => {
    reset({
      concepto: '',
      monto: 0,
      medio_pago: 'EFECTIVO',
      nro_tramite: ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Nuevo Egreso</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 1 }}>
          <Alert severity="warning">
            Este egreso quedará <strong>PENDIENTE</strong> hasta que sea aprobado por un Revisor de Cuenta.
          </Alert>

          <TextField 
            label="Concepto" 
            fullWidth
            multiline
            rows={2}
            placeholder="Ej: Compra de equipamiento deportivo"
            {...register('concepto')} 
            error={!!errors.concepto}
            helperText={errors.concepto?.message}
          />

          <TextField 
            label="Monto" 
            type="number"
            inputProps={{ step: '0.01', min: '0.01' }}
            {...register('monto', { valueAsNumber: true })} 
            error={!!errors.monto}
            helperText={errors.monto?.message}
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
            <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
          </TextField>

          {medioPago === 'TRANSFERENCIA' && (
            <TextField 
              label="Número de Trámite (Transferencia)" 
              fullWidth
              placeholder="Ej: TRX-123456"
              {...register('nro_tramite')} 
              error={!!errors.nro_tramite}
              helperText={errors.nro_tramite?.message}
            />
          )}

          <Alert severity="info">
            <strong>Importante:</strong> El egreso será enviado al Revisor de Cuenta para su aprobación.
            No se descontará de la caja hasta que sea aprobado.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button 
          disabled={isSubmitting} 
          variant="contained" 
          color="error"
          onClick={submit}
        >
          Solicitar Egreso
        </Button>
      </DialogActions>
    </Dialog>
  );
}

