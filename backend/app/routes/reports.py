import json
import csv
import io
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Response
from typing import Optional
from app.database import get_db

router = APIRouter(prefix="/api/reports", tags=["Reports & Exports"])

@router.get("/export/csv")
def export_watershed_csv(watershed_id: str = Query(...)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM interventions WHERE watershed_id = ?", (watershed_id,))
    rows = cursor.fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Intervention ID", "Name", "Category", "Status", "Sanctioned Year",
        "Agency", "Latitude", "Longitude", "Elevation (m)", "Dimensions",
        "Storage Boost (m3)", "Beneficiary Area (ha)"
    ])

    for r in rows:
        writer.writerow([
            r["id"], r["name"], r["category"], r["status"], r["sanctioned_year"],
            r["implementing_agency"], r["latitude"], r["longitude"], r["elevation_m"],
            r["dimension_spec"], r["storage_boost_m3"], r["beneficiary_area_ha"]
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=Watershed_{watershed_id}_Interventions.csv"}
    )

@router.get("/export/geojson")
def export_watershed_geojson(watershed_id: str = Query(...)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM watersheds WHERE id = ?", (watershed_id,))
    w_row = cursor.fetchone()
    if not w_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Watershed not found")

    cursor.execute("SELECT * FROM interventions WHERE watershed_id = ?", (watershed_id,))
    int_rows = cursor.fetchall()

    cursor.execute("SELECT * FROM water_bodies WHERE watershed_id = ?", (watershed_id,))
    wb_rows = cursor.fetchall()
    conn.close()

    features = []

    # Watershed boundary feature
    w_geom = json.loads(w_row["boundary_geojson"])["geometry"]
    features.append({
        "type": "Feature",
        "geometry": w_geom,
        "properties": {
            "entity": "Watershed Boundary",
            "id": w_row["id"],
            "name": w_row["name"],
            "area_sq_km": w_row["area_sq_km"],
            "state": w_row["state"],
            "district": w_row["district"]
        }
    })

    # Water bodies
    for wb in wb_rows:
        wb_geom = json.loads(wb["boundary_geojson"])
        features.append({
            "type": "Feature",
            "geometry": wb_geom,
            "properties": {
                "entity": "Water Body",
                "id": wb["id"],
                "name": wb["name"],
                "type": wb["water_type"],
                "bathymetry_available": bool(wb["bathymetry_available"]),
                "surface_area_ha": wb["surface_area_ha"]
            }
        })

    # Interventions
    for i in int_rows:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [i["longitude"], i["latitude"]]
            },
            "properties": {
                "entity": "Intervention",
                "id": i["id"],
                "name": i["name"],
                "category": i["category"],
                "status": i["status"],
                "storage_boost_m3": i["storage_boost_m3"]
            }
        })

    geojson_doc = {
        "type": "FeatureCollection",
        "name": f"Watershed_{watershed_id}_Spatial_Dataset",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": features
    }

    return Response(
        content=json.dumps(geojson_doc, indent=2),
        media_type="application/geo+json",
        headers={"Content-Disposition": f"attachment; filename=Watershed_{watershed_id}_GIS_Layers.geojson"}
    )
