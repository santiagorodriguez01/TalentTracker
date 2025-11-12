# routers/performance.py
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
import base64, numpy as np, cv2, os, tempfile
from performance_tracker.services.pose_estimator import PoseEstimator
from performance_tracker.services.metrics_accumulator import MetricsAccumulator


router = APIRouter(prefix="/performance", tags=["Performance"])

# Inicializar modelos globales y acumuladores
pose = PoseEstimator(model_path="yolov8n-pose.pt")
buffer_size = int(os.getenv("PERF_BUFFER_SIZE", "150"))
accumulator = MetricsAccumulator(buffer_size=buffer_size)  # guarda últimos N frames por alumno


class FrameData(BaseModel):
    alumno_id: str
    frame_b64: str


@router.post("/analyze/sprint")
async def analyze_sprint(video: UploadFile = File(...)):
    suffix = os.path.splitext(video.filename or "video.mp4")[1] or ".mp4"
    tmp_file = tempfile.NamedTemporaryFile(prefix="perf_", suffix=suffix, delete=False)
    tmp_path = tmp_file.name
    try:
        content = await video.read()
        tmp_file.write(content)
        tmp_file.close()
        metrics = pose.process_video(tmp_path)
        return metrics
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


@router.post("/realtime")
async def analyze_realtime(data: FrameData):
    # Decodificar frame base64
    frame_bytes = base64.b64decode(data.frame_b64)
    npimg = np.frombuffer(frame_bytes, np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    # Detectar pose
    keypoints = pose.detect_keypoints(frame)

    if keypoints is None:
        return {"error": "No se detectó persona"}

    # Calcular métricas con buffer temporal
    metrics = accumulator.update_and_compute(data.alumno_id, keypoints)

    # Dibujar esqueleto sobre el frame
    overlay = frame.copy()
    k = keypoints.astype(int)
    pairs = [
        (5,6), (5,7), (7,9), (6,8), (8,10),  # brazos
        (11,12), (5,11), (6,12),             # torso
        (11,13), (13,15), (12,14), (14,16),  # piernas
        (5,0), (6,0)                          # cuello-cabeza
    ]
    for (i,j) in pairs:
        cv2.line(overlay, (int(k[i,0]), int(k[i,1])), (int(k[j,0]), int(k[j,1])), (0,255,0), 2)
    for p in k:
        cv2.circle(overlay, (int(p[0]), int(p[1])), 3, (0,200,255), -1)

    # Opcional: reducir tamaño para la UI
    h, w = overlay.shape[:2]
    maxw = 640
    if w > maxw:
        scale = maxw / float(w)
        overlay = cv2.resize(overlay, (int(w*scale), int(h*scale)))

    ok, buf = cv2.imencode('.jpg', overlay, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    overlay_b64 = base64.b64encode(buf.tobytes()).decode('ascii') if ok else None

    out = { **metrics, "overlay_b64": overlay_b64 }
    return out
