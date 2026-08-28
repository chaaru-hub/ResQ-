"""
Safe Locations Finder Service
Calculates real-time distances (Haversine formula) and estimated evacuation times
to nearest Hospitals, Relief Shelters, Fire Stations, and Emergency Hubs for reported disasters.
"""

import math
from typing import List, Dict, Any

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates geodesic distance between two GPS coordinates in kilometers."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


def find_nearest_safe_locations(latitude: float, longitude: float, disaster_type: str = "", limit: int = 6, safe_locations_list: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Ranks nearest safe facilities (Hospitals, Relief Shelters, Fire Stations)
    relative to a reported disaster or citizen emergency coordinate.
    """
    if safe_locations_list is None:
        from database import db_store
        safe_locations_list = db_store.safe_locations

    if not safe_locations_list:
        return []

    results = []
    d_type_lower = (disaster_type or "").lower()
    
    # Detect if incident requires priority medical/trauma care or structural rescue
    is_structural_or_medical = any(k in d_type_lower for k in [
        "building", "collapse", "medical", "injury", "fire", "explosion", "trauma", "accident", "trapped"
    ])

    for loc in safe_locations_list:
        loc_lat = loc.get("latitude", 13.0827)
        loc_lon = loc.get("longitude", 80.2707)
        dist_km = calculate_haversine_distance(latitude, longitude, loc_lat, loc_lon)
        
        # Est. emergency transit speed (~30 km/h)
        est_mins = max(1, round((dist_km / 30.0) * 60.0))
        
        facility_item = dict(loc)
        facility_item["distance_km"] = dist_km
        facility_item["estimated_time_mins"] = est_mins
        
        # Priority sorting weight: boost Hospital/Fire ranking for building collapse or medical emergencies
        sort_weight = dist_km
        if is_structural_or_medical and loc.get("facility_type") in ["Hospital", "Fire Station"]:
            sort_weight -= 0.6  # Give medical/fire hubs priority boost
            
        facility_item["_sort_weight"] = sort_weight
        results.append(facility_item)

    # Sort by weighted distance
    results.sort(key=lambda x: x["_sort_weight"])
    
    for item in results:
        item.pop("_sort_weight", None)

    return results[:limit]
