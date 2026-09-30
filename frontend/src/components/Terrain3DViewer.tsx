import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Box, 
  RotateCcw, 
  Layers, 
  Scissors, 
  Eye, 
  Sliders, 
  Maximize2,
  Compass,
  Info
} from 'lucide-react';
import { Watershed, WaterBody, Intervention } from '../types';
import { api } from '../services/api';

interface Terrain3DViewerProps {
  watershed: Watershed;
  waterBodies: WaterBody[];
  interventions: Intervention[];
}

export const Terrain3DViewer: React.FC<Terrain3DViewerProps> = ({
  watershed,
  waterBodies,
  interventions
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [gridData, setGridData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 3D Controls
  const [vertExaggeration, setVertExaggeration] = useState(2.2);
  const [cutawayOffset, setCutawayOffset] = useState(1.0); // 0.0 = full cut, 1.0 = no cut
  const [showWaterBodies, setShowWaterBodies] = useState(true);
  const [showInterventions, setShowInterventions] = useState(true);
  const [showStrataCutaway, setShowStrataCutaway] = useState(true);

  // References for ThreeJS objects to update smoothly
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const clipPlaneRef = useRef<THREE.Plane | null>(null);

  // Fetch 3D DEM Grid from Backend
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api.getTerrain3DGrid(watershed.id, 52)
      .then(data => {
        if (isMounted) {
          setGridData(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching 3D grid:', err);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [watershed.id]);

  // Setup Three.js Scene
  useEffect(() => {
    if (!mountRef.current || !gridData) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x090D16);
    scene.fog = new THREE.FogExp2(0x090D16, 0.008);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 50, 75);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.localClippingEnabled = true;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Clipping Plane for Cutaway
    const clipPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 25 * cutawayOffset);
    clipPlaneRef.current = clipPlane;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(40, 80, 50);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Build Terrain Geometry from real DEM normalized elevation matrix
    const gridSize = gridData.grid_size;
    const geometry = new THREE.PlaneGeometry(50, 50, gridSize - 1, gridSize - 1);
    geometry.rotateX(-Math.PI / 2);

    const posAttr = geometry.attributes.position;
    const colors = [];

    const elevMatrix = gridData.normalized_matrix; // 0.0 to 1.0
    const rawElevMatrix = gridData.elevation_matrix;

    for (let i = 0; i < posAttr.count; i++) {
      const r = Math.floor(i / gridSize);
      const c = i % gridSize;
      const normZ = (elevMatrix[r] && elevMatrix[r][c] !== undefined) ? elevMatrix[r][c] : 0.5;
      
      // Set Y height based on vertical exaggeration
      posAttr.setY(i, normZ * 12 * (vertExaggeration / 2.0));

      // Hypsometric Color calculation (Valleys -> Hills -> Ridges)
      const color = new THREE.Color();
      if (normZ < 0.25) {
        color.setHSL(0.40 - normZ * 0.2, 0.7, 0.35 + normZ * 0.3); // Lush emerald valley
      } else if (normZ < 0.65) {
        color.setHSL(0.14 - (normZ - 0.25) * 0.1, 0.65, 0.45); // Terraced agrarian slopes
      } else {
        color.setHSL(0.06, 0.5, 0.45 + (normZ - 0.65) * 0.4); // Rocky ridges
      }
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1,
      clippingPlanes: [clipPlane],
      clipShadows: true,
      side: THREE.DoubleSide
    });

    const terrainMesh = new THREE.Mesh(geometry, material);
    terrainMesh.receiveShadow = true;
    meshRef.current = terrainMesh;
    scene.add(terrainMesh);

    // Add Under-Terrain Geological Strata Cutaway Skirt
    if (showStrataCutaway) {
      const strataGeom = new THREE.BoxGeometry(50, 8, 50);
      strataGeom.translate(0, -4, 0);
      const strataMat = new THREE.MeshStandardMaterial({
        color: 0x4A3728, // Earth brown bedrock
        roughness: 0.9,
        clippingPlanes: [clipPlane],
        side: THREE.DoubleSide
      });
      const strataMesh = new THREE.Mesh(strataGeom, strataMat);
      scene.add(strataMesh);

      // Saturated Groundwater Table Plane (Cyan transparent)
      const waterTableGeom = new THREE.PlaneGeometry(48, 48);
      waterTableGeom.rotateX(-Math.PI / 2);
      waterTableGeom.translate(0, -1.5, 0);
      const waterTableMat = new THREE.MeshBasicMaterial({
        color: 0x06B6D4,
        transparent: true,
        opacity: 0.4,
        clippingPlanes: [clipPlane],
        side: THREE.DoubleSide
      });
      const waterTableMesh = new THREE.Mesh(waterTableGeom, waterTableMat);
      scene.add(waterTableMesh);
    }

    // Add 3D Water Bodies Extrusion
    if (showWaterBodies && waterBodies) {
      waterBodies.forEach(wb => {
        const isBathy = wb.bathymetry_available;
        const radius = Math.min(6, Math.max(2.5, Math.sqrt(wb.surface_area_ha) * 0.8));
        const waterGeom = new THREE.CylinderGeometry(radius, radius * 0.8, isBathy ? 1.8 : 0.4, 24);
        const waterMat = new THREE.MeshStandardMaterial({
          color: isBathy ? 0x00A8E8 : 0x48CAE4,
          transparent: true,
          opacity: 0.75,
          roughness: 0.1,
          metalness: 0.3,
          clippingPlanes: [clipPlane]
        });
        const waterMesh = new THREE.Mesh(waterGeom, waterMat);
        // Place in central catchment basin
        waterMesh.position.set(4, 2.8, 2);
        scene.add(waterMesh);
      });
    }

    // Add 3D Intervention Markers (Pins & Concrete Check Dam Weirs)
    if (showInterventions && interventions) {
      interventions.forEach((item, idx) => {
        const angle = (idx / interventions.length) * Math.PI * 1.5;
        const dist = 6 + (idx % 3) * 6;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;

        const pinGeom = new THREE.ConeGeometry(0.8, 2.5, 8);
        pinGeom.rotateX(Math.PI);
        const pinMat = new THREE.MeshStandardMaterial({
          color: item.category === 'Check Dam' ? 0x10B981 : 0xF59E0B,
          emissive: item.category === 'Check Dam' ? 0x059669 : 0xD97706,
          emissiveIntensity: 0.4,
          clippingPlanes: [clipPlane]
        });
        const pinMesh = new THREE.Mesh(pinGeom, pinMat);
        pinMesh.position.set(x, 6.5, z);
        scene.add(pinMesh);
      });
    }

    // Interactive Orbit Drag Logic
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let spherical = { radius: 75, theta: 0.4, phi: 0.9 };

    const updateCameraPos = () => {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 2, 0);
    };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMousePos.x;
      const dy = e.clientY - prevMousePos.y;

      spherical.theta -= dx * 0.008;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi + dy * 0.008));
      updateCameraPos();

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(25, Math.min(140, spherical.radius + e.deltaY * 0.05));
      updateCameraPos();
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [gridData, vertExaggeration, cutawayOffset, showWaterBodies, showInterventions, showStrataCutaway]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#090D16', overflow: 'hidden' }}>
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Loading State */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid #1E293B',
            borderTopColor: '#06B6D4',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>Loading 3D Terrain DEM Mesh...</p>
        </div>
      )}

      {/* Top Floating 3D Controls Bar */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '24px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Cutaway Slicing Slider */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px' }}>
          <Scissors size={16} color="#06B6D4" />
          <span style={{ fontSize: '0.78rem', color: '#E2E8F0', fontWeight: 600 }}>3D Cutaway Slice:</span>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={cutawayOffset}
            onChange={(e) => setCutawayOffset(parseFloat(e.target.value))}
            style={{ width: '100px', cursor: 'pointer', accentColor: '#06B6D4' }}
          />
          <span style={{ fontSize: '0.75rem', color: '#38BDF8', width: '36px' }}>
            {Math.round((1.0 - cutawayOffset) * 100)}% Cut
          </span>
        </div>

        {/* Vertical Exaggeration Slider */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px' }}>
          <Sliders size={16} color="#10B981" />
          <span style={{ fontSize: '0.78rem', color: '#E2E8F0', fontWeight: 600 }}>Vertical Exaggeration:</span>
          <input
            type="range"
            min="1.0"
            max="4.5"
            step="0.1"
            value={vertExaggeration}
            onChange={(e) => setVertExaggeration(parseFloat(e.target.value))}
            style={{ width: '100px', cursor: 'pointer', accentColor: '#10B981' }}
          />
          <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700 }}>
            {vertExaggeration.toFixed(1)}&times;
          </span>
        </div>
      </div>

      {/* 3D Terrain Layer Toggles (Top Right) */}
      <div className="glass-panel" style={{
        position: 'absolute',
        top: '16px',
        right: '24px',
        zIndex: 100,
        width: '240px',
        padding: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #1E293B', paddingBottom: '8px' }}>
          <Box size={16} color="#06B6D4" />
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>3D Mesh Layers</h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ color: '#E2E8F0' }}>Geological Strata Skirt</span>
            <input
              type="checkbox"
              checked={showStrataCutaway}
              onChange={(e) => setShowStrataCutaway(e.target.checked)}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ color: '#E2E8F0' }}>3D Water Volume</span>
            <input
              type="checkbox"
              checked={showWaterBodies}
              onChange={(e) => setShowWaterBodies(e.target.checked)}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ color: '#E2E8F0' }}>3D Intervention Pins</span>
            <input
              type="checkbox"
              checked={showInterventions}
              onChange={(e) => setShowInterventions(e.target.checked)}
            />
          </label>
        </div>

        {/* DEM Scientific Notice */}
        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #1E293B', fontSize: '0.7rem', color: '#94A3B8' }}>
          <div style={{ color: '#38BDF8', fontWeight: 600 }}>ISRO Cartosat-1 DEM</div>
          <div>Resolution: 30m &bull; Accuracy: &plusmn;8m</div>
          <div style={{ color: '#F59E0B', marginTop: '4px', fontSize: '0.65rem' }}>
            Note: DEM represents surface elevation, not submerged bed depth.
          </div>
        </div>
      </div>

      {/* Navigation Help HUD (Bottom Left) */}
      <div className="glass-panel" style={{
        position: 'absolute',
        bottom: '20px',
        left: '24px',
        zIndex: 100,
        padding: '8px 16px',
        fontSize: '0.75rem',
        color: '#94A3B8',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <span><strong style={{ color: '#F8FAFC' }}>Left Drag:</strong> Rotate Camera</span>
        <span><strong style={{ color: '#F8FAFC' }}>Scroll:</strong> Zoom</span>
        <span><strong style={{ color: '#06B6D4' }}>Cutaway Slider:</strong> Underground Slicing</span>
      </div>
    </div>
  );
};
