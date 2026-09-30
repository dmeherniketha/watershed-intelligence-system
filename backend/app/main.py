from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import APP_NAME, VERSION, CORS_ORIGINS, UPLOAD_DIR
from app.database import init_db
from app.services.data_seeder import seed_database

# Import routers
from app.routes.watersheds import router as watersheds_router
from app.routes.dem import router as dem_router
from app.routes.bathymetry import router as bathymetry_router
from app.routes.field_photos import router as field_photos_router
from app.routes.satellite import router as satellite_router
from app.routes.ai_vision import router as ai_vision_router
from app.routes.dashboard import router as dashboard_router
from app.routes.reports import router as reports_router

app = FastAPI(
    title=APP_NAME,
    version=VERSION,
    description="Backend API for AI-Powered 3D Watershed Intelligence System (Smart India Hackathon 2026 - SIH26015 / Team INNOVAID)"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads static directory for field photographs
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include API Routers
app.include_router(watersheds_router)
app.include_router(dem_router)
app.include_router(bathymetry_router)
app.include_router(field_photos_router)
app.include_router(satellite_router)
app.include_router(ai_vision_router)
app.include_router(dashboard_router)
app.include_router(reports_router)

@app.on_event("startup")
def on_startup():
    init_db()
    seed_database()

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "system": APP_NAME,
        "version": VERSION,
        "team": "INNOVAID (SIH26015)",
        "database": "SQLite / Spatial Datasets Ready"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
