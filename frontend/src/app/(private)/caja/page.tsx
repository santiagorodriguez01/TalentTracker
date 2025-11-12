'use client';
import * as React from 'react';
import {
  Box,
  Button,
  Stack,
  TextField,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Skeleton,
  Grid,
  Alert
} from '@mui/material';
import CajaNewDialog from '@/components/caja/CajaNewDialog';
import VentaEntradaDialog from '@/components/caja/VentaEntradaDialog';
import EgresoDialog from '@/components/caja/EgresoDialog';
import VentaEntradaVisitanteDialog from '@/components/caja/VentaEntradaVisitanteDialog';
import TransferTesoreriaDialog from '@/components/caja/TransferTesoreriaDialog';
import EntradasSelectorDialog from '@/components/caja/EntradasSelectorDialog';
import { cajaApi } from '@/lib/cajaApi';
import { http } from '@/lib/http';
import BiometricVerifyDialog from '@/components/biometric/BiometricVerifyDialog';
import Link from 'next/link';
// useAuthStore ya está importado arriba
import { can, type Rol } from '@/lib/rbac';
import dayjs from 'dayjs';
import AddCircleRounded from '@mui/icons-material/AddCircleRounded';
import ConfirmationNumberRounded from '@mui/icons-material/ConfirmationNumberRounded';
import LocalActivityRounded from '@mui/icons-material/LocalActivityRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import OutboundRounded from '@mui/icons-material/OutboundRounded';
import AccountBalanceRounded from '@mui/icons-material/AccountBalanceRounded';
import CloudDownloadRounded from '@mui/icons-material/CloudDownloadRounded';
import PictureAsPdfRounded from '@mui/icons-material/PictureAsPdfRounded';
import { useAuthStore } from '@/store/auth';

interface Movimiento {
  id: number;
  fecha: string;
  concepto: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  medio_pago: string;
  nro_tramite: string | null;
  estado: 'APROBADO' | 'PENDIENTE' | 'RECHAZADO';
  responsable_id?: number;
  responsable_nombre?: string;
  responsable_apellido?: string;
}

export default function CajaPage(){
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;
  const canCrear = rol ? can.cajaCrear(rol) : false;
  const canReporte = rol ? can.cajaReportes(rol) : false;
  const canAprobar = rol ? can.aprobarEgreso(rol) : false;
  const userId: number | null = (authUser?.user?.id ?? authUser?.id ?? null) as number | null;
  const [open, setOpen] = React.useState(false);
  const [openVentaEntrada, setOpenVentaEntrada] = React.useState(false);
  const [openEgreso, setOpenEgreso] = React.useState(false);
  const [openVentaEntradaVisitante, setOpenVentaEntradaVisitante] = React.useState(false);
  const [openEntradas, setOpenEntradas] = React.useState(false);
  const [openTransfer, setOpenTransfer] = React.useState(false);
  const [verifyOpen, setVerifyOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<null | { kind: 'approve' | 'reject'; id: number }>(null);
  const [bioReady, setBioReady] = React.useState<boolean | null>(null);
  const [desde, setDesde] = React.useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [hasta, setHasta] = React.useState(dayjs().format('YYYY-MM-DD'));
  const [movimientos, setMovimientos] = React.useState<Movimiento[]>([]);
  const [totales, setTotales] = React.useState({ total_caja: 0, ingresos_hoy: 0, egresos_hoy: 0 });
  const [loading, setLoading] = React.useState(false);
  const receiptUrl = React.useCallback((path:string)=>{
    try {
      const token = useAuthStore.getState().token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const q = token ? `?bearer=${encodeURIComponent(token)}` : '';
      return `/api/proxy${path}${q}`;
    } catch { return `/api/proxy${path}`; }
  },[]);
  const [viewMode, setViewMode] = React.useState<'cards'|'table'>('cards');

interface MovimientosResponse {
  movimientos: Movimiento[];
  totales?: {
    total_caja: number;
    ingresos_hoy: number;
    egresos_hoy: number;
  };
}

  const cargarMovimientos = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await cajaApi.get<MovimientosResponse>('/movimientos');
      setMovimientos(data.movimientos || []);
      setTotales(data.totales || { total_caja: 0, ingresos_hoy: 0, egresos_hoy: 0 });
    } catch (error) {
      console.error('Error cargando movimientos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  async function doAprobarEgreso(id: number) {
    try {
      await cajaApi.put(`/${id}/aprobar`);
      cargarMovimientos();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Error al aprobar egreso');
    }
  }

  async function doRechazarEgreso(id: number) {
    try {
      await cajaApi.put(`/${id}/rechazar`);
      cargarMovimientos();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Error al rechazar egreso');
    }
  }

  function solicitarAprobacion(id: number) {
    if (!canAprobar) return;
    setPendingAction({ kind: 'approve', id });
    setVerifyOpen(true);
  }

  function solicitarRechazo(id: number) {
    if (!canAprobar) return;
    setPendingAction({ kind: 'reject', id });
    setVerifyOpen(true);
  }

  async function onVerified() {
    const act = pendingAction;
    setPendingAction(null);
    if (!act) return;
    if (act.kind === 'approve') await doAprobarEgreso(act.id);
    else await doRechazarEgreso(act.id);
  }

  React.useEffect(() => {
    cargarMovimientos();
  }, [cargarMovimientos]);

  // Chequear estado biométrico del revisor para mostrar aviso/atajo
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!userId) { setBioReady(null); return; }
        const { data } = await http.get(`/ai/usuarios/${userId}/biometric`);
        if (!mounted) return;
        setBioReady(!!data?.enrolled);
      } catch {
        if (!mounted) return;
        setBioReady(null);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  async function crearMovimiento(v:any){
    await cajaApi.post('', v);
    setOpen(false);
    cargarMovimientos();
  }

  async function crearVentaEntrada(v:any){
    await cajaApi.post('/venta-entrada', v);
    // Mantener abierto el diálogo de venta para múltiples operaciones
    cargarMovimientos();
  }


  async function crearEgreso(v:any){
    await cajaApi.post('/egreso', v);
    setOpenEgreso(false);
    cargarMovimientos();
  }

  async function crearVentaEntradaVisitante(v:any){
    await cajaApi.post('/venta-entrada-visitante', v);
    // Mantener abierto el diálogo de venta para múltiples operaciones
    cargarMovimientos();
  }

  async function transferirTesoreria(v: any){
    await cajaApi.post('/transferir', v);
    setOpenTransfer(false);
    cargarMovimientos();
  }

  async function descargar(){
    const { data } = await cajaApi.get<Blob>('/reporte.csv', { params:{ desde, hasta }, responseType:'blob' });
    const url = URL.createObjectURL(data);
    const a = document.createElement('a'); a.href=url; a.download=`reporte_caja_${desde}_${hasta}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Box sx={{ display:'grid', gap:2 }}>
      <Paper variant="outlined" sx={{ p: 1, display: 'grid', gap: 1 }}>
        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          <TextField size="small" type="date" label="Desde" value={desde} onChange={(e)=>setDesde(e.target.value)} />
          <TextField size="small" type="date" label="Hasta" value={hasta} onChange={(e)=>setHasta(e.target.value)} />
          {canReporte && (
            <>
              <Button size="small" variant="outlined" startIcon={<CloudDownloadRounded/>} onClick={descargar}>Reporte</Button>
              <Button component={Link} href="/caja/reportes" size="small" variant="contained">
                Ver por Cajero
              </Button>
            </>
          )}
        </Stack>
        {canCrear && (
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Button size="large" sx={{ py: 2, px: 2.5, fontSize: { xs: '1rem', sm: '1.05rem' } }} color="secondary" startIcon={<ConfirmationNumberRounded sx={{ fontSize: 30 }} />} onClick={()=> setOpenEntradas(true)}>Entradas</Button>
            <Button startIcon={<AddCircleRounded/>} onClick={()=>setOpen(true)}>Ingreso</Button>
            <Button color="error" startIcon={<OutboundRounded/>} onClick={()=>setOpenEgreso(true)}>Egreso</Button>
            <Button color="warning" startIcon={<AccountBalanceRounded/>} onClick={()=>setOpenTransfer(true)}>Transferir</Button>
          </Stack>
        )}
      </Paper>

      <Stack direction="row" gap={2} flexWrap="wrap">
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total en Caja
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={120} height={36} />
            ) : (
              <Typography variant="h5" component="div" color="primary">
                ${totales.total_caja.toFixed(2)}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Ingresos Hoy
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={120} height={36} />
            ) : (
              <Typography variant="h5" component="div" color="success.main">
                ${totales.ingresos_hoy.toFixed(2)}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Egresos Hoy
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={120} height={36} />
            ) : (
              <Typography variant="h5" component="div" color="error.main">
                ${totales.egresos_hoy.toFixed(2)}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Stack>

      {canAprobar && bioReady !== true && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          Para aprobar o rechazar egresos necesitas configurar tu biometría.{' '}
          <Button component={Link as any} href={'/perfil/biometria' as any} size="small" sx={{ ml: 1 }}>
            Configurar ahora
          </Button>
        </Alert>
      )}

      <Stack direction="row" justifyContent="flex-end" sx={{ mb:1 }}>
        <Button size="small" variant={viewMode==='cards'?'contained':'outlined'} onClick={()=> setViewMode(viewMode==='cards'?'table':'cards')}>
          {viewMode==='cards' ? 'Ver tabla' : 'Ver cards'}
        </Button>
      </Stack>
      {viewMode==='table' ? (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Concepto</TableCell>
              <TableCell>Cajero</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell>Medio de Pago</TableCell>
              <TableCell>Nro. Tramite</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && Array.from({ length: 6 }).map((_,i) => (
              <TableRow key={`sk-${i}`}>
                <TableCell><Skeleton width={24}/></TableCell>
                <TableCell><Skeleton width={120}/></TableCell>
                <TableCell><Skeleton width={180}/></TableCell>
                <TableCell><Skeleton width={120}/></TableCell>
                <TableCell><Skeleton width={60}/></TableCell>
                <TableCell><Skeleton width={80}/></TableCell>
                <TableCell align="right"><Skeleton width={60}/></TableCell>
                <TableCell><Skeleton width={90}/></TableCell>
                <TableCell><Skeleton width={90}/></TableCell>
                <TableCell align="center"><Skeleton width={100}/></TableCell>
              </TableRow>
            ))}
            {!loading && movimientos.map((mov) => (
              <TableRow key={mov.id} hover>
                <TableCell>{mov.id}</TableCell>
                <TableCell>{dayjs(mov.fecha).format('DD/MM/YYYY HH:mm')}</TableCell>
                <TableCell>{mov.concepto}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {mov.responsable_apellido && mov.responsable_nombre 
                      ? `${mov.responsable_apellido} ${mov.responsable_nombre}`
                      : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={mov.tipo}
                    color={mov.tipo === 'INGRESO' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={mov.estado}
                    color={
                      mov.estado === 'APROBADO' ? 'success' :
                      mov.estado === 'PENDIENTE' ? 'warning' :
                      'error'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography
                    color={mov.tipo === 'INGRESO' ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                  >
                    ${parseFloat(String(mov.monto)).toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>{mov.medio_pago || '-'}</TableCell>
                <TableCell>{mov.nro_tramite || '-'}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  <Button size="small" variant="outlined" startIcon={<PictureAsPdfRounded/>} onClick={()=> window.open(receiptUrl(`/caja/${mov.id}/comprobante.pdf`), "_blank")}>Recibo</Button>
                  &nbsp;
                  {mov.tipo === 'EGRESO' && mov.estado === 'PENDIENTE' && canAprobar && (
                    <Stack direction="row" gap={1} justifyContent="center">
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => solicitarAprobacion(mov.id)}
                      >
                        Aprobar
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => solicitarRechazo(mov.id)}
                      >
                        Rechazar
                      </Button>
                    </Stack>
                  )}
                  {(!canAprobar || mov.tipo === 'INGRESO' || mov.estado !== 'PENDIENTE') && '-'}
                </TableCell>
              </TableRow>
            ))}
            {!loading && movimientos.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No hay movimientos registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      ) : (
        <Grid container spacing={2}>
          {movimientos.map((mov)=>(
            <Grid key={mov.id} item xs={12} md={6} lg={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={700}>{mov.concepto}</Typography>
                      <Chip label={mov.estado} size="small" color={
                        mov.estado === 'APROBADO' ? 'success' :
                        mov.estado === 'PENDIENTE' ? 'warning' : 'error'
                      } />
                    </Stack>
                    <Typography variant="body2">{dayjs(mov.fecha).format('DD/MM/YYYY HH:mm')}</Typography>
                    {mov.responsable_apellido && mov.responsable_nombre && (
                      <Typography variant="body2" color="text.secondary">
                        Cajero: {mov.responsable_apellido} {mov.responsable_nombre}
                      </Typography>
                    )}
                    <Typography variant="h6" color={mov.tipo==='INGRESO' ? 'success.main':'error.main'}>
                      ${parseFloat(String(mov.monto)).toFixed(2)}
                    </Typography>
                    <Typography variant="body2">Medio: {mov.medio_pago || '-'}</Typography>
                    <Typography variant="body2">Trámite: {mov.nro_tramite || '-'}</Typography>
                    <Stack direction="row" gap={1}>
                      <Button size="small" variant="outlined" startIcon={<PictureAsPdfRounded/>} onClick={()=> window.open(receiptUrl(`/caja/${mov.id}/comprobante.pdf`), "_blank")}>Recibo</Button>
                      {mov.tipo === 'EGRESO' && mov.estado === 'PENDIENTE' && canAprobar && (
                        <>
                          <Button size="small" variant="contained" color="success" onClick={()=> solicitarAprobacion(mov.id)}>Aprobar</Button>
                          <Button size="small" variant="outlined" color="error" onClick={()=> solicitarRechazo(mov.id)}>Rechazar</Button>
                        </>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <CajaNewDialog open={open} onClose={()=>setOpen(false)} onSave={crearMovimiento}/>
      <VentaEntradaDialog open={openVentaEntrada} onClose={()=>setOpenVentaEntrada(false)} onSave={crearVentaEntrada}/>
      <VentaEntradaVisitanteDialog open={openVentaEntradaVisitante} onClose={()=>setOpenVentaEntradaVisitante(false)} onSave={crearVentaEntradaVisitante}/>
      <EgresoDialog open={openEgreso} onClose={()=>setOpenEgreso(false)} onSave={crearEgreso}/>
      <TransferTesoreriaDialog open={openTransfer} onClose={()=>setOpenTransfer(false)} onSave={transferirTesoreria} />
      <EntradasSelectorDialog open={openEntradas} onClose={()=> setOpenEntradas(false)} onSelect={(tipo)=>{ if (tipo==='local') setOpenVentaEntrada(true); else setOpenVentaEntradaVisitante(true); }} />

      {Boolean(verifyOpen && userId) && (
        <BiometricVerifyDialog
          open={verifyOpen}
          onClose={() => { setVerifyOpen(false); setPendingAction(null); }}
          userId={userId as number}
          onVerified={onVerified}
        />
      )}
    </Box>
  );
}

