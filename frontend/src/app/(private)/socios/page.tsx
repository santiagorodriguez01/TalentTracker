'use client';
import * as React from 'react';
import api from '@/lib/api';
import DataTable from '@/components/data/DataTable';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography, useMediaQuery, TextField, Card, CardContent, Chip, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CreditCardRounded from '@mui/icons-material/CreditCardRounded';
import QrCodeScannerRounded from '@mui/icons-material/QrCodeScannerRounded';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { can, type Rol } from '@/lib/rbac';
import QrScanDialog from '@/components/media/QrScanDialog';

type Row = {
  id?: number;
  socio_id?: number;
  persona_id?: number;
  persona?: { id?: number; nombre?: string; apellido?: string } | null;
  nro_socio?: string;
  nombre?: string;
  apellido?: string;
  estado?: string;
};

export default function SociosList(){
  const router = useRouter();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = React.useState(0);
  const [openRow, setOpenRow] = React.useState<Row | null>(null);
  const pageSize = 25;
  const [q, setQ] = React.useState('');
  const [personaFilter, setPersonaFilter] = React.useState<number|undefined>(undefined);
  const [qrOpen, setQrOpen] = React.useState(false);
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;
  const puedeEditar = rol ? can.editarSocio(rol) : false;

  async function fetchSociosList(pageNum:number, size:number){
    const params = { page: pageNum+1, size, q: q || undefined, persona_id: personaFilter } as any;
    const paths = ['/socios', '/api/socios'];
    let lastErr: any;
    for (const p of paths){
      try { return (await api.get(p, { params })).data; } catch(e){ lastErr = e; }
    }
    throw lastErr;
  }

  const { data, isFetching } = useQuery({
    queryKey: ['socios', page, pageSize, q, personaFilter],
    queryFn: async ()=> fetchSociosList(page, pageSize)
  });

  const rows: Row[] = data?.data || data?.rows || [];
  const rowCount = data?.total || data?.count || 0;
  const [viewMode, setViewMode] = React.useState<'cards'|'table'>('cards');

  const columns: GridColDef<Row>[] = [
    { field:'socio_id', headerName:'ID', width:90, valueGetter: (_v,row)=> row.id ?? row.socio_id },
    { field:'nro_socio', headerName:'N Socio', flex:1 },
    // algunos back devuelven nombre/apellido directo; otros dentro de persona:
    { field:'nombre',  headerName:'Nombre',  flex:1, valueGetter: (_v,row)=> row.nombre ?? row.persona?.nombre ?? '' },
    { field:'apellido',headerName:'Apellido',flex:1, valueGetter: (_v,row)=> row.apellido ?? row.persona?.apellido ?? '' },
    { field:'estado',  headerName:'Estado',  flex:1 },
    {
      field: 'acciones',
      headerName: '',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (p: GridRenderCellParams<Row>) => {
        const personaId =
          p.row.persona_id ??
          p.row.persona?.id ??
          undefined;
        const disabled = !personaId;
        return (
          <Tooltip title={disabled ? 'Sin persona vinculada' : 'Ver credencial'}>
            <span>
              <IconButton
                size="small"
                disabled={disabled}
                onClick={()=> !disabled && router.push(`/credenciales/${personaId}`)}
              >
                <CreditCardRounded fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        );
      }
    }
  ];
  const columnsFiltered: GridColDef<Row>[] = React.useMemo(()=>{
    if (!isSmall) return columns;
    const pick = new Set(['apellido','nombre','nro_socio','estado']);
    return columns.filter(c => pick.has(c.field as string));
  },[isSmall]);

  return (
    <>
    <Stack direction="row" gap={1} sx={{ mb: 1, alignItems:'center' }}>
      <TextField size="small" label="Buscar" value={q} onChange={(e)=>{ setQ(e.target.value); setPersonaFilter(undefined); setPage(0); }} placeholder="apellido, nombre o nro socio" />
      <Tooltip title="Escanear QR">
        <span>
          <IconButton onClick={()=> setQrOpen(true)} color="primary">
            <QrCodeScannerRounded />
          </IconButton>
        </span>
      </Tooltip>
      <Button variant="outlined" onClick={()=>{ /* trigger refetch by touching state */ setPage(0); }}>Buscar</Button>
      <Button size="small" variant={viewMode==='cards'?'contained':'outlined'} onClick={()=> setViewMode(viewMode==='cards'?'table':'cards')}>
        {viewMode==='cards' ? 'Ver tabla' : 'Ver cards'}
      </Button>
    </Stack>
    {viewMode==='table' ? (
    <DataTable
      rows={rows}
      columns={columnsFiltered as any}
      loading={isFetching}
      page={page}
      pageSize={pageSize}
      rowCount={rowCount}
      onPageChange={(m)=>setPage(m.page)}
      onRowClick={(p:any)=>{ if (isSmall) setOpenRow(p.row as Row); }}
      getRowId={(r: Row)=> r.id ?? r.socio_id ?? `${r.nro_socio}`}
    />
    ) : (
      <Grid container spacing={2}>
        {rows.map((r)=>{
          const personaId = r.persona_id ?? r.persona?.id;
          return (
            <Grid key={r.socio_id ?? r.id ?? r.nro_socio} item xs={12} md={6} lg={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={700}>{r.apellido ?? r.persona?.apellido} {r.nombre ?? r.persona?.nombre}</Typography>
                      <Chip size="small" label={r.estado} color={r.estado==='AL_DIA'?'success':(r.estado==='MOROSO'?'warning':'default')} />
                    </Stack>
                    <Typography variant="body2">Socio: <b>{r.nro_socio || '-'}</b></Typography>
                    <Stack direction="row" gap={1}>
                      <Button size="small" variant="outlined" disabled={!personaId} onClick={()=> personaId && router.push(`/credenciales/${personaId}`)}>Ver credencial</Button>
                      {puedeEditar && (
                        <Button size="small" variant="contained" onClick={()=>{ const id = r.id ?? r.socio_id; if(id) router.push(`/socios/${id}`); }}>Editar</Button>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    )}
    <Dialog open={!!openRow} onClose={()=>setOpenRow(null)} fullWidth maxWidth="sm">
      <DialogTitle>Detalle de socio</DialogTitle>
      <DialogContent>
        {openRow && (
          <Stack spacing={1.2} sx={{ mt: 1 }}>
            <Typography variant="body2"><b>ID:</b> {openRow.id ?? openRow.socio_id}</Typography>
            <Typography variant="body2"><b>No Socio:</b> {openRow.nro_socio}</Typography>
            <Typography variant="body2"><b>Apellido:</b> {openRow.apellido ?? openRow.persona?.apellido}</Typography>
            <Typography variant="body2"><b>Nombre:</b> {openRow.nombre ?? openRow.persona?.nombre}</Typography>
            <Typography variant="body2"><b>Estado:</b> {openRow.estado}</Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        {openRow && (
          <Stack direction="column" spacing={1} sx={{ width:'100%' }}>
            <Button fullWidth variant="outlined" onClick={()=>{ const pid = openRow.persona_id ?? openRow.persona?.id; if(pid) router.push(`/credenciales/${pid}`); }}>Ver credencial</Button>
            {puedeEditar && (
              <Button fullWidth variant="contained" onClick={()=>{ const id = openRow.id ?? openRow.socio_id; if(id) router.push(`/socios/${id}`); }}>Editar</Button>
            )}
          </Stack>
        )}
      </DialogActions>
    </Dialog>
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
        if (/^\d{4,}$/.test(token)) { setQ(token); setPersonaFilter(undefined); setPage(0); return; }
        try{ const resp = await api.get(`/qr/${token}`, { // evitar logout si 401
          // @ts-ignore
          skipAuth: true, allow401: true, headers: { 'X-Skip-Auth': '1' }
        } as any); const pid = resp?.data?.pid || resp?.data?.persona_id || resp?.data?.payload?.pid;
          if (pid){ setPersonaFilter(Number(pid)); setQ(''); setPage(0); } } catch {}
      } finally { setQrOpen(false); }
    }} />
    </>
  );
}
