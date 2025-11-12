from fastapi import FastAPI
from biometric_access.routers import biometric




app = FastAPI(title="Biometric Access Service", version="1.0")
app.include_router(biometric.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8010, reload=True)
