"""
Resource Allocator Engine using Greedy Algorithm
Matches verified disaster reports with available rescue squads, vehicles, and medical teams.
"""

import uuid
from typing import Dict, Any, List, Optional
from database import db_store
from services.route_optimizer import calculate_dijkstra_route

def recommend_resources_greedy(report: Dict[str, Any]) -> Dict[str, Any]:
    """
    Greedy Algorithm for Smart Resource Allocation:
    Selects best available rescue team, vehicle, and supplies based on disaster type,
    people affected, required resources, and proximity/availability.
    """
    disaster_type = report.get("disaster_type", "Flood")
    pop = report.get("people_affected", 8)
    req_resources = report.get("required_resources", [])

    # Calculate quantities required
    req_personnel = max(2, min(20, int(pop * 0.5) if pop > 0 else 4))
    req_food = max(20, pop * 10)
    req_water = max(30, pop * 15)
    req_medical = max(10, pop * 2)

    # 1. Greedy match for Rescue Squad
    available_teams = [t for t in db_store.rescue_teams if t.get("status") == "Available"]
    matched_team = None
    
    # Priority match by specialization keyword
    if "Fire" in disaster_type:
        matched_team = next((t for t in available_teams if "Fire" in t.get("specialization", "")), None)
    elif "Medical" in str(req_resources) or "Medical Emergency" in disaster_type:
        matched_team = next((t for t in available_teams if "Medical" in t.get("specialization", "")), None)
    elif "Flood" in disaster_type or "Cyclone" in disaster_type:
        matched_team = next((t for t in available_teams if "Evacuation" in t.get("specialization", "") or "Rescue" in t.get("specialization", "")), None)

    if not matched_team and available_teams:
        matched_team = available_teams[0]

    # 2. Greedy match for Vehicle
    available_vehicles = [v for v in db_store.vehicles if v.get("status") == "Available"]
    matched_vehicle = None

    if "Flood" in disaster_type:
        matched_vehicle = next((v for v in available_vehicles if "Boat" in v.get("type", "")), None)
    elif "Fire" in disaster_type:
        matched_vehicle = next((v for v in available_vehicles if "Fire" in v.get("type", "") or "Truck" in v.get("type", "")), None)
    elif "Medical" in str(req_resources) or "Ambulance" in str(req_resources):
        matched_vehicle = next((v for v in available_vehicles if "Ambulance" in v.get("type", "")), None)

    if not matched_vehicle and available_vehicles:
        matched_vehicle = available_vehicles[0]

    return {
        "required_quantities": {
            "personnel": req_personnel,
            "food_packets": req_food,
            "water_liters": req_water,
            "medical_kits": req_medical
        },
        "recommended_team": matched_team or {
            "id": "t_default",
            "team_name": "Rescue Squad Alpha (Standard)",
            "leader": "Capt. R. Sharma",
            "members": req_personnel,
            "specialization": "General Disaster Response"
        },
        "recommended_vehicle": matched_vehicle or {
            "id": "v_default",
            "vehicle_id": "RESCUE-BOAT-02",
            "type": "Rescue Boat / Amphibious Craft",
            "driver": "Sgt. K. Vijay",
            "capacity": max(10, pop)
        }
    }


def process_report_verification(report: Dict[str, Any]) -> Dict[str, Any]:
    """
    Verifies a WhatsApp disaster report and feeds it into the core resource allocation pipeline.
    Executes Greedy Resource Matching and Dijkstra Route Optimization.
    """
    area_id = f"a_wa_{uuid.uuid4().hex[:6]}"
    area_name = report.get("location") or "Unspecified Location"
    if not area_name.startswith("Area"):
        area_name = f"Area WA - {area_name}"

    lat = report.get("latitude") or 12.9229
    lng = report.get("longitude") or 80.1275
    pop = report.get("people_affected") or 8
    sev = report.get("severity") or "Critical"
    p_score = report.get("priority_score") or 91.0

    # 1. Run Greedy Allocation Algorithm
    recommendation = recommend_resources_greedy(report)
    matched_team = recommendation["recommended_team"]
    matched_vehicle = recommendation["recommended_vehicle"]

    # 2. Add verified area into affected_areas
    new_area = {
        "id": area_id,
        "disaster_id": "d101",
        "area_name": area_name,
        "population": pop,
        "severity": sev,
        "medical_cases": int(pop * 0.25),
        "vulnerable_population": int(pop * 0.35),
        "latitude": lat,
        "longitude": lng,
        "food_required": recommendation["required_quantities"]["food_packets"],
        "water_required": recommendation["required_quantities"]["water_liters"],
        "medicine_required": recommendation["required_quantities"]["medical_kits"],
        "priority_score": p_score,
        "status": "Verified",
        "source": "WhatsApp Report"
    }

    db_store.affected_areas.insert(0, new_area)

    # 3. Compute Dijkstra dispatch route from Central Hub (13.0827, 80.2707) to disaster location
    central_depot = (13.0827, 80.2707)
    incident_coords = (lat, lng)
    dijkstra_route = calculate_dijkstra_route(central_depot, incident_coords)

    # Update assigned team status if found
    if matched_team and matched_team.get("id"):
        for t in db_store.rescue_teams:
            if t["id"] == matched_team["id"]:
                t["status"] = "Assigned"
                t["assigned_area_name"] = area_name

    return {
        "status": "Success",
        "message": f"Report verified via Greedy Algorithm. Incident '{area_name}' queued for dispatch.",
        "area": new_area,
        "greedy_recommendation": recommendation,
        "dijkstra_route": dijkstra_route
    }
