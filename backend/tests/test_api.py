import pytest
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db
from app.services.data_seeder import seed_database

client = TestClient(app)

def setup_module():
    init_db()
    seed_database()

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "INNOVAID" in data["team"]

def test_list_watersheds():
    res = client.get("/api/watersheds")
    assert res.status_code == 200
    watersheds = res.json()
    assert len(watersheds) >= 2
    assert any(w["id"] == "WTR-KA-001" for w in watersheds)

def test_watershed_detail():
    res = client.get("/api/watersheds/WTR-KA-001")
    assert res.status_code == 200
    w = res.json()
    assert w["name"] == "Chitravathi Sub-Basin Catchment 4B2A5"
    assert len(w["water_bodies"]) >= 2
    assert len(w["interventions"]) >= 5

def test_dem_elevation_point():
    res = client.get("/api/dem/elevation?watershed_id=WTR-KA-001&lat=13.4325&lon=77.7280")
    assert res.status_code == 200
    data = res.json()
    assert "elevation_m" in data
    assert data["elevation_m"] > 600.0

def test_dem_elevation_profile():
    payload = {
        "watershed_id": "WTR-KA-001",
        "points": [[13.41, 77.68], [13.45, 77.74]],
        "num_samples": 40
    }
    res = client.post("/api/dem/profile", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_distance_m"] > 1000.0
    assert len(data["points"]) >= 35

def test_bathymetry_available():
    # WB-KA-01 has valid bathymetric soundings
    res = client.get("/api/bathymetry/water-body/WB-KA-01")
    assert res.status_code == 200
    data = res.json()
    assert data["bathymetry_available"] is True
    assert data["max_measured_depth_m"] == 5.4
    assert len(data["measured_soundings"]) > 0

def test_bathymetry_unavailable():
    # WB-KA-02 has NO bathymetry -> must show honest limitation disclaimer
    res = client.get("/api/bathymetry/water-body/WB-KA-02")
    assert res.status_code == 200
    data = res.json()
    assert data["bathymetry_available"] is False
    assert "Bathymetry unavailable" in data["disclaimer"]

def test_field_photos_and_exif():
    res = client.get("/api/field-photos?watershed_id=WTR-KA-001")
    assert res.status_code == 200
    photos = res.json()
    assert len(photos) >= 4
    # Check that photos without GPS are clearly tagged as UNVERIFIED
    unverified = [p for p in photos if not p["has_exif_gps"]]
    assert len(unverified) >= 1
    assert unverified[0]["location_source"] == "UNVERIFIED"

def test_satellite_scenes_and_change():
    scenes_res = client.get("/api/satellite/scenes?watershed_id=WTR-KA-001")
    assert scenes_res.status_code == 200
    scenes = scenes_res.json()
    assert len(scenes) >= 2

    # Run change detection
    payload = {
        "watershed_id": "WTR-KA-001",
        "scene_t1_id": scenes[1]["id"],
        "scene_t2_id": scenes[0]["id"],
        "analysis_type": "NDVI_VEGETATION"
    }
    change_res = client.post("/api/satellite/change-analysis", json=payload)
    assert change_res.status_code == 200
    change_data = change_res.json()
    assert "metrics" in change_data
    assert "vegetation_gain_ha" in change_data["metrics"]

def test_dashboard_metrics():
    res = client.get("/api/dashboard/metrics?watershed_id=WTR-KA-001")
    assert res.status_code == 200
    metrics = res.json()
    assert metrics["water_bodies"]["total_count"] >= 2
    assert metrics["interventions"]["total_count"] >= 5

def test_report_export():
    csv_res = client.get("/api/reports/export/csv?watershed_id=WTR-KA-001")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers.get("content-type", "")

    geojson_res = client.get("/api/reports/export/geojson?watershed_id=WTR-KA-001")
    assert geojson_res.status_code == 200
    assert "FeatureCollection" in geojson_res.text
