import sqlite3
import json
from datetime import datetime
from app.config import DB_PATH

def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Watersheds Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS watersheds (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        sub_basin TEXT,
        area_sq_km REAL NOT NULL,
        perimeter_km REAL,
        avg_slope_pct REAL,
        elevation_min_m REAL,
        elevation_max_m REAL,
        crs TEXT DEFAULT 'EPSG:4326',
        center_lat REAL NOT NULL,
        center_lon REAL NOT NULL,
        bounding_box TEXT NOT NULL, -- JSON [min_lon, min_lat, max_lon, max_lat]
        boundary_geojson TEXT NOT NULL,
        drainage_geojson TEXT,
        lu_lc_summary TEXT, -- JSON
        created_at TEXT NOT NULL,
        data_source TEXT NOT NULL,
        data_provenance TEXT
    )
    """)

    # 2. Water Bodies & Bathymetry Availability
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS water_bodies (
        id TEXT PRIMARY KEY,
        watershed_id TEXT NOT NULL,
        name TEXT NOT NULL,
        water_type TEXT NOT NULL, -- Reservoir, Tank, Pond, Check Dam Basin
        surface_area_ha REAL NOT NULL,
        surface_elevation_m REAL,
        center_lat REAL NOT NULL,
        center_lon REAL NOT NULL,
        boundary_geojson TEXT NOT NULL,
        bathymetry_available INTEGER DEFAULT 0, -- 1 = real bathymetry exists, 0 = unavailable
        max_measured_depth_m REAL,
        avg_measured_depth_m REAL,
        storage_capacity_m3 REAL,
        survey_date TEXT,
        vertical_datum TEXT,
        survey_method TEXT,
        quality_assessment TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (watershed_id) REFERENCES watersheds(id)
    )
    """)

    # 3. Bathymetry Soundings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bathymetry_soundings (
        id TEXT PRIMARY KEY,
        water_body_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        depth_m REAL NOT NULL,
        bed_elevation_m REAL NOT NULL,
        uncertainty_m REAL DEFAULT 0.05,
        is_measured INTEGER DEFAULT 1, -- 1 = Measured Sounding, 0 = Interpolated
        sounder_type TEXT,
        FOREIGN KEY (water_body_id) REFERENCES water_bodies(id)
    )
    """)

    # 4. Watershed Interventions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interventions (
        id TEXT PRIMARY KEY,
        watershed_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL, -- Check Dam, Gully Plug, Farm Pond, Percolation Tank, Contour Bunding, Afforestation
        status TEXT NOT NULL, -- Completed, In Progress, Planned, Needs Maintenance
        sanctioned_year INTEGER,
        implementing_agency TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        elevation_m REAL,
        dimension_spec TEXT,
        storage_boost_m3 REAL,
        beneficiary_area_ha REAL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (watershed_id) REFERENCES watersheds(id)
    )
    """)

    # 5. Field Evidence / Geo-tagged Photographs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS field_photos (
        id TEXT PRIMARY KEY,
        watershed_id TEXT NOT NULL,
        water_body_id TEXT,
        intervention_id TEXT,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        thumbnail_path TEXT,
        file_size_bytes INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        has_exif_gps INTEGER DEFAULT 0,
        latitude REAL,
        longitude REAL,
        altitude_m REAL,
        capture_timestamp TEXT,
        is_location_manually_assigned INTEGER DEFAULT 0,
        location_source TEXT NOT NULL, -- 'EXIF_METADATA', 'MANUAL_PIN', 'UNVERIFIED'
        camera_make TEXT,
        camera_model TEXT,
        observation_category TEXT, -- 'Structure Inspection', 'Vegetation Health', 'Soil Erosion', 'Siltation', 'Water Level'
        description TEXT,
        recorded_by TEXT,
        verification_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'REJECTED'
        verified_by TEXT,
        verified_at TEXT,
        verification_notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (watershed_id) REFERENCES watersheds(id)
    )
    """)

    # 6. Satellite Scenes & Observations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS satellite_scenes (
        id TEXT PRIMARY KEY,
        watershed_id TEXT NOT NULL,
        sensor TEXT NOT NULL, -- Sentinel-2 MSI, Landsat 8/9, Cartosat, Resourcesat LISS-IV
        acquisition_date TEXT NOT NULL,
        cloud_cover_pct REAL NOT NULL,
        spatial_resolution_m REAL NOT NULL,
        crs TEXT NOT NULL,
        rgb_path TEXT,
        ndvi_path TEXT,
        ndwi_path TEXT,
        data_provider TEXT NOT NULL, -- NRSC / Bhuvan, ESA Copernicus, USGS
        is_calibrated INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (watershed_id) REFERENCES watersheds(id)
    )
    """)

    # 7. Multi-temporal Change Analyses
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS change_analyses (
        id TEXT PRIMARY KEY,
        watershed_id TEXT NOT NULL,
        scene_t1_id TEXT NOT NULL,
        scene_t2_id TEXT NOT NULL,
        analysis_type TEXT NOT NULL, -- 'NDVI_VEGETATION', 'NDWI_WATER_SURFACE', 'LAND_COVER_CHANGE'
        methodology TEXT NOT NULL,
        vegetation_gain_ha REAL,
        vegetation_loss_ha REAL,
        water_spread_t1_ha REAL,
        water_spread_t2_ha REAL,
        net_water_gain_ha REAL,
        confidence_pct REAL,
        limitations TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (watershed_id) REFERENCES watersheds(id),
        FOREIGN KEY (scene_t1_id) REFERENCES satellite_scenes(id),
        FOREIGN KEY (scene_t2_id) REFERENCES satellite_scenes(id)
    )
    """)

    # 8. AI Vision Predictions & Human Review
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_predictions (
        id TEXT PRIMARY KEY,
        field_photo_id TEXT NOT NULL,
        model_name TEXT NOT NULL,
        model_version TEXT NOT NULL,
        predicted_class TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        all_class_scores TEXT NOT NULL, -- JSON array of {label, score}
        detected_features TEXT, -- JSON array of bounding boxes or key observations
        inference_timestamp TEXT NOT NULL,
        human_review_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'CORRECTED', 'REJECTED'
        human_corrected_class TEXT,
        reviewer_id TEXT,
        review_timestamp TEXT,
        review_comments TEXT,
        FOREIGN KEY (field_photo_id) REFERENCES field_photos(id)
    )
    """)

    # 9. Audit Logs & Data Provenance
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        actor TEXT,
        details TEXT,
        timestamp TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()
