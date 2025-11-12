'use client';
import * as React from 'react';
import api from '@/lib/api';
import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

export default function Audit(){
  const { data } = useQuery({
    queryKey: ['audit'],
    queryFn: async ()=> (await api.get('/audit')).data
  });
  const items = data?.data || data || [];
  return (
    <>
      <Typography variant="h6" fontWeight={700} sx={{ mb:1 }}>Auditoria</Typography>
      <List>
        {items.map((ev:any,i:number)=>(<ListItem key={i} divider><ListItemText primary={ev.tipo || 'evento'} secondary={JSON.stringify(ev)} /></ListItem>))}
      </List>
    </>
  );
}
