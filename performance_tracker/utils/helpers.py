# utils/helpers.py
import requests, json

def post_metrics_to_backend(backend_url, alumno_id, metrics):
    try:
        payload = {
            "alumno_id": alumno_id,
            "metrics": metrics
        }
        requests.post(f"{backend_url}/api/ai/metrics", json=payload, timeout=3)
    except Exception as e:
        print("[WARN] No se pudo enviar métricas:", str(e))
