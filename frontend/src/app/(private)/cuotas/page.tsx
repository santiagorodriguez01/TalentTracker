'use client';
import * as React from 'react';
import api from '@/lib/api';
import DataTable from '@/components/data/DataTable';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography, Button, useMediaQuery, TextField, MenuItem, IconButton, Tooltip, Card, CardContent, Chip, Box, Grid } from '@mui/material';
import QrCodeScannerRounded from '@mui/icons-material/QrCodeScannerRounded';
import QrScanDialog from '@/components/media/QrScanDialog';
import Link from 'next/link';
import { useTheme } from '@mui/material/styles';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import AddCircleRounded from '@mui/icons-material/AddCircleRounded';
import { useAuthStore } from '@/store/auth';
import { can, type Rol } from '@/lib/rbac';
import PagoCuotaDialog from '@/components/caja/PagoCuotaDialog';

type Row = {
  id?: number;
  cuota_id?: number;
  socio_id?: number;
  periodo?: string;
  estado?: string;
  saldo?: number;
  importe?: number;
  saldo_con_mora?: number;
  dias_atraso?: number;
  nro_socio?: string;
  nombre?: string;
  apellido?: string;
};

export default function CuotasList(){
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = React.useState(0);
  const [openRow, setOpenRow] = React.useState<Row | null>(null);
  const pageSize = 25;
  const [q, setQ] = React.useState('');
  const [pagarRow, setPagarRow] = React.useState<Row | null>(null);
  const [pago, setPago] = React.useState<{ monto: string; medio_pago: string; nro_tramite: string }>({ monto: '', medio_pago: 'EFECTIVO', nro_tramite: '' });
  const [qrOpen, setQrOpen] = React.useState(false);
  const qc = useQueryClient();
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;
  const puedePagar = rol ? can.pagarCuotas(rol) : false;
  const receiptUrl = React.useCallback((path:string)=>{
    try {
      const token = useAuthStore.getState().token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const q = token ? `?bearer=${encodeURIComponent(token)}` : '';
      return `/api/proxy${path}${q}`;
    } catch { return `/api/proxy${path}`; }
  },[]);

  async function fetchCuotas(pageNum:number, size:number){
    const params = { page: pageNum+1, size, q: q || undefined } as any;
    const paths = ['/cuotas', '/api/cuotas'];
    let lastErr: any;
    for (const p of paths){
      try { return (await api.get(p, { params })).data; } catch(e){ lastErr = e; }
    }
    throw lastErr;
  }

  const { data, isFetching } = useQuery({
    queryKey: ['cuotas', page, pageSize, q],
    queryFn: async ()=> fetchCuotas(page, pageSize)
  });

  const pagarMutation = useMutation({
    mutationFn: async ({ id, monto, medio_pago, nro_tramite }:{ id:number; monto:number; medio_pago?:string; nro_tramite?:string; }) => {
      const paths = [`/cuotas/${id}/pagar`, `/api/cuotas/${id}/pagar`];
      let lastErr: any;
      for (const p of paths){
        try { return (await api.put(p, { monto, medio_pago, nro_tramite })).data; } catch(e){ lastErr = e; }
      }
      throw lastErr;
    },
    onSuccess: ()=> { setPagarRow(null); setPago({ monto:'', medio_pago:'EFECTIVO', nro_tramite:'' }); qc.invalidateQueries({ queryKey: ['cuotas'] }); }
  });

  const rows: Row[] = data?.data || data?.rows || [];
  const rowCount = data?.total || data?.count || 0;

  const [viewMode, setViewMode] = React.useState<'cards'|'table'>('cards');

  const deudasPorSocio = React.useMemo(()=>{
    const map = new Map<number, { socio_id:number; nro_socio?:string; nombre?:string; apellido?:string; periodos:Array<{ id?:number; periodo?:string; base:number; mora:number; total:number; dias?:number; estado?:string }> }>();
    for (const r of rows){
      const estado = String(r.estado||'').toUpperCase();
      const base0 = Number(r.importe ?? r.saldo ?? 0) || 0;
      const total0 = Number(r.saldo_con_mora ?? base0) || base0;
      const mora0 = Math.max(0, total0 - base0);
      const pendiente = estado !== 'PAGADA' && total0 > 0;
      if (!pendiente) continue;
      const sid = Number(r.socio_id || 0) || 0;
      if (!map.has(sid)) map.set(sid, { socio_id:sid, nro_socio: r.nro_socio as any, nombre: r.nombre as any, apellido: r.apellido as any, periodos: [] });
      map.get(sid)!.periodos.push({ id: (r.id ?? r.cuota_id) as any, periodo:r.periodo, base: base0, mora: mora0, total: total0, dias: Number(r.dias_atraso||0) || undefined, estado:r.estado });
    }
    return Array.from(map.values()).sort((a,b)=> (a.apellido||'').localeCompare(b.apellido||''));
  }, [rows]);

  const [pagarTodasRow, setPagarTodasRow] = React.useState<{ socio_id: number; nro_socio?: string; nombre?: string; apellido?: string; total_deuda: number } | null>(null);
  const [pagoTodas, setPagoTodas] = React.useState<{ monto: string; medio_pago: string; nro_tramite: string }>({ monto: '', medio_pago: 'EFECTIVO', nro_tramite: '' });
  const [openPagoCuotaGeneral, setOpenPagoCuotaGeneral] = React.useState(false);

  const pagarTodasMutation = useMutation({
    mutationFn: async ({ socio_id, monto, medio_pago, nro_tramite }:{ socio_id:number; monto:number; medio_pago?:string; nro_tramite?:string; }) => {
      return (await api.post(`/socios/${socio_id}/pagar-cuotas`, { monto_total: monto, medio_pago, nro_tramite })).data;
    },
    onSuccess: (result)=> {
      setPagarTodasRow(null);
      setPagoTodas({ monto:'', medio_pago:'EFECTIVO', nro_tramite:'' });
      qc.invalidateQueries({ queryKey: ['cuotas'] });
      alert(`Pagos registrados exitosamente!\n${result.cuotas_procesadas} cuotas pagadas\nMonto aplicado: $${result.monto_aplicado?.toFixed(2)}`);
    },
    onError: (error: any) => {
      console.error('Error al pagar cuotas:', error);
      alert(error?.response?.data?.error?.message || error?.message || 'No se pudo registrar el pago');
    }
  });

  // Función para pagar cuota general (cualquier socio)
  async function pagarCuotaGeneral(v: any) {
    try {
      await api.post('/caja/pago-cuota', v);
      setOpenPagoCuotaGeneral(false);
      qc.invalidateQueries({ queryKey: ['cuotas'] });
      alert('Pago de cuota registrado exitosamente');
    } catch (error: any) {
      console.error('Error al pagar cuota:', error);
      alert(error?.response?.data?.error?.message || error?.message || 'No se pudo registrar el pago');
    }
  }

  const columns: GridColDef<Row>[] = [
    { field:'id', headerName:'ID', width:90, valueGetter: (_v, row) => row.id ?? row.cuota_id },
    { field:'socio_id', headerName:'Socio', flex:1, valueGetter: (_v,row)=> row.socio_id || row.nro_socio },
    { field:'periodo', headerName:'Periodo', flex:1 },
    { field:'estado', headerName:'Estado', flex:1 },
    { field:'saldo', headerName:'Saldo', flex:1, valueGetter: (_v, row) => {
        const base = Number(row.saldo ?? row.importe ?? 0);
        const mora = Number(row.saldo_con_mora ?? base);
        return (Number.isFinite(mora) ? mora : base).toFixed(2);
      }
    },
    { field: 'acciones', headerName: '', width: 90, sortable:false, filterable:false,
      renderCell: ({ row }) => {
        const id = row.id ?? row.cuota_id;
        const saldo = Number(row.saldo_con_mora ?? row.saldo ?? row.importe ?? 0) || 0;
        return (
          <Stack direction="row" gap={1} alignItems="center">
            {puedePagar && saldo > 0 && (
              <Button size="small" variant="contained" onClick={()=>{ setPagarRow(row); setPago({ monto: String(saldo.toFixed(2)), medio_pago: 'EFECTIVO', nro_tramite: '' }); }}>Pagar</Button>
            )}
            {id && (
              <Button size="small" variant="outlined" startIcon={<ReceiptLongRounded/>} onClick={()=> window.open(receiptUrl(`/cuotas/${id}/comprobante.pdf`), "_blank")}>
                Recibo
              </Button>
            )}
          </Stack>
        );
      }
    }
  ];
  const columnsFiltered: GridColDef<Row>[] = React.useMemo(()=>{
    if (!isSmall) return columns;
    const pick = new Set(['socio_id','periodo','estado']);
    return columns.filter(c => pick.has(c.field as string) || c.field === 'id');
  },[isSmall]);

  return (
    <>
    <Stack direction="row" gap={1} sx={{ mb: 1, alignItems:'center', flexWrap: 'wrap' }}>
      <TextField size="small" label="Buscar" value={q} onChange={(e)=> setQ(e.target.value)} placeholder="apellido, nombre o nro socio" />
      <Tooltip title="Escanear QR">
        <span>
          <IconButton color="primary" onClick={()=> setQrOpen(true)}>
            <QrCodeScannerRounded />
          </IconButton>
        </span>
      </Tooltip>
      <Button variant="outlined" onClick={()=> qc.invalidateQueries({ queryKey: ['cuotas'] })}>Buscar</Button>
      {puedePagar && (
        <Button
          variant="contained"
          color="success"
          startIcon={<AddCircleRounded />}
          onClick={()=> setOpenPagoCuotaGeneral(true)}
        >
          Pagar Cuota
        </Button>
      )}
      <Button component={Link} href="/cuotas/alumnos" variant="text">Cuotas de alumnos</Button>
      <Button size="small" variant={viewMode==='cards'?'contained':'outlined'} onClick={()=> setViewMode(viewMode==='cards'?'table':'cards')}>
        {viewMode==='cards' ? 'Ver tabla' : 'Ver cards'}
      </Button>
    </Stack>
    {viewMode==='table' ? (
    <DataTable
      rows={rows}
      columns={columnsFiltered as GridColDef[]}
      loading={isFetching}
      page={page}
      pageSize={pageSize}
      rowCount={rowCount}
      onPageChange={(m)=>setPage(m.page)}
      onRowClick={(p:any)=>{ if (isSmall) setOpenRow(p.row as Row); }}
      getRowId={(r: Row)=> r.id ?? r.cuota_id ?? `${r.socio_id}-${r.periodo}`}
    />
    ) : (
      <Stack gap={2}>
        <Typography variant="subtitle2" color="text.secondary">Deudas por socio y periodo</Typography>
        <Grid container spacing={2}>
          {deudasPorSocio.length===0 && (
            <Grid item xs={12}><Typography variant="body2">Sin deudas pendientes para el filtro actual.</Typography></Grid>
          )}
          {deudasPorSocio.map(s => {
            const totalDeuda = s.periodos.reduce((sum, p) => sum + p.total, 0);
            return (
            <Grid key={s.socio_id} item xs={12} md={6} lg={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={700}>{s.apellido} {s.nombre}</Typography>
                      {s.nro_socio && <Chip size="small" label={`Socio ${s.nro_socio}`} />}
                    </Stack>
                    <Typography variant="h6" color="error" sx={{ textAlign: 'center', my: 1 }}>
                      Total Adeudado: ${totalDeuda.toFixed(2)}
                    </Typography>
                    {puedePagar && s.periodos.length > 0 && (
                      <Button 
                        fullWidth 
                        variant="contained" 
                        color="primary" 
                        size="large"
                        onClick={()=>{
                          setPagarTodasRow({
                            socio_id: s.socio_id,
                            nro_socio: s.nro_socio,
                            nombre: s.nombre,
                            apellido: s.apellido,
                            total_deuda: totalDeuda
                          });
                          setPagoTodas({ monto: totalDeuda.toFixed(2), medio_pago: 'EFECTIVO', nro_tramite: '' });
                        }}
                      >
                        Pagar Todas las Cuotas
                      </Button>
                    )}
                    <Stack spacing={0.75}>
                      {s.periodos.sort((a,b)=> String(a.periodo||'').localeCompare(String(b.periodo||''))).map((p,idx)=> (
                        <Box key={idx} sx={{ p:1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight={700}>{p.periodo}</Typography>
                            <Chip size="small" color={p.estado==='PAGADA'?'success':'warning'} label={p.estado||'PENDIENTE'} />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {`Base: $${p.base.toFixed(2)} • Mora: $${p.mora.toFixed(2)} • Total: $${p.total.toFixed(2)}`}
                          </Typography>
                          {p.dias!=null && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {`Días de atraso: ${p.dias}`}
                            </Typography>
                          )}
                          <Stack direction="row" gap={1} sx={{ mt: 0.5 }}>
                            {puedePagar && p.id && p.total > 0 && (p.dias == null || p.dias > 0) && (
                              <Button size="small" variant="contained" onClick={()=>{
                                const row = rows.find(r => (r.id ?? r.cuota_id) === p.id);
                                if (row) {
                                  setPagarRow(row);
                                  const base0 = Number(row.importe ?? row.saldo ?? 0) || 0;
                                  const total0 = Number(row.saldo_con_mora ?? base0) || base0;
                                  setPago({ monto: String(total0.toFixed(2)), medio_pago: 'EFECTIVO', nro_tramite: '' });
                                }
                              }}>Pagar</Button>
                            )}
                            {p.id && (
                              <Button size="small" variant="outlined" onClick={()=> window.open(receiptUrl(`/cuotas/${p.id}/comprobante.pdf`), "_blank")}>Recibo</Button>
                            )}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            );
          })}
        </Grid>
        {false && (<>
        <Typography variant="subtitle2" color="text.secondary">Cuotas</Typography>
        <Grid container spacing={2}>
          {rows.map((row)=>{
            const base0 = Number(row.importe ?? row.saldo ?? 0) || 0;
            const total0 = Number(row.saldo_con_mora ?? base0) || base0;
            const mora0 = Math.max(0, total0 - base0);
            return (
              <Grid key={`${row.id ?? row.cuota_id}`} item xs={12} md={6} lg={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={700}>{row.apellido} {row.nombre}</Typography>
                        <Chip size="small" color={String(row.estado).toUpperCase()==='PAGADA'?'success':'warning'} label={row.estado} />
                      </Stack>
                      <Typography variant="body2">Periodo: <b>{row.periodo}</b></Typography>
                      <Typography variant="body2">{`Importe: $${base0.toFixed(2)} • Mora: $${mora0.toFixed(2)} • Total: $${total0.toFixed(2)}`}</Typography>
                      <Stack direction="row" gap={1}>
                        {puedePagar && Number(row.saldo_con_mora ?? row.saldo ?? row.importe ?? 0) > 0 && (
                          <Button size="small" variant="contained" onClick={()=>{ setPagarRow(row); setPago({ monto: String((Number(row.saldo_con_mora ?? row.saldo ?? row.importe ?? 0)).toFixed(2)), medio_pago: 'EFECTIVO', nro_tramite: '' }); }}>Pagar</Button>
                        )}
                        {(row.id || row.cuota_id) && (
                          <Button size="small" variant="outlined" onClick={()=> window.open(receiptUrl(`/cuotas/${row.id ?? row.cuota_id}/comprobante.pdf`), "_blank")}>Recibo</Button>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        </>)}
      </Stack>
    )}
    <Dialog open={!!openRow} onClose={()=>setOpenRow(null)} fullWidth maxWidth="sm">
      <DialogTitle>Detalle de cuota</DialogTitle>
      <DialogContent>
        {openRow && (
          <Stack spacing={1.2} sx={{ mt: 1 }}>
            <Typography variant="body2"><b>ID:</b> {openRow.id ?? openRow.cuota_id}</Typography>
            <Typography variant="body2"><b>Socio:</b> {openRow.socio_id}</Typography>
            <Typography variant="body2"><b>Periodo:</b> {openRow.periodo}</Typography>
            <Typography variant="body2"><b>Estado:</b> {openRow.estado}</Typography>
            <Typography variant="body2"><b>Saldo/Importe:</b> {Number(openRow.saldo ?? openRow.importe ?? 0).toFixed(2)}</Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={()=>setOpenRow(null)}>Cerrar</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={!!pagarRow} onClose={()=> setPagarRow(null)} fullWidth maxWidth="xs">
      <DialogTitle>Pagar cuota</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <Typography variant="body2">Periodo: {pagarRow?.periodo}</Typography>
          <TextField label="Monto" type="number" inputProps={{ step:'0.01', min:'0' }} value={pago.monto} onChange={(e)=> setPago(prev => ({ ...prev, monto: e.target.value }))} />
          <TextField select label="Medio de pago" value={pago.medio_pago} onChange={(e)=> setPago(prev => ({ ...prev, medio_pago: e.target.value }))}>
            {['EFECTIVO','MERCADO_PAGO','TRANSFERENCIA','DEBITO','CREDITO','OTRO'].map(mp => (
              <MenuItem key={mp} value={mp}>{mp.replace('_',' ')}</MenuItem>
            ))}
          </TextField>
          <TextField label="Nro. trámite" value={pago.nro_tramite} onChange={(e)=> setPago(prev => ({ ...prev, nro_tramite: e.target.value }))} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={()=> setPagarRow(null)}>Cancelar</Button>
        <Button variant="contained" disabled={pagarMutation.isPending || !pagarRow || !Number(pago.monto)} onClick={async ()=>{
            if (!pagarRow) return;
            const id = pagarRow.id ?? pagarRow.cuota_id!;
            try { await pagarMutation.mutateAsync({ id, monto: Number(pago.monto), medio_pago: pago.medio_pago, nro_tramite: pago.nro_tramite || undefined }); }
            catch (e:any) { alert(e?.response?.data?.error?.message || 'No se pudo registrar el pago'); }
          }}>Confirmar pago</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={!!pagarTodasRow} onClose={()=> setPagarTodasRow(null)} fullWidth maxWidth="sm">
      <DialogTitle>Pagar Todas las Cuotas</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body1">
            <strong>Socio:</strong> {pagarTodasRow?.apellido} {pagarTodasRow?.nombre}
          </Typography>
          {pagarTodasRow?.nro_socio && (
            <Typography variant="body2">
              <strong>Nro. Socio:</strong> {pagarTodasRow.nro_socio}
            </Typography>
          )}
          <Typography variant="h6" color="error">
            Total Adeudado: ${pagarTodasRow?.total_deuda.toFixed(2)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Se pagarán las cuotas de la más antigua a la más reciente hasta cubrir el monto ingresado.
          </Typography>
          <TextField 
            label="Monto a Pagar" 
            type="number" 
            inputProps={{ step:'0.01', min:'0' }} 
            value={pagoTodas.monto} 
            onChange={(e)=> setPagoTodas(prev => ({ ...prev, monto: e.target.value }))}
            helperText="Puede pagar el total o un monto parcial"
          />
          <TextField 
            select 
            label="Medio de Pago" 
            value={pagoTodas.medio_pago} 
            onChange={(e)=> setPagoTodas(prev => ({ ...prev, medio_pago: e.target.value }))}
          >
            {['EFECTIVO','MERCADO_PAGO','TRANSFERENCIA','DEBITO','CREDITO','OTRO'].map(mp => (
              <MenuItem key={mp} value={mp}>{mp.replace('_',' ')}</MenuItem>
            ))}
          </TextField>
          <TextField 
            label="Nro. Trámite (opcional)" 
            value={pagoTodas.nro_tramite} 
            onChange={(e)=> setPagoTodas(prev => ({ ...prev, nro_tramite: e.target.value }))} 
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={()=> setPagarTodasRow(null)}>Cancelar</Button>
        <Button 
          variant="contained" 
          disabled={pagarTodasMutation.isPending || !pagarTodasRow || !Number(pagoTodas.monto)} 
          onClick={async ()=>{
            if (!pagarTodasRow) return;
            pagarTodasMutation.mutate({ 
              socio_id: pagarTodasRow.socio_id, 
              monto: Number(pagoTodas.monto), 
              medio_pago: pagoTodas.medio_pago, 
              nro_tramite: pagoTodas.nro_tramite || undefined 
            });
          }}
        >
          Confirmar Pago
        </Button>
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
          if (idx >= 0) { let rest = p.slice(idx + 4); if (rest.startsWith('/')) rest = rest.slice(1); token = rest.split('/')[0]; if (token.toLowerCase().endsWith('.png')) token = token.slice(0, -4); }
        } catch {}
        if (!token && s.toLowerCase().includes('/qr/')) { let rest = s.slice(s.toLowerCase().indexOf('/qr/') + 4); if (rest.startsWith('/')) rest = rest.slice(1); token = rest.split('/')[0]; if (token.toLowerCase().endsWith('.png')) token = token.slice(0, -4); }
        if (!token) token = s;
        if (/^\d{4,}$/.test(token)) { setQ(token); setPage(0); return; }
        try{ const resp = await api.get(`/qr/${token}`, { // evitar logout si 401
          // @ts-ignore
          skipAuth: true, allow401: true, headers: { 'X-Skip-Auth': '1' }
        } as any); const pid = resp?.data?.pid || resp?.data?.persona_id || resp?.data?.payload?.pid; const nro = resp?.data?.nro_socio;
          if (nro){ setQ(String(nro)); setPage(0); }
          else if (pid){ const { data } = await api.get('/socios', { params: { persona_id: pid, page:1, size:1 } }); const row = (data?.data || data?.rows || [])[0]; if (row?.nro_socio){ setQ(String(row.nro_socio)); setPage(0); } } } catch {}
      } finally { setQrOpen(false); }
    }} />

    <PagoCuotaDialog
      open={openPagoCuotaGeneral}
      onClose={()=> setOpenPagoCuotaGeneral(false)}
      onSave={pagarCuotaGeneral}
    />
    </>
  );
}
