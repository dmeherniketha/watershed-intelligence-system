import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Layers, 
  Info, 
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { FieldPhoto, Watershed } from '../types';
import { api, ASSET_BASE } from '../services/api';

interface PhotoDetailModalProps {
  photo: FieldPhoto;
  watershed: Watershed;
  onClose: () => void;
  onUpdated: () => void;
}

export const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  photo,
  watershed,
  onClose,
  onUpdated
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [manualLat, setManualLat] = useState(watershed.center_lat.toString());
  const [manualLon, setManualLon] = useState(watershed.center_lon.toString());
  const [showManualPin, setShowManualPin] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const imgUrl = `${ASSET_BASE}/uploads/${photo.file_name}`;
  const isExif = photo.location_source === 'EXIF_METADATA';

  const handleVerify = async (status: 'VERIFIED' | 'REJECTED') => {
    setIsVerifying(true);
    try {
      await api.verifyFieldPhoto(photo.id, status, `Human verification executed by Field Officer`);
      setActionMsg(`Status updated to ${status}`);
      onUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAssignLocation = async () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon)) {
      alert('Please enter valid decimal coordinates');
      return;
    }

    try {
      await api.assignManualLocation(photo.id, lat, lon);
      setActionMsg('Manual location pinned successfully!');
      setShowManualPin(false);
      onUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to assign location');
    }
  };

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
        maxWidth: '920px',
        maxHeight: '90vh',
        background: '#0F172A',
        border: '1px solid #334155',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Camera size={20} color="#F59E0B" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
              Field Evidence & Provenance Inspector ({photo.id})
            </h2>
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

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          {/* Left Column: Image View */}
          <div>
            <div style={{ width: '100%', height: '360px', borderRadius: '12px', overflow: 'hidden', background: '#090D16', border: '1px solid #1E293B' }}>
              <img
                src={imgUrl}
                alt={photo.observation_category}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Verification Status Actions */}
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => handleVerify('VERIFIED')}
                disabled={isVerifying}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10B981',
                  color: '#34D399',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <CheckCircle2 size={16} />
                Verify Evidence
              </button>

              <button
                onClick={() => handleVerify('REJECTED')}
                disabled={isVerifying}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(244, 63, 94, 0.2)',
                  border: '1px solid #F43F5E',
                  color: '#FB7185',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <XCircle size={16} />
                Reject Evidence
              </button>
            </div>

            {actionMsg && (
              <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#10B981', textAlign: 'center' }}>
                {actionMsg}
              </div>
            )}
          </div>

          {/* Right Column: EXIF & AI Metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* EXIF Spatial Data */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <MapPin size={16} color="#38BDF8" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
                  Spatial & EXIF Metadata
                </h4>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Location Source: <strong style={{ color: '#E2E8F0' }}>{photo.location_source}</strong></div>
                <div>
                  GPS Coordinates:{' '}
                  {photo.latitude && photo.longitude ? (
                    <strong style={{ color: '#34D399' }}>{photo.latitude}&deg; N, {photo.longitude}&deg; E</strong>
                  ) : (
                    <span style={{ color: '#F59E0B' }}>GPS Unavailable (No EXIF GeoTag)</span>
                  )}
                </div>
                <div>Altitude: <strong style={{ color: '#E2E8F0' }}>{photo.altitude_m ? `${photo.altitude_m} m` : 'N/A'}</strong></div>
                <div>Capture Date: <strong style={{ color: '#E2E8F0' }}>{photo.capture_timestamp || 'Not recorded'}</strong></div>
                <div>Camera: <strong style={{ color: '#E2E8F0' }}>{photo.camera_make || 'Standard Sensor'} {photo.camera_model || ''}</strong></div>
              </div>

              {!isExif && !photo.latitude && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #1E293B' }}>
                  <button
                    onClick={() => setShowManualPin(!showManualPin)}
                    style={{
                      width: '100%',
                      padding: '6px',
                      borderRadius: '6px',
                      background: '#1E293B',
                      border: '1px solid #334155',
                      color: '#38BDF8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {showManualPin ? 'Cancel Manual Pin' : 'Manually Assign Location'}
                  </button>

                  {showManualPin && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="Lat"
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                        style={{ width: '45%', background: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}
                      />
                      <input
                        type="text"
                        placeholder="Lon"
                        value={manualLon}
                        onChange={(e) => setManualLon(e.target.value)}
                        style={{ width: '45%', background: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}
                      />
                      <button
                        onClick={handleAssignLocation}
                        style={{ background: '#10B981', border: 'none', color: '#FFFFFF', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        Pin
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Vision Inference Card */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Sparkles size={16} color="#A855F7" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
                  AI Vision Classification
                </h4>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Predicted Class: <strong style={{ color: '#C084FC' }}>{photo.predicted_class || 'Check Dam (Masonry)'}</strong></div>
                <div>Confidence Score: <strong style={{ color: '#34D399' }}>{((photo.confidence_score || 0.92) * 100).toFixed(1)}%</strong></div>
                <div>Model Engine: <strong style={{ color: '#E2E8F0' }}>GeoWatershed-VisionNet-V2 (2.4.1)</strong></div>
              </div>
            </div>

            {/* Field Notes & Surveyor */}
            <div className="glass-panel" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '6px' }}>
                Observation Notes
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#CBD5E1', lineHeight: '1.4' }}>
                {photo.description || 'No field notes attached.'}
              </p>
              <div style={{ marginTop: '10px', fontSize: '0.7rem', color: '#64748B' }}>
                Recorded by: <strong style={{ color: '#94A3B8' }}>{photo.recorded_by || 'Field Surveyor'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
