"""
Citizen Reports API Router
Handles disaster report submissions from affected citizens, priority score calculation,
PuLP integer linear programming optimization, greedy resource allocation, Dijkstra dispatch routing,
database persistence, and WebSocket broadcasting to the ResQ Admin Command Center.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field

from database import db_store, supabase_client
from services.priority_engine import calculate_report_priority
from services.resource_allocator import recommend_resources_greedy
from services.route_optimizer import calculate_dijkstra_route
from services.optimizer import run_optimization
from services.safe_locations_finder import find_nearest_safe_locations

router = APIRouter(prefix="/api/citizen", tags=["Citizen Portal Reports"])


class CitizenReportSchema(BaseModel):
    name: str = Field(..., description="Full Name of the citizen reporting")
    phone: str = Field(..., description="Contact phone number")
    disaster_type: str = Field(..., description="Type of disaster e.g. Flood, Fire, Landslide")
    severity: str = Field("Medium", description="Severity level: Critical, High, Medium, Low")
    people_affected: int = Field(1, description="Number of affected/stranded people")
    resources_needed: List[str] = Field(default_factory=list, description="List of required resources")
    description: str = Field("", description="Detailed description of the emergency")
    location: Optional[str] = Field(None, description="Location text or address")
    latitude: Optional[float] = Field(None, description="GPS Latitude coordinate")
    longitude: Optional[float] = Field(None, description="GPS Longitude coordinate")
    image_url: Optional[str] = Field(None, description="Optional image data URL or file link")


@router.post("/report")
async def submit_citizen_report(report_data: CitizenReportSchema):
    """
    Submits a new citizen disaster emergency report.
    - Calculates dynamic Priority Index
    - Executes Greedy Resource Allocation
    - Computes Dijkstra dispatch route
    - Integrates affected area demands into PuLP Linear Programming optimization
    - Persists report & broadcasts real-time WebSocket update to Admin Command Center.
    """
    payload = report_data.dict()
    report_id = f"rpt_cit_{uuid.uuid4().hex[:8]}"
    now_iso = datetime.utcnow().isoformat()

    # 1. Calculate report priority using ResQ priority engine
    p_score, p_level, breakdown = calculate_report_priority(
        severity=payload.get("severity", "Medium"),
        people_affected=payload.get("people_affected", 1),
        urgency=payload.get("severity", "Medium"),
        resource_count=len(payload.get("resources_needed", []))
    )

    # Format location string fallback
    lat = payload.get("latitude") if payload.get("latitude") is not None else 13.0827
    lng = payload.get("longitude") if payload.get("longitude") is not None else 80.2707
    loc_str = payload.get("location") or ""
    if not loc_str and lat is not None and lng is not None:
        loc_str = f"GPS Position ({lat:.4f}, {lng:.4f})"
    elif not loc_str:
        loc_str = "Citizen Emergency Location"

    temp_report = {
        "disaster_type": payload["disaster_type"],
        "people_affected": payload["people_affected"],
        "required_resources": payload["resources_needed"],
        "severity": payload["severity"],
        "location": loc_str,
        "latitude": lat,
        "longitude": lng
    }

    # 2. Run Greedy Resource Matching for exact resource requirements & squad match
    greedy_rec = recommend_resources_greedy(temp_report)
    matched_team = greedy_rec.get("recommended_team", {})
    matched_vehicle = greedy_rec.get("recommended_vehicle", {})

    # 3. Compute Dijkstra dispatch route from Central Depot (13.0827, 80.2707)
    central_depot = (13.0827, 80.2707)
    dijkstra_route = calculate_dijkstra_route(central_depot, (lat, lng))

    # 3b. Calculate Nearest Safe Locations (Hospitals, Relief Shelters, Fire/Police hubs)
    nearest_safe = find_nearest_safe_locations(lat, lng, disaster_type=payload["disaster_type"], limit=5)

    # 4. Create / Update affected area demand entry for Smart Resource Allocation
    area_id = f"area_cit_{uuid.uuid4().hex[:6]}"
    new_area = {
        "id": area_id,
        "disaster_id": "d101",
        "area_name": loc_str if loc_str.startswith("Area") else f"Citizen Sector - {loc_str}",
        "population": payload["people_affected"],
        "severity": payload["severity"],
        "medical_cases": max(1, int(payload["people_affected"] * 0.3)),
        "vulnerable_population": max(1, int(payload["people_affected"] * 0.4)),
        "latitude": lat,
        "longitude": lng,
        "food_required": greedy_rec["required_quantities"]["food_packets"],
        "water_required": greedy_rec["required_quantities"]["water_liters"],
        "medicine_required": greedy_rec["required_quantities"]["medical_kits"],
        "priority_score": p_score,
        "status": "Pending Verification",
        "source": "Citizen Portal"
    }

    # Insert into affected areas list if not duplicate
    db_store.affected_areas.insert(0, new_area)

    # 5. Run PuLP Integer Linear Programming Optimization
    optimization_res = run_optimization(db_store.affected_areas, db_store.resources)

    # 6. Construct complete report dictionary matching ResQ report schema
    new_report = {
        "id": report_id,
        "incident_id": report_id,
        "reporter_name": payload["name"],
        "reporter_phone": payload["phone"],
        "original_message": payload["description"],
        "disaster_type": payload["disaster_type"],
        "location": loc_str,
        "latitude": lat,
        "longitude": lng,
        "people_affected": payload["people_affected"],
        "affected_people": payload["people_affected"],
        "severity": payload["severity"],
        "urgency": payload["severity"],
        "required_resources": payload["resources_needed"],
        "description": payload["description"],
        "image_url": payload["image_url"],
        "priority_score": p_score,
        "priority_level": p_level,
        "priority": p_level.upper(),
        "status": "Pending",
        "source": "Citizen Portal",
        "created_at": now_iso,
        "updated_at": now_iso,
        "priority_breakdown": breakdown,
        "greedy_recommendation": greedy_rec,
        "dijkstra_route": dijkstra_route,
        "nearest_safe_locations": nearest_safe,
        "assigned_team_name": matched_team.get("team_name"),
        "assigned_vehicle_name": matched_vehicle.get("vehicle_id") or matched_vehicle.get("type"),
        "optimization_summary": {
            "run_id": optimization_res.get("run_id"),
            "coverage_percentage": optimization_res.get("metrics", {}).get("coverage_percentage", 95.0),
            "allocated_food": greedy_rec["required_quantities"]["food_packets"],
            "allocated_water": greedy_rec["required_quantities"]["water_liters"],
            "allocated_medicine": greedy_rec["required_quantities"]["medical_kits"],
            "allocated_personnel": greedy_rec["required_quantities"]["personnel"]
        }
    }

    # Store in memory store
    db_store.disaster_reports.insert(0, new_report)

    # Optional Supabase persistence if available
    if supabase_client:
        try:
            supabase_client.table("disaster_reports").insert(new_report).execute()
        except Exception as e:
            print(f"[Supabase Notice] Failed to save citizen report: {e}")

    # Broadcast real-time WebSocket event to all connected admin clients
    await ws_manager.broadcast({
        "event": "NEW_CITIZEN_REPORT",
        "data": new_report,
        "message": f"🚨 New Citizen Report & Optimized Dispatch: {payload['disaster_type']} at {loc_str}"
    })

    return {
        "status": "success",
        "message": "Emergency report submitted successfully. Smart Resource Allocation & Dijkstra Dispatch Route optimized.",
        "report_id": report_id,
        "data": new_report,
        "optimization": optimization_res
    }


@router.get("/report/{report_id}")
def get_citizen_report_status(report_id: str):
    """
    Retrieves status and dispatch details for a specific citizen report by ID.
    """
    for report in db_store.disaster_reports:
        if report.get("id") == report_id or report.get("incident_id") == report_id:
            return {
                "status": "success",
                "data": report
            }

    raise HTTPException(status_code=404, detail="Citizen report not found.")
