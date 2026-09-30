import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Layers, 
  Waves, 
  CheckCircle2, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  Trees, 
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  Ruler
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { DashboardMetrics, Watershed } from '../types';
import { api } from '../services/api';

interface MonitoringDashboardViewProps {
  watershed: Watershed;
}

export const MonitoringDashboardView: React.FC<MonitoringDashboardViewProps> = ({ watershed }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api.getDashboardMetrics(watershed.id)
      .then(data => {
        if (isMounted) {
          setMetrics(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [watershed.id]);

  if (isLoading || !metrics) {
    return (
      <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#090D16' }}>
        <div style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Aggregating Watershed KPI Metrics...</div>
      </div>
    );
  }

  // Bar Chart Data for Interventions by Category
  const categoryData = Object.entries(metrics.interventions.by_category).map(([name, count]) => ({
    name,
    count
  }));

  // Status Pie Chart Data
  const statusColors: Record<string, string> = {
    'Completed': '#10B981',
    'In Progress': '#38BDF8',
    'Planned': '#F59E0B',
    'Needs Maintenance': '#F43F5E'
  };

  const statusData = Object.entries(metrics.interventions.by_status).map(([name, value]) => ({
    name,
    value,
    color: statusColors[name] || '#94A3B8'
  }));

  // LULC Data
  const lulcSummary = watershed.lu_lc_summary || {};
  const lulcColors = ['#10B981', '#38BDF8', '#F59E0B', '#06B6D4', '#A855F7'];
  const lulcData = Object.entries(lulcSummary).map(([name, valStr], idx) => {
    const numVal = parseFloat(valStr.replace('%', ''));
    return {
      name,
      value: isNaN(numVal) ? 20 : numVal,
      color: lulcColors[idx % lulcColors.length]
    };
  });

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto', background: '#090D16' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={24} color="#10B981" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F8FAFC' }}>
              Unified Watershed Intelligence Dashboard
            </h1>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
            Catchment: <strong>{watershed.name}</strong> ({watershed.district}, {watershed.state}) &bull; CRS: {watershed.crs}
          </p>
        </div>

        {metrics.latest_satellite && (
          <div className="glass-panel" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="#38BDF8" />
            <span style={{ fontSize: '0.75rem', color: '#E2E8F0' }}>
              Latest Scene: <strong>{metrics.latest_satellite.acquisition_date}</strong> ({metrics.latest_satellite.sensor})
            </span>
          </div>
        )}
      </div>

      {/* Top KPI Cards (6 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600 }}>
            <span>AREA</span>
            <Layers size={14} color="#38BDF8" />
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#F8FAFC', marginTop: '4px' }}>
            {watershed.area_sq_km} <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>km&sup2;</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#38BDF8', marginTop: '2px' }}>
            Slope: {watershed.avg_slope_pct}% avg
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600 }}>
            <span>STORAGE BOOST</span>
            <Waves size={14} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>
            {(metrics.interventions.total_storage_boost_m3 / 1000).toFixed(1)}k <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>m&sup3;</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#34D399', marginTop: '2px' }}>
            {metrics.interventions.total_count} structures
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600 }}>
            <span>BENEFICIARY</span>
            <Trees size={14} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#F59E0B', marginTop: '4px' }}>
            {metrics.interventions.total_beneficiary_ha} <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>ha</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#FBBF24', marginTop: '2px' }}>
            Irrigated Command
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600 }}>
            <span>FIELD EVIDENCE</span>
            <CheckCircle2 size={14} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#F8FAFC', marginTop: '4px' }}>
            {metrics.field_evidence.verified_count}/{metrics.field_evidence.total_photos}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#34D399', marginTop: '2px' }}>
            {metrics.field_evidence.exif_gps_count} EXIF GPS Validated
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600 }}>
            <span>BATHYMETRY</span>
            <Waves size={14} color="#06B6D4" />
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#22D3EE', marginTop: '4px' }}>
            {metrics.water_bodies.bathymetry_coverage_pct}%
          </div>
          <div style={{ fontSize: '0.68rem', color: '#38BDF8', marginTop: '2px' }}>
            {metrics.water_bodies.bathymetry_surveyed_count}/{metrics.water_bodies.total_count} tanks surveyed
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600 }}>
            <span>AI ACCURACY</span>
            <Sparkles size={14} color="#A855F7" />
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#C084FC', marginTop: '4px' }}>
            {metrics.ai_vision.mean_confidence_pct}%
          </div>
          <div style={{ fontSize: '0.68rem', color: '#C084FC', marginTop: '2px' }}>
            {metrics.ai_vision.human_accepted} Human Accepted
          </div>
        </div>
      </div>

      {/* Main Charts Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Interventions by Category Bar Chart */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '14px' }}>
            Water Harvesting & Conservation Structures Distribution
          </h3>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '0.75rem' }}
                  labelStyle={{ color: '#F8FAFC', fontWeight: 600 }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} name="Interventions Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LULC Composition Pie Chart */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '14px' }}>
            Land Use & Land Cover (LULC) Classification
          </h3>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lulcData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {lulcData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '0.75rem' }}
                  formatter={(val: any) => [`${val}%`, 'Coverage']}
                />
                <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '0.72rem', color: '#94A3B8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Provenance & Reliability Audit Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <ShieldCheck size={18} color="#10B981" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>
            Dataset Traceability & Provenance Verification Matrix
          </h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', color: '#E2E8F0' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#94A3B8' }}>
              <th style={{ padding: '8px 12px' }}>Dataset Layer</th>
              <th style={{ padding: '8px 12px' }}>Source / Sensor</th>
              <th style={{ padding: '8px 12px' }}>Spatial Resolution</th>
              <th style={{ padding: '8px 12px' }}>Verification Method</th>
              <th style={{ padding: '8px 12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #1E293B' }}>
              <td style={{ padding: '10px 12px', fontWeight: 600 }}>DEM Terrain Elevation</td>
              <td style={{ padding: '10px 12px', color: '#94A3B8' }}>ISRO Cartosat-1 / SOI Toposheets</td>
              <td style={{ padding: '10px 12px' }}>30m (Vertical &plusmn;8m)</td>
              <td style={{ padding: '10px 12px' }}>D8 Hydrological Flow Path Analysis</td>
              <td style={{ padding: '10px 12px' }}><span className="badge badge-verified">Verified</span></td>
            </tr>
            <tr style={{ borderBottom: '1px solid #1E293B' }}>
              <td style={{ padding: '10px 12px', fontWeight: 600 }}>Acoustic Bathymetry</td>
              <td style={{ padding: '10px 12px', color: '#94A3B8' }}>Dual-Frequency Hydrographic Echo Sounder</td>
              <td style={{ padding: '10px 12px' }}>0.05m Sounding Accuracy</td>
              <td style={{ padding: '10px 12px' }}>IHO S-44 Order 1a Standard</td>
              <td style={{ padding: '10px 12px' }}><span className="badge badge-verified">Verified (Kandavara)</span></td>
            </tr>
            <tr style={{ borderBottom: '1px solid #1E293B' }}>
              <td style={{ padding: '10px 12px', fontWeight: 600 }}>Field Photographs</td>
              <td style={{ padding: '10px 12px', color: '#94A3B8' }}>On-ground Surveyor EXIF Cameras</td>
              <td style={{ padding: '10px 12px' }}>Sub-meter DGPS GeoTag</td>
              <td style={{ padding: '10px 12px' }}>EXIF DMS-to-DD Header Validation</td>
              <td style={{ padding: '10px 12px' }}><span className="badge badge-verified">Audited</span></td>
            </tr>
            <tr>
              <td style={{ padding: '10px 12px', fontWeight: 600 }}>Biophysical Change</td>
              <td style={{ padding: '10px 12px', color: '#94A3B8' }}>Sentinel-2B MSI (Level-2A BOA)</td>
              <td style={{ padding: '10px 12px' }}>10m Multispectral Bands</td>
              <td style={{ padding: '10px 12px' }}>Sen2Cor Reflectance Differencing</td>
              <td style={{ padding: '10px 12px' }}><span className="badge badge-live">Live Calibrated</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
