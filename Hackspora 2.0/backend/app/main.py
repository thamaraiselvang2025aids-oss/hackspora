import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.models import contact, emergency, event_log
from app.api.vision_router import router as vision_router
from app.api.audio_router import router as audio_router
from app.api.isl_router import router as isl_router
from app.api.emergency_router import router as emergency_router
from app.api.contacts_router import router as contacts_router
from app.api.status_router import router as status_router
from app.websocket.endpoints import router as ws_router
from app.services.emergency.escalation_worker import run_escalation_worker_loop

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite tables
    Base.metadata.create_all(bind=engine)
    print("[OBSERVA Backend] Database tables initialized.")
    
    # Launch background escalation task
    worker_task = asyncio.create_task(run_escalation_worker_loop())
    yield
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass
    print("[OBSERVA Backend] Shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multimodal Accessibility Operating System Backend",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(vision_router, prefix=settings.API_PREFIX)
app.include_router(audio_router, prefix=settings.API_PREFIX)
app.include_router(isl_router, prefix=settings.API_PREFIX)
app.include_router(emergency_router, prefix=settings.API_PREFIX)
app.include_router(contacts_router, prefix=settings.API_PREFIX)
app.include_router(status_router, prefix=settings.API_PREFIX)
app.include_router(ws_router)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Determine path to frontend dist directory
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.abspath(os.path.join(_THIS_DIR, "..", ".."))
frontend_dist = os.path.join(_PROJECT_ROOT, "frontend", "dist")

if os.path.isdir(frontend_dist):
    # Mount the assets directory directly
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Check if the requested file exists in dist
    path_to_file = os.path.join(frontend_dist, full_path)
    if os.path.isfile(path_to_file) and full_path != "":
        return FileResponse(path_to_file)
    
    # Otherwise, return index.html for React Router
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)
    
    # Fallback if frontend isn't built
    return {
        "product": "OBSERVA",
        "status": "ONLINE - Frontend not built. Run 'npm run build'.",
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
