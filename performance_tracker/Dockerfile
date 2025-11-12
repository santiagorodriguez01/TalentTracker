FROM python:3.11-slim
WORKDIR /app

# Dependencias del sistema para OpenCV/ultralytics
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libsm6 libxext6 libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

ENV PIP_NO_CACHE_DIR=1

COPY performance_tracker/requirements.txt ./perf_requirements.txt
RUN pip install -r perf_requirements.txt

# Copiamos el paquete
COPY performance_tracker/ /app/performance_tracker/

# El modelo se monta por volumen en /app/yolov8n-pose.pt
EXPOSE 8020
CMD ["uvicorn", "performance_tracker.main:app", "--host", "0.0.0.0", "--port", "8020"]

