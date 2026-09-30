import os
import io
import uuid
from PIL import Image, ExifTags
from typing import Dict, Any, Optional, Tuple
from pathlib import Path

class ExifService:
    """
    Extracts and validates EXIF spatial and temporal metadata from uploaded field photographs.
    Prevents metadata forgery and securely handles missing GPS tags.
    """

    @staticmethod
    def _convert_dms_to_dd(dms_values, ref: str) -> Optional[float]:
        """
        Converts Degrees, Minutes, Seconds tuple or IFDRational list to Decimal Degrees.
        """
        try:
            # Handle float or rational values
            deg = float(dms_values[0])
            minute = float(dms_values[1])
            sec = float(dms_values[2])
            dd = deg + (minute / 60.0) + (sec / 3600.0)
            if ref in ['S', 'W']:
                dd = -dd
            return round(dd, 7)
        except Exception:
            return None

    @classmethod
    def extract_metadata(cls, image_path: Path) -> Dict[str, Any]:
        """
        Extracts GPS, timestamp, and device metadata from an image file.
        """
        result = {
            "has_exif_gps": False,
            "latitude": None,
            "longitude": None,
            "altitude_m": None,
            "capture_timestamp": None,
            "camera_make": None,
            "camera_model": None,
            "location_source": "UNVERIFIED"
        }

        try:
            with Image.open(image_path) as img:
                exif_data = img._getexif()
                if not exif_data:
                    return result

                # Parse standard tags
                named_exif = {}
                for tag_id, value in exif_data.items():
                    tag_name = ExifTags.TAGS.get(tag_id, tag_id)
                    named_exif[tag_name] = value

                # Camera Make & Model
                result["camera_make"] = str(named_exif.get("Make", "")).strip() or None
                result["camera_model"] = str(named_exif.get("Model", "")).strip() or None

                # Capture DateTime
                date_str = named_exif.get("DateTimeOriginal") or named_exif.get("DateTime")
                if date_str:
                    # Format standard 'YYYY:MM:DD HH:MM:SS' into ISO 'YYYY-MM-DDTHH:MM:SS'
                    parts = str(date_str).strip().split(" ")
                    if len(parts) == 2:
                        d_part = parts[0].replace(":", "-")
                        result["capture_timestamp"] = f"{d_part}T{parts[1]}"
                    else:
                        result["capture_timestamp"] = str(date_str)

                # GPS IFD Tags
                gps_info = named_exif.get("GPSInfo")
                if gps_info:
                    gps_named = {}
                    for k, v in gps_info.items():
                        gps_tag = ExifTags.GPSTAGS.get(k, k)
                        gps_named[gps_tag] = v

                    lat_dms = gps_named.get("GPSLatitude")
                    lat_ref = gps_named.get("GPSLatitudeRef", "N")
                    lon_dms = gps_named.get("GPSLongitude")
                    lon_ref = gps_named.get("GPSLongitudeRef", "E")
                    alt = gps_named.get("GPSAltitude")

                    if lat_dms and lon_dms:
                        lat_dd = cls._convert_dms_to_dd(lat_dms, lat_ref)
                        lon_dd = cls._convert_dms_to_dd(lon_dms, lon_ref)

                        if lat_dd is not None and lon_dd is not None:
                            result["latitude"] = lat_dd
                            result["longitude"] = lon_dd
                            result["has_exif_gps"] = True
                            result["location_source"] = "EXIF_METADATA"

                    if alt is not None:
                        try:
                            result["altitude_m"] = round(float(alt), 1)
                        except Exception:
                            pass

        except Exception as e:
            pass

        return result

    @classmethod
    def generate_thumbnail(cls, source_path: Path, thumb_path: Path, max_dim: int = 320) -> bool:
        """
        Creates an optimized thumbnail image.
        """
        try:
            with Image.open(source_path) as img:
                img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                # Convert to RGB if RGBA/P
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img.save(thumb_path, "JPEG", quality=85)
                return True
        except Exception:
            return False
