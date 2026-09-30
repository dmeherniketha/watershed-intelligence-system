import json
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from app.database import get_db

router = APIRouter(prefix="/api/watersheds", tags=["Watersheds"])

@router.get("", response_model=List[Dict[str, Any]])
def list_watersheds():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, state, district, sub_basin, area_sq_km, perimeter_km, avg_slope_pct, elevation_min_m, elevation_max_m, crs, center_lat, center_lon, bounding_box, data_source, created_at FROM watersheds")
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d["bounding_box"] = json.loads(d["bounding_box"])
        result.append(d)
    return result

@router.get("/{watershed_id}")
def get_watershed_detail(watershed_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM watersheds WHERE id = ?", (watershed_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Watershed not found")

    w = dict(row)
    w["bounding_box"] = json.loads(w["bounding_box"])
    w["boundary_geojson"] = json.loads(w["boundary_geojson"])
    w["drainage_geojson"] = json.loads(w["drainage_geojson"]) if w["drainage_geojson"] else None
    w["lu_lc_summary"] = json.loads(w["lu_lc_summary"]) if w["lu_lc_summary"] else None

    # Fetch water bodies
    cursor.execute("SELECT * FROM water_bodies WHERE watershed_id = ?", (watershed_id,))
    w_bodies = []
    for wb in cursor.fetchall():
        wbd = dict(wb)
        wbd["boundary_geojson"] = json.loads(wbd["boundary_geojson"])
        wbd["bathymetry_available"] = bool(wbd["bathymetry_available"])
        w_bodies.append(wbd)
    w["water_bodies"] = w_bodies

    # Fetch interventions
    cursor.execute("SELECT * FROM interventions WHERE watershed_id = ?", (watershed_id,))
    w["interventions"] = [dict(i) for i in cursor.fetchall()]

    conn.close()
    return w
