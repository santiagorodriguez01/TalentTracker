'use client';
import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, MenuItem, Alert } from '@mui/material';

const MEDIOS = ['EFECTIVO','TRANSFERENCIA'] as const;

export default function TransferTesoreriaDialog({ open, onClose, onSave }: { open: boolean; onClose: ()=>void; onSave: (v: { monto: number; medio_pago: typeof MEDIOS[number]; nro_tramite?: string })=>Promise<void> | void }){
  const [monto, setMonto] = React.useState<string>('');
  const [medio, setMedio] = React.useState<typeof MEDIOS[number]>('EFECTIVO');
  const [tramite, setTramite] = React.useState('');
  const [err, setErr] = React.useState<string | null>(null);
  const requiereTramite = medio === 'TRANSFERENCIA';
  const reset = ()=>{ setMonto(''); setMedio('EFECTIVO'); setTramite(''); setErr(null); };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Transferir a Tesorería</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {err && <Alert severity="error">{err}</Alert>}
          <TextField
            label="Monto"
            type="number"
            inputProps={{ step:'0.01', min:'0' }}
            value={monto}
            onChange={(e)=> setMonto(e.target.value)}
          />
          <TextField select label="Medio" value={medio} onChange={(e)=> setMedio(e.target.value as any)}>
            {MEDIOS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>
          <TextField
            label="Nro. trámite"
            value={tramite}
            onChange={(e)=> setTramite(e.target.value)}
            required={requiereTramite}
            helperText={requiereTramite ? 'Obligatorio para transferencia bancaria' : ''}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={()=>{ reset(); onClose(); }}>Cancelar</Button>
        <Button
          onClick={async ()=>{
            const n = Number(monto);
            if (!Number.isFinite(n) || n <= 0) { setErr('Ingrese un monto válido'); return; }
            if (requiereTramite && !tramite.trim()) { setErr('Ingrese nro. de trámite'); return; }
            setErr(null);
            await onSave({ monto: n, medio_pago: medio, nro_tramite: tramite || undefined });
            reset();
          }}
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

