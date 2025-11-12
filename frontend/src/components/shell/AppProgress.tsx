'use client';
import * as React from 'react';
import { LinearProgress, Box, Fade } from '@mui/material';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';

export default function AppProgress(){
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const pathname = usePathname();
  const [routeSpinning, setRouteSpinning] = React.useState(false);

  React.useEffect(()=>{
    // Mostrar una pequeña barra en cada cambio de ruta para dar feedback inmediato
    setRouteSpinning(true);
    const t = setTimeout(()=> setRouteSpinning(false), 450);
    return () => clearTimeout(t);
  }, [pathname]);

  const active = routeSpinning || fetching > 0 || mutating > 0;

  return (
    <Fade in={active} unmountOnExit>
      <Box sx={{ position: 'fixed', zIndex: 2000, top: 0, left: 0, right: 0 }}>
        <LinearProgress color="primary" />
      </Box>
    </Fade>
  );
}

