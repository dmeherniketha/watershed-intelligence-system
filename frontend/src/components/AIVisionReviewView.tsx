import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  UserCheck, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  Eye,
  Camera
} from 'lucide-react';
import { AIPrediction } from '../types';
import { api, ASSET_BASE } from '../services/api';

export const AIVisionReviewView: React.FC = () => {
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedPred, setSelectedPred] = useState<AIPrediction | null>(null);
  const [correctedClass, setCorrectedClass] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [reviewerId, setReviewerId] = useState('Dr. S. Patil (Principal Geoscientist)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const classesList = [
    'Check Dam (Masonry/Earthen)',
    'Gully Plug / Boulder Check',
    'Farm Pond / Water Harvesting Tank',
    'Percolation Tank / Recharge Basin',
    'Active Soil Erosion / Gully Scour',
    'Siltation / Reservoir Sedimentation',
    'Afforestation / Riparian Buffer'
  ];

  const fetchPredictions = () => {
    api.getAIPredictions(filterStatus === 'ALL' ? undefined : filterStatus)
      .then(data => {
        setPredictions(data);
        if (data.length > 0 && !selectedPred) {
          setSelectedPred(data[0]);
          setCorrectedClass(data[0].predicted_class);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchPredictions();
  }, [filterStatus]);

  const handleReviewAction = async (status: 'ACCEPTED' | 'CORRECTED' | 'REJECTED') => {
    if (!selectedPred) return;
    setIsSubmitting(true);
    setActionSuccess(null);

    try {
      await api.submitHumanReview(
        selectedPred.id,
        status,
        reviewerId,
        status === 'CORRECTED' ? correctedClass : undefined,
        reviewComments
      );
      setActionSuccess(`Review submitted: Prediction marked as ${status}!`);
      fetchPredictions();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto', background: '#090D16' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={24} color="#A855F7" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F8FAFC' }}>
              Human-In-The-Loop AI Vision Review & Calibration
            </h1>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
            Auditable review workflow for field intervention and erosion categorization predictions with full provenance.
          </p>
        </div>

        {/* Filter Status Selector */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem' }}
          >
            <option value="ALL">All Predictions</option>
            <option value="PENDING">Pending Review</option>
            <option value="ACCEPTED">Human Accepted</option>
            <option value="CORRECTED">Human Corrected</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Content: Left List + Right Review Workbench */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
        {/* Left List of Predictions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {predictions.map(pred => {
            const isSelected = selectedPred?.id === pred.id;
            const imgUrl = `${ASSET_BASE}/uploads/${pred.file_name}`;

            return (
              <div
                key={pred.id}
                onClick={() => {
                  setSelectedPred(pred);
                  setCorrectedClass(pred.predicted_class);
                  setActionSuccess(null);
                }}
                className={isSelected ? 'glass-panel-glow' : 'glass-panel'}
                style={{
                  padding: '12px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  cursor: 'pointer',
                  borderColor: isSelected ? '#A855F7' : 'var(--glass-border)',
                  background: isSelected ? 'rgba(168, 85, 247, 0.12)' : 'var(--glass-bg)'
                }}
              >
                <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#0F172A', flexShrink: 0 }}>
                  <img
                    src={imgUrl}
                    alt={pred.predicted_class}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e: any) => {
                      e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pred.predicted_class}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#34D399', fontWeight: 600 }}>
                      {(pred.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{pred.id}</div>

                  <div style={{ marginTop: '4px' }}>
                    {pred.human_review_status === 'ACCEPTED' ? (
                      <span className="badge badge-verified" style={{ fontSize: '0.62rem' }}>Accepted</span>
                    ) : pred.human_review_status === 'CORRECTED' ? (
                      <span className="badge badge-live" style={{ fontSize: '0.62rem' }}>Corrected</span>
                    ) : pred.human_review_status === 'REJECTED' ? (
                      <span className="badge badge-rejected" style={{ fontSize: '0.62rem' }}>Rejected</span>
                    ) : (
                      <span className="badge badge-pending" style={{ fontSize: '0.62rem' }}>Pending Review</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Review Workbench */}
        {selectedPred ? (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {actionSuccess && (
              <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', fontSize: '0.8rem', color: '#34D399' }}>
                {actionSuccess}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              {/* Evidence Photo Preview */}
              <div>
                <div style={{ width: '100%', height: '280px', borderRadius: '12px', overflow: 'hidden', background: '#090D16', border: '1px solid #1E293B' }}>
                  <img
                    src={`${ASSET_BASE}/uploads/${selectedPred.file_name}`}
                    alt={selectedPred.predicted_class}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Filename: {selectedPred.file_name}</span>
                  <span>Watershed: {selectedPred.watershed_id}</span>
                </div>
              </div>

              {/* Model Scores Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <span className="badge badge-live" style={{ fontSize: '0.7rem' }}>Model Architecture</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', marginTop: '4px' }}>
                    {selectedPred.model_name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Version: {selectedPred.model_version}</div>
                </div>

                {/* Class Probabilities Bars */}
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '8px' }}>
                    Top Class Probabilities
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedPred.all_class_scores.map((sc, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#E2E8F0', marginBottom: '2px' }}>
                          <span>{sc.label}</span>
                          <span style={{ fontWeight: 600 }}>{(sc.score * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${sc.score * 100}%`,
                            height: '100%',
                            background: idx === 0 ? '#A855F7' : '#38BDF8',
                            borderRadius: '3px'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detected Visual Features */}
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '6px' }}>
                    Detected Visual Cues
                  </h4>
                  <ul style={{ paddingLeft: '16px', fontSize: '0.72rem', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {selectedPred.detected_features.map((feat, i) => (
                      <li key={i}>{feat}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Human Decision Form */}
            <div style={{ borderTop: '1px solid #1E293B', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={18} color="#10B981" />
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#F8FAFC' }}>
                  Human Reviewer Decision & Override
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Correct / Override Category (if model is inaccurate)
                  </label>
                  <select
                    value={correctedClass}
                    onChange={(e) => setCorrectedClass(e.target.value)}
                    style={{ width: '100%', background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '6px', padding: '8px', fontSize: '0.8rem' }}
                  >
                    {classesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Reviewer Identity
                  </label>
                  <input
                    type="text"
                    value={reviewerId}
                    onChange={(e) => setReviewerId(e.target.value)}
                    style={{ width: '100%', background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '6px', padding: '8px', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Geological Review Notes / Rationale
                </label>
                <input
                  type="text"
                  placeholder="e.g. Masonry apron clearly observed without scouring..."
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  style={{ width: '100%', background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '6px', padding: '8px', fontSize: '0.8rem' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button
                  onClick={() => handleReviewAction('ACCEPTED')}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#10B981',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle2 size={16} /> Accept Prediction
                </button>

                <button
                  onClick={() => handleReviewAction('CORRECTED')}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Edit3 size={16} /> Submit Corrected Class
                </button>

                <button
                  onClick={() => handleReviewAction('REJECTED')}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#F43F5E',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <XCircle size={16} /> Reject Prediction
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
            Select a prediction record from the left to review.
          </div>
        )}
      </div>
    </div>
  );
};
