import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { GIS2DMap } from './components/GIS2DMap';
import { Terrain3DViewer } from './components/Terrain3DViewer';
import { FieldEvidenceView } from './components/FieldEvidenceView';
import { SatelliteCompareView } from './components/SatelliteCompareView';
import { AIVisionReviewView } from './components/AIVisionReviewView';
import { MonitoringDashboardView } from './components/MonitoringDashboardView';
import { ReportsView } from './components/ReportsView';
import { CutawaySectionModal } from './components/CutawaySectionModal';
import { PhotoDetailModal } from './components/PhotoDetailModal';
import { Watershed, WaterBody, Intervention, FieldPhoto, ElevationProfile } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [watersheds, setWatersheds] = useState<Watershed[]>([]);
  const [selectedWatershedId, setSelectedWatershedId] = useState<string>('WTR-KA-001');
  const [currentWatershed, setCurrentWatershed] = useState<Watershed | null>(null);
  const [waterBodies, setWaterBodies] = useState<WaterBody[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [fieldPhotos, setFieldPhotos] = useState<FieldPhoto[]>([]);
  const [activeTab, setActiveTab] = useState<'map2d' | 'terrain3d' | 'fieldEvidence' | 'satellite' | 'aiReview' | 'dashboard' | 'reports'>('map2d');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [activeCutaway, setActiveCutaway] = useState<{ profile: ElevationProfile; waterBody?: WaterBody } | null>(null);
  const [activePhotoDetail, setActivePhotoDetail] = useState<FieldPhoto | null>(null);

  // 1. Initial Load: Fetch Watersheds List
  useEffect(() => {
    let isMounted = true;
    api.getWatersheds()
      .then(data => {
        if (isMounted) {
          setWatersheds(data);
          if (data.length > 0) {
            setSelectedWatershedId(data[0].id);
          }
          setIsBackendConnected(true);
        }
      })
      .catch(err => {
        console.error('Error fetching watersheds:', err);
        setIsBackendConnected(false);
      });

    return () => { isMounted = false; };
  }, []);

  // 2. Load Selected Watershed Detail, Water Bodies, Interventions, Field Photos
  const loadWatershedData = (wid: string) => {
    setIsLoading(true);
    api.getWatershedDetail(wid)
      .then(w => {
        setCurrentWatershed(w);
        setWaterBodies(w.water_bodies || []);
        setInterventions(w.interventions || []);
        setIsBackendConnected(true);
      })
      .catch(err => {
        console.error('Error loading watershed detail:', err);
        setIsBackendConnected(false);
      })
      .finally(() => setIsLoading(false));

    api.getFieldPhotos(wid)
      .then(photos => {
        setFieldPhotos(photos);
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (selectedWatershedId) {
      loadWatershedData(selectedWatershedId);
    }
  }, [selectedWatershedId]);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        watersheds={watersheds}
        selectedWatershedId={selectedWatershedId}
        onSelectWatershed={(id) => setSelectedWatershedId(id)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Workspace Content */}
      <main className="main-content">
        {isLoading || !currentWatershed ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#090D16' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '3px solid #1E293B',
                borderTopColor: '#10B981',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Loading Geospatial Intelligence Datasets...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'map2d' && (
              <GIS2DMap
                watershed={currentWatershed}
                waterBodies={waterBodies}
                interventions={interventions}
                fieldPhotos={fieldPhotos}
                onOpenCutaway={(profile, wb) => setActiveCutaway({ profile, waterBody: wb })}
                onOpenPhotoDetail={(photo) => setActivePhotoDetail(photo)}
              />
            )}

            {activeTab === 'terrain3d' && (
              <Terrain3DViewer
                watershed={currentWatershed}
                waterBodies={waterBodies}
                interventions={interventions}
              />
            )}

            {activeTab === 'fieldEvidence' && (
              <FieldEvidenceView
                watershed={currentWatershed}
                fieldPhotos={fieldPhotos}
                onRefresh={() => loadWatershedData(selectedWatershedId)}
                onOpenPhotoDetail={(photo) => setActivePhotoDetail(photo)}
              />
            )}

            {activeTab === 'satellite' && (
              <SatelliteCompareView
                watershed={currentWatershed}
              />
            )}

            {activeTab === 'aiReview' && (
              <AIVisionReviewView />
            )}

            {activeTab === 'dashboard' && (
              <MonitoringDashboardView
                watershed={currentWatershed}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                watershed={currentWatershed}
                fieldPhotos={fieldPhotos}
              />
            )}
          </>
        )}
      </main>

      {/* 3D Cutaway Elevation Profile Modal */}
      {activeCutaway && (
        <CutawaySectionModal
          profile={activeCutaway.profile}
          waterBody={activeCutaway.waterBody}
          onClose={() => setActiveCutaway(null)}
        />
      )}

      {/* Field Photo & EXIF Metadata Inspector Modal */}
      {activePhotoDetail && currentWatershed && (
        <PhotoDetailModal
          photo={activePhotoDetail}
          watershed={currentWatershed}
          onClose={() => setActivePhotoDetail(null)}
          onUpdated={() => {
            loadWatershedData(selectedWatershedId);
            setActivePhotoDetail(null);
          }}
        />
      )}
    </div>
  );
};

export default App;
