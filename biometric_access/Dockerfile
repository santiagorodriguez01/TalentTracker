FROM python:3.11-slim
WORKDIR /app

# Dependencias del sistema para OpenCV/mediapipe
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libsm6 libxext6 libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

ENV PIP_NO_CACHE_DIR=1

COPY biometric_access/requirements.txt ./biometric_requirements.txt
RUN pip install -r biometric_requirements.txt

# Copiamos el paquete como tal
COPY biometric_access/ /app/biometric_access/

EXPOSE 8010
CMD ["uvicorn", "biometric_access.main:app", "--host", "0.0.0.0", "--port", "8010"]

