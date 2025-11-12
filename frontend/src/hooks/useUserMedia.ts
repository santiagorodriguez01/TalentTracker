import { useEffect, useRef, useState } from "react";

export function useUserMedia(constraints: MediaStreamConstraints = { video: true, audio: false }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    navigator.mediaDevices.getUserMedia(constraints)
      .then((s) => {
        if (!current) return;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch((e) => setError(e.message));
    return () => {
      current = false;
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { videoRef, stream, error };
}
