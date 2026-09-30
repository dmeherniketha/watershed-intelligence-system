import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.schemas import HumanReviewRequest
from app.services.ai_vision_service import AIVisionService

router = APIRouter(prefix="/api/ai-vision", tags=["AI Vision & Human Review"])

@router.get("/classes")
def get_supported_classes():
    return {
        "model_name": AIVisionService.MODEL_NAME,
        "model_version": AIVisionService.MODEL_VERSION,
        "supported_classes": AIVisionService.INTERVENTION_CLASSES,
        "inference_engine": "Tensor-Optimized Heuristic Feature Pyramid & Bayesian Spectral Calibrator"
    }

@router.get("/predictions")
def list_ai_predictions(status: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()

    query = """
    SELECT ap.*, fp.file_name, fp.thumbnail_path, fp.watershed_id, fp.observation_category, fp.description, fp.latitude, fp.longitude
    FROM ai_predictions ap
    JOIN field_photos fp ON ap.field_photo_id = fp.id
    WHERE 1=1
    """
    params = []
    if status:
        query += " AND ap.human_review_status = ?"
        params.append(status)

    query += " ORDER BY ap.inference_timestamp DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d["all_class_scores"] = json.loads(d["all_class_scores"])
        d["detected_features"] = json.loads(d["detected_features"]) if d["detected_features"] else []
        result.append(d)
    return result

@router.post("/review/{prediction_id}")
def submit_human_review(prediction_id: str, req: HumanReviewRequest):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, field_photo_id FROM ai_predictions WHERE id = ?", (prediction_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="AI Prediction record not found")

    photo_id = row["field_photo_id"]
    now = datetime.now().isoformat()

    cursor.execute("""
    UPDATE ai_predictions
    SET human_review_status = ?, human_corrected_class = ?, reviewer_id = ?, review_timestamp = ?, review_comments = ?
    WHERE id = ?
    """, (req.status, req.corrected_class, req.reviewer_id, now, req.comments, prediction_id))

    # Also update the field photo verification status
    new_vstatus = "VERIFIED" if req.status in ("ACCEPTED", "CORRECTED") else "REJECTED"
    cursor.execute("""
    UPDATE field_photos
    SET verification_status = ?, verified_by = ?, verified_at = ?, verification_notes = ?
    WHERE id = ?
    """, (new_vstatus, req.reviewer_id, now, f"AI Review: {req.status} ({req.comments or ''})", photo_id))

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "prediction_id": prediction_id,
        "human_review_status": req.status,
        "updated_at": now
    }
