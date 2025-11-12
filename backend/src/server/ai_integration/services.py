from .config import AIConfig
from .clients import AIClients

class BiometricService:
    def __init__(self, clients: AIClients):
        self.clients = clients

    async def enroll_face_for_alumno(self, alumno_id: int, image_bytes: bytes, db):
        # 1) invocar microservicio
        _ = await self.clients.biometric_enroll(str(alumno_id), image_bytes)
        # 2) persistir en tu tabla local si guardás también la imagen/embedding (opcional)
        # db.biometric_profile.upsert(...)

    async def verify_reviewer(self, revisor_persona_id: int, image_bytes: bytes, db) -> dict:
        res = await self.clients.biometric_verify(str(revisor_persona_id), image_bytes)
        ok = bool(res.get("allow"))
        score = float(res.get("score", 0.0))
        # guardar auditoría local
        db.insert_biometric_audit(revisor_persona_id, "APROBAR_EGRESO", score, ok, detalle=res)
        return {"ok": ok, "score": score}

class PerformanceService:
    def __init__(self, clients: AIClients):
        self.clients = clients

    async def run_sprint_analysis(self, alumno_id: int, video_bytes: bytes, db) -> dict:
        res = await self.clients.analyze_sprint(video_bytes)
        # registrar sesión y métricas
        session_id = db.insert_physical_session(alumno_id, dispositivo="mobile", context=None)
        # ejemplo: {"average_speed_m_s": 5.2}
        for k, v in res.items():
            unit = "m/s" if "speed" in k else None
            db.insert_physical_metric(session_id, k, v, unit, extra=None)
        return {"session_id": session_id, **res}
