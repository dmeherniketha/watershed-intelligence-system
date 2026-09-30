export interface Watershed {
  id: string;
  name: string;
  state: string;
  district: string;
  sub_basin?: string;
  area_sq_km: number;
  perimeter_km?: number;
  avg_slope_pct?: number;
  elevation_min_m?: number;
  elevation_max_m?: number;
  crs: string;
  center_lat: number;
  center_lon: number;
  bounding_box: [number, number, number, number];
  boundary_geojson: any;
  drainage_geojson?: any;
  lu_lc_summary?: Record<string, string>;
  water_bodies?: WaterBody[];
  interventions?: Intervention[];
  created_at: string;
  data_source: string;
  data_provenance?: string;
}

export interface WaterBody {
  id: string;
  watershed_id: string;
  name: string;
  water_type: string;
  surface_area_ha: number;
  surface_elevation_m?: number;
  center_lat: number;
  center_lon: number;
  boundary_geojson: any;
  bathymetry_available: boolean;
  max_measured_depth_m?: number;
  avg_measured_depth_m?: number;
  storage_capacity_m3?: number;
  survey_date?: string;
  vertical_datum?: string;
  survey_method?: string;
  quality_assessment?: string;
}

export interface BathymetryInspection {
  water_body_id: string;
  water_body_name: string;
  water_type: string;
  surface_area_ha: number;
  surface_elevation_m?: number;
  bathymetry_available: boolean;
  disclaimer: string;
  max_measured_depth_m?: number;
  avg_measured_depth_m?: number;
  storage_capacity_m3?: number;
  survey_metadata?: {
    survey_date: string;
    vertical_datum: string;
    survey_method: string;
    sounder_type: string;
    total_soundings_count: number;
    horizontal_accuracy_m: number;
    vertical_accuracy_m: number;
  };
  quality_assessment?: string;
  measured_soundings: Array<{
    id: string;
    latitude: number;
    longitude: number;
    depth_m: number;
    bed_elevation_m: number;
    sounder_type: string;
  }>;
  depth_contours: Array<{
    depth_level_m: number;
    bed_elevation_m: number;
    isobath_label: string;
    area_at_depth_ha: number;
  }>;
}

export interface Intervention {
  id: string;
  watershed_id: string;
  name: string;
  category: string;
  status: string;
  sanctioned_year?: number;
  implementing_agency?: string;
  latitude: number;
  longitude: number;
  elevation_m?: number;
  dimension_spec?: string;
  storage_boost_m3?: number;
  beneficiary_area_ha?: number;
}

export interface FieldPhoto {
  id: string;
  watershed_id: string;
  water_body_id?: string;
  intervention_id?: string;
  file_name: string;
  file_path: string;
  thumbnail_path?: string;
  file_size_bytes: number;
  mime_type: string;
  has_exif_gps: boolean;
  latitude?: number;
  longitude?: number;
  altitude_m?: number;
  capture_timestamp?: string;
  is_location_manually_assigned: boolean;
  location_source: 'EXIF_METADATA' | 'MANUAL_PIN' | 'UNVERIFIED';
  camera_make?: string;
  camera_model?: string;
  observation_category: string;
  description?: string;
  recorded_by?: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  created_at: string;
  predicted_class?: string;
  confidence_score?: number;
  human_review_status?: string;
}

export interface ProfilePoint {
  distance_m: number;
  latitude: number;
  longitude: number;
  elevation_m: number;
  slope_pct: number;
  surface_feature?: string;
}

export interface ElevationProfile {
  watershed_id: string;
  total_distance_m: number;
  min_elevation_m: number;
  max_elevation_m: number;
  avg_slope_pct: number;
  dem_source: string;
  dem_resolution_m: number;
  vertical_accuracy_m: number;
  points: ProfilePoint[];
  crosses_water_body: boolean;
  water_body_name?: string;
  bathymetry_status: string;
  disclaimer?: string;
}

export interface SatelliteScene {
  id: string;
  watershed_id: string;
  sensor: string;
  acquisition_date: string;
  cloud_cover_pct: number;
  spatial_resolution_m: number;
  crs: string;
  data_provider: string;
}

export interface ChangeAnalysisResult {
  watershed_id: string;
  analysis_type: string;
  baseline_scene: {
    id: string;
    sensor: string;
    acquisition_date: string;
    cloud_cover_pct: number;
    data_provider: string;
  };
  monitoring_scene: {
    id: string;
    sensor: string;
    acquisition_date: string;
    cloud_cover_pct: number;
    data_provider: string;
  };
  methodology: string;
  spatial_resolution_m: number;
  metrics: {
    vegetation_gain_ha: number;
    vegetation_loss_ha: number;
    water_spread_t1_ha: number;
    water_spread_t2_ha: number;
    net_water_gain_ha: number;
    biomass_vigor_change_pct: number;
  };
  confidence_pct: number;
  limitations: string;
  heatmap_grid: {
    grid_size: number;
    t1_ndvi: number[][];
    t2_ndvi: number[][];
    delta_ndvi: number[][];
  };
}

export interface AIPrediction {
  id: string;
  field_photo_id: string;
  model_name: string;
  model_version: string;
  predicted_class: string;
  confidence_score: number;
  all_class_scores: Array<{ label: string; score: number }>;
  detected_features: string[];
  inference_timestamp: string;
  human_review_status: 'PENDING' | 'ACCEPTED' | 'CORRECTED' | 'REJECTED';
  human_corrected_class?: string;
  reviewer_id?: string;
  review_timestamp?: string;
  review_comments?: string;
  file_name: string;
  thumbnail_path?: string;
  watershed_id: string;
  observation_category?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface DashboardMetrics {
  watershed_id?: string;
  watershed_info?: any;
  water_bodies: {
    total_count: number;
    total_surface_area_ha: number;
    measured_storage_m3: number;
    bathymetry_surveyed_count: number;
    bathymetry_coverage_pct: number;
  };
  interventions: {
    total_count: number;
    by_category: Record<string, number>;
    by_status: Record<string, number>;
    total_storage_boost_m3: number;
    total_beneficiary_ha: number;
  };
  field_evidence: {
    total_photos: number;
    verified_count: number;
    pending_count: number;
    exif_gps_count: number;
    manual_pinned_count: number;
    unverified_location_count: number;
  };
  ai_vision: {
    total_predictions: number;
    human_accepted: number;
    human_pending: number;
    human_corrected: number;
    mean_confidence_pct: number;
  };
  latest_satellite?: {
    sensor: string;
    acquisition_date: string;
    data_provider: string;
  };
}
