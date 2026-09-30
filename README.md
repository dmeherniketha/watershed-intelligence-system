# AI-Powered 3D Watershed Intelligence System

**Hackathon:** Smart India Hackathon 2026  
**Problem Statement ID:** SIH26015  
**Official Statement:** *"Application of Geospatial Techniques for Visualization and Analysis to Interpret Geo-Coded Images to Enhance Watershed Development Outcomes."*  
**Team Name:** INNOVAID  

---

## 1. Executive Summary & Core Capabilities

The **AI-Powered 3D Watershed Intelligence System** is an enterprise-grade, scientifically rigorous geospatial analytics and remote-sensing monitoring platform designed for watershed managers, geoscientists, field officers, and government authorities.

### Key Features:
1. **Interactive 2D GIS Map (Leaflet)**:
   - High-resolution multi-source basemaps (ESRI World Imagery Satellite, Topo Relief, Dark CartoDB).
   - Dynamic vector layers: Watershed boundaries, Strahler-classified drainage stream networks (Orders 1–4), Water bodies with bathymetry tags, Soil & water conservation interventions (Check dams, Gully plugs, Farm ponds, Percolation tanks), and Geo-tagged field photographs.
   - Interactive section line tool: draw arbitrary cross-sections directly on the map to sample the DEM elevation profile.
   - Coordinate and elevation tracker with real-time cursor sampling.

2. **True 3D Terrain & Subsurface Cutaway Viewer (WebGL / Three.js)**:
   - Real DEM-derived elevation mesh with hypsometric color ramps (valleys $\to$ terraced slopes $\to$ rocky ridges).
   - Full 360&deg; Orbit navigation (rotate, tilt, zoom, pan).
   - Interactive 3D Cutaway Slicing Plane: cross-sectional clipping slider exposing underground strata layers (weathered regolith, fractured rock, bedrock) and the saturated aquifer groundwater table.
   - 3D Water body volumes extruded at their true surface and bed elevations.
   - Vertical exaggeration slider ($1.0\times$ to $4.5\times$) with explicit factor labeling.

3. **Scientifically Accurate Elevation Profiles & Bathymetry**:
   - Cross-section elevation profile charts with distance ($m/km$), elevation ($m$), and slope ($\%$) axes.
   - **Strict Bathymetry Handling**:
     - For surveyed reservoirs (e.g., *Kandavara Minor Irrigation Reservoir*): dual-frequency acoustic soundings ($200\text{ kHz} / 33\text{ kHz}$), depth contours, IHO S-44 Order 1a standard, and storage volume calculation.
     - For unsurveyed water bodies: displays the mandatory honest fallback banner:
       > *"Bathymetry unavailable — underwater depth data is not available for this water body."*

4. **Geo-Tagged Field Evidence & EXIF Verification**:
   - Direct upload of field photographs with automated EXIF metadata extraction: GPS decimal coordinates, altitude, capture timestamp, and camera make/model.
   - Automatic classification of location provenance: `EXIF_METADATA`, `MANUAL_PIN`, or `UNVERIFIED`.
   - Manual map-pinning tool for photos lacking native GPS tags.
   - Complete verification lifecycle (`PENDING` $\to$ `VERIFIED` / `REJECTED`).

5. **Multi-Temporal Satellite Change Detection (Sentinel-2 & Bhuvan)**:
   - Pre-Monsoon vs. Post-Monsoon comparative split-screen slider.
   - Multispectral index computations:
     - **NDVI** (Normalized Difference Vegetation Index): $(NIR - Red) / (NIR + Red)$
     - **NDWI** (Normalized Difference Water Index): $(Green - NIR) / (Green + NIR)$
     - Color Infrared (CIR) & True Color (RGB).
   - Quantified metrics: Vegetation Expansion ($ha$), Water Spread Increase ($ha$), and Average Canopy Vigor Shift ($\%$).

6. **Human-In-The-Loop AI Vision Review**:
   - Computer vision model (`GeoWatershed-VisionNet-V2`, version `2.4.1`) for field photograph categorization.
   - Detects visual cues: masonry spillway alignment, chlorophyll canopy vigor, surface water absorption, and rill erosion.
   - Reviewer workbench: Accept Prediction, Submit Corrected Category, or Reject with auditor notes.

7. **Unified Monitoring Dashboard & Reporting**:
   - Executive KPIs, LULC composition, Intervention category breakdown, and data traceability matrix.
   - One-click exports for CSV datasets and standardized GeoJSON spatial layers.
   - Printable official audit report formatted for government submissions.

---

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Leaflet, Three.js, Lucide Icons, Recharts, Custom Glassmorphism CSS Design System.
- **Backend**: Python 3.14 / FastAPI, Uvicorn, SQLite3, NumPy, Pillow (PIL), Pydantic v2.
- **Geospatial & Remote Sensing Standards**: OGC GeoJSON (EPSG:4326), Cartosat-1 DEM, Sentinel-2 L2A BOA Multispectral Reflectance, IHO S-44 Hydrographic Survey Standard.

---

## 3. Getting Started & Startup Instructions

### Prerequisites
- Python $\ge$ 3.10
- Node.js $\ge$ 18 & npm $\ge$ 9

### Step 1: Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Step 3: Launch the Full-Stack Application
From the workspace root directory:
```bash
python run.py
```
Or start each service individually:
- **Backend API**: `cd backend && python -m uvicorn app.main:app --port 8000 --reload`
- **Frontend Client**: `cd frontend && npm run dev`

Open your browser at:
- **Frontend UI**: [http://localhost:5173](http://localhost:5173)
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 4. Running Automated Tests

Run the complete backend test suite:
```bash
python -m pytest backend/tests/test_api.py -v
```

To build and validate the frontend TypeScript bundle:
```bash
cd frontend
npm run build
```

---

## 5. Final Feature Status Table

| Feature / Module | Status | Verification Details |
| :--- | :---: | :--- |
| **2D GIS Interactive Map** | `IMPLEMENTED AND TESTED` | Multi-layer Leaflet GIS with Strahler drainage, water bodies, interventions, photo pins, and section line tool. |
| **3D Terrain & Subsurface Cutaway** | `IMPLEMENTED AND TESTED` | WebGL Three.js terrain mesh using DEM heightmaps, underground strata slicing plane, 3D water volume, and vertical exaggeration. |
| **DEM Elevation Profiling** | `IMPLEMENTED AND TESTED` | Continuous elevation sampling, slope %, and cross-section distance/elevation graphs. |
| **Hydrographic Bathymetry** | `IMPLEMENTED AND TESTED` | Dual-frequency acoustic soundings for surveyed tanks; strict honest disclaimer for unsurveyed tanks. |
| **Geo-Tagged Field Evidence** | `IMPLEMENTED AND TESTED` | EXIF GPS/date extraction, manual coordinate pinning, verification workflows, and thumbnail generation. |
| **Satellite Imagery & Change Detection** | `IMPLEMENTED AND TESTED` | Multi-temporal Sentinel-2 / Bhuvan comparison with split slider, NDVI/NDWI differencing, and biomass change metrics. |
| **AI Vision & Human-In-The-Loop** | `IMPLEMENTED AND TESTED` | Real computer vision inference, top-3 class scoring, visual feature extraction, and human accept/correct/reject review. |
| **Monitoring Dashboard** | `IMPLEMENTED AND TESTED` | Executive KPIs, LULC charts, intervention tracking, and data provenance matrix. |
| **Reporting & Spatial Exports** | `IMPLEMENTED AND TESTED` | Export CSV, Export GeoJSON, and printable official audit report preview. |
| **Security & Privacy** | `IMPLEMENTED AND TESTED` | Upload size limits, MIME type validation, PII sanitization from EXIF, and CORS configuration. |
