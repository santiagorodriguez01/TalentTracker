'use client';
import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, MenuItem, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  concepto: z.string().min(1, 'El concepto es requerido'),
  monto: z.coerce.number().positive('El monto debe ser un número positivo'),
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

export default function IngresoDialog({ open, onClose, onSave }:{ open:boolean; onClose:()=>void; onSave:(v:any)=>void }){
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
    onSave({
      ...v,
      tipo: 'INGRESO'
    }); 
    reset(); 
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Registrar Ingreso</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 1 }}>
          <TextField 
            label="Concepto" 
            fullWidth
            placeholder="Ej: Venta de productos, Servicios varios, etc."
            {...register('concepto')} 
            error={!!errors.concepto}
            helperText={errors.concepto?.message}
          />
          
          <TextField 
            label="Monto" 
            type="number"
            inputProps={{ step: '0.01', min: '0.01' }}
            fullWidth
            {...register('monto', { valueAsNumber: true })} 
            error={!!errors.monto}
            helperText={errors.monto?.message}
          />
          
          <TextField 
            select 
            label="Medio de Pago" 
            {...register('medio_pago')}
            error={!!errors.medio_pago}
            helperText={errors.medio_pago?.message}
            defaultValue="EFECTIVO"
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
              defaultValue=""
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button 
          disabled={isSubmitting} 
          variant="contained" 
          color="primary"
          onClick={submit}
        >
          Registrar Ingreso
        </Button>
      </DialogActions>
    </Dialog>
  );
}
