'use client';
import { Button, Stack } from '@mui/material';
import api from '@/lib/api';

async function dl(path:string, filename:string){
  const { data } = await api.get(path, { responseType:'blob' });
  const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

export default function Reportes(){
  return (
    <Stack gap={2}>
      <Button variant="outlined" onClick={()=>dl('/export/socios.csv', 'socios.csv')}>Socios CSV</Button>
      <Button variant="outlined" onClick={()=>dl('/export/morosos.csv', 'morosos.csv')}>Morosos CSV</Button>
      <Button variant="outlined" onClick={()=>dl('/export/alumnos.csv', 'alumnos.csv')}>Alumnos CSV</Button>
      <Button variant="outlined" onClick={()=>dl('/export/jugadores.csv', 'jugadores.csv')}>Jugadores CSV</Button>
    </Stack>
  );
}
