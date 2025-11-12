'use client';
import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, MenuItem, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  cantidad: z.coerce.number().min(1, 'La cantidad debe ser al menos 1'),
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

export default function VentaEntradaVisitanteDialog({ open, onClose, onSave }:{ open:boolean; onClose:()=>void; onSave:(v:any)=>void }){
  const { register, handleSubmit, reset, watch, formState:{ errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cantidad: 1,
      medio_pago: 'EFECTIVO',
      nro_tramite: ''
    }
  });

  const medioPago = watch('medio_pago');
  const cantidad = watch('cantidad');
  const montoFijo = 5000;
  const montoTotal = montoFijo * (cantidad || 1);

  const submit = handleSubmit((v)=>{ 
    onSave({
      ...v,
      monto: montoTotal,
      cantidad: cantidad || 1,
      concepto: 'Venta Entrada Visitante'
    }); 
    reset(); 
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Venta Entrada Visitante</DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            Precio por entrada: <strong>${montoFijo.toLocaleString('es-AR')}</strong>
          </Alert>
          
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
            value={`$${montoTotal.toLocaleString('es-AR')}`}
            fullWidth
            disabled
            helperText={`${cantidad || 1} entrada(s) × $${montoFijo.toLocaleString('es-AR')} = $${montoTotal.toLocaleString('es-AR')}`}
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
          Confirmar Venta
        </Button>
      </DialogActions>
    </Dialog>
  );
}
