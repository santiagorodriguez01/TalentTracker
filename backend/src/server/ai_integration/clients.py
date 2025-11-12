import httpx
from .config import AIConfig

class AIClients:
    def __init__(self, timeout: float | None = None):
        self.timeout = timeout or AIConfig.TIMEOUT
        self._client = httpx.AsyncClient(timeout=self.timeout)

    async def biometric_enroll(self, user_id: str, image_bytes: bytes):
        files = {"image": ("face.jpg", image_bytes, "image/jpeg")}
        data = {"user_id": user_id}
        r = await self._client.post(f"{AIConfig.BIOMETRIC_URL}/enroll", files=files, data=data)
        r.raise_for_status()
        return r.json()

    async def biometric_verify(self, user_id: str, image_bytes: bytes, challenge: str = "blink", evidence: dict | None = None):
        files = {"image": ("face.jpg", image_bytes, "image/jpeg")}
        data = {"user_id": user_id, "challenge": challenge, "evidence": (None, (evidence or {}).__str__())}
        r = await self._client.post(f"{AIConfig.BIOMETRIC_URL}/verify", files=files, data=data)
        r.raise_for_status()
        return r.json()

    async def analyze_sprint(self, video_bytes: bytes):
        files = {"video": ("sprint.mp4", video_bytes, "video/mp4")}
        r = await self._client.post(f"{AIConfig.PERFORMANCE_URL}/analyze/sprint", files=files)
        r.raise_for_status()
        return r.json()

    async def aclose(self):
        await self._client.aclose()
