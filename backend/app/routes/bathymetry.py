import json
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.database import get_db
from app.services.bathymetry_service import BathymetryService

router = APIRouter(prefix="/api/bathymetry", tags=["Bathymetry"])

@router.get("/water-body/{water_body_id}")
def get_water_body_bathymetry(water_body_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM water_bodies WHERE id = ?", (water_body_id,))
    wb_row = cursor.fetchone()

    if not wb_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Water body not found")

    wb_dict = dict(wb_row)
    wb_dict["boundary_geojson"] = json.loads(wb_dict["boundary_geojson"])

    # Fetch soundings if any
    cursor.execute("SELECT * FROM bathymetry_soundings WHERE water_body_id = ?", (water_body_id,))
    soundings = [dict(s) for s in cursor.fetchall()]
    conn.close()

    result = BathymetryService.get_water_body_bathymetry(wb_dict, soundings)
    return result
