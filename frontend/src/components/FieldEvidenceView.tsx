import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Filter, 
  Eye, 
  Calendar, 
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { FieldPhoto, Watershed } from '../types';
import { api, ASSET_BASE } from '../services/api';

interface FieldEvidenceViewProps {
  watershed: Watershed;
  fieldPhotos: FieldPhoto[];
  onRefresh: () => void;
  onOpenPhotoDetail: (photo: FieldPhoto) => void;
}

export const FieldEvidenceView: React.FC<FieldEvidenceViewProps> = ({
  watershed,
  fieldPhotos,
  onRefresh,
  onOpenPhotoDetail
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Upload Form State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('Structure Inspection');
  const [description, setDescription] = useState('');
  const [recordedBy, setRecordedBy] = useState('Field Officer (Team INNOVAID)');

  const categories = [
    'Structure Inspection',
    'Vegetation Health',
    'Soil Erosion',
    'Siltation',
    'Water Level'
  ];

  const filteredPhotos = fieldPhotos.filter(p => {
    if (filterCategory !== 'ALL' && p.observation_category !== filterCategory) return false;
    if (filterStatus !== 'ALL' && p.verification_status !== filterStatus) return false;
    return true;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please choose an image file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('watershed_id', watershed.id);
    formData.append('observation_category', category);
    formData.append('description', description);
    formData.append('recorded_by', recordedBy);

    try {
      const res = await api.uploadFieldPhoto(formData);
      setUploadSuccess(`Photo uploaded successfully! EXIF GPS: ${res.has_exif_gps ? 'Extracted (' + res.latitude + ', ' + res.longitude + ')' : 'Unavailable (Location marked Unverified)'}. AI Classified: ${res.ai_prediction.predicted_class} (${(res.ai_prediction.confidence_score * 100).toFixed(1)}%).`);
      setSelectedFile(null);
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onRefresh();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto', background: '#090D16' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={24} color="#F59E0B" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F8FAFC' }}>
              Geo-Tagged Field Photographs & Evidence
            </h1>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
            Auditable ground-truth verification linking EXIF coordinates, spatial metadata, and AI interpretation.
          </p>
        </div>

        {/* Verification Summary Counts */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="glass-panel" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#10B981" />
            <span style={{ fontSize: '0.78rem', color: '#E2E8F0' }}>
              Verified: <strong>{fieldPhotos.filter(p => p.verification_status === 'VERIFIED').length}</strong>
            </span>
          </div>

          <div className="glass-panel" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="#F59E0B" />
            <span style={{ fontSize: '0.78rem', color: '#E2E8F0' }}>
              Pending: <strong>{fieldPhotos.filter(p => p.verification_status === 'PENDING').length}</strong>
            </span>
          </div>

          <div className="glass-panel" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} color="#38BDF8" />
            <span style={{ fontSize: '0.78rem', color: '#E2E8F0' }}>
              EXIF GPS: <strong>{fieldPhotos.filter(p => p.has_exif_gps).length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Sidebar + Gallery */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
        {/* Upload Form Card */}
        <div className="glass-panel" style={{ padding: '20px', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #1E293B', paddingBottom: '10px' }}>
            <Upload size={18} color="#10B981" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>Upload Field Observation</h3>
          </div>

          {uploadSuccess && (
            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', fontSize: '0.75rem', color: '#34D399', marginBottom: '14px' }}>
              {uploadSuccess}
            </div>
          )}

          {uploadError && (
            <div style={{ padding: '10px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid #F43F5E', borderRadius: '8px', fontSize: '0.75rem', color: '#FB7185', marginBottom: '14px' }}>
              {uploadError}
            </div>
          )}

          <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Select Field Image (JPG / PNG / WEBP)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  fontSize: '0.75rem',
                  color: '#94A3B8',
                  background: '#1E293B',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #334155'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Observation Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '0.8rem',
                  color: '#F8FAFC',
                  background: '#1E293B',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  outline: 'none'
                }}
              >
                {categories.map(c => (
                  <option key={c} value={c} style={{ background: '#0F172A' }}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Field Notes & Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of structure crest, siltation, or vegetation..."
                rows={3}
                style={{
                  width: '100%',
                  fontSize: '0.8rem',
                  color: '#F8FAFC',
                  background: '#1E293B',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Surveyor Identifier
              </label>
              <input
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '0.8rem',
                  color: '#F8FAFC',
                  background: '#1E293B',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isUploading}
              style={{
                marginTop: '6px',
                padding: '10px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              {isUploading ? 'Extracting EXIF & Running AI...' : 'Upload & Process Photo'}
            </button>
          </form>

          {/* Scientific Disclaimer */}
          <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px solid #1E293B', fontSize: '0.68rem', color: '#64748B' }}>
            <Info size={12} style={{ display: 'inline', marginRight: '4px' }} />
            EXIF coordinates are directly extracted without fabrication. Photos lacking GPS are safely flagged as Unverified.
          </div>
        </div>

        {/* Gallery Section */}
        <div>
          {/* Filters Bar */}
          <div className="glass-panel" style={{ padding: '12px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={16} color="#06B6D4" />
                <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Filter Category:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{ background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem' }}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem' }}
                >
                  <option value="ALL">All Status</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Showing <strong>{filteredPhotos.length}</strong> photo records
            </span>
          </div>

          {/* Photos Card Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredPhotos.map(photo => {
              const imgUrl = `${ASSET_BASE}/uploads/${photo.file_name}`;
              const isExif = photo.location_source === 'EXIF_METADATA';
              const isVerified = photo.verification_status === 'VERIFIED';

              return (
                <div
                  key={photo.id}
                  className="glass-panel"
                  style={{
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => onOpenPhotoDetail(photo)}
                >
                  {/* Thumbnail Image */}
                  <div style={{ position: 'relative', width: '100%', height: '170px', background: '#0F172A' }}>
                    <img
                      src={imgUrl}
                      alt={photo.observation_category}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e: any) => {
                        e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop&q=80';
                      }}
                    />
                    
                    {/* Status Badge Overlay */}
                    <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                      {isVerified ? (
                        <span className="badge badge-verified">Verified</span>
                      ) : photo.verification_status === 'PENDING' ? (
                        <span className="badge badge-pending">Pending</span>
                      ) : (
                        <span className="badge badge-rejected">Rejected</span>
                      )}
                    </div>

                    {/* Geotag Source Overlay */}
                    <div style={{ position: 'absolute', bottom: '8px', left: '8px' }}>
                      {isExif ? (
                        <span className="badge badge-verified" style={{ fontSize: '0.65rem' }}>
                          <MapPin size={10} /> EXIF GPS
                        </span>
                      ) : photo.location_source === 'MANUAL_PIN' ? (
                        <span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>
                          <MapPin size={10} /> Manual Pin
                        </span>
                      ) : (
                        <span className="badge badge-unverified" style={{ fontSize: '0.65rem' }}>
                          <AlertTriangle size={10} /> GPS Unavailable
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#F8FAFC' }}>
                          {photo.observation_category}
                        </h4>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{photo.id}</span>
                      </div>

                      <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '8px', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {photo.description || 'No field notes provided.'}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid #1E293B', paddingTop: '8px', fontSize: '0.7rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{photo.capture_timestamp ? photo.capture_timestamp.split('T')[0] : 'Date Unknown'}</span>
                      {photo.predicted_class && (
                        <span style={{ color: '#C084FC', fontWeight: 600 }}>
                          <Sparkles size={10} style={{ display: 'inline', marginRight: '2px' }} />
                          {photo.predicted_class}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
