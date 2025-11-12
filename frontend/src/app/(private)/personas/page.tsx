'use client';
import * as React from 'react';
import api from '@/lib/api';
import DataTable from '@/components/data/DataTable';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography, useMediaQuery, Box, Paper } from '@mui/material';
import CreditCardRounded from '@mui/icons-material/CreditCardRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { can, type Rol } from '@/lib/rbac';
import { useTheme } from '@mui/material/styles';

type Row = {
  id?: number;
  persona_id?: number;
  apellido?: string;
  nombre?: string;
  dni?: string;
  rol?: string;
  roles?: any;
  estado?: string;
};

export default function PersonasList(){
  const router = useRouter();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = React.useState(0);
  const [openRow, setOpenRow] = React.useState<Row | null>(null);
  const pageSize = 25;
  const qc = useQueryClient();
  const token = useAuthStore(s => s.token) || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;
  const puedeEditar = rol ? can.editarPersona(rol) : false;

  async function fetchPersonasList(pageNum:number, size:number){
    const params = { page: pageNum+1, size } as any;
    const paths = ['/personas', '/api/personas'];
    let lastErr: any;
    for (const p of paths){
      try { return (await api.get(p, { params })).data; } catch(e){ lastErr = e; }
    }
    throw lastErr;
  }

  const { data, isFetching } = useQuery({
    queryKey: ['personas', page, pageSize],
    queryFn: async ()=> fetchPersonasList(page, pageSize),
    enabled: !!token
  });

  const rows: Row[] = data?.data || data?.rows || [];
  const rowCount = data?.total || data?.count || 0;

  const toggleValid = useMutation({
    mutationFn: async ({ id, estado }: { id:number; estado:'ACTIVO'|'INACTIVO' })=>{
      const activar = estado === 'ACTIVO';
      // 1) Endpoints especificos de accion
      try { return (await api.post(`/personas/${id}/${activar ? 'activar' : 'inactivar'}`)).data; } catch(e:any) {}
      try { return (await api.patch(`/personas/${id}/${activar ? 'activar' : 'inactivar'}`)).data; } catch(e:any) {}
      try { return (await api.post(`/personas/${id}/${activar ? 'activar' : 'desactivar'}`)).data; } catch(e:any) {}
      try { return (await api.patch(`/personas/${id}/${activar ? 'activar' : 'desactivar'}`)).data; } catch(e:any) {}
      // 2) Endpoint de estado dedicado
      try { return (await api.patch(`/personas/${id}/estado`, { estado })).data; } catch(e:any) {}
      try { return (await api.put(`/personas/${id}/estado`, { estado })).data; } catch(e:any) {}
      // 3) PATCH/PUT generico con campo estado
      try { return (await api.patch(`/personas/${id}`, { estado })).data; } catch(e:any) {}
      try { return (await api.put(`/personas/${id}`, { estado })).data; } catch(e:any) {}
      // 4) Alternativa booleana
      const activo = activar;
      try { return (await api.patch(`/personas/${id}`, { activo })).data; } catch(e:any) {}
      return (await api.put(`/personas/${id}`, { activo })).data;
    },
    onSuccess: ()=> qc.invalidateQueries({ queryKey: ['personas'] })
  });

  const columnsBase: GridColDef<Row>[] = [
    { field:'id', headerName:'ID', width:90, valueGetter: (_v,row)=> row.id ?? row.persona_id },
    { field:'apellido', headerName:'Apellido', flex:1 },
    { field:'nombre',  headerName:'Nombre',  flex:1 },
    { field:'dni',     headerName:'DNI',     flex:1 },
    { field:'rol',     headerName:'Rol',     flex:1, valueGetter: (_v,row)=>{
      const arr = Array.isArray((row as any).roles) ? (row as any).roles : [];
      const labels = arr.map((r:any)=> r?.rol || r).filter(Boolean);
      return labels.length ? labels.join(', ') : (row as any).rol;
    } },
    { field:'estado',  headerName:'Estado',  flex:1 },
    puedeEditar ? {
      field: 'editar', headerName: '', width: 70, sortable:false, filterable:false,
      renderCell: (p: GridRenderCellParams<Row>) => {
        const personaId = p.row.id ?? p.row.persona_id;
        const disabled = !personaId;
        return (
          <Tooltip title={disabled ? 'Sin ID' : 'Editar persona'}>
            <span>
              <IconButton size="small" disabled={disabled} onClick={()=> !disabled && router.push(`/personas/${personaId}`)}>
                <EditRounded fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        );
      }
    } : (undefined as any),
    {
      field: 'validar', headerName: '', width: 70, sortable:false, filterable:false,
      renderCell: (p: GridRenderCellParams<Row>) => {
        if (!puedeEditar) return null as any;
        const personaId = p.row.id ?? p.row.persona_id;
        const estado = (p.row.estado || '').toUpperCase();
        const invalid = estado !== 'ACTIVO';
        const disabled = !personaId || toggleValid.isPending;
        const onToggle = async ()=>{
          if (!personaId) return;
          const target = invalid ? 'ACTIVO' : 'INACTIVO';
          const msg = invalid ? 'Validar esta persona?' : 'Invalidar esta persona?';
          const ok = window.confirm(invalid ? 'Confirmar alta de esta persona?' : 'Confirmar baja de esta persona?');
          if (!ok) return;
          try{ await toggleValid.mutateAsync({ id: personaId!, estado: target as any }); }catch{}
        };
        return (
          <Tooltip title={disabled ? 'No disponible' : (invalid ? 'Dar de alta' : 'Dar de baja')}>
            <span>
              <IconButton size="small" color={invalid ? 'success' : 'error'} disabled={disabled} onClick={onToggle}>
                {invalid ? <CheckCircleRounded fontSize="small" /> : <DeleteRounded fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        );
      }
    },
    {
      field: 'acciones',
      headerName: '',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (p: GridRenderCellParams<Row>) => {
        const personaId = p.row.id ?? p.row.persona_id;
        const disabled = !personaId;
        return (
          <Tooltip title={disabled ? 'Sin ID' : 'Ver credencial'}>
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

  const columns: GridColDef<Row>[] = React.useMemo(()=>{
    const cleaned = columnsBase.filter(Boolean) as GridColDef<Row>[];
    if (!isSmall) return cleaned;
    // En mobile: solo Apellido, Nombre, Rol, DNI
    const pick = new Set(['apellido','nombre','rol','dni']);
    return cleaned.filter(c => pick.has(c.field as string));
  },[isSmall, puedeEditar]);

  const puedeCrear = rol ? can.crearPersona(rol) : false;

  return (
    <>
    {puedeCrear && (
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Paper
          onClick={() => router.push('/personas/new' as any)}
          sx={{
            px: 2, py: 1,
            borderRadius: 9999,
            display: 'inline-flex', alignItems: 'center', cursor: 'pointer',
            width: { xs: '100%', sm: 'auto' }, justifyContent: 'center',
            boxShadow: (t) => t.palette.mode === 'light'
              ? t.shadows[1]
              : '0 1px 2px rgba(255,255,255,0.06), 0 6px 18px rgba(255,255,255,0.10)',
            transition: 'transform 160ms ease, box-shadow 180ms ease, background-color 180ms ease',
            '&:hover': {
              boxShadow: (t) => t.palette.mode === 'light'
                ? t.shadows[3]
                : '0 2px 4px rgba(255,255,255,0.08), 0 10px 24px rgba(255,255,255,0.16)',
              transform: 'translateY(-1px)',
              backgroundColor: (t) => t.palette.mode === 'light' ? 'rgba(47,166,74,0.08)' : 'rgba(255,163,126,0.16)'
            }
          }}
          elevation={0}
        >
          <AddRounded fontSize="small" />
          <Typography sx={{ ml: 1 }} variant="body2">Alta persona</Typography>
        </Paper>
      </Box>
    )}
    <DataTable
      rows={rows}
      columns={columns as any}
      loading={isFetching}
      page={page}
      pageSize={pageSize}
      rowCount={rowCount}
      onPageChange={(m)=>setPage(m.page)}
      getRowId={(r: Row)=> r.id ?? r.persona_id ?? `${r.dni}`}
      onRowClick={(p)=>{ if (isSmall) setOpenRow(p.row as Row); }}
      onCellKeyDown={(_params:any, e:any)=>{
        if (!isSmall) return;
        if (e?.key === 'Enter' || e?.key === ' ') {
          const row = (_params?.row as Row) || null;
          if (row) setOpenRow(row);
        }
      }}
    />
    <Dialog open={!!openRow} onClose={()=>setOpenRow(null)} fullWidth maxWidth="sm">
      <DialogTitle>Detalle de persona</DialogTitle>
      <DialogContent>
        {openRow && (
          <Stack spacing={1.2} sx={{ mt: 1 }}>
            <Typography variant="body2"><b>Apellido:</b> {openRow.apellido}</Typography>
            <Typography variant="body2"><b>Nombre:</b> {openRow.nombre}</Typography>
            <Typography variant="body2"><b>DNI:</b> {openRow.dni}</Typography>
            <Typography variant="body2"><b>Rol:</b> {openRow.rol}</Typography>
            <Typography variant="body2"><b>Estado:</b> {openRow.estado}</Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        {openRow && (
          <Stack direction="column" spacing={1} sx={{ width:'100%' }}>
            <Button fullWidth variant="outlined" onClick={()=>{ const id = openRow.id ?? openRow.persona_id; if(id) router.push(`/credenciales/${id}`); }}>Ver credencial</Button>
            {puedeEditar && (
              <Stack direction="column" spacing={1}>
                <Button fullWidth variant="contained" onClick={()=>{ const id = openRow.id ?? openRow.persona_id; if(id) router.push(`/personas/${id}`); }}>Editar</Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  onClick={async ()=>{
                    const id = openRow.id ?? openRow.persona_id; if(!id) return;
                    const estado = (openRow.estado || '').toUpperCase();
                    const invalid = estado !== 'ACTIVO';
                    const target = invalid ? 'ACTIVO' : 'INACTIVO';
                    const ok = window.confirm(invalid ? 'Activar esta persona?' : 'Inactivar esta persona?');
                    if (!ok) return;
                    try{ await toggleValid.mutateAsync({ id: id!, estado: target as any }); setOpenRow(null); }catch{}
                  }}
                >
                  {(openRow.estado || '').toUpperCase() !== 'ACTIVO' ? 'Dar de Alta' : 'Dar de Baja'}
                </Button>
              </Stack>
            )}
          </Stack>
        )}
      </DialogActions>
    </Dialog>
    </>
  );
}
