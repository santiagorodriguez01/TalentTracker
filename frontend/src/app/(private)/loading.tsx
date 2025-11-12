'use client';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function Loading(){
  return (
    <Box sx={{ display:'grid', placeItems:'center', minHeight:'50dvh', gap: 1 }}>
      <CircularProgress color="primary"/>
      <Typography variant="body2" color="text.secondary">Cargando…</Typography>
    </Box>
  );
}

