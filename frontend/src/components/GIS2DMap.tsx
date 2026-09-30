import React, { useEffect, useRef, useState } from 'react';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  MapPin, 
  Info, 
  Crosshair, 
  Maximize2, 
  Compass, 
  Ruler, 
  Waves,
  ShieldCheck,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Watershed, WaterBody, Intervention, FieldPhoto, ElevationProfile } from '../types';
import { api, ASSET_BASE } from '../services/api';

interface GIS2DMapProps {
  watershed: Watershed;
  waterBodies: WaterBody[];
  interventions: Intervention[];
  fieldPhotos: FieldPhoto[];
  onOpenCutaway: (profile: ElevationProfile, selectedWaterBody?: WaterBody) => void;
  onOpenPhotoDetail: (photo: FieldPhoto) => void;
}

export const GIS2DMap: React.FC<GIS2DMapProps> = ({
  watershed,
  waterBodies,
  interventions,
  fieldPhotos,
  onOpenCutaway,
  onOpenPhotoDetail
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{ [key: string]: any }>({});
  
  // Layer Visibility State
  const [layersVisibility, setLayersVisibility] = useState({
    boundary: true,
    drainage: true,
    waterBodies: true,
    interventions: true,
    fieldPhotos: true,
    contours: false
  });

  // Basemap State
  const [basemap, setBasemap] = useState<'satellite' | 'dark' | 'topo'>('satellite');

  // Hover Coordinates & Elevation
  const [cursorPos, setCursorPos] = useState<{ lat: number; lon: number; elev?: number } | null>(null);

  // Cross-section Drawing Tool
  const [isDrawingSection, setIsDrawingSection] = useState(false);
  const [sectionPoints, setSectionPoints] = useState<[number, number][]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Selected Feature Details
  const [selectedFeature, setSelectedFeature] = useState<{ type: string; data: any } | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;

      const L = await import('leaflet');

      // If map already initialized, remove it
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [watershed.center_lat, watershed.center_lon],
        zoom: 13,
        zoomControl: true,
        attributionControl: true
      });

      mapInstanceRef.current = map;

      // Basemap tile layers
      const tileUrls = {
        satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
      };

      const tileAttributions = {
        satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        dark: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        topo: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
      };

      const baseTile = L.tileLayer(tileUrls[basemap], {
        attribution: tileAttributions[basemap],
        maxZoom: 19
      }).addTo(map);

      layersRef.current['baseTile'] = baseTile;

      // Mouse move elevation & coordinate tracking
      map.on('mousemove', async (e: any) => {
        if (!isMounted) return;
        const lat = parseFloat(e.latlng.lat.toFixed(5));
        const lon = parseFloat(e.latlng.lng.toFixed(5));
        setCursorPos({ lat, lon });
      });

      // Map click handler for drawing cross sections
      map.on('click', (e: any) => {
        if (isDrawingSection) {
          const pt: [number, number] = [e.latlng.lat, e.latlng.lng];
          setSectionPoints(prev => [...prev, pt]);
        }
      });

      // Render Watershed Boundary
      if (watershed.boundary_geojson && layersVisibility.boundary) {
        const boundaryLayer = L.geoJSON(watershed.boundary_geojson, {
          style: {
            color: '#10B981',
            weight: 3,
            fillColor: '#10B981',
            fillOpacity: 0.12,
            dashArray: '6, 6'
          }
        }).addTo(map);

        boundaryLayer.on('click', () => {
          setSelectedFeature({ type: 'Watershed Boundary', data: watershed });
        });

        layersRef.current['boundary'] = boundaryLayer;
        map.fitBounds(boundaryLayer.getBounds(), { padding: [20, 20] });
      }

      // Render Drainage Network
      if (watershed.drainage_geojson && layersVisibility.drainage) {
        const drainageLayer = L.geoJSON(watershed.drainage_geojson, {
          style: (feature: any) => {
            const order = feature?.properties?.stream_order || 1;
            const colors: Record<number, string> = {
              1: '#7DD3FC',
              2: '#38BDF8',
              3: '#0284C7',
              4: '#0369A1'
            };
            return {
              color: colors[order] || '#38BDF8',
              weight: order * 1.5 + 1.2,
              opacity: 0.9
            };
          },
          onEachFeature: (feature, layer) => {
            layer.bindTooltip(`Stream Order: ${feature.properties?.stream_order || 1} &bull; ${feature.properties?.name || 'Drainage Stream'}`, {
              sticky: true,
              className: 'glass-panel'
            });
          }
        }).addTo(map);
        layersRef.current['drainage'] = drainageLayer;
      }

      // Render Water Bodies
      if (waterBodies && layersVisibility.waterBodies) {
        const wbGroup = L.layerGroup();
        waterBodies.forEach(wb => {
          const isBathy = wb.bathymetry_available;
          const color = isBathy ? '#06B6D4' : '#60A5FA';

          const wbLayer = L.geoJSON(wb.boundary_geojson, {
            style: {
              color: color,
              weight: 2,
              fillColor: color,
              fillOpacity: 0.5
            }
          });

          wbLayer.bindTooltip(`<strong>${wb.name}</strong><br/>Type: ${wb.water_type}<br/>Bathymetry: ${isBathy ? 'Measured Available' : 'Unsurveyed'}`, {
            sticky: true
          });

          wbLayer.on('click', async () => {
            setSelectedFeature({ type: 'Water Body', data: wb });
            try {
              const bathyData = await api.getWaterBodyBathymetry(wb.id);
              // Sample profile across water body
              const [minLon, minLat, maxLon, maxLat] = [wb.center_lon - 0.005, wb.center_lat - 0.005, wb.center_lon + 0.005, wb.center_lat + 0.005];
              const sampleProfile = await api.getElevationProfile(watershed.id, [[minLat, minLon], [maxLat, maxLon]], 40);
              sampleProfile.crosses_water_body = true;
              sampleProfile.water_body_name = wb.name;
              sampleProfile.bathymetry_status = isBathy ? 'MEASURED' : 'UNAVAILABLE';
              if (!isBathy) {
                sampleProfile.disclaimer = 'Bathymetry unavailable — underwater depth data is not available for this water body.';
              }
              onOpenCutaway(sampleProfile, wb);
            } catch (err) {
              console.error(err);
            }
          });

          wbGroup.addLayer(wbLayer);
        });
        wbGroup.addTo(map);
        layersRef.current['waterBodies'] = wbGroup;
      }

      // Render Interventions Markers
      if (interventions && layersVisibility.interventions) {
        const intGroup = L.layerGroup();
        interventions.forEach(item => {
          const iconColors: Record<string, string> = {
            'Check Dam': '#10B981',
            'Gully Plug': '#F59E0B',
            'Farm Pond': '#06B6D4',
            'Percolation Tank': '#3B82F6',
            'Afforestation': '#22C55E'
          };
          const color = iconColors[item.category] || '#E2E8F0';

          const markerHtml = `
            <div style="
              width: 22px;
              height: 22px;
              background: ${color};
              border: 2px solid #FFFFFF;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 10px ${color};
            ">
              <div style="width: 6px; height: 6px; background: #0F172A; border-radius: 50%;"></div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'custom-intervention-marker',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });

          const marker = L.marker([item.latitude, item.longitude], { icon: customIcon });
          marker.bindTooltip(`<strong>${item.name}</strong><br/>Category: ${item.category}<br/>Status: ${item.status}`, {
            sticky: true
          });

          marker.on('click', () => {
            setSelectedFeature({ type: 'Intervention', data: item });
          });

          intGroup.addLayer(marker);
        });
        intGroup.addTo(map);
        layersRef.current['interventions'] = intGroup;
      }

      // Render Field Photos Markers
      if (fieldPhotos && layersVisibility.fieldPhotos) {
        const photoGroup = L.layerGroup();
        fieldPhotos.forEach(photo => {
          if (photo.latitude && photo.longitude) {
            const isVerified = photo.verification_status === 'VERIFIED';
            const isExif = photo.location_source === 'EXIF_METADATA';
            const color = isVerified ? '#10B981' : (photo.verification_status === 'PENDING' ? '#F59E0B' : '#F43F5E');

            const photoIconHtml = `
              <div style="
                width: 26px;
                height: 26px;
                background: #0F172A;
                border: 2px solid ${color};
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.6);
                cursor: pointer;
              ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                  <circle cx="12" cy="13" r="3"></circle>
                </svg>
              </div>
            `;

            const icon = L.divIcon({
              html: photoIconHtml,
              className: 'custom-photo-marker',
              iconSize: [26, 26],
              iconAnchor: [13, 13]
            });

            const marker = L.marker([photo.latitude, photo.longitude], { icon });
            marker.bindTooltip(`<strong>${photo.observation_category}</strong><br/>Source: ${isExif ? 'EXIF GPS' : 'Manual Pin'}<br/>Status: ${photo.verification_status}`, {
              sticky: true
            });

            marker.on('click', () => {
              setSelectedFeature({ type: 'Field Photo', data: photo });
              onOpenPhotoDetail(photo);
            });

            photoGroup.addLayer(marker);
          }
        });
        photoGroup.addTo(map);
        layersRef.current['fieldPhotos'] = photoGroup;
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [watershed, waterBodies, interventions, fieldPhotos, layersVisibility, basemap]);

  // Handle Section Line Completion
  const handleCompleteSection = async () => {
    if (sectionPoints.length < 2) {
      alert('Please click at least 2 points on the map to sample the elevation profile.');
      return;
    }

    setIsLoadingProfile(true);
    try {
      const profile = await api.getElevationProfile(watershed.id, sectionPoints, 60);
      onOpenCutaway(profile);
      setIsDrawingSection(false);
      setSectionPoints([]);
    } catch (err: any) {
      alert(err.message || 'Error generating cross-section profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current && layersRef.current['boundary']) {
      mapInstanceRef.current.fitBounds(layersRef.current['boundary'].getBounds(), { padding: [20, 20] });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Map DOM Element */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Top Floating Control Bar */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '64px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Basemap Switcher */}
        <div className="glass-panel" style={{ display: 'flex', padding: '4px', gap: '4px' }}>
          {(['satellite', 'dark', 'topo'] as const).map(m => (
            <button
              key={m}
              onClick={() => setBasemap(m)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                border: 'none',
                cursor: 'pointer',
                background: basemap === m ? '#10B981' : 'transparent',
                color: basemap === m ? '#FFFFFF' : '#94A3B8'
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Section Line Profiler Button */}
        <button
          onClick={() => {
            if (isDrawingSection) {
              setIsDrawingSection(false);
              setSectionPoints([]);
            } else {
              setIsDrawingSection(true);
              setSectionPoints([]);
            }
          }}
          className="glass-panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: isDrawingSection ? '#06B6D4' : 'rgba(19, 30, 50, 0.85)',
            color: isDrawingSection ? '#000000' : '#22D3EE',
            border: isDrawingSection ? '1px solid #22D3EE' : '1px solid rgba(6, 182, 212, 0.3)'
          }}
        >
          <Ruler size={16} />
          {isDrawingSection ? `Drawing (${sectionPoints.length} pts) - Finish Profile` : 'Draw Elevation Section'}
        </button>

        {isDrawingSection && sectionPoints.length >= 2 && (
          <button
            onClick={handleCompleteSection}
            disabled={isLoadingProfile}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
            }}
          >
            {isLoadingProfile ? 'Sampling DEM...' : 'Generate Cutaway Profile'}
          </button>
        )}

        {/* Reset View Button */}
        <button
          onClick={handleResetView}
          className="glass-panel"
          title="Reset to Watershed Bounds"
          style={{
            padding: '8px 10px',
            cursor: 'pointer',
            color: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Layer Visibility Drawer (Top Right) */}
      <div className="glass-panel" style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 1000,
        width: '240px',
        padding: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #1E293B', paddingBottom: '8px' }}>
          <Layers size={16} color="#10B981" />
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>GIS Thematic Layers</h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E2E8F0' }}>
              <div style={{ width: '10px', height: '10px', border: '2px dashed #10B981', borderRadius: '2px' }} />
              Catchment Boundary
            </span>
            <input
              type="checkbox"
              checked={layersVisibility.boundary}
              onChange={(e) => setLayersVisibility(prev => ({ ...prev, boundary: e.target.checked }))}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E2E8F0' }}>
              <div style={{ width: '10px', height: '3px', background: '#38BDF8' }} />
              Drainage Network (1-4)
            </span>
            <input
              type="checkbox"
              checked={layersVisibility.drainage}
              onChange={(e) => setLayersVisibility(prev => ({ ...prev, drainage: e.target.checked }))}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E2E8F0' }}>
              <div style={{ width: '10px', height: '10px', background: '#06B6D4', borderRadius: '2px' }} />
              Water Bodies & Tanks
            </span>
            <input
              type="checkbox"
              checked={layersVisibility.waterBodies}
              onChange={(e) => setLayersVisibility(prev => ({ ...prev, waterBodies: e.target.checked }))}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E2E8F0' }}>
              <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%' }} />
              Interventions (Check Dams)
            </span>
            <input
              type="checkbox"
              checked={layersVisibility.interventions}
              onChange={(e) => setLayersVisibility(prev => ({ ...prev, interventions: e.target.checked }))}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E2E8F0' }}>
              <div style={{ width: '10px', height: '10px', background: '#F59E0B', borderRadius: '2px' }} />
              Field Evidence (Photos)
            </span>
            <input
              type="checkbox"
              checked={layersVisibility.fieldPhotos}
              onChange={(e) => setLayersVisibility(prev => ({ ...prev, fieldPhotos: e.target.checked }))}
            />
          </label>
        </div>

        {/* Dataset Provenance Footer */}
        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #1E293B', fontSize: '0.68rem', color: '#64748B' }}>
          <div><strong>CRS:</strong> {watershed.crs}</div>
          <div><strong>DEM Source:</strong> Cartosat-1 30m / SOI</div>
        </div>
      </div>

      {/* Coordinate & Elevation Tracker Bar (Bottom Left) */}
      <div className="glass-panel" style={{
        position: 'absolute',
        bottom: '20px',
        left: '16px',
        zIndex: 1000,
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        fontSize: '0.8rem',
        color: '#E2E8F0',
        pointerEvents: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
        maxWidth: 'calc(100% - 32px)',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Crosshair size={14} color="#10B981" />
          <span>
            Lat: <strong>{cursorPos ? cursorPos.lat : '--'}</strong> &bull; Lon: <strong>{cursorPos ? cursorPos.lon : '--'}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid #334155', paddingLeft: '12px' }}>
          <Compass size={14} color="#06B6D4" />
          <span>Elevation: <strong>{watershed.elevation_min_m}m - {watershed.elevation_max_m}m</strong></span>
        </div>
      </div>

      {/* Feature Details Inspector Drawer (Bottom Right) */}
      {selectedFeature && (
        <div className="glass-panel-glow" style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          zIndex: 1000,
          width: '320px',
          padding: '16px',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="badge badge-verified" style={{ fontSize: '0.7rem' }}>{selectedFeature.type}</span>
            <button
              onClick={() => setSelectedFeature(null)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '1rem' }}
            >
              &times;
            </button>
          </div>

          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '6px' }}>
            {selectedFeature.data.name || selectedFeature.data.observation_category || 'Selected Feature'}
          </h3>

          <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {selectedFeature.type === 'Water Body' && (
              <>
                <div>Type: <strong style={{ color: '#E2E8F0' }}>{selectedFeature.data.water_type}</strong></div>
                <div>Surface Area: <strong style={{ color: '#E2E8F0' }}>{selectedFeature.data.surface_area_ha} ha</strong></div>
                <div>Surface Elev: <strong style={{ color: '#E2E8F0' }}>{selectedFeature.data.surface_elevation_m} m</strong></div>
                <div style={{ marginTop: '6px' }}>
                  {selectedFeature.data.bathymetry_available ? (
                    <span className="badge badge-verified">Dual-Frequency Bathymetry Available</span>
                  ) : (
                    <span className="badge badge-pending">Bathymetry Unavailable (Unsurveyed)</span>
                  )}
                </div>
              </>
            )}

            {selectedFeature.type === 'Intervention' && (
              <>
                <div>Category: <strong style={{ color: '#E2E8F0' }}>{selectedFeature.data.category}</strong></div>
                <div>Status: <strong style={{ color: '#10B981' }}>{selectedFeature.data.status}</strong></div>
                <div>Storage Boost: <strong style={{ color: '#38BDF8' }}>{selectedFeature.data.storage_boost_m3?.toLocaleString()} m&sup3;</strong></div>
                <div>Beneficiary Area: <strong style={{ color: '#E2E8F0' }}>{selectedFeature.data.beneficiary_area_ha} ha</strong></div>
              </>
            )}

            {selectedFeature.type === 'Field Photo' && (
              <>
                <div>Category: <strong style={{ color: '#E2E8F0' }}>{selectedFeature.data.observation_category}</strong></div>
                <div>Source: <strong style={{ color: '#E2E8F0' }}>{selectedFeature.data.location_source}</strong></div>
                <div>Status: <strong style={{ color: selectedFeature.data.verification_status === 'VERIFIED' ? '#10B981' : '#F59E0B' }}>{selectedFeature.data.verification_status}</strong></div>
                {selectedFeature.data.description && (
                  <p style={{ marginTop: '6px', color: '#CBD5E1', fontStyle: 'italic' }}>
                    "{selectedFeature.data.description}"
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
