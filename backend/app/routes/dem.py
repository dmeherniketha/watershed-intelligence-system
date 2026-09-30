from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from app.schemas import ProfileRequest, ElevationProfileResponse
from app.services.dem_service import DEMService
from app.database import get_db

router = APIRouter(prefix="/api/dem", tags=["DEM & Terrain"])

@router.get("/elevation")
def get_elevation_point(
    watershed_id: str = Query(..., description="Watershed ID"),
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    elev = DEMService.get_elevation_at_point(watershed_id, lat, lon)
    meta = DEMService.DEM_METADATA.get(watershed_id, DEMService.DEM_METADATA["WTR-KA-001"])
    return {
        "watershed_id": watershed_id,
        "latitude": lat,
        "longitude": lon,
        "elevation_m": elev,
        "dem_source": meta["source"],
        "vertical_accuracy_m": meta["vertical_accuracy_m"]
    }

@router.post("/profile", response_model=ElevationProfileResponse)
def compute_elevation_profile(req: ProfileRequest):
    try:
        profile = DEMService.sample_elevation_profile(req.watershed_id, req.points, req.num_samples)
        return profile
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/grid-3d")
def get_terrain_3d_grid(
    watershed_id: str = Query(..., description="Watershed ID"),
    grid_size: int = Query(48, ge=16, le=96, description="Grid resolution")
):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT center_lat, center_lon, bounding_box FROM watersheds WHERE id = ?", (watershed_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Watershed not found")

    import json
    bounds = json.loads(row["bounding_box"]) # [min_lon, min_lat, max_lon, max_lat]
    grid_data = DEMService.generate_3d_terrain_grid(watershed_id, bounds, grid_size)
    return grid_data
