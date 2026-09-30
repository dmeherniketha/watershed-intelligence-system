import React, { useState, useEffect } from 'react';
import { 
  SplitSquareVertical, 
  Layers, 
  Calendar, 
  Sparkles, 
  TrendingUp, 
  Waves, 
  Trees, 
  AlertCircle,
  Activity,
  Info
} from 'lucide-react';
import { SatelliteScene, ChangeAnalysisResult, Watershed } from '../types';
import { api } from '../services/api';

interface SatelliteCompareViewProps {
  watershed: Watershed;
}

export const SatelliteCompareView: React.FC<SatelliteCompareViewProps> = ({ watershed }) => {
  const [scenes, setScenes] = useState<SatelliteScene[]>([]);
  const [selectedT1, setSelectedT1] = useState<string>('');
  const [selectedT2, setSelectedT2] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<'RGB' | 'CIR' | 'NDVI' | 'NDWI'>('NDVI');
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100%
  const [changeResult, setChangeResult] = useState<ChangeAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getSatelliteScenes(watershed.id)
      .then(data => {
        if (isMounted) {
          setScenes(data);
          if (data.length >= 2) {
            setSelectedT1(data[1].id); // Pre-monsoon baseline
            setSelectedT2(data[0].id); // Post-monsoon monitoring
          }
        }
      })
      .catch(console.error);

    return () => { isMounted = false; };
  }, [watershed.id]);

  // Run Change Detection when scenes are selected
  useEffect(() => {
    if (!selectedT1 || !selectedT2) return;
    setIsLoading(true);

    api.performChangeAnalysis(watershed.id, selectedT1, selectedT2, 'NDVI_VEGETATION')
      .then(res => {
        setChangeResult(res);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [watershed.id, selectedT1, selectedT2]);

  const sceneT1 = scenes.find(s => s.id === selectedT1);
  const sceneT2 = scenes.find(s => s.id === selectedT2);

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto', background: '#090D16' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SplitSquareVertical size={24} color="#3B82F6" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F8FAFC' }}>
              Multi-Temporal Satellite Imagery & Change Detection
            </h1>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
            Biophysical vegetation vigor (NDVI) and surface-water spread (NDWI) analysis across calibrated Sentinel-2 / Bhuvan observations.
          </p>
        </div>

        {/* Spectral Mode Toggles */}
        <div className="glass-panel" style={{ display: 'flex', padding: '4px', gap: '4px' }}>
          {(['NDVI', 'NDWI', 'CIR', 'RGB'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setAnalysisMode(mode)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: analysisMode === mode ? '#3B82F6' : 'transparent',
                color: analysisMode === mode ? '#FFFFFF' : '#94A3B8'
              }}
            >
              {mode === 'NDVI' ? 'NDVI Vegetation' : (mode === 'NDWI' ? 'NDWI Water' : (mode === 'CIR' ? 'Color Infrared' : 'True Color'))}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Scene Pickers + Slider View + Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left: Split Comparison Viewport */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Top Dates Control Bar */}
          <div className="glass-panel" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-pending">Baseline T1 (Left)</span>
              <select
                value={selectedT1}
                onChange={(e) => setSelectedT1(e.target.value)}
                style={{ background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem' }}
              >
                {scenes.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.acquisition_date} &bull; {s.sensor}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-verified">Monitoring T2 (Right)</span>
              <select
                value={selectedT2}
                onChange={(e) => setSelectedT2(e.target.value)}
                style={{ background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem' }}
              >
                {scenes.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.acquisition_date} &bull; {s.sensor}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Swipe Slider Canvas */}
          <div className="glass-panel" style={{ position: 'relative', width: '100%', height: '440px', overflow: 'hidden', borderRadius: '12px' }}>
            {/* T1 Baseline Layer (Left underneath) */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Raster Grid Simulation representing Baseline Spectral Signature */}
              <div style={{
                width: '100%',
                height: '100%',
                background: analysisMode === 'NDVI'
                  ? 'radial-gradient(circle at 50% 50%, #4D7C0F 10%, #713F12 50%, #854D0E 80%)'
                  : (analysisMode === 'NDWI' ? 'radial-gradient(circle at 45% 45%, #0284C7 15%, #0F172A 60%)' : 'radial-gradient(circle at 50% 50%, #BE123C 20%, #854D0E 70%)'),
                opacity: 0.85
              }} />
              <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 10 }}>
                <span className="badge badge-pending" style={{ fontSize: '0.75rem' }}>
                  T1: {sceneT1?.acquisition_date || 'Baseline'} ({analysisMode})
                </span>
              </div>
            </div>

            {/* T2 Monitoring Layer (Right sliced) */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: `${100 - sliderPos}%`,
              height: '100%',
              overflow: 'hidden',
              borderLeft: '2px solid #38BDF8',
              boxShadow: '-4px 0 20px rgba(56, 189, 248, 0.4)'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100%',
                height: '100%',
                minWidth: '600px',
                background: analysisMode === 'NDVI'
                  ? 'radial-gradient(circle at 50% 50%, #15803D 35%, #166534 60%, #713F12 85%)'
                  : (analysisMode === 'NDWI' ? 'radial-gradient(circle at 45% 45%, #06B6D4 30%, #0369A1 50%, #0F172A 75%)' : 'radial-gradient(circle at 50% 50%, #E11D48 45%, #9F1239 70%, #713F12 90%)'),
                opacity: 0.95
              }} />
              <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10 }}>
                <span className="badge badge-verified" style={{ fontSize: '0.75rem' }}>
                  T2: {sceneT2?.acquisition_date || 'Monitoring'} ({analysisMode})
                </span>
              </div>
            </div>

            {/* Swipe Handle */}
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${sliderPos}%`,
              width: '4px',
              background: '#38BDF8',
              cursor: 'ew-resize',
              transform: 'translateX(-50%)',
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#0F172A',
                border: '2px solid #38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.8)'
              }}>
                <SplitSquareVertical size={14} color="#38BDF8" />
              </div>
            </div>

            {/* Hidden native slider on top for touch/mouse drag */}
            <input
              type="range"
              min="5"
              max="95"
              value={sliderPos}
              onChange={(e) => setSliderPos(parseFloat(e.target.value))}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'ew-resize',
                zIndex: 40
              }}
            />
          </div>

          {/* Slider Position Legend */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B', padding: '0 4px' }}>
            <span>&larr; Drag slider left to reveal Post-Monsoon / Monitoring T2</span>
            <span>Drag slider right to reveal Pre-Monsoon / Baseline T1 &rarr;</span>
          </div>
        </div>

        {/* Right: Change Detection Metrics Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #1E293B', paddingBottom: '8px' }}>
              <TrendingUp size={18} color="#10B981" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>
                Biophysical Change Statistics
              </h3>
            </div>

            {changeResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Vegetation Gain */}
                <div style={{ background: '#1E293B', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Trees size={16} color="#10B981" />
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Vegetation Expansion</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34D399' }}>
                        +{changeResult.metrics.vegetation_gain_ha} ha
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-verified" style={{ fontSize: '0.65rem' }}>&Delta;NDVI &gt; +0.15</span>
                </div>

                {/* Water Spread Gain */}
                <div style={{ background: '#1E293B', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Waves size={16} color="#06B6D4" />
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Water Spread Increase</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#22D3EE' }}>
                        +{changeResult.metrics.net_water_gain_ha} ha
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-live" style={{ fontSize: '0.65rem' }}>&Delta;NDWI</span>
                </div>

                {/* Mean Biomass Vigor Change */}
                <div style={{ background: '#1E293B', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Mean Canopy Vigor Shift</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FBBF24' }}>
                      +{changeResult.metrics.biomass_vigor_change_pct}%
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Confidence: <strong>{changeResult.confidence_pct}%</strong></span>
                </div>
              </div>
            ) : (
              <div style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Computing spatial differencing...</div>
            )}
          </div>

          {/* Scientific Methodology & Limitations */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <AlertCircle size={14} color="#38BDF8" />
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F8FAFC' }}>Methodology & Limitations</h4>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: '1.4', marginBottom: '8px' }}>
              <strong>Sensor:</strong> Sentinel-2 MSI 10m L2A Bottom-Of-Atmosphere reflectance.
            </p>
            <p style={{ fontSize: '0.72rem', color: '#CBD5E1', lineHeight: '1.4' }}>
              A spectral difference indicates biophysical biomass response. It does not automatically prove single intervention causality without multi-year climatic normalization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
