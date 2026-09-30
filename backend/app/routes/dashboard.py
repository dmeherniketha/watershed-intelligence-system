import json
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional
from app.database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["Monitoring Dashboard"])

@router.get("/metrics")
def get_dashboard_metrics(watershed_id: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()

    # Base filter
    w_filter = "WHERE watershed_id = ?" if watershed_id else ""
    w_params = [watershed_id] if watershed_id else []

    # 1. Watershed Info
    if watershed_id:
        cursor.execute("SELECT * FROM watersheds WHERE id = ?", (watershed_id,))
        w_row = cursor.fetchone()
        watershed_info = dict(w_row) if w_row else None
        if watershed_info and watershed_info["lu_lc_summary"]:
            watershed_info["lu_lc_summary"] = json.loads(watershed_info["lu_lc_summary"])
    else:
        cursor.execute("SELECT COUNT(*), SUM(area_sq_km) FROM watersheds")
        w_count, total_area = cursor.fetchone()
        watershed_info = {"total_watersheds": w_count, "total_area_sq_km": total_area}

    # 2. Water bodies & Bathymetry stats
    cursor.execute(f"SELECT COUNT(*), SUM(surface_area_ha), SUM(storage_capacity_m3), SUM(bathymetry_available) FROM water_bodies {w_filter}", w_params)
    wb_count, total_ha, total_storage_m3, bathy_count = cursor.fetchone()

    # 3. Interventions stats
    cursor.execute(f"SELECT category, status, COUNT(*), SUM(storage_boost_m3), SUM(beneficiary_area_ha) FROM interventions {w_filter} GROUP BY category, status", w_params)
    int_rows = cursor.fetchall()

    interventions_by_cat = {}
    interventions_by_status = {"Completed": 0, "In Progress": 0, "Planned": 0, "Needs Maintenance": 0}
    total_interventions = 0
    total_storage_boost_m3 = 0.0
    total_beneficiary_ha = 0.0

    for r in int_rows:
        cat, status, cnt, stg, ben = r
        total_interventions += cnt
        interventions_by_status[status] = interventions_by_status.get(status, 0) + cnt
        if cat not in interventions_by_cat:
            interventions_by_cat[cat] = 0
        interventions_by_cat[cat] += cnt
        if stg:
            total_storage_boost_m3 += stg
        if ben:
            total_beneficiary_ha += ben

    # 4. Field Evidence & EXIF GPS stats
    cursor.execute(f"""
    SELECT 
        COUNT(*),
        SUM(CASE WHEN verification_status = 'VERIFIED' THEN 1 ELSE 0 END),
        SUM(CASE WHEN verification_status = 'PENDING' THEN 1 ELSE 0 END),
        SUM(CASE WHEN has_exif_gps = 1 THEN 1 ELSE 0 END),
        SUM(CASE WHEN location_source = 'MANUAL_PIN' THEN 1 ELSE 0 END),
        SUM(CASE WHEN location_source = 'UNVERIFIED' THEN 1 ELSE 0 END)
    FROM field_photos {w_filter}
    """, w_params)
    fp_total, fp_verified, fp_pending, fp_exif, fp_manual, fp_unverified = cursor.fetchone()

    # 5. AI Predictions stats
    ai_w_filter = "WHERE fp.watershed_id = ?" if watershed_id else ""
    cursor.execute(f"""
    SELECT 
        COUNT(*),
        SUM(CASE WHEN ap.human_review_status = 'ACCEPTED' THEN 1 ELSE 0 END),
        SUM(CASE WHEN ap.human_review_status = 'PENDING' THEN 1 ELSE 0 END),
        SUM(CASE WHEN ap.human_review_status = 'CORRECTED' THEN 1 ELSE 0 END),
        AVG(ap.confidence_score)
    FROM ai_predictions ap
    JOIN field_photos fp ON ap.field_photo_id = fp.id
    {ai_w_filter}
    """, w_params)
    ai_total, ai_accepted, ai_pending, ai_corrected, avg_conf = cursor.fetchone()

    # 6. Latest Satellite Scene
    cursor.execute(f"SELECT sensor, acquisition_date, data_provider FROM satellite_scenes {w_filter} ORDER BY acquisition_date DESC LIMIT 1", w_params)
    sat_row = cursor.fetchone()
    latest_satellite = dict(sat_row) if sat_row else None

    conn.close()

    return {
        "watershed_id": watershed_id,
        "watershed_info": watershed_info,
        "water_bodies": {
            "total_count": wb_count or 0,
            "total_surface_area_ha": round(total_ha or 0.0, 2),
            "measured_storage_m3": round(total_storage_m3 or 0.0, 1),
            "bathymetry_surveyed_count": bathy_count or 0,
            "bathymetry_coverage_pct": round((bathy_count / max(wb_count, 1)) * 100.0, 1) if wb_count else 0.0
        },
        "interventions": {
            "total_count": total_interventions,
            "by_category": interventions_by_cat,
            "by_status": interventions_by_status,
            "total_storage_boost_m3": round(total_storage_boost_m3, 1),
            "total_beneficiary_ha": round(total_beneficiary_ha, 1)
        },
        "field_evidence": {
            "total_photos": fp_total or 0,
            "verified_count": fp_verified or 0,
            "pending_count": fp_pending or 0,
            "exif_gps_count": fp_exif or 0,
            "manual_pinned_count": fp_manual or 0,
            "unverified_location_count": fp_unverified or 0
        },
        "ai_vision": {
            "total_predictions": ai_total or 0,
            "human_accepted": ai_accepted or 0,
            "human_pending": ai_pending or 0,
            "human_corrected": ai_corrected or 0,
            "mean_confidence_pct": round((avg_conf or 0.0) * 100.0, 1)
        },
        "latest_satellite": latest_satellite
    }
