from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from pydantic import BaseModel
import numpy as np, cv2, json, base64, os
from biometric_access.utils.face_features import extract_face_embedding
from biometric_access.utils.liveness import evaluate_liveness


router = APIRouter(prefix="/biometric", tags=["Biometric"])
ENROLLMENTS: dict[str, np.ndarray] = {}

# Umbrales más estrictos; ajustables por env
MATCH_THRESHOLD = float(os.getenv("BIOMETRIC_MATCH_THRESHOLD", os.getenv("AI_FACE_MATCH_THRESHOLD", "0.93")))
MAX_L2_DISTANCE = float(os.getenv("BIOMETRIC_MAX_L2", "0.60"))
# Tolerancia adicional cuando el score es muy alto
MAX_L2_DISTANCE_HI = float(os.getenv("BIOMETRIC_MAX_L2_HI", os.getenv("BIOMETRIC_MAX_L2", "0.45")))
HI_DELTA = float(os.getenv("BIOMETRIC_HI_DELTA", "0.05"))

class VerifyResponse(BaseModel):
    allow: bool
    score: float
    reason: str | None = None

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    a = a.astype(np.float32); b = b.astype(np.float32)
    a = a / (np.linalg.norm(a) + 1e-8)
    b = b / (np.linalg.norm(b) + 1e-8)
    return float(np.dot(a, b))

def l2_distance(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.linalg.norm(a - b))

@router.post("/enroll")
async def enroll(user_id: str = Form(...), image: UploadFile = File(...)):
    file_bytes = np.frombuffer(await image.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    vec = extract_face_embedding(img)
    if vec is None:
        raise HTTPException(400, "No face detected")
    ENROLLMENTS[user_id] = vec
    emb_b64 = base64.b64encode(vec.tobytes()).decode('ascii')
    return {"message": "Enrollment successful", "user_id": user_id, "embedding_b64": emb_b64}

@router.post("/verify", response_model=VerifyResponse)
async def verify(user_id: str = Form(...), image: UploadFile = File(...), challenge: str = Form("blink"), evidence: str = Form("{}")):
    evidence = json.loads(evidence)
    if user_id not in ENROLLMENTS:
        raise HTTPException(404, "User not enrolled")

    file_bytes = np.frombuffer(await image.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    vec = extract_face_embedding(img)
    if vec is None:
        raise HTTPException(400, "No face detected")

    enrolled = ENROLLMENTS[user_id]
    score = cosine_similarity(vec, enrolled)
    dist = l2_distance(vec, enrolled)
    live = evaluate_liveness(challenge, evidence)
    base_ok = (score >= MATCH_THRESHOLD) and (dist <= MAX_L2_DISTANCE)
    hi_ok = (score >= (MATCH_THRESHOLD + HI_DELTA)) and (dist <= MAX_L2_DISTANCE_HI)
    allow = (base_ok or hi_ok) and live
    if not allow:
        return VerifyResponse(allow=False, score=score, reason=f"score={score:.3f} dist={dist:.3f} live={bool(live)}")
    return VerifyResponse(allow=True, score=score, reason=None)


@router.delete("/enrollments/{user_id}")
async def delete_enrollment(user_id: str):
    """Elimina el embedding cargado en memoria para un usuario.
    No toca base de datos (eso lo hace el backend Node)."""
    existed = user_id in ENROLLMENTS
    if existed:
        try:
            del ENROLLMENTS[user_id]
        except KeyError:
            existed = False
    return {"deleted": existed, "user_id": user_id}
