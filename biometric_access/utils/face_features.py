import mediapipe as mp
import numpy as np
import cv2

mp_face_mesh = mp.solutions.face_mesh
mp_face_det = mp.solutions.face_detection

def _normalize(v: np.ndarray) -> np.ndarray:
    v = v.astype(np.float32)
    v -= np.mean(v, axis=0, keepdims=True)
    std = np.std(v, axis=0, keepdims=True) + 1e-6
    v /= std
    return v

def _mesh_on(image_bgr: np.ndarray):
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,  # un poco más permisivo
    ) as fm:
        return fm.process(rgb)

def _embedding_from_mesh_res(res) -> np.ndarray | None:
    if not res or not getattr(res, "multi_face_landmarks", None):
        return None
    lm = res.multi_face_landmarks[0]
    landmarks = np.array([[p.x, p.y, p.z] for p in lm.landmark], dtype=np.float32)
    landmarks = _normalize(landmarks)
    emb = landmarks.flatten().astype(np.float32)
    n = np.linalg.norm(emb) + 1e-8
    return emb / n

def extract_face_embedding(image: np.ndarray) -> np.ndarray | None:
    """
    Devuelve un embedding estable basado en FaceMesh.
    Estrategia robusta:
      1) Intento directo sobre la imagen completa
      2) Si falla, detecto la cara con FaceDetection, recorto + margen y reintento mesh
    """
    # 1) Intento directo
    res = _mesh_on(image)
    emb = _embedding_from_mesh_res(res)
    if emb is not None:
        return emb

    # 2) Fallback con recorte de la mayor cara detectada
    try:
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        with mp_face_det.FaceDetection(model_selection=1, min_detection_confidence=0.5) as fd:
            det = fd.process(rgb)
        if not det or not det.detections:
            return None
        # tomar la detección con mayor score
        best = max(det.detections, key=lambda d: d.score[0] if d.score else 0.0)
        bbox = best.location_data.relative_bounding_box
        h, w = image.shape[:2]
        x = max(0, int((bbox.xmin - 0.15) * w))
        y = max(0, int((bbox.ymin - 0.20) * h))
        bw = int((bbox.width + 0.30) * w)
        bh = int((bbox.height + 0.35) * h)
        x2 = min(w, x + bw)
        y2 = min(h, y + bh)
        crop = image[y:y2, x:x2].copy()
        if crop.size == 0:
            return None
        # asegurar tamaño mínimo para landmarks estables
        if min(crop.shape[:2]) < 160:
            scale = 160.0 / float(min(crop.shape[:2]))
            crop = cv2.resize(crop, (int(crop.shape[1]*scale), int(crop.shape[0]*scale)))
        res2 = _mesh_on(crop)
        emb2 = _embedding_from_mesh_res(res2)
        return emb2
    except Exception:
        return None
