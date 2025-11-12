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
  MenuItem,
  Grid
} from '@mui/material';
import { useAuthStore } from '@/store/auth';
import { can, type Rol } from '@/lib/rbac';
import dayjs from 'dayjs';
import CloudDownloadRounded from '@mui/icons-material/CloudDownloadRounded';
import PictureAsPdfRounded from '@mui/icons-material/PictureAsPdfRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import api from '@/lib/api';

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

interface Cajero {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
}

export default function CajaReportesPage() {
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;
  const canReporte = rol ? can.cajaReportes(rol) : false;
  
  const [desde, setDesde] = React.useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [hasta, setHasta] = React.useState(dayjs().format('YYYY-MM-DD'));
  const [cajeroId, setCajeroId] = React.useState<string>('');
  const [movimientos, setMovimientos] = React.useState<Movimiento[]>([]);
  const [cajeros, setCajeros] = React.useState<Cajero[]>([]);
  const [totales, setTotales] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'cards'|'table'>('table');

  const receiptUrl = React.useCallback((path:string)=>{
    try {
      const token = useAuthStore.getState().token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const q = token ? `?bearer=${encodeURIComponent(token)}` : '';
      return `/api/proxy${path}${q}`;
    } catch { return `/api/proxy${path}`; }
  },[]);

  // Cargar lista de cajeros
  React.useEffect(() => {
    async function loadCajeros() {
      try {
        const { data } = await api.get('/caja/cajeros');
        setCajeros(data.data || []);
      } catch (error) {
        console.error('Error cargando cajeros:', error);
      }
    }
    loadCajeros();
  }, []);

  // Cargar reporte
  const cargarReporte = React.useCallback(async () => {
    if (!desde || !hasta) return;
    
    setLoading(true);
    try {
      const params: any = { desde, hasta };
      if (cajeroId) params.cajero_id = cajeroId;

      const { data } = await api.get('/caja/reporte', { params });
      setMovimientos(data.movimientos || []);
      setTotales(data.totales || []);
    } catch (error) {
      console.error('Error cargando reporte:', error);
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, cajeroId]);

  React.useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  const totalIngresos = Number(totales.find(t => t.tipo === 'INGRESO')?.total || 0);
  const totalEgresos = Number(totales.find(t => t.tipo === 'EGRESO')?.total || 0);
  const saldoNeto = totalIngresos - totalEgresos;

  async function descargarCSV() {
    try {
      const params: any = { desde, hasta };
      if (cajeroId) params.cajero_id = cajeroId;

      const { data } = await api.get('/caja/reporte.csv', { 
        params, 
        responseType: 'blob' 
      });
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_caja_${desde}_${hasta}${cajeroId ? `_cajero_${cajeroId}` : ''}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando CSV:', error);
      alert('Error al descargar el reporte');
    }
  }

  if (!canReporte) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          No tienes permisos para ver esta sección
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display:'grid', gap:2 }}>
      {/* Header con controles */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h5">
            Movimientos por Cajero
          </Typography>

          <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
            <TextField 
              size="small" 
              type="date" 
              label="Desde" 
              value={desde} 
              onChange={(e)=>setDesde(e.target.value)}
              sx={{ minWidth: 160 }}
            />
            <TextField 
              size="small" 
              type="date" 
              label="Hasta" 
              value={hasta} 
              onChange={(e)=>setHasta(e.target.value)}
              sx={{ minWidth: 160 }}
            />
            <TextField
              select
              size="small"
              label="Cajero"
              value={cajeroId}
              onChange={(e) => setCajeroId(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Todos los cajeros</MenuItem>
              {cajeros.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.apellido} {c.nombre}
                </MenuItem>
              ))}
            </TextField>
            <Button 
              variant="contained" 
              onClick={cargarReporte}
              disabled={loading}
            >
              Buscar
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<CloudDownloadRounded/>} 
              onClick={descargarCSV}
              disabled={loading || movimientos.length === 0}
            >
              Descargar CSV
            </Button>
            <Button 
              size="small" 
              variant={viewMode==='cards'?'contained':'outlined'} 
              onClick={()=> setViewMode(viewMode==='cards'?'table':'cards')}
            >
              {viewMode==='cards' ? 'Ver tabla' : 'Ver cards'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Tarjetas de totales */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Ingresos
              </Typography>
              {loading ? (
                <Skeleton variant="text" width={120} height={36} />
              ) : (
                <Typography variant="h5" component="div" color="success.main">
                  ${totalIngresos.toFixed(2)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Egresos
              </Typography>
              {loading ? (
                <Skeleton variant="text" width={120} height={36} />
              ) : (
                <Typography variant="h5" component="div" color="error.main">
                  ${totalEgresos.toFixed(2)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Saldo Neto
              </Typography>
              {loading ? (
                <Skeleton variant="text" width={120} height={36} />
              ) : (
                <Typography 
                  variant="h5" 
                  component="div" 
                  color={saldoNeto >= 0 ? 'primary.main' : 'error.main'}
                >
                  ${saldoNeto.toFixed(2)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla o Cards de movimientos */}
      {viewMode === 'table' ? (
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
                <TableCell align="center">Recibo</TableCell>
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
                  <TableCell align="center"><Skeleton width={80}/></TableCell>
                </TableRow>
              ))}
              {!loading && movimientos.map((mov) => (
                <TableRow key={mov.id} hover>
                  <TableCell>{mov.id}</TableCell>
                  <TableCell>{dayjs(mov.fecha).format('DD/MM/YYYY HH:mm')}</TableCell>
                  <TableCell>{mov.concepto}</TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <PersonRounded fontSize="small" color="action" />
                      <Typography variant="body2">
                        {mov.responsable_apellido && mov.responsable_nombre 
                          ? `${mov.responsable_apellido} ${mov.responsable_nombre}`
                          : '-'}
                      </Typography>
                    </Stack>
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
                  <TableCell align="center">
                    <Button 
                      size="small" 
                      variant="outlined" 
                      startIcon={<PictureAsPdfRounded/>} 
                      onClick={()=> window.open(receiptUrl(`/caja/${mov.id}/comprobante.pdf`), "_blank")}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && movimientos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No hay movimientos para los filtros seleccionados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Grid container spacing={2}>
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <Grid key={`sk-${i}`} item xs={12} md={6} lg={4}>
              <Card variant="outlined">
                <CardContent>
                  <Skeleton variant="text" width="60%" height={30} />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="rectangular" height={40} sx={{ my: 1 }} />
                  <Skeleton variant="text" width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {!loading && movimientos.map((mov) => (
            <Grid key={mov.id} item xs={12} md={6} lg={4}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={700} noWrap sx={{ flex: 1, mr: 1 }}>
                        {mov.concepto}
                      </Typography>
                      <Chip 
                        label={mov.estado} 
                        size="small" 
                        color={
                          mov.estado === 'APROBADO' ? 'success' :
                          mov.estado === 'PENDIENTE' ? 'warning' : 'error'
                        } 
                      />
                    </Stack>
                    
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(mov.fecha).format('DD/MM/YYYY HH:mm')}
                    </Typography>
                    
                    {mov.responsable_apellido && mov.responsable_nombre && (
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <PersonRounded fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {mov.responsable_apellido} {mov.responsable_nombre}
                        </Typography>
                      </Stack>
                    )}
                    
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Chip 
                        label={mov.tipo} 
                        size="small"
                        color={mov.tipo === 'INGRESO' ? 'success' : 'error'}
                      />
                      <Typography 
                        variant="h6" 
                        color={mov.tipo==='INGRESO' ? 'success.main':'error.main'}
                      >
                        ${parseFloat(String(mov.monto)).toFixed(2)}
                      </Typography>
                    </Stack>
                    
                    <Typography variant="body2" color="text.secondary">
                      Medio: {mov.medio_pago || '-'}
                    </Typography>
                    
                    {mov.nro_tramite && (
                      <Typography variant="body2" color="text.secondary">
                        Trámite: {mov.nro_tramite}
                      </Typography>
                    )}
                    
                    <Button 
                      size="small" 
                      variant="outlined" 
                      startIcon={<PictureAsPdfRounded/>}
                      onClick={()=> window.open(receiptUrl(`/caja/${mov.id}/comprobante.pdf`), "_blank")}
                      fullWidth
                    >
                      Ver Recibo
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {!loading && movimientos.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No hay movimientos para los filtros seleccionados
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}

