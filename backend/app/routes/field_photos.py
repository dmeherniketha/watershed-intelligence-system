import os
import uuid
import json
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from typing import List, Optional, Dict, Any

from app.config import UPLOAD_DIR, MAX_UPLOAD_SIZE_MB, ALLOWED_IMAGE_EXTENSIONS
from app.database import get_db
from app.services.exif_service import ExifService
from app.services.ai_vision_service import AIVisionService

router = APIRouter(prefix="/api/field-photos", tags=["Field Evidence & Photos"])

@router.get("")
def list_field_photos(
    watershed_id: Optional[str] = None,
    verification_status: Optional[str] = None,
    category: Optional[str] = None
):
    conn = get_db()
    cursor = conn.cursor()

    query = """
    SELECT fp.*, ap.predicted_class, ap.confidence_score, ap.human_review_status
    FROM field_photos fp
    LEFT JOIN ai_predictions ap ON fp.id = ap.field_photo_id
    WHERE 1=1
    """
    params = []

    if watershed_id:
        query += " AND fp.watershed_id = ?"
        params.append(watershed_id)
    if verification_status:
        query += " AND fp.verification_status = ?"
        params.append(verification_status)
    if category:
        query += " AND fp.observation_category = ?"
        params.append(category)

    query += " ORDER BY fp.created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d["has_exif_gps"] = bool(d["has_exif_gps"])
        d["is_location_manually_assigned"] = bool(d["is_location_manually_assigned"])
        result.append(d)
    return result

@router.post("/upload")
async def upload_field_photo(
    file: UploadFile = File(...),
    watershed_id: str = Form(...),
    water_body_id: Optional[str] = Form(None),
    intervention_id: Optional[str] = Form(None),
    observation_category: str = Form("Structure Inspection"),
    description: Optional[str] = Form(""),
    recorded_by: Optional[str] = Form("Field Officer")
):
    # Validate extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file_ext}'. Allowed formats: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )

    # Read bytes and validate size
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_SIZE_MB}MB"
        )

    # Save to disk
    photo_id = f"FP-{uuid.uuid4().hex[:8].upper()}"
    saved_filename = f"{photo_id}_{Path(file.filename).stem}{file_ext}"
    saved_path = UPLOAD_DIR / saved_filename
    thumb_path = UPLOAD_DIR / f"thumb_{saved_filename}"

    with open(saved_path, "wb") as f:
        f.write(content)

    # Generate thumbnail
    ExifService.generate_thumbnail(saved_path, thumb_path)

    # Extract EXIF metadata
    exif_info = ExifService.extract_metadata(saved_path)

    now = datetime.now().isoformat()
    capture_time = exif_info["capture_timestamp"] or now

    # Run AI Vision inference
    ai_result = AIVisionService.analyze_field_photo(saved_path, file.filename)

    conn = get_db()
    cursor = conn.cursor()

    # Insert photo record
    cursor.execute("""
    INSERT INTO field_photos VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    """, (
        photo_id,
        watershed_id,
        water_body_id,
        intervention_id,
        saved_filename,
        str(saved_path),
        str(thumb_path),
        len(content),
        file.content_type or "image/jpeg",
        1 if exif_info["has_exif_gps"] else 0,
        exif_info["latitude"],
        exif_info["longitude"],
        exif_info["altitude_m"],
        capture_time,
        0,
        exif_info["location_source"],
        exif_info["camera_make"],
        exif_info["camera_model"],
        observation_category,
        description,
        recorded_by,
        "PENDING",
        None,
        None,
        None,
        now
    ))

    # Insert AI prediction record
    pred_id = f"AIP-{photo_id}"
    cursor.execute("""
    INSERT INTO ai_predictions VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    """, (
        pred_id,
        photo_id,
        ai_result["model_name"],
        ai_result["model_version"],
        ai_result["predicted_class"],
        ai_result["confidence_score"],
        json.dumps(ai_result["all_class_scores"]),
        json.dumps(ai_result["detected_features"]),
        now,
        "PENDING",
        None,
        None,
        None,
        None
    ))

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "photo_id": photo_id,
        "has_exif_gps": exif_info["has_exif_gps"],
        "latitude": exif_info["latitude"],
        "longitude": exif_info["longitude"],
        "location_source": exif_info["location_source"],
        "capture_timestamp": capture_time,
        "ai_prediction": ai_result
    }

@router.patch("/{photo_id}/assign-location")
def assign_manual_location(photo_id: str, lat: float = Query(...), lon: float = Query(...)):
    """Allows manual pinning on map for photos lacking EXIF GPS."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, location_source FROM field_photos WHERE id = ?", (photo_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Photo not found")

    cursor.execute("""
    UPDATE field_photos
    SET latitude = ?, longitude = ?, is_location_manually_assigned = 1, location_source = 'MANUAL_PIN'
    WHERE id = ?
    """, (lat, lon, photo_id))
    conn.commit()
    conn.close()
    return {"status": "success", "photo_id": photo_id, "latitude": lat, "longitude": lon, "location_source": "MANUAL_PIN"}

@router.patch("/{photo_id}/verify")
def verify_field_photo(
    photo_id: str,
    status: str = Query(..., regex="^(VERIFIED|REJECTED|PENDING)$"),
    verified_by: str = Query("Admin Reviewer"),
    notes: Optional[str] = Query(None)
):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM field_photos WHERE id = ?", (photo_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Photo not found")

    now = datetime.now().isoformat()
    cursor.execute("""
    UPDATE field_photos
    SET verification_status = ?, verified_by = ?, verified_at = ?, verification_notes = ?
    WHERE id = ?
    """, (status, verified_by, now, notes, photo_id))
    conn.commit()
    conn.close()
    return {"status": "success", "photo_id": photo_id, "verification_status": status, "verified_at": now}
