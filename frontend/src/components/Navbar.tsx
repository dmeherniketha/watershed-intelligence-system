import React from 'react';
import { 
  Globe2, 
  Layers, 
  Box, 
  Camera, 
  Sparkles, 
  BarChart3, 
  FileText, 
  Activity, 
  MapPin, 
  Eye,
  Sliders,
  SplitSquareVertical
} from 'lucide-react';
import { Watershed } from '../types';

interface NavbarProps {
  watersheds: Watershed[];
  selectedWatershedId: string;
  onSelectWatershed: (id: string) => void;
  activeTab: 'map2d' | 'terrain3d' | 'fieldEvidence' | 'satellite' | 'aiReview' | 'dashboard' | 'reports';
  setActiveTab: (tab: 'map2d' | 'terrain3d' | 'fieldEvidence' | 'satellite' | 'aiReview' | 'dashboard' | 'reports') => void;
  isBackendConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  watersheds,
  selectedWatershedId,
  onSelectWatershed,
  activeTab,
  setActiveTab,
  isBackendConnected
}) => {
  const currentWatershed = watersheds.find(w => w.id === selectedWatershedId);

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      background: 'rgba(15, 23, 42, 0.95)',
      borderBottom: '1px solid #1E293B',
      backdropFilter: 'blur(12px)',
      zIndex: 1000
    }}>
      {/* Brand & Team Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #10B981, #06B6D4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
        }}>
          <Globe2 size={24} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
              WATERSHED <span style={{ color: '#10B981' }}>3D</span> INTELLIGENCE
            </span>
            <span className="badge badge-live" style={{ fontSize: '0.65rem' }}>SIH26015</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Team <strong style={{ color: '#E2E8F0' }}>INNOVAID</strong> &bull; Geospatial Remote Sensing & Bathymetry Platform
          </p>
        </div>
      </div>

      {/* Watershed Dropdown Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#1E293B', padding: '6px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
        <MapPin size={16} color="#10B981" />
        <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 500 }}>Target Catchment:</span>
        <select
          value={selectedWatershedId}
          onChange={(e) => onSelectWatershed(e.target.value)}
          style={{
            background: 'transparent',
            color: '#F8FAFC',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {watersheds.map(w => (
            <option key={w.id} value={w.id} style={{ background: '#0F172A', color: '#F8FAFC' }}>
              {w.name} ({w.state})
            </option>
          ))}
        </select>
        {currentWatershed && (
          <span style={{ fontSize: '0.75rem', color: '#38BDF8', borderLeft: '1px solid #475569', paddingLeft: '8px' }}>
            {currentWatershed.area_sq_km} km&sup2;
          </span>
        )}
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => setActiveTab('map2d')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: activeTab === 'map2d' ? '1px solid #10B981' : '1px solid transparent',
            background: activeTab === 'map2d' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: activeTab === 'map2d' ? '#34D399' : '#94A3B8',
            transition: 'all 0.2s'
          }}
        >
          <Layers size={16} />
          2D GIS Map
        </button>

        <button
          onClick={() => setActiveTab('terrain3d')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: activeTab === 'terrain3d' ? '1px solid #06B6D4' : '1px solid transparent',
            background: activeTab === 'terrain3d' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeTab === 'terrain3d' ? '#22D3EE' : '#94A3B8',
            transition: 'all 0.2s'
          }}
        >
          <Box size={16} />
          3D Terrain & Cutaway
        </button>

        <button
          onClick={() => setActiveTab('fieldEvidence')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: activeTab === 'fieldEvidence' ? '1px solid #F59E0B' : '1px solid transparent',
            background: activeTab === 'fieldEvidence' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'fieldEvidence' ? '#FBBF24' : '#94A3B8',
            transition: 'all 0.2s'
          }}
        >
          <Camera size={16} />
          Field Evidence (EXIF)
        </button>

        <button
          onClick={() => setActiveTab('satellite')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: activeTab === 'satellite' ? '1px solid #3B82F6' : '1px solid transparent',
            background: activeTab === 'satellite' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: activeTab === 'satellite' ? '#60A5FA' : '#94A3B8',
            transition: 'all 0.2s'
          }}
        >
          <SplitSquareVertical size={16} />
          Satellite Change (NDVI)
        </button>

        <button
          onClick={() => setActiveTab('aiReview')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: activeTab === 'aiReview' ? '1px solid #A855F7' : '1px solid transparent',
            background: activeTab === 'aiReview' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
            color: activeTab === 'aiReview' ? '#C084FC' : '#94A3B8',
            transition: 'all 0.2s'
          }}
        >
          <Sparkles size={16} />
          AI Vision Review
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: activeTab === 'dashboard' ? '1px solid #10B981' : '1px solid transparent',
            background: activeTab === 'dashboard' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: activeTab === 'dashboard' ? '#34D399' : '#94A3B8',
            transition: 'all 0.2s'
          }}
        >
          <BarChart3 size={16} />
          Dashboard
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: activeTab === 'reports' ? '1px solid #64748B' : '1px solid transparent',
            background: activeTab === 'reports' ? 'rgba(100, 116, 139, 0.15)' : 'transparent',
            color: activeTab === 'reports' ? '#E2E8F0' : '#94A3B8',
            transition: 'all 0.2s'
          }}
        >
          <FileText size={16} />
          Reports
        </button>
      </nav>

      {/* Backend Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: isBackendConnected ? '#10B981' : '#F43F5E',
          boxShadow: isBackendConnected ? '0 0 10px #10B981' : '0 0 10px #F43F5E'
        }} />
        <span style={{ fontSize: '0.75rem', color: isBackendConnected ? '#34D399' : '#FB7185', fontWeight: 500 }}>
          {isBackendConnected ? 'API Live (8000)' : 'API Disconnected'}
        </span>
      </div>
    </header>
  );
};
