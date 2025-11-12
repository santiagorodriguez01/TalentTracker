'use client';
import * as React from 'react';
import {
  Box,
  Stack,
  TextField,
  MenuItem,
  Button,
  Tooltip,
  IconButton,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import CancelRounded from '@mui/icons-material/CancelRounded';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import dayjs from 'dayjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { type Rol } from '@/lib/rbac';
import { useRouter } from 'next/navigation';

type Row = {
  id: number;
  persona_id: number;
  nombre: string;
  apellido: string;
  dni: string;
  deporte?: string | null;
  categoria?: string | null;
  estado?: string;
  edad?: number;
  email?: string;
};

export default function AlumnosList(){
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;
  const isCoord = rol === 'COORDINADOR';
  const isAdmin = rol === 'ADMIN';
  const router = useRouter();

  const [page, setPage] = React.useState(0);
  const pageSize = 25;
  const [deporte, setDeporte] = React.useState<string>('');
  const [categoria, setCategoria] = React.useState<string>('');
  const [fecha, setFecha] = React.useState<string>(dayjs().format('YYYY-MM-DD'));
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const qc = useQueryClient();

  const { data: deportes } = useQuery({
    queryKey: ['deportes'],
    queryFn: async ()=> (await api.get('/catalogo/deportes')).data as string[]
  });

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: async ()=> (await api.get('/catalogo/categorias')).data as string[]
  });

  // Si el coordinador tiene un solo deporte, seleccionarlo automáticamente
  React.useEffect(() => {
    if (isCoord && deportes && deportes.length === 1 && !deporte) {
      setDeporte(deportes[0]);
    }
  }, [isCoord, deportes, deporte]);

  async function fetchRows(p:number, size:number){
    const params:any = { page: p+1, size };
    if (deporte) params.deporte = deporte;
    if (categoria) params.categoria = categoria;
    const paths = isCoord ? ['/coordinador/alumnos', '/api/coordinador/alumnos'] : ['/alumnos', '/api/alumnos'];
    let lastErr:any;
    for (const path of paths){
      try { return (await api.get(path, { params })).data; } catch(e){ lastErr = e; }
    }
    throw lastErr;
  }

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['alumnos', page, pageSize, deporte, categoria, isCoord],
    queryFn: async ()=> fetchRows(page, pageSize)
  });

  const marcarAsistencia = useMutation({
    mutationFn: async ({ id, presente, obs, dep, cat, nombre }:{
      id:number;
      presente:boolean;
      obs?:string;
      dep?:string|null;
      cat?:string|null;
      nombre?:string;
    })=>{
      const payload:any = { fecha, presente, observacion: obs };
      if (dep) payload.deporte = dep;
      if (cat) payload.categoria = cat;
      const paths = [`/alumnos/${id}/asistencias`,`/api/alumnos/${id}/asistencias`];
      let last:any;
      for (const p of paths){
        try {
          const result = (await api.post(p, payload)).data;
          return { ...result, nombre, presente };
        } catch(e){
          last=e;
        }
      }
      throw last;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['asistencias', fecha, deporte, categoria] });
      setSnackbar({
        open: true,
        message: `${variables.nombre} marcado como ${variables.presente ? 'PRESENTE' : 'AUSENTE'}`,
        severity: 'success'
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: `Error: ${error?.response?.data?.message || 'No se pudo registrar la asistencia'}`,
        severity: 'error'
      });
    }
  });

  const rows: Row[] = data?.data || data || [];
  const rowCount = data?.total || rows.length || 0;

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleVerHistorial = () => {
    router.push('/asistencias');
  };

  // Calcular estadísticas
  const totalAlumnos = rows.length;
  const deportesUnicos = [...new Set(rows.map(r => r.deporte).filter(Boolean))].length;
  const categoriasUnicas = [...new Set(rows.map(r => r.categoria).filter(Boolean))].length;

  // Cards: acciones de asistencia
  const Acciones = ({ row }:{ row:Row }) => (
    <Stack direction="row" gap={1} alignItems="center" justifyContent="flex-end">
      <Tooltip title="Marcar presente">
        <span>
          <IconButton
            size="medium"
            color="success"
            disabled={marcarAsistencia.isPending}
            onClick={()=> marcarAsistencia.mutate({
              id: row.id,
              presente: true,
              dep: row.deporte || undefined,
              cat: row.categoria || undefined,
              nombre: `${row.apellido} ${row.nombre}`
            })}
            sx={{
              bgcolor: 'success.light',
              '&:hover': { bgcolor: 'success.main' },
              color: 'white'
            }}
          >
            <CheckCircleRounded />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Marcar ausente">
        <span>
          <IconButton
            size="medium"
            color="error"
            disabled={marcarAsistencia.isPending}
            onClick={()=> marcarAsistencia.mutate({
              id: row.id,
              presente: false,
              dep: row.deporte || undefined,
              cat: row.categoria || undefined,
              nombre: `${row.apellido} ${row.nombre}`
            })}
            sx={{
              bgcolor: 'error.light',
              '&:hover': { bgcolor: 'error.main' },
              color: 'white'
            }}
          >
            <CancelRounded />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );

  return (
    <Box sx={{ display:'grid', gap: 2, p: 2 }}>
      {/* Header con título */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Tomar Asistencia
          </Typography>
          {isCoord && deportes && deportes.length === 1 && (
            <Typography variant="caption" color="text.secondary">
              Deporte: {deportes[0]}
            </Typography>
          )}
        </Box>
        <Stack direction="row" gap={1}>
          <Tooltip title="Refrescar">
            <IconButton onClick={() => refetch()} disabled={isFetching}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={handleVerHistorial}
          >
            Ver Historial
          </Button>
        </Stack>
      </Stack>

      {/* Estadísticas rápidas */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={700}>{totalAlumnos}</Typography>
            <Typography variant="body2">Alumnos</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'secondary.light', color: 'secondary.contrastText', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={700}>{deportesUnicos || deportes?.length || 0}</Typography>
            <Typography variant="body2">Deportes</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={700}>{categoriasUnicas || categorias?.length || 0}</Typography>
            <Typography variant="body2">Categorías</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
        <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            type="date"
            label="Fecha"
            value={fecha}
            onChange={(e)=> setFecha(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          {/* Solo mostrar selector de deporte para administradores */}
          {isAdmin && (
            <TextField
              select
              label="Deporte"
              value={deporte}
              onChange={(e)=>{ setPage(0); setDeporte(e.target.value); }}
              sx={{ minWidth: 180 }}
              size="small"
            >
              <MenuItem value="">Todos</MenuItem>
              {(deportes || []).map((d)=> (<MenuItem key={d} value={d}>{d}</MenuItem>))}
            </TextField>
          )}
          {/* Si es coordinador, mostrar el deporte como información (solo lectura) */}
          {isCoord && deportes && deportes.length === 1 && (
            <TextField
              label="Deporte"
              value={deportes[0]}
              InputProps={{ readOnly: true }}
              sx={{ minWidth: 180 }}
              size="small"
              helperText="Deporte asignado"
            />
          )}
          <TextField
            select
            label="Categoría"
            value={categoria}
            onChange={(e)=>{ setPage(0); setCategoria(e.target.value); }}
            sx={{ minWidth: 180 }}
            size="small"
          >
            <MenuItem value="">Todas</MenuItem>
            {(categorias || []).map((c)=> (<MenuItem key={c} value={c}>{c}</MenuItem>))}
          </TextField>
          {(deporte || categoria) && (
            <Button
              variant="text"
              size="small"
              onClick={() => { setDeporte(''); setCategoria(''); setPage(0); }}
            >
              Limpiar filtros
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Lista de alumnos en cards */}
      {isFetching && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!isFetching && (
        <Grid container spacing={2}>
          {rows.map((r)=> (
            <Grid key={r.id} item xs={12} sm={6} md={4}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent>
                  <Stack spacing={1.5}>
                    {/* Header del card */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          {r.apellido}, {r.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          DNI: {r.dni}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={r.estado || 'ACTIVO'}
                        color={(r.estado||'ACTIVO')==='ACTIVO'?'success':'default'}
                      />
                    </Stack>

                    <Divider />

                    {/* Información */}
                    <Stack spacing={0.5}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                          Deporte:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {r.deporte || '-'}
                        </Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                          Categoría:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {r.categoria || '-'}
                        </Typography>
                      </Stack>
                      {r.edad && (
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                            Edad:
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {r.edad} años
                          </Typography>
                        </Stack>
                      )}
                    </Stack>

                    <Divider />

                    {/* Acciones */}
                    <Box sx={{ pt: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Registrar asistencia para {dayjs(fecha).format('DD/MM/YYYY')}:
                      </Typography>
                      <Acciones row={r} />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {rows.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No hay alumnos para mostrar con los filtros seleccionados.
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
