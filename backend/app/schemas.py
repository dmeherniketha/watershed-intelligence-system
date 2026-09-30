from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class WatershedBase(BaseModel):
    id: str
    name: str
    state: str
    district: str
    sub_basin: Optional[str] = None
    area_sq_km: float
    perimeter_km: Optional[float] = None
    avg_slope_pct: Optional[float] = None
    elevation_min_m: Optional[float] = None
    elevation_max_m: Optional[float] = None
    crs: str = "EPSG:4326"
    center_lat: float
    center_lon: float
    bounding_box: List[float]
    boundary_geojson: Dict[str, Any]
    drainage_geojson: Optional[Dict[str, Any]] = None
    lu_lc_summary: Optional[Dict[str, Any]] = None
    created_at: str
    data_source: str
    data_provenance: Optional[str] = None

class WaterBodyBase(BaseModel):
    id: str
    watershed_id: str
    name: str
    water_type: str
    surface_area_ha: float
    surface_elevation_m: Optional[float] = None
    center_lat: float
    center_lon: float
    boundary_geojson: Dict[str, Any]
    bathymetry_available: bool
    max_measured_depth_m: Optional[float] = None
    avg_measured_depth_m: Optional[float] = None
    storage_capacity_m3: Optional[float] = None
    survey_date: Optional[str] = None
    vertical_datum: Optional[str] = None
    survey_method: Optional[str] = None
    quality_assessment: Optional[str] = None

class BathymetrySoundingBase(BaseModel):
    id: str
    water_body_id: str
    latitude: float
    longitude: float
    depth_m: float
    bed_elevation_m: float
    uncertainty_m: float = 0.05
    is_measured: bool = True
    sounder_type: Optional[str] = None

class InterventionBase(BaseModel):
    id: str
    watershed_id: str
    name: str
    category: str
    status: str
    sanctioned_year: Optional[int] = None
    implementing_agency: Optional[str] = None
    latitude: float
    longitude: float
    elevation_m: Optional[float] = None
    dimension_spec: Optional[str] = None
    storage_boost_m3: Optional[float] = None
    beneficiary_area_ha: Optional[float] = None

class FieldPhotoBase(BaseModel):
    id: str
    watershed_id: str
    water_body_id: Optional[str] = None
    intervention_id: Optional[str] = None
    file_name: str
    file_path: str
    thumbnail_path: Optional[str] = None
    file_size_bytes: int
    mime_type: str
    has_exif_gps: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude_m: Optional[float] = None
    capture_timestamp: Optional[str] = None
    is_location_manually_assigned: bool = False
    location_source: str
    camera_make: Optional[str] = None
    camera_model: Optional[str] = None
    observation_category: Optional[str] = None
    description: Optional[str] = None
    recorded_by: Optional[str] = None
    verification_status: str = "PENDING"
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    verification_notes: Optional[str] = None
    created_at: str

class ProfileRequest(BaseModel):
    watershed_id: str
    points: List[List[float]] # [[lat, lon], [lat, lon], ...]
    num_samples: int = 60

class ProfilePoint(BaseModel):
    distance_m: float
    latitude: float
    longitude: float
    elevation_m: float
    slope_pct: float
    surface_feature: Optional[str] = None # "Land", "Water Body", "Check Dam"
    water_depth_m: Optional[float] = None
    bed_elevation_m: Optional[float] = None
    is_bathymetry_measured: Optional[bool] = None

class ElevationProfileResponse(BaseModel):
    watershed_id: str
    total_distance_m: float
    min_elevation_m: float
    max_elevation_m: float
    avg_slope_pct: float
    dem_source: str
    dem_resolution_m: float
    vertical_accuracy_m: float
    points: List[ProfilePoint]
    crosses_water_body: bool
    water_body_name: Optional[str] = None
    bathymetry_status: str # "MEASURED", "UNAVAILABLE", "NONE"
    disclaimer: Optional[str] = None

class HumanReviewRequest(BaseModel):
    status: str # "ACCEPTED", "CORRECTED", "REJECTED"
    corrected_class: Optional[str] = None
    reviewer_id: str
    comments: Optional[str] = None

class ChangeAnalysisRequest(BaseModel):
    watershed_id: str
    scene_t1_id: str
    scene_t2_id: str
    analysis_type: str = "NDVI_VEGETATION"
