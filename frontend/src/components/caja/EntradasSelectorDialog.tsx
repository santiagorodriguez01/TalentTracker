'use client';
import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, IconButton } from '@mui/material';
import ConfirmationNumberRounded from '@mui/icons-material/ConfirmationNumberRounded';
import LocalActivityRounded from '@mui/icons-material/LocalActivityRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';

export default function EntradasSelectorDialog({ open, onClose, onSelect }:{ open:boolean; onClose:()=>void; onSelect:(tipo:'local'|'visitante')=>void }){
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        Seleccionar tipo de entradas
        <IconButton size="small" onClick={onClose} aria-label="Cerrar">
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack gap={2} sx={{ mt: 1 }} direction={{ xs:'column', sm:'row' }}>
          <Button size="large" variant="contained" color="success"
            startIcon={<ConfirmationNumberRounded sx={{ fontSize: 36 }} />}
            onClick={()=> onSelect('local')}
            sx={{ py: 2, flex: 1, fontSize: { xs: '1.05rem', sm: '1.1rem' } }}>
            Entrada Local
          </Button>
          <Button size="large" variant="contained" color="secondary"
            startIcon={<LocalActivityRounded sx={{ fontSize: 36 }} />}
            onClick={()=> onSelect('visitante')}
            sx={{ py: 2, flex: 1, fontSize: { xs: '1.05rem', sm: '1.1rem' } }}>
            Entrada Visitante
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
