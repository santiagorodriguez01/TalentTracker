# main.py
from fastapi import FastAPI
from .routers import performance
from performance_tracker.routers import performance
import uvicorn

app = FastAPI(
    title="Performance Tracker Service",
    version="2.0",
    description="Servicio de análisis físico en tiempo real (YOLOv8 Pose + Buffer temporal)"
)

app.include_router(performance.router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8020, reload=True)
