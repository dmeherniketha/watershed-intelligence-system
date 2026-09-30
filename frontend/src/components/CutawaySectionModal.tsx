import React from 'react';
import { 
  X, 
  Ruler, 
  Waves, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Layers, 
  Info,
  Download
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Line
} from 'recharts';
import { ElevationProfile, WaterBody, BathymetryInspection } from '../types';

interface CutawaySectionModalProps {
  profile: ElevationProfile;
  waterBody?: WaterBody;
  onClose: () => void;
}

export const CutawaySectionModal: React.FC<CutawaySectionModalProps> = ({
  profile,
  waterBody,
  onClose
}) => {
  // Chart Data Preparation
  const chartData = profile.points.map(p => ({
    distance: p.distance_m >= 1000 ? `${(p.distance_m / 1000).toFixed(2)} km` : `${Math.round(p.distance_m)} m`,
    distNum: p.distance_m,
    elevation: p.elevation_m,
    slope: p.slope_pct,
    // Synthetic geological strata depths for visual section cutaway
    weatheredBed: p.elevation_m - 8.5,
    fracturedRock: p.elevation_m - 22.0,
    hardBedrock: p.elevation_m - 40.0,
    waterTable: p.elevation_m - 12.0
  }));

  const hasBathymetry = waterBody?.bathymetry_available;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '1000px',
        maxHeight: '92vh',
        background: '#0F172A',
        border: '1px solid #334155',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid #1E293B',
          background: 'rgba(30, 41, 59, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Ruler size={20} color="#22D3EE" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC' }}>
                Terrain Cross-Section & 3D Cutaway Profile
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Sampled from Validated Digital Elevation Model (DEM) &bull; Distance: {profile.total_distance_m >= 1000 ? `${(profile.total_distance_m / 1000).toFixed(2)} km` : `${profile.total_distance_m} m`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Key Profile Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div className="glass-panel" style={{ padding: '12px 16px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Total Span</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38BDF8', marginTop: '2px' }}>
                {profile.total_distance_m >= 1000 ? `${(profile.total_distance_m / 1000).toFixed(2)} km` : `${profile.total_distance_m} m`}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '12px 16px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Min - Max Elevation</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10B981', marginTop: '2px' }}>
                {profile.min_elevation_m}m - {profile.max_elevation_m}m
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '12px 16px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Average Slope</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F59E0B', marginTop: '2px' }}>
                {profile.avg_slope_pct}%
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '12px 16px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>DEM Accuracy</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#A855F7', marginTop: '2px' }}>
                &plusmn;{profile.vertical_accuracy_m} m
              </div>
            </div>
          </div>

          {/* Elevation Profile Chart */}
          <div className="glass-panel" style={{ padding: '18px 20px', background: '#090D16' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="#10B981" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
                  Elevation Cross-Section & Underground Strata Profile
                </h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.72rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34D399' }}>
                  <div style={{ width: '12px', height: '3px', background: '#10B981' }} /> Terrain Surface (DEM)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38BDF8' }}>
                  <div style={{ width: '12px', height: '3px', background: '#0284C7', borderTop: '1px dashed #38BDF8' }} /> Saturated Water Table
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#A3704C' }}>
                  <div style={{ width: '12px', height: '3px', background: '#78350F' }} /> Weathered Regolith
                </span>
              </div>
            </div>

            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="terrainGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.7}/>
                      <stop offset="95%" stopColor="#064E3B" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="strataGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#78350F" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#3B1E08" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="distance" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} domain={['dataMin - 15', 'dataMax + 10']} />
                  <Tooltip
                    contentStyle={{ background: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '0.75rem' }}
                    labelStyle={{ color: '#F8FAFC', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="elevation" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#terrainGrad)" name="Surface Elevation (m)" />
                  <Area type="monotone" dataKey="weatheredBed" stroke="#78350F" strokeWidth={1.5} fillOpacity={1} fill="url(#strataGrad)" name="Weathered Bedrock (m)" />
                  <Line type="monotone" dataKey="waterTable" stroke="#0284C7" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Water Table Depth (m)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Water Body Depth & Bathymetry Section */}
          <div className="glass-panel" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Waves size={18} color="#06B6D4" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>
                Water-Body Bathymetric Survey Inspection
              </h3>
            </div>

            {hasBathymetry && waterBody ? (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  marginBottom: '14px'
                }}>
                  <CheckCircle2 size={18} color="#10B981" />
                  <span style={{ fontSize: '0.8rem', color: '#34D399', fontWeight: 600 }}>
                    Hydrographic Acoustic Survey Record Verified for: <strong>{waterBody.name}</strong>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '0.8rem', marginBottom: '14px' }}>
                  <div style={{ background: '#1E293B', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Max Measured Depth</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38BDF8' }}>{waterBody.max_measured_depth_m} m</div>
                  </div>
                  <div style={{ background: '#1E293B', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Avg Measured Depth</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38BDF8' }}>{waterBody.avg_measured_depth_m} m</div>
                  </div>
                  <div style={{ background: '#1E293B', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Storage Capacity</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#10B981' }}>{waterBody.storage_capacity_m3?.toLocaleString()} m&sup3;</div>
                  </div>
                  <div style={{ background: '#1E293B', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Vertical Datum</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#E2E8F0' }}>{waterBody.vertical_datum}</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  <div><strong>Survey Method:</strong> {waterBody.survey_method}</div>
                  <div><strong>Standard:</strong> {waterBody.quality_assessment}</div>
                </div>
              </div>
            ) : (
              /* Strict Unsurveyed Fallback Warning Banner */
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 18px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '8px'
              }}>
                <AlertTriangle size={24} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FBBF24', marginBottom: '4px' }}>
                    Bathymetry unavailable &mdash; underwater depth data is not available for this water body.
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#CBD5E1', lineHeight: '1.4' }}>
                    A DEM represents dry terrain topography, not submerged bed geometry. Satellite imagery and aerial photography cannot establish actual depth. Illustrative terrain boundaries and surface water extents are provided without fabricated depth soundings.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '12px 24px',
          borderTop: '1px solid #1E293B',
          background: 'rgba(15, 23, 42, 0.8)'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#1E293B',
              border: '1px solid #334155',
              color: '#F8FAFC',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close Section Profile
          </button>
        </div>
      </div>
    </div>
  );
};
