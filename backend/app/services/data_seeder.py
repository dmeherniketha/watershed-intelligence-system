import json
import uuid
import os
import math
from datetime import datetime
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from app.config import UPLOAD_DIR
from app.database import get_db

def create_sample_field_image(filepath: Path, title: str, subtitle: str, color_bg=(34, 139, 34)):
    """Creates a sample illustrative field evidence image with labels and textures."""
    img = Image.new("RGB", (640, 480), color_bg)
    draw = ImageDraw.Draw(img)

    # Draw sky and terrain texture
    draw.rectangle([0, 0, 640, 160], fill=(135, 206, 235)) # Sky
    draw.polygon([(0, 240), (200, 140), (450, 180), (640, 130), (640, 480), (0, 480)], fill=color_bg)
    
    # Draw water or masonry structure
    if "Check Dam" in title or "Structure" in title:
        draw.rectangle([180, 220, 460, 360], fill=(169, 169, 169)) # Concrete wall
        draw.polygon([(240, 260), (400, 260), (420, 380), (220, 380)], fill=(70, 130, 180)) # Water spillway
        draw.line([180, 220, 460, 220], fill=(220, 220, 220), width=4)
    elif "Pond" in title or "Tank" in title:
        draw.ellipse([120, 220, 520, 440], fill=(64, 164, 223), outline=(139, 69, 19), width=8)
    elif "Erosion" in title:
        for offset in [0, 40, 90]:
            draw.line([(280 + offset, 160), (250 + offset, 460)], fill=(101, 67, 33), width=16)

    # Add info overlay banner
    draw.rectangle([0, 410, 640, 480], fill=(0, 0, 0, 180))
    draw.text((20, 420), f"[FIELD EVIDENCE] {title}", fill=(255, 255, 255))
    draw.text((20, 445), f"Geo-Tag: {subtitle}", fill=(200, 240, 200))

    img.save(filepath, "JPEG", quality=90)


def seed_database():
    conn = get_db()
    cursor = conn.cursor()

    # Check if already seeded
    cursor.execute("SELECT COUNT(*) FROM watersheds")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return

    now = datetime.now().isoformat()

    # 1. Watersheds
    watersheds_data = [
        {
            "id": "WTR-KA-001",
            "name": "Chitravathi Sub-Basin Catchment 4B2A5",
            "state": "Karnataka",
            "district": "Chikkaballapur / Kolar",
            "sub_basin": "Chitravathi River Basin",
            "area_sq_km": 142.8,
            "perimeter_km": 58.4,
            "avg_slope_pct": 6.4,
            "elevation_min_m": 682.0,
            "elevation_max_m": 894.0,
            "crs": "EPSG:4326",
            "center_lat": 13.4325,
            "center_lon": 77.7280,
            "bounding_box": json.dumps([77.6500, 13.3600, 77.8100, 13.5100]),
            "boundary_geojson": json.dumps({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [77.6500, 13.4100], [77.6800, 13.4800], [77.7400, 13.5100],
                        [77.8000, 13.4700], [77.8100, 13.4000], [77.7700, 13.3600],
                        [77.6900, 13.3700], [77.6500, 13.4100]
                    ]]
                },
                "properties": {"name": "Chitravathi 4B2A5 Catchment Boundary", "area_ha": 14280.0}
            }),
            "drainage_geojson": json.dumps({
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [77.6900, 13.4900], [77.7150, 13.4550], [77.7280, 13.4325],
                                [77.7450, 13.4000], [77.7700, 13.3750]
                            ]
                        },
                        "properties": {"stream_order": 4, "name": "Main Chitravathi Stream", "length_km": 18.2}
                    },
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [77.6650, 13.4400], [77.6950, 13.4380], [77.7280, 13.4325]
                            ]
                        },
                        "properties": {"stream_order": 2, "name": "Gopalapura Tributary Rill", "length_km": 7.4}
                    },
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [77.7850, 13.4600], [77.7600, 13.4400], [77.7280, 13.4325]
                            ]
                        },
                        "properties": {"stream_order": 3, "name": "Nandi Valley Secondary Stream", "length_km": 9.1}
                    }
                ]
            }),
            "lu_lc_summary": json.dumps({
                "Agricultural Crop Land": "52.4%",
                "Scrub & Deciduous Forest": "23.1%",
                "Plantation & Agroforestry": "12.8%",
                "Water Bodies & Wetlands": "6.2%",
                "Built-up & Rural Settlement": "5.5%"
            }),
            "created_at": now,
            "data_source": "Karnataka State Remote Sensing Applications Centre (KSRSAC) & Survey of India Toposheets (1:50000)",
            "data_provenance": "Delineated using Cartosat-1 DEM Hydro-processing with D8 flow direction algorithm."
        },
        {
            "id": "WTR-MH-002",
            "name": "Ghod River Micro-Catchment 4D3C2",
            "state": "Maharashtra",
            "district": "Pune / Ahmednagar",
            "sub_basin": "Bhima Sub-Basin",
            "area_sq_km": 98.4,
            "perimeter_km": 44.2,
            "avg_slope_pct": 8.2,
            "elevation_min_m": 542.0,
            "elevation_max_m": 768.0,
            "crs": "EPSG:4326",
            "center_lat": 18.8450,
            "center_lon": 74.1250,
            "bounding_box": json.dumps([74.0500, 18.7800, 74.2000, 18.9100]),
            "boundary_geojson": json.dumps({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [74.0500, 18.8300], [74.0800, 18.8900], [74.1600, 18.9100],
                        [74.2000, 18.8600], [74.1800, 18.7900], [74.1100, 18.7800],
                        [74.0500, 18.8300]
                    ]]
                },
                "properties": {"name": "Ghod 4D3C2 Micro-Catchment Boundary", "area_ha": 9840.0}
            }),
            "drainage_geojson": json.dumps({
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [74.0800, 18.8900], [74.1100, 18.8650], [74.1250, 18.8450], [74.1650, 18.8000]
                            ]
                        },
                        "properties": {"stream_order": 3, "name": "Ghod Main Tributary", "length_km": 14.3}
                    }
                ]
            }),
            "lu_lc_summary": json.dumps({
                "Kharif / Rabi Farmland": "48.2%",
                "Fallow & Wastelands": "28.6%",
                "Dense Scrub / Ridge": "14.2%",
                "Surface Water Spread": "5.4%",
                "Settlements": "3.6%"
            }),
            "created_at": now,
            "data_source": "Maharashtra Remote Sensing Applications Centre (MRSAC)",
            "data_provenance": "SRTM v3 30m hydrological flow network corrected with Sentinel-2 L2A high water marks."
        }
    ]

    for w in watersheds_data:
        cursor.execute("""
        INSERT INTO watersheds VALUES (
            :id, :name, :state, :district, :sub_basin, :area_sq_km, :perimeter_km,
            :avg_slope_pct, :elevation_min_m, :elevation_max_m, :crs, :center_lat, :center_lon,
            :bounding_box, :boundary_geojson, :drainage_geojson, :lu_lc_summary, :created_at,
            :data_source, :data_provenance
        )
        """, w)

    # 2. Water Bodies (One WITH real bathymetry, One WITHOUT)
    water_bodies_data = [
        {
            "id": "WB-KA-01",
            "watershed_id": "WTR-KA-001",
            "name": "Kandavara Minor Irrigation Reservoir",
            "water_type": "Irrigation Tank / Reservoir",
            "surface_area_ha": 46.8,
            "surface_elevation_m": 718.5,
            "center_lat": 13.4380,
            "center_lon": 77.7340,
            "boundary_geojson": json.dumps({
                "type": "Polygon",
                "coordinates": [[
                    [77.7280, 13.4350], [77.7310, 13.4420], [77.7390, 13.4440],
                    [77.7420, 13.4380], [77.7360, 13.4320], [77.7280, 13.4350]
                ]]
            }),
            "bathymetry_available": 1, # Real bathymetry available!
            "max_measured_depth_m": 5.4,
            "avg_measured_depth_m": 2.85,
            "storage_capacity_m3": 1180000.0,
            "survey_date": "2024-05-18",
            "vertical_datum": "WGS84 EGM2008 / MSL",
            "survey_method": "Dual-Frequency Hydrographic Echo Sounder (200kHz/33kHz) with Trimble RTK-DGPS Base",
            "quality_assessment": "Class-1 Hydrographic Survey Standard (IHO S-44 Order 1a)",
            "created_at": now
        },
        {
            "id": "WB-KA-02",
            "watershed_id": "WTR-KA-001",
            "name": "Gopalapura Community Percolation Tank",
            "water_type": "Percolation Tank",
            "surface_area_ha": 14.2,
            "surface_elevation_m": 732.0,
            "center_lat": 13.4560,
            "center_lon": 77.6980,
            "boundary_geojson": json.dumps({
                "type": "Polygon",
                "coordinates": [[
                    [77.6940, 13.4540], [77.6960, 13.4590], [77.7020, 13.4580],
                    [77.7010, 13.4530], [77.6940, 13.4540]
                ]]
            }),
            "bathymetry_available": 0, # NO bathymetry available -> Must trigger honest fallback
            "max_measured_depth_m": None,
            "avg_measured_depth_m": None,
            "storage_capacity_m3": None,
            "survey_date": None,
            "vertical_datum": None,
            "survey_method": None,
            "quality_assessment": "Unsurveyed — Depth soundings pending",
            "created_at": now
        }
    ]

    for wb in water_bodies_data:
        cursor.execute("""
        INSERT INTO water_bodies VALUES (
            :id, :watershed_id, :name, :water_type, :surface_area_ha, :surface_elevation_m,
            :center_lat, :center_lon, :boundary_geojson, :bathymetry_available,
            :max_measured_depth_m, :avg_measured_depth_m, :storage_capacity_m3,
            :survey_date, :vertical_datum, :survey_method, :quality_assessment, :created_at
        )
        """, wb)

    # 3. Bathymetric Soundings for Kandavara Reservoir (WB-KA-01)
    soundings = [
        ("BS-01", "WB-KA-01", 13.4380, 77.7340, 5.40, 713.10, 0.05, 1, "Acoustic 200kHz"),
        ("BS-02", "WB-KA-01", 13.4370, 77.7325, 4.85, 713.65, 0.05, 1, "Acoustic 200kHz"),
        ("BS-03", "WB-KA-01", 13.4390, 77.7355, 4.20, 714.30, 0.05, 1, "Acoustic 200kHz"),
        ("BS-04", "WB-KA-01", 13.4360, 77.7310, 3.10, 715.40, 0.05, 1, "Acoustic 200kHz"),
        ("BS-05", "WB-KA-01", 13.4405, 77.7370, 2.70, 715.80, 0.05, 1, "Acoustic 200kHz"),
        ("BS-06", "WB-KA-01", 13.4350, 77.7295, 1.40, 717.10, 0.05, 1, "Lead-line calibration"),
        ("BS-07", "WB-KA-01", 13.4420, 77.7390, 0.90, 717.60, 0.05, 1, "Lead-line calibration")
    ]
    cursor.executemany("""
    INSERT INTO bathymetry_soundings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, soundings)

    # 4. Watershed Interventions
    interventions = [
        ("INT-01", "WTR-KA-001", "Check Dam CD-01 (Masonry)", "Check Dam", "Completed", 2022, "Minor Irrigation & Watershed Dept", 13.4425, 77.7210, 724.5, "Width 18m, Height 2.4m", 14500.0, 38.5, now),
        ("INT-02", "WTR-KA-001", "Check Dam CD-02 (Boulder)", "Check Dam", "Completed", 2023, "District Watershed Cell", 13.4310, 77.7420, 710.0, "Width 12m, Height 1.8m", 8200.0, 22.0, now),
        ("INT-03", "WTR-KA-001", "Gully Control Structure GP-04", "Gully Plug", "Completed", 2023, "MGNREGA / Watershed", 13.4610, 77.6920, 755.0, "Boulder Gabion 6m x 1.2m", 2100.0, 8.4, now),
        ("INT-04", "WTR-KA-001", "Community Farm Pond FP-07", "Farm Pond", "Completed", 2024, "PMKSY-WDC", 13.4250, 77.7080, 738.0, "20m x 20m x 3m (Unlined)", 1200.0, 4.5, now),
        ("INT-05", "WTR-KA-001", "Percolation Recharge Basin PT-02", "Percolation Tank", "Completed", 2021, "Groundwater Authority", 13.4560, 77.6980, 732.0, "Bund Length 140m", 65000.0, 64.0, now),
        ("INT-06", "WTR-KA-001", "Ridge Afforestation Zone AF-01", "Afforestation", "In Progress", 2024, "Forest Department", 13.4850, 77.7120, 815.0, "8,500 Native Saplings", None, 18.0, now)
    ]
    cursor.executemany("""
    INSERT INTO interventions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, interventions)

    # 5. Create Sample Field Photos in UPLOAD_DIR and seed database
    photo_samples = [
        ("FP-001", "WTR-KA-001", None, "INT-01", "field_photo_cd01.jpg", 13.4425, 77.7210, 724.5, "2024-07-12T10:30:00", 1, "EXIF_METADATA", "Canon EOS 1500D", "Structure Inspection", "Check Dam CD-01 masonry spillway in excellent condition after monsoon recharge. No crest fractures.", "VERIFIED", "Dr. A. Sharma (Geologist)", "2024-07-15T14:00:00", (100, 110, 115), "Check Dam Structure CD-01", "Lat: 13.4425 N, Lon: 77.7210 E"),
        ("FP-002", "WTR-KA-001", "WB-KA-01", None, "field_photo_kandavara.jpg", 13.4380, 77.7340, 718.5, "2024-07-12T11:15:00", 1, "EXIF_METADATA", "Samsung Galaxy S22", "Water Level", "Kandavara minor irrigation tank surface storage reaching 85% FTL level.", "VERIFIED", "R. Gowda (AE Watershed)", "2024-07-15T14:10:00", (50, 120, 180), "Kandavara Reservoir Storage", "Lat: 13.4380 N, Lon: 77.7340 E"),
        ("FP-003", "WTR-KA-001", None, "INT-04", "field_photo_farmpond.jpg", 13.4250, 77.7080, 738.0, "2024-08-04T09:20:00", 1, "EXIF_METADATA", "Xiaomi Redmi Note 12", "Structure Inspection", "Farm Pond FP-07 harvesting surface runoff. Silt trap operational.", "PENDING", None, None, (70, 140, 120), "Farm Pond FP-07 Harvesting", "Lat: 13.4250 N, Lon: 77.7080 E"),
        ("FP-004", "WTR-KA-001", None, None, "field_photo_gully_erosion.jpg", 13.4720, 77.7010, 782.0, "2024-08-10T15:45:00", 1, "EXIF_METADATA", "Nikon D3500", "Soil Erosion", "Active rill and gully scour on untreated upper ridge slopes. Recommending vegetative loose boulder checks.", "VERIFIED", "K. Rao (Agronomist)", "2024-08-12T10:00:00", (160, 90, 50), "Active Gully Scour Erosion", "Lat: 13.4720 N, Lon: 77.7010 E"),
        ("FP-005", "WTR-KA-001", None, None, "field_photo_unverified_sample.jpg", None, None, None, "2024-08-18T16:00:00", 0, "UNVERIFIED", "Motorola G84", "Vegetation Health", "Social forestry sapling plantation along contour line. GPS receiver was disabled during capture.", "PENDING", None, None, (34, 139, 34), "Afforestation Sapling Row", "GPS: Unavailable (Unverified)")
    ]

    for p in photo_samples:
        pid, wid, wbid, intid, fname, lat, lon, alt, tstamp, has_gps, loc_src, cam, cat, desc, vstat, vby, vat, col, t_title, t_sub = p
        
        fpath = UPLOAD_DIR / fname
        thumb_path = UPLOAD_DIR / f"thumb_{fname}"
        create_sample_field_image(fpath, t_title, t_sub, col)
        create_sample_field_image(thumb_path, t_title, "Thumb", col)
        fsize = fpath.stat().st_size

        cursor.execute("""
        INSERT INTO field_photos VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        """, (
            pid, wid, wbid, intid, fname, str(fpath), str(thumb_path), fsize, "image/jpeg",
            1 if has_gps else 0, lat, lon, alt, tstamp, 0 if has_gps else 1, loc_src, cam, cam,
            cat, desc, "Field Surveyor Team INNOVAID", vstat, vby, vat,
            "Valid photographic evidence with EXIF validation" if vstat == "VERIFIED" else None,
            now
        ))

        # Seed AI prediction for each photo
        pred_class = "Check Dam (Masonry/Earthen)" if "Check Dam" in t_title else (
            "Farm Pond / Water Harvesting Tank" if "Farm Pond" in t_title else (
                "Active Soil Erosion / Gully Scour" if "Erosion" in t_title else (
                    "Percolation Tank / Recharge Basin" if "Reservoir" in t_title else "Afforestation / Riparian Buffer"
                )
            )
        )
        confidence = 0.94 if vstat == "VERIFIED" else 0.88
        all_scores = json.dumps([
            {"label": pred_class, "score": confidence},
            {"label": "Gully Plug / Boulder Check", "score": round((1.0 - confidence) * 0.6, 3)},
            {"label": "Siltation / Reservoir Sedimentation", "score": round((1.0 - confidence) * 0.4, 3)}
        ])
        features = json.dumps(["Visible masonry stone structure", "Spillway apron clear of debris", "Water retention verified"])

        cursor.execute("""
        INSERT INTO ai_predictions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"AIP-{pid}", pid, "GeoWatershed-VisionNet-V2", "2.4.1", pred_class, confidence,
            all_scores, features, now, "ACCEPTED" if vstat == "VERIFIED" else "PENDING",
            None, vby, vat, "Confirmed by field inspection" if vstat == "VERIFIED" else None
        ))

    # 6. Satellite Scenes (Pre-Monsoon & Post-Monsoon)
    scenes = [
        ("SCENE-2024-T1", "WTR-KA-001", "Sentinel-2B MSI (Level-2A BOA)", "2024-03-24", 2.1, 10.0, "EPSG:4326", None, None, None, "ESA Copernicus / ISRO Bhuvan", 1, now),
        ("SCENE-2024-T2", "WTR-KA-001", "Sentinel-2A MSI (Level-2A BOA)", "2024-10-18", 3.4, 10.0, "EPSG:4326", None, None, None, "ESA Copernicus / ISRO Bhuvan", 1, now)
    ]
    cursor.executemany("""
    INSERT INTO satellite_scenes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, scenes)

    # 7. Change Analysis between T1 and T2
    cursor.execute("""
    INSERT INTO change_analyses VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "CA-2024-01", "WTR-KA-001", "SCENE-2024-T1", "SCENE-2024-T2", "NDVI_VEGETATION",
        "Top-of-Atmosphere Sen2Cor Reflectance Differencing (delta_NDVI > +0.15)",
        184.5, 26.2, 38.2, 94.8, 56.6, 91.4,
        "Atmospheric mask applied. Natural monsoon phenology partially contributes to biomass boost in non-irrigated zones.",
        now
    ))

    conn.commit()
    conn.close()
