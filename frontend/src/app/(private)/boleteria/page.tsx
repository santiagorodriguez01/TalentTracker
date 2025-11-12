'use client';
import * as React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Alert,
  Card,
  CardContent,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useAuthStore } from '@/store/auth';
import { can, type Rol } from '@/lib/rbac';
import api from '@/lib/api';
import ConfirmationNumberRounded from '@mui/icons-material/ConfirmationNumberRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import { getErrorMessage } from '@/utils/errors';
import VentaEntradaDialog from '@/components/caja/VentaEntradaDialog';
import VentaEntradaVisitanteDialog from '@/components/caja/VentaEntradaVisitanteDialog';

// Precios de entradas
const PRECIO_LOCAL_SOCIO_AL_DIA = 1500;
const PRECIO_LOCAL_NO_SOCIO = 3000;
const PRECIO_VISITANTE = 5000;

type SocioInfo = {
  existe: boolean;
  socio_id?: number;
  estado?: string;
  nombre?: string;
  apellido?: string;
  dni?: string;
  nro_socio?: string;
  saldo_total?: number;
};

export default function BoleteriaPage() {
  const authUser = useAuthStore(s => s.user as any);
  const rol = ((authUser?.user?.rol_sistema || authUser?.rol_sistema || '') as Rol) || undefined;
  const puedeVender = rol ? can.ventaEntradas(rol) : false;

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const zxingControlsRef = React.useRef<any>(null);
  const zxingReaderRef = React.useRef<any>(null);
  const [scanning, setScanning] = React.useState<boolean>(true);
  const [supported, setSupported] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [socioInfo, setSocioInfo] = React.useState<SocioInfo | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const lastScanTimeRef = React.useRef<number>(0);

  // Estados para los dialogs
  const [openVentaLocal, setOpenVentaLocal] = React.useState<boolean>(false);
  const [openVentaVisitante, setOpenVentaVisitante] = React.useState<boolean>(false);
  const [nroSocioPrefill, setNroSocioPrefill] = React.useState<string>('');
  const [forceNoSocio, setForceNoSocio] = React.useState<boolean>(false);
  const [qrMode, setQrMode] = React.useState<boolean>(false);

  // Verificar socio por QR token
  const verificarSocioQR = React.useCallback(async (qrToken: string) => {
    // Evitar escaneos duplicados muy rápidos (menos de 2 segundos)
    const now = Date.now();
    if (now - lastScanTimeRef.current < 2000) return;
    lastScanTimeRef.current = now;

    setLoading(true);
    setSocioInfo(null);
    setError('');

    try {
      // Consumir token QR para obtener datos de persona
      const { data: qrData } = await api.get(`/qr/${qrToken}`);

      if (!qrData?.ok || !qrData?.persona_id) {
        setError('QR inválido o expirado');
        setLoading(false);
        return;
      }

      // Si tiene nro_socio, es socio - abrir dialog con el número pre-cargado
      if (qrData.nro_socio) {
        setNroSocioPrefill(qrData.nro_socio);
        setForceNoSocio(false); // Permitir modo socio
        setQrMode(true); // Activar modo QR simplificado
        setOpenVentaLocal(true);
        setSocioInfo(null); // Limpiar info anterior
      } else {
        // No es socio - mostrar error
        setError('El QR escaneado no pertenece a un socio. Use el botón de "Venta Entrada Local (No Socio)"');
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Error al verificar QR'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para manejar la venta de entrada local desde el dialog
  const handleVentaEntradaLocal = React.useCallback(async (data: any) => {
    try {
      await api.post('/caja/venta-entrada', data);
      alert('✅ Venta de entrada local registrada correctamente');
      setError('');
      // No cerramos el dialog automáticamente para permitir múltiples ventas
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError(`Sin permisos: Tu rol "${rol}" no puede realizar ventas. Roles permitidos: ADMIN, BOLETERIA, TESORERIA, PERSONAL_CAJA`);
      } else {
        setError(getErrorMessage(err, 'Error al registrar venta'));
      }
      throw err; // Re-throw para que el dialog pueda manejar el error
    }
  }, [rol]);

  // Función para manejar la venta de entrada visitante desde el dialog
  const handleVentaEntradaVisitante = React.useCallback(async (data: any) => {
    try {
      await api.post('/caja/venta-entrada-visitante', data);
      alert('✅ Venta de entrada visitante registrada correctamente');
      setError('');
      // No cerramos el dialog automáticamente para permitir múltiples ventas
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError(`Sin permisos: Tu rol "${rol}" no puede realizar ventas. Roles permitidos: ADMIN, BOLETERIA, TESORERIA, PERSONAL_CAJA`);
      } else {
        setError(getErrorMessage(err, 'Error al registrar venta'));
      }
      throw err; // Re-throw para que el dialog pueda manejar el error
    }
  }, [rol]);

  // Iniciar cámara y escaneo
  React.useEffect(() => {
    if (!scanning) return;

    let active = true;

    async function start() {
      setError('');
      try {
        // @ts-ignore
        const Detector = (window as any).BarcodeDetector;
        if (Detector) {
          setSupported(true);
          streamRef.current = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          });
          if (!active) return;
          const video = videoRef.current!;
          video.srcObject = streamRef.current;
          await video.play();
          const detector = new Detector({ formats: ['qr_code'] });
          const tick = async () => {
            if (!active) return;
            try {
              // @ts-ignore
              const codes = await detector.detect(video);
              if (codes && codes.length) {
                const raw = codes[0].rawValue || '';
                if (raw) {
                  // Extraer token del QR
                  const match = raw.match(/\/qr\/([^\/\?]+)/);
                  if (match && match[1]) {
                    await verificarSocioQR(match[1]);
                  }
                }
              }
            } catch {}
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          return;
        }

        // Fallback con ZXing
        try {
          const zxing = await import('@zxing/browser');
          const { BrowserQRCodeReader } = zxing as any;
          if (!BrowserQRCodeReader) throw new Error('ZXing no disponible');
          setSupported(true);
          const reader = new BrowserQRCodeReader();
          zxingReaderRef.current = reader;
          const video = videoRef.current!;
          const controls = await reader.decodeFromVideoDevice(
            undefined,
            video,
            async (result: any) => {
              if (!active) return;
              if (result) {
                try {
                  const raw = result.getText ? result.getText() : String(result?.text || result);
                  const match = raw.match(/\/qr\/([^\/\?]+)/);
                  if (match && match[1]) {
                    await verificarSocioQR(match[1]);
                  }
                } catch {}
              }
            },
            { facingMode: 'environment' } as any
          );
          zxingControlsRef.current = controls;
        } catch (err: any) {
          setSupported(false);
          setError(getErrorMessage(err, 'El lector de QR no es compatible'));
        }
      } catch (e: any) {
        setError(getErrorMessage(e, 'No se pudo iniciar la cámara'));
      }
    }

    start();

    return () => {
      active = false;
      try {
        videoRef.current?.pause();
      } catch {}
      try {
        zxingControlsRef.current?.stop?.();
      } catch {}
      try {
        zxingReaderRef.current?.reset?.();
      } catch {}
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [scanning, verificarSocioQR]);

  if (!puedeVender) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Sin permisos para Boletería
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Tu rol actual: <strong>{rol || 'Sin rol asignado'}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Roles permitidos para acceder a boletería:
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip label="ADMIN" color="primary" size="small" />
            <Chip label="BOLETERIA" color="primary" size="small" />
            <Chip label="TESORERIA" color="primary" size="small" />
            <Chip label="PERSONAL_CAJA" color="primary" size="small" />
          </Stack>
          <Alert severity="info" sx={{ mt: 2 }}>
            Contacta con un administrador para que te asigne el rol correcto.
          </Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 2, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Boletería Automatizada
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Para socios: Escanea el QR del socio | Para no socios: Usa el botón correspondiente
        </Typography>
      </Paper>

      {/* Botones de venta */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<ConfirmationNumberRounded />}
          onClick={() => {
            setNroSocioPrefill('');
            setForceNoSocio(true); // Forzar modo NO socio
            setQrMode(false); // Desactivar modo QR
            setOpenVentaLocal(true);
          }}
          disabled={loading}
          sx={{ py: 2 }}
        >
          Venta Entrada Local (No Socio)
        </Button>
        <Button
          fullWidth
          variant="contained"
          color="secondary"
          size="large"
          startIcon={<ConfirmationNumberRounded />}
          onClick={() => setOpenVentaVisitante(true)}
          disabled={loading}
          sx={{ py: 2 }}
        >
          Venta Entrada Visitante
        </Button>
      </Stack>

      {/* Error */}
      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Cámara de escaneo */}
      <Paper variant="outlined" sx={{ p: 2, position: 'relative' }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Escáner de QR
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Coloca el código QR del socio frente a la cámara
        </Typography>

        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.5)',
              zIndex: 10,
              borderRadius: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {!supported && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            El lector de QR no es compatible en este navegador
          </Alert>
        )}

        <Box
          sx={{
            width: '100%',
            height: 400,
            bgcolor: 'black',
            borderRadius: 1,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            playsInline
            muted
          />
          {/* Overlay de enfoque */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 200,
              height: 200,
              border: '3px solid rgba(255,255,255,0.8)',
              borderRadius: 2,
              pointerEvents: 'none',
            }}
          />
        </Box>
      </Paper>

      {/* Dialogs de venta */}
      <VentaEntradaDialog
        open={openVentaLocal}
        onClose={() => {
          setOpenVentaLocal(false);
          setNroSocioPrefill('');
          setForceNoSocio(false);
          setQrMode(false);
        }}
        onSave={handleVentaEntradaLocal}
        initialNroSocio={nroSocioPrefill}
        forceNoSocio={forceNoSocio}
        qrMode={qrMode}
      />

      <VentaEntradaVisitanteDialog
        open={openVentaVisitante}
        onClose={() => setOpenVentaVisitante(false)}
        onSave={handleVentaEntradaVisitante}
      />
    </Box>
  );
}
