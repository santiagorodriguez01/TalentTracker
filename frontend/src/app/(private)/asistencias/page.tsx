'use client';
import * as React from 'react';
import {
  Box,
  Stack,
  TextField,
  MenuItem,
  Button,
  Typography,
  Paper,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import dayjs from 'dayjs';
import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { type Rol } from '@/lib/rbac';
import { useRouter } from 'next/navigation';

type AsistenciaRow = {
  id: number;
  alumno_id: number;
  alumno_nombre: string;
  alumno_apellido: string;
  alumno_dni: string;
  fecha: string;
  deporte: string;
  categoria: string;
  presente: boolean;
  observacion?: string;
};

export default function AsistenciasHistorial() {
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;
  const isCoord = rol === 'COORDINADOR';
  const isAdmin = rol === 'ADMIN';
  const router = useRouter();

  const [deporte, setDeporte] = React.useState<string>('');
  const [categoria, setCategoria] = React.useState<string>('');
  const [fechaDesde, setFechaDesde] = React.useState<string>(
    dayjs().subtract(7, 'days').format('YYYY-MM-DD')
  );
  const [fechaHasta, setFechaHasta] = React.useState<string>(
    dayjs().format('YYYY-MM-DD')
  );

  const { data: deportes } = useQuery({
    queryKey: ['deportes'],
    queryFn: async () => (await api.get('/catalogo/deportes')).data as string[]
  });

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => (await api.get('/catalogo/categorias')).data as string[]
  });

  async function fetchAsistencias() {
    const params: any = {};
    if (deporte) params.deporte = deporte;
    if (categoria) params.categoria = categoria;
    if (fechaDesde) params.fecha_desde = fechaDesde;
    if (fechaHasta) params.fecha_hasta = fechaHasta;

    const paths = ['/coordinador/asistencias', '/api/coordinador/asistencias'];
    let lastErr: any;
    for (const path of paths) {
      try {
        return (await api.get(path, { params })).data;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  }

  const { data, isFetching, error } = useQuery({
    queryKey: ['asistencias-historial', deporte, categoria, fechaDesde, fechaHasta],
    queryFn: fetchAsistencias,
    enabled: !!fechaDesde && !!fechaHasta
  });

  const rows: AsistenciaRow[] = data?.data || data || [];

  const columns: GridColDef[] = [
    {
      field: 'fecha',
      headerName: 'Fecha',
      width: 120,
      valueFormatter: (params) => dayjs(params).format('DD/MM/YYYY')
    },
    {
      field: 'alumno_nombre_completo',
      headerName: 'Alumno',
      width: 200,
      valueGetter: (params, row) => `${row.alumno_apellido}, ${row.alumno_nombre}`
    },
    {
      field: 'alumno_dni',
      headerName: 'DNI',
      width: 120
    },
    {
      field: 'deporte',
      headerName: 'Deporte',
      width: 130
    },
    {
      field: 'categoria',
      headerName: 'Categoría',
      width: 120
    },
    {
      field: 'presente',
      headerName: 'Asistencia',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'PRESENTE' : 'AUSENTE'}
          color={params.value ? 'success' : 'error'}
          size="small"
          variant="filled"
        />
      )
    },
    {
      field: 'observacion',
      headerName: 'Observación',
      flex: 1,
      minWidth: 200
    }
  ];

  const handleExportar = () => {
    // Crear CSV
    const headers = ['Fecha', 'Apellido', 'Nombre', 'DNI', 'Deporte', 'Categoría', 'Asistencia', 'Observación'];
    const csvRows = rows.map(r => [
      dayjs(r.fecha).format('DD/MM/YYYY'),
      r.alumno_apellido,
      r.alumno_nombre,
      r.alumno_dni,
      r.deporte,
      r.categoria,
      r.presente ? 'PRESENTE' : 'AUSENTE',
      r.observacion || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `asistencias_${fechaDesde}_${fechaHasta}.csv`;
    link.click();
  };

  // Estadísticas
  const totalRegistros = rows.length;
  const totalPresentes = rows.filter(r => r.presente).length;
  const totalAusentes = rows.filter(r => !r.presente).length;
  const porcentajeAsistencia = totalRegistros > 0
    ? ((totalPresentes / totalRegistros) * 100).toFixed(1)
    : '0';

  return (
    <Box sx={{ display: 'grid', gap: 2, p: 2 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" alignItems="center" gap={1}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.back()}
            variant="outlined"
            size="small"
          >
            Volver
          </Button>
          <Typography variant="h5" fontWeight={700}>
            Historial de Asistencias
          </Typography>
        </Stack>
        <Button
          startIcon={<FileDownloadIcon />}
          onClick={handleExportar}
          variant="contained"
          disabled={rows.length === 0}
        >
          Exportar CSV
        </Button>
      </Stack>

      {/* Estadísticas */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
        <Stack direction="row" gap={4} flexWrap="wrap">
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary">
              {totalRegistros}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total de registros
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700} color="success.main">
              {totalPresentes}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Presentes
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700} color="error.main">
              {totalAusentes}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ausentes
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700} color="info.main">
              {porcentajeAsistencia}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tasa de asistencia
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Filtros */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
        <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            type="date"
            label="Fecha desde"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            type="date"
            label="Fecha hasta"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          {/* Solo mostrar selector de deporte para administradores */}
          {isAdmin && (
            <TextField
              select
              label="Deporte"
              value={deporte}
              onChange={(e) => setDeporte(e.target.value)}
              sx={{ minWidth: 180 }}
              size="small"
            >
              <MenuItem value="">Todos</MenuItem>
              {(deportes || []).map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
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
            onChange={(e) => setCategoria(e.target.value)}
            sx={{ minWidth: 180 }}
            size="small"
          >
            <MenuItem value="">Todas</MenuItem>
            {(categorias || []).map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          {(deporte || categoria) && (
            <Button
              variant="text"
              size="small"
              onClick={() => {
                setDeporte('');
                setCategoria('');
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Tabla */}
      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Error al cargar las asistencias: {(error as any)?.message || 'Error desconocido'}
        </Alert>
      )}

      {isFetching ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 }
              },
              sorting: {
                sortModel: [{ field: 'fecha', sort: 'desc' }]
              }
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            autoHeight
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid rgba(224, 224, 224, 1)'
              }
            }}
          />
        </Paper>
      )}

      {!isFetching && rows.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No hay registros de asistencia para el período seleccionado.
        </Alert>
      )}
    </Box>
  );
}
