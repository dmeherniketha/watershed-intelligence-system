import {
  Watershed,
  WaterBody,
  BathymetryInspection,
  FieldPhoto,
  ElevationProfile,
  SatelliteScene,
  ChangeAnalysisResult,
  AIPrediction,
  DashboardMetrics
} from '../types';

const API_BASE = 'http://localhost:8000/api';
export const ASSET_BASE = 'http://localhost:8000';

export const api = {
  // Watersheds
  getWatersheds: async (): Promise<Watershed[]> => {
    const res = await fetch(`${API_BASE}/watersheds`);
    if (!res.ok) throw new Error('Failed to fetch watersheds');
    return res.json();
  },

  getWatershedDetail: async (id: string): Promise<Watershed> => {
    const res = await fetch(`${API_BASE}/watersheds/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch watershed ${id}`);
    return res.json();
  },

  // DEM & Terrain
  getElevationAtPoint: async (watershedId: string, lat: number, lon: number) => {
    const res = await fetch(`${API_BASE}/dem/elevation?watershed_id=${watershedId}&lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('Failed to query elevation point');
    return res.json();
  },

  getElevationProfile: async (watershedId: string, points: number[][], numSamples = 60): Promise<ElevationProfile> => {
    const res = await fetch(`${API_BASE}/dem/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watershed_id: watershedId, points, num_samples: numSamples })
    });
    if (!res.ok) throw new Error('Failed to calculate elevation profile');
    return res.json();
  },

  getTerrain3DGrid: async (watershedId: string, gridSize = 48) => {
    const res = await fetch(`${API_BASE}/dem/grid-3d?watershed_id=${watershedId}&grid_size=${gridSize}`);
    if (!res.ok) throw new Error('Failed to fetch 3D terrain grid');
    return res.json();
  },

  // Bathymetry
  getWaterBodyBathymetry: async (waterBodyId: string): Promise<BathymetryInspection> => {
    const res = await fetch(`${API_BASE}/bathymetry/water-body/${waterBodyId}`);
    if (!res.ok) throw new Error('Failed to fetch water body bathymetry');
    return res.json();
  },

  // Field Photos
  getFieldPhotos: async (watershedId?: string, verificationStatus?: string, category?: string): Promise<FieldPhoto[]> => {
    const params = new URLSearchParams();
    if (watershedId) params.append('watershed_id', watershedId);
    if (verificationStatus) params.append('verification_status', verificationStatus);
    if (category) params.append('category', category);
    const res = await fetch(`${API_BASE}/field-photos?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch field photos');
    return res.json();
  },

  uploadFieldPhoto: async (formData: FormData): Promise<any> => {
    const res = await fetch(`${API_BASE}/field-photos/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  assignManualLocation: async (photoId: string, lat: number, lon: number) => {
    const res = await fetch(`${API_BASE}/field-photos/${photoId}/assign-location?lat=${lat}&lon=${lon}`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Failed to assign manual location');
    return res.json();
  },

  verifyFieldPhoto: async (photoId: string, status: 'VERIFIED' | 'REJECTED', notes?: string) => {
    const params = new URLSearchParams({ status, verified_by: 'Authorized Watershed Officer' });
    if (notes) params.append('notes', notes);
    const res = await fetch(`${API_BASE}/field-photos/${photoId}/verify?${params.toString()}`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Failed to update verification status');
    return res.json();
  },

  // Satellite
  getSatelliteScenes: async (watershedId: string): Promise<SatelliteScene[]> => {
    const res = await fetch(`${API_BASE}/satellite/scenes?watershed_id=${watershedId}`);
    if (!res.ok) throw new Error('Failed to fetch satellite scenes');
    return res.json();
  },

  performChangeAnalysis: async (watershedId: string, sceneT1Id: string, sceneT2Id: string, analysisType = 'NDVI_VEGETATION'): Promise<ChangeAnalysisResult> => {
    const res = await fetch(`${API_BASE}/satellite/change-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        watershed_id: watershedId,
        scene_t1_id: sceneT1Id,
        scene_t2_id: sceneT2Id,
        analysis_type: analysisType
      })
    });
    if (!res.ok) throw new Error('Failed to compute change matrix');
    return res.json();
  },

  // AI Vision
  getAIPredictions: async (status?: string): Promise<AIPrediction[]> => {
    const url = status ? `${API_BASE}/ai-vision/predictions?status=${status}` : `${API_BASE}/ai-vision/predictions`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch AI predictions');
    return res.json();
  },

  submitHumanReview: async (predictionId: string, status: 'ACCEPTED' | 'CORRECTED' | 'REJECTED', reviewerId = 'Expert Geoscientist', correctedClass?: string, comments?: string) => {
    const res = await fetch(`${API_BASE}/ai-vision/review/${predictionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        reviewer_id: reviewerId,
        corrected_class: correctedClass,
        comments
      })
    });
    if (!res.ok) throw new Error('Failed to submit AI review');
    return res.json();
  },

  // Dashboard Metrics
  getDashboardMetrics: async (watershedId?: string): Promise<DashboardMetrics> => {
    const url = watershedId ? `${API_BASE}/dashboard/metrics?watershed_id=${watershedId}` : `${API_BASE}/dashboard/metrics`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    return res.json();
  },

  // Export URLs
  getCsvExportUrl: (watershedId: string) => `${API_BASE}/reports/export/csv?watershed_id=${watershedId}`,
  getGeoJsonExportUrl: (watershedId: string) => `${API_BASE}/reports/export/geojson?watershed_id=${watershedId}`
};
