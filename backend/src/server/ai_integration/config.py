import os

class AIConfig:
    BIOMETRIC_URL = os.getenv("AI_BIOMETRIC_URL", "http://127.0.0.1:8010/biometric").rstrip("/")
    PERFORMANCE_URL = os.getenv("AI_PERFORMANCE_URL", "http://127.0.0.1:8020/performance").rstrip("/")
    TIMEOUT = int(os.getenv("AI_TIMEOUT_MS", "10000")) / 1000.0
    FACE_MATCH_THRESHOLD = float(os.getenv("AI_FACE_MATCH_THRESHOLD", "0.85"))
