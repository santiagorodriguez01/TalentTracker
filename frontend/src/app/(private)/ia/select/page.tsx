'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, ToggleButtonGroup, ToggleButton, Grid, Chip } from '@mui/material';
import { useIAStore } from '@/store/ia';
import { useRouter } from 'next/navigation';
import { http } from '@/lib/http';

type Item = { id: number; nombre?: string; apellido?: string; persona_id?: number; deporte?: string; categoria?: string };

export default function SelectAlumnoPage() {
  const [entity, setEntity] = useState<'alumnos'|'jugadores'>('alumnos');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [alumnoId, setAlumnoId] = useState('');
  const { setSelectedAlumno } = useIAStore();
  const router = useRouter();

  const fetchList = async (all=false) => {
    setLoading(true);
    try {
      const url = `/${entity}?size=${all?100:20}`;
      const res = await http.get(url);
      const arr = res.data?.data || res.data || [];
      setItems(Array.isArray(arr) ? arr : []);
    } catch {
      setItems([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchList(true); }, [entity]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((it) => {
      const name = `${it.apellido||''} ${it.nombre||''}`.toLowerCase();
      return name.includes(term) || String(it.id).includes(term) || String(it.persona_id||'').includes(term) || String(it.deporte||'').toLowerCase().includes(term) || String(it.categoria||'').toLowerCase().includes(term);
    });
  }, [items, q]);

  const chooseId = () => {
    const id = Number(alumnoId);
    if (!id || Number.isNaN(id)) return alert('Ingrese un ID válido');
    setSelectedAlumno({ id });
    router.replace('/ia');
  };

  const chooseFromCard = (id: number, label?: string) => {
    setSelectedAlumno({ id, nombre: label });
    router.replace('/ia');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Seleccionar Alumno/Jugador</Typography>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'grid', gap: 2 }}>
          <ToggleButtonGroup exclusive size="small" value={entity} onChange={(_, v)=> v && setEntity(v)}>
            <ToggleButton value="alumnos">Alumnos</ToggleButton>
            <ToggleButton value="jugadores">Jugadores</ToggleButton>
          </ToggleButtonGroup>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField label="Buscar por nombre/ID" value={q} onChange={e=>setQ(e.target.value)} size="small" />
            <Button variant="outlined" onClick={()=>fetchList(false)} disabled={loading}>Buscar</Button>
            <Button variant="text" onClick={()=>fetchList(true)} disabled={loading}>Ver todos</Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">o seleccionar por ID</Typography>
            <TextField size="small" label="ID" value={alumnoId} onChange={(e)=>setAlumnoId(e.target.value)} inputMode="numeric" sx={{ width: 120 }} />
            <Button size="small" variant="contained" onClick={chooseId}>Confirmar</Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {filtered.map((it)=>{
          const label = `${it.apellido||''} ${it.nombre||''}`.trim() || `#${it.id}`;
          const img = `/files/alumnos/${it.id}/biometric_enroll.jpg`;
          return (
            <Grid item xs={12} sm={6} md={4} key={`${entity}-${it.id}`}>
              <Card variant="outlined" sx={{ cursor:'pointer' }} onClick={()=>chooseFromCard(it.id, label)}>
                <CardContent>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1 }}>
                    <img src={img} alt={label} width={48} height={48} style={{ borderRadius: '50%', objectFit:'cover' }} onError={(e:any)=>{ e.currentTarget.style.display='none'; }} />
                    <Typography variant="subtitle1" fontWeight={700}>{label}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">ID: {it.id}</Typography>
                  <Box sx={{ mt: 1, display:'flex', gap:1, flexWrap:'wrap' }}>
                    {it.deporte && <Chip size="small" label={`Deporte: ${it.deporte}`} />}
                    {it.categoria && <Chip size="small" label={`Cat: ${it.categoria}`} />}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        {!loading && filtered.length === 0 && (
          <Grid item xs={12}><Typography variant="body2" color="text.secondary">Sin resultados</Typography></Grid>
        )}
      </Grid>
    </Box>
  );
}
