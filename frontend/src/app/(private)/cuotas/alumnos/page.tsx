'use client';
import * as React from 'react';
import api from '@/lib/api';
import DataTable from '@/components/data/DataTable';
import type { GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography, Button, useMediaQuery, TextField, MenuItem, IconButton, Tooltip, Card, CardContent, Chip, Grid, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import { useAuthStore } from '@/store/auth';
import { can, type Rol } from '@/lib/rbac';

type Row = {
  id?: number;
  persona_id?: number;
  periodo?: string;
  estado?: string;
  saldo?: number;
  total_importe?: number;
  saldo_con_mora?: number;
  dias_atraso?: number;
  apellido?: string;
  nombre?: string;
  dni?: string;
};

export default function CuotasAlumnosList(){
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = React.useState(0);
  const [q, setQ] = React.useState('');
  const pageSize = 25;
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
    const paths = ['/cuotas-alumno', '/api/cuotas-alumno'];
    let lastErr: any;
    for (const p of paths){
      try { return (await api.get(p, { params })).data; } catch(e){ lastErr = e; }
    }
    throw lastErr;
  }

  const { data, isFetching } = useQuery({
    queryKey: ['cuotas-alumno', page, pageSize, q],
    queryFn: async ()=> fetchCuotas(page, pageSize)
  });

  const pagarMutation = useMutation({
    mutationFn: async ({ id, monto, medio_pago, nro_tramite }:{ id:number; monto:number; medio_pago?:string; nro_tramite?:string; }) => {
      const paths = [`/cuotas-alumno/${id}/pagar`, `/api/cuotas-alumno/${id}/pagar`];
      let lastErr: any;
      for (const p of paths){
        try { return (await api.put(p, { monto, medio_pago, nro_tramite })).data; } catch(e){ lastErr = e; }
      }
      throw lastErr;
    },
    onSuccess: ()=> qc.invalidateQueries({ queryKey: ['cuotas-alumno'] })
  });

  const rows: Row[] = data?.data || data?.rows || [];
  const rowCount = data?.total || data?.count || 0;
  const [viewMode, setViewMode] = React.useState<'cards'|'table'>('cards');

  // Agrupar deudas por alumno (persona)
  const deudasPorAlumno = React.useMemo(()=>{
    const map = new Map<number, { persona_id:number; dni?:string; nombre?:string; apellido?:string; periodos:Array<{ id?:number; periodo?:string; base:number; mora:number; total:number; dias?:number; estado?:string }> }>();
    for (const r of rows){
      const estado = String(r.estado||'').toUpperCase();
      const base0 = Number(r.total_importe ?? r.saldo ?? 0) || 0;
      const total0 = Number(r.saldo_con_mora ?? base0) || base0;
      const mora0 = Math.max(0, total0 - base0);
      const pendiente = estado !== 'PAGADA' && total0 > 0;
      if (!pendiente) continue;
      const pid = Number(r.persona_id || 0) || 0;
      if (!map.has(pid)) map.set(pid, { persona_id:pid, dni: r.dni as any, nombre: r.nombre as any, apellido: r.apellido as any, periodos: [] });
      map.get(pid)!.periodos.push({ id: r.id as any, periodo:r.periodo, base: base0, mora: mora0, total: total0, dias: Number(r.dias_atraso||0) || undefined, estado:r.estado });
    }
    return Array.from(map.values()).sort((a,b)=> (a.apellido||'').localeCompare(b.apellido||''));
  }, [rows]);

  const [pagarTodasRow, setPagarTodasRow] = React.useState<{ persona_id: number; dni?: string; nombre?: string; apellido?: string; total_deuda: number } | null>(null);
  const [pagoTodas, setPagoTodas] = React.useState<{ monto: string; medio_pago: string; nro_tramite: string }>({ monto: '', medio_pago: 'EFECTIVO', nro_tramite: '' });

  const pagarTodasMutation = useMutation({
    mutationFn: async ({ persona_id, monto, medio_pago, nro_tramite }:{ persona_id:number; monto:number; medio_pago?:string; nro_tramite?:string; }) => {
      return (await api.post(`/personas/${persona_id}/pagar-cuotas-alumno`, { monto_total: monto, medio_pago, nro_tramite })).data;
    },
    onSuccess: (result)=> { 
      setPagarTodasRow(null); 
      setPagoTodas({ monto:'', medio_pago:'EFECTIVO', nro_tramite:'' }); 
      qc.invalidateQueries({ queryKey: ['cuotas-alumno'] }); 
      alert(`Pagos registrados exitosamente!\n${result.cuotas_procesadas} cuotas pagadas\nMonto aplicado: $${result.monto_aplicado?.toFixed(2)}`);
    },
    onError: (error: any) => {
      console.error('Error al pagar cuotas de alumno:', error);
      alert(error?.response?.data?.error?.message || error?.message || 'No se pudo registrar el pago');
    }
  });

  const columns: GridColDef<Row>[] = [
    { field:'apellido', headerName:'Apellido', flex:1 },
    { field:'nombre', headerName:'Nombre', flex:1 },
    { field:'dni', headerName:'DNI', flex:1 },
    { field:'periodo', headerName:'Periodo', flex:1 },
    { field:'estado', headerName:'Estado', flex:1 },
    { field:'saldo', headerName:'Saldo', flex:1, valueGetter: (_v,row)=> Number(row.saldo_con_mora ?? row.saldo ?? row.total_importe ?? 0).toFixed(2) },
    { field: 'acciones', headerName: '', width: 120, sortable:false, filterable:false,
      renderCell: ({ row }) => {
        const id = row.id;
        const saldo = Number(row.saldo_con_mora ?? row.saldo ?? row.total_importe ?? 0) || 0;
        return (
          <Stack direction="row" gap={1} alignItems="center">
            {puedePagar && saldo > 0 && id && (
              <Button size="small" variant="contained" onClick={()=>{
                const monto = prompt('Monto a pagar', String(saldo.toFixed(2)));
                if (!monto) return; const n = Number(monto); if (!n) return;
                pagarMutation.mutate({ id, monto: n });
              }}>Pagar</Button>
            )}
            {id && (
              <Tooltip title="Recibo PDF">
                <IconButton size="small" onClick={()=> window.open(receiptUrl(`/cuotas-alumno/${id}/comprobante.pdf`), "_blank") }>
                  <ReceiptLongRounded fontSize="small"/>
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      }
    }
  ];

  return (
    <>
    <Stack direction="row" gap={1} sx={{ mb: 1, alignItems:'center' }}>
      <TextField size="small" label="Buscar" value={q} onChange={(e)=> setQ(e.target.value)} placeholder="apellido, nombre o DNI" />
      <Button variant="outlined" onClick={()=> qc.invalidateQueries({ queryKey: ['cuotas-alumno'] })}>Buscar</Button>
      <Button size="small" variant={viewMode==='cards'?'contained':'outlined'} onClick={()=> setViewMode(viewMode==='cards'?'table':'cards')}>
        {viewMode==='cards' ? 'Ver tabla' : 'Ver cards'}
      </Button>
    </Stack>
    {viewMode==='table' ? (
    <DataTable
      rows={rows}
      columns={columns as GridColDef[]}
      loading={isFetching}
      page={page}
      pageSize={pageSize}
      rowCount={rowCount}
      onPageChange={(m)=>setPage(m.page)}
      getRowId={(r: Row)=> r.id!}
    />
    ) : (
      <Stack gap={2}>
        <Typography variant="subtitle2" color="text.secondary">Deudas por alumno y periodo</Typography>
        <Grid container spacing={2}>
          {deudasPorAlumno.length===0 && (
            <Grid item xs={12}><Typography variant="body2">Sin deudas pendientes para el filtro actual.</Typography></Grid>
          )}
          {deudasPorAlumno.map(a => {
            const totalDeuda = a.periodos.reduce((sum, p) => sum + p.total, 0);
            return (
            <Grid key={a.persona_id} item xs={12} md={6} lg={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={700}>{a.apellido} {a.nombre}</Typography>
                      {a.dni && <Chip size="small" label={`DNI ${a.dni}`} />}
                    </Stack>
                    <Typography variant="h6" color="error" sx={{ textAlign: 'center', my: 1 }}>
                      Total Adeudado: ${totalDeuda.toFixed(2)}
                    </Typography>
                    {puedePagar && a.periodos.length > 0 && (
                      <Button 
                        fullWidth 
                        variant="contained" 
                        color="primary" 
                        size="large"
                        onClick={()=>{
                          setPagarTodasRow({
                            persona_id: a.persona_id,
                            dni: a.dni,
                            nombre: a.nombre,
                            apellido: a.apellido,
                            total_deuda: totalDeuda
                          });
                          setPagoTodas({ monto: totalDeuda.toFixed(2), medio_pago: 'EFECTIVO', nro_tramite: '' });
                        }}
                      >
                        Pagar Todas las Cuotas
                      </Button>
                    )}
                    <Stack spacing={0.75}>
                      {a.periodos.sort((a,b)=> String(a.periodo||'').localeCompare(String(b.periodo||''))).map((p,idx)=> (
                        <Box key={idx} sx={{ p:1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight={700}>{p.periodo}</Typography>
                            <Chip size="small" color={p.estado==='PAGADA'?'success':'warning'} label={p.estado||'PENDIENTE'} />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {`Base: $${p.base.toFixed(2)} • Mora: $${p.mora.toFixed(2)} • Total: $${p.total.toFixed(2)}`}
                          </Typography>
                          {p.dias!=null && p.dias > 0 && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {`Días de atraso: ${p.dias}`}
                            </Typography>
                          )}
                          <Stack direction="row" gap={1} sx={{ mt: 0.5 }}>
                            {puedePagar && p.id && p.total > 0 && (
                              <Button size="small" variant="contained" onClick={()=>{
                                const monto = prompt('Monto a pagar', String(p.total.toFixed(2)));
                                if (!monto) return; const n = Number(monto); if (!n) return;
                                pagarMutation.mutate({ id: p.id!, monto: n });
                              }}>Pagar</Button>
                            )}
                            {p.id && (
                              <Button size="small" variant="outlined" onClick={()=> window.open(receiptUrl(`/cuotas-alumno/${p.id}/comprobante.pdf`), "_blank")}>Recibo</Button>
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
      </Stack>
    )}

    <Dialog open={!!pagarTodasRow} onClose={()=> setPagarTodasRow(null)} fullWidth maxWidth="sm">
      <DialogTitle>Pagar Todas las Cuotas del Alumno</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body1">
            <strong>Alumno:</strong> {pagarTodasRow?.apellido} {pagarTodasRow?.nombre}
          </Typography>
          {pagarTodasRow?.dni && (
            <Typography variant="body2">
              <strong>DNI:</strong> {pagarTodasRow.dni}
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
              persona_id: pagarTodasRow.persona_id, 
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
    </>
  );
}

