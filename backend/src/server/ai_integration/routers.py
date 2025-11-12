from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from .clients import AIClients
from .services import BiometricService, PerformanceService
from .guards import require_coordinator, require_reviewer

router = APIRouter(prefix="/ai", tags=["AI Integration"])

# Inyector simple (adaptalo a tu contenedor DI)
async def get_clients():
    c = AIClients()
    try:
        yield c
    finally:
        await c.aclose()

@router.post("/enroll/alumno/{alumno_id}")
async def enroll_alumno_face(alumno_id: int, image: UploadFile = File(...), user=Depends(...), clients: AIClients = Depends(get_clients)):
    try:
        require_coordinator(user)
        svc = BiometricService(clients)
        db = ...  # tu session / repositorio
        res = await svc.enroll_face_for_alumno(alumno_id, await image.read(), db)
        return {"ok": True}
    except PermissionError as e:
        raise HTTPException(403, str(e))

@router.post("/verify/reviewer/{persona_id}")
async def verify_reviewer(persona_id: int, image: UploadFile = File(...), user=Depends(...), clients: AIClients = Depends(get_clients)):
    try:
        require_reviewer(user)
        svc = BiometricService(clients)
        db = ...
        res = await svc.verify_reviewer(persona_id, await image.read(), db)
        return res
    except PermissionError as e:
        raise HTTPException(403, str(e))

@router.post("/analyze/sprint/{alumno_id}")
async def analyze_sprint(alumno_id: int, video: UploadFile = File(...), user=Depends(...), clients: AIClients = Depends(get_clients)):
    try:
        require_coordinator(user)
        svc = PerformanceService(clients)
        db = ...
        res = await svc.run_sprint_analysis(alumno_id, await video.read(), db)
        return res
    except PermissionError as e:
        raise HTTPException(403, str(e))
