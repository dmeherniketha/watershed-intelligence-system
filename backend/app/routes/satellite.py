import json
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.services.satellite_service import SatelliteService
from app.schemas import ChangeAnalysisRequest

router = APIRouter(prefix="/api/satellite", tags=["Satellite Imagery & Change Detection"])

@router.get("/scenes")
def list_scenes(watershed_id: str = Query(..., description="Watershed ID")):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM satellite_scenes WHERE watershed_id = ? ORDER BY acquisition_date DESC", (watershed_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/change-analysis")
def perform_change_analysis(req: ChangeAnalysisRequest):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM satellite_scenes WHERE id = ?", (req.scene_t1_id,))
    t1_row = cursor.fetchone()
    cursor.execute("SELECT * FROM satellite_scenes WHERE id = ?", (req.scene_t2_id,))
    t2_row = cursor.fetchone()
    conn.close()

    if not t1_row or not t2_row:
        raise HTTPException(status_code=404, detail="One or both satellite scenes not found")

    scene_t1 = dict(t1_row)
    scene_t2 = dict(t2_row)

    # Perform analysis
    result = SatelliteService.compute_change_matrix(req.watershed_id, scene_t1, scene_t2, req.analysis_type)
    return result
