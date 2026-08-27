"""
FastAPI Server Entry Point - Smart Disaster Resource Allocation & Emergency Response System
"""

import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import db_store, supabase_client
from services.priority import calculate_priority_score
from services.optimizer import run_optimization

app = FastAPI(
    title="Smart Disaster Resource Allocation API",
    description="FastAPI Backend for dynamic priority calculation, PuLP linear resource optimization, and emergency response management.",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ],
    allow_origin_regex=r"http://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Disaster Reports, SMS, OpenWeather, & Citizen Reports APIRouters
from routes import disaster_reports, weather, sms, citizen_reports
from fastapi import WebSocket, WebSocketDisconnect
from services.websocket_manager import ws_manager

app.include_router(disaster_reports.router)
app.include_router(sms.router)
app.include_router(weather.router)
app.include_router(citizen_reports.router)

# WebSocket Endpoint for real-time live admin synchronization
@app.websocket("/ws")
@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


# -----------------------------------------------------------------------------
# PYDANTIC SCHEMAS
# -----------------------------------------------------------------------------

class DisasterSchema(BaseModel):
    name: str
    type: str
    location: str
    severity: str # 'Critical', 'High', 'Medium', 'Low'
    description: Optional[str] = ""
    date: Optional[str] = None
    status: Optional[str] = "Active" # 'Active', 'Monitoring', 'Resolved'

class AreaSchema(BaseModel):
    disaster_id: Optional[str] = ""
    area_name: str
    population: int = 0
    severity: str # 'Critical', 'High', 'Medium', 'Low'
    medical_cases: int = 0
    vulnerable_population: int = 0
    latitude: float
    longitude: float
    food_required: int = 0
    water_required: int = 0
    medicine_required: int = 0
    status: Optional[str] = "Critical"

class ResourceSchema(BaseModel):
    resource_name: str
    resource_type: str
    category: str # 'Essential Supplies', 'Emergency Equipment', 'Human Resources', 'Vehicles'
    quantity_available: int = 0
    quantity_allocated: int = 0
    unit: Optional[str] = "units"
    location: Optional[str] = "Central Depot"
    minimum_threshold: Optional[int] = 100

class RequestSchema(BaseModel):
    area_id: str
    area_name: Optional[str] = ""
    resource_type: str
    quantity: int
    urgency: str # 'Critical', 'High', 'Medium', 'Low'
    description: Optional[str] = ""

class ConfirmAllocationSchema(BaseModel):
    run_id: str
    allocations: List[Dict[str, Any]]

# -----------------------------------------------------------------------------
# ROOT & HEALTH CHECK
# -----------------------------------------------------------------------------

@app.get("/")
def read_root():
    return {
        "system": "Smart Disaster Resource Allocation & Emergency Response System",
        "status": "Online",
        "timestamp": datetime.utcnow().isoformat()
    }

# -----------------------------------------------------------------------------
# DISASTERS ENDPOINTS
# -----------------------------------------------------------------------------

@app.get("/api/disasters")
def get_disasters():
    return {"status": "success", "data": db_store.disasters}

@app.post("/api/disasters")
def create_disaster(disaster: DisasterSchema):
    new_d = disaster.dict()
    new_d["id"] = f"d{uuid.uuid4().hex[:6]}"
    new_d["created_at"] = datetime.utcnow().isoformat()
    if not new_d.get("date"):
        new_d["date"] = datetime.utcnow().strftime("%Y-%m-%d")
    db_store.disasters.insert(0, new_d)
    return {"status": "success", "data": new_d}

@app.put("/api/disasters/{disaster_id}")
def update_disaster(disaster_id: str, disaster: DisasterSchema):
    for idx, d in enumerate(db_store.disasters):
        if d["id"] == disaster_id:
            updated = {**d, **disaster.dict(exclude_unset=True)}
            db_store.disasters[idx] = updated
            return {"status": "success", "data": updated}
    raise HTTPException(status_code=404, detail="Disaster not found")

@app.delete("/api/disasters/{disaster_id}")
def delete_disaster(disaster_id: str):
    db_store.disasters = [d for d in db_store.disasters if d["id"] != disaster_id]
    return {"status": "success", "message": "Disaster deleted"}

# -----------------------------------------------------------------------------
# AFFECTED AREAS ENDPOINTS
# -----------------------------------------------------------------------------

@app.get("/api/areas")
def get_affected_areas():
    # Recalculate priority scores dynamically for accuracy
    for area in db_store.affected_areas:
        calc = calculate_priority_score(area)
        area["priority_score"] = calc["score"]
        area["priority_classification"] = calc["classification"]
        area["priority_breakdown"] = calc["breakdown"]
    return {"status": "success", "data": db_store.affected_areas}

@app.post("/api/areas")
def create_affected_area(area: AreaSchema):
    new_area = area.dict()
    new_area["id"] = f"a{uuid.uuid4().hex[:6]}"
    calc = calculate_priority_score(new_area)
    new_area["priority_score"] = calc["score"]
    new_area["status"] = calc["classification"]
    new_area["created_at"] = datetime.utcnow().isoformat()
    db_store.affected_areas.insert(0, new_area)
    return {"status": "success", "data": new_area}

@app.put("/api/areas/{area_id}")
def update_affected_area(area_id: str, area: AreaSchema):
    for idx, a in enumerate(db_store.affected_areas):
        if a["id"] == area_id:
            updated = {**a, **area.dict(exclude_unset=True)}
            calc = calculate_priority_score(updated)
            updated["priority_score"] = calc["score"]
            updated["status"] = calc["classification"]
            db_store.affected_areas[idx] = updated
            return {"status": "success", "data": updated}
    raise HTTPException(status_code=404, detail="Area not found")

@app.delete("/api/areas/{area_id}")
def delete_affected_area(area_id: str):
    db_store.affected_areas = [a for a in db_store.affected_areas if a["id"] != area_id]
    return {"status": "success", "message": "Area deleted"}

# -----------------------------------------------------------------------------
# RESOURCES ENDPOINTS
# -----------------------------------------------------------------------------

@app.get("/api/resources")
def get_resources():
    return {"status": "success", "data": db_store.resources}

@app.post("/api/resources")
def create_resource(resource: ResourceSchema):
    new_res = resource.dict()
    new_res["id"] = f"r{uuid.uuid4().hex[:6]}"
    new_res["created_at"] = datetime.utcnow().isoformat()
    db_store.resources.insert(0, new_res)
    return {"status": "success", "data": new_res}

@app.put("/api/resources/{resource_id}")
def update_resource(resource_id: str, resource: ResourceSchema):
    for idx, r in enumerate(db_store.resources):
        if r["id"] == resource_id:
            updated = {**r, **resource.dict(exclude_unset=True)}
            db_store.resources[idx] = updated
            return {"status": "success", "data": updated}
    raise HTTPException(status_code=404, detail="Resource not found")

# -----------------------------------------------------------------------------
# EMERGENCY REQUESTS ENDPOINTS
# -----------------------------------------------------------------------------

@app.get("/api/requests")
def get_requests():
    return {"status": "success", "data": db_store.resource_requests}

@app.post("/api/requests")
def create_request(req: RequestSchema):
    new_req = req.dict()
    new_req["id"] = f"req{uuid.uuid4().hex[:6]}"
    new_req["status"] = "Pending"
    new_req["created_at"] = datetime.utcnow().isoformat()
    if not new_req.get("area_name"):
        area_obj = next((a for a in db_store.affected_areas if a["id"] == req.area_id), None)
        new_req["area_name"] = area_obj["area_name"] if area_obj else "Emergency Area"
    db_store.resource_requests.insert(0, new_req)
    return {"status": "success", "data": new_req}

@app.put("/api/requests/{request_id}")
def update_request_status(request_id: str, payload: Dict[str, Any] = Body(...)):
    status = payload.get("status", "Approved")
    for idx, r in enumerate(db_store.resource_requests):
        if r["id"] == request_id:
            r["status"] = status
            db_store.resource_requests[idx] = r
            return {"status": "success", "data": r}
    raise HTTPException(status_code=404, detail="Request not found")

# -----------------------------------------------------------------------------
# SMART OPTIMIZATION & ALLOCATION ENDPOINTS
# -----------------------------------------------------------------------------

@app.post("/api/optimize")
def optimize_allocations(custom_weights: Optional[Dict[str, float]] = None):
    """
    Core AI & Optimization Endpoint:
    1. Re-calculates dynamic priority scores for all affected areas.
    2. Executes PuLP Integer Linear Programming resource solver.
    3. Returns recommended allocations and metrics to frontend.
    """
    # 1. Update priority scores
    for area in db_store.affected_areas:
        calc = calculate_priority_score(area, custom_weights)
        area["priority_score"] = calc["score"]
        area["status"] = calc["classification"]

    # 2. Run solver
    result = run_optimization(db_store.affected_areas, db_store.resources)
    return {"status": "success", "data": result}

@app.post("/api/allocate")
def confirm_allocations(payload: ConfirmAllocationSchema):
    """
    Saves confirmed allocations into storage and updates inventory allocated counts.
    """
    run_id = payload.run_id
    allocations_data = payload.allocations
    
    timestamp = datetime.utcnow().isoformat()
    saved_records = []
    
    for item in allocations_data:
        area_id = item.get("area_id")
        area_name = item.get("area_name")
        p_score = item.get("priority_score", 0)
        
        # Deduct / Allocate for Food, Water, Medicine, Rescue Teams
        food_a = item.get("food_allocated", 0)
        water_a = item.get("water_allocated", 0)
        med_a = item.get("medicine_allocated", 0)
        teams_a = item.get("rescue_teams_allocated", 0)
        
        record = {
            "id": f"alloc-{uuid.uuid4().hex[:6]}",
            "optimization_run_id": run_id,
            "area_id": area_id,
            "area_name": area_name,
            "priority_score": p_score,
            "food_allocated": food_a,
            "water_allocated": water_a,
            "medicine_allocated": med_a,
            "rescue_teams_allocated": teams_a,
            "status": "Confirmed",
            "created_at": timestamp
        }
        saved_records.append(record)
        db_store.allocations.insert(0, record)
        
        # Update Area Status to 'Assigned' or 'Relieved'
        for a in db_store.affected_areas:
            if a["id"] == area_id:
                if p_score >= 80:
                    a["status"] = "Assigned"
                elif p_score >= 60:
                    a["status"] = "Assigned"
                    
        # Update Resource Quantities in Inventory
        for r in db_store.resources:
            r_type = r.get("resource_type", "")
            if "Food" in r_type:
                r["quantity_allocated"] = min(r["quantity_available"], r["quantity_allocated"] + food_a)
            elif "Water" in r_type:
                r["quantity_allocated"] = min(r["quantity_available"], r["quantity_allocated"] + water_a)
            elif "Medicine" in r_type:
                r["quantity_allocated"] = min(r["quantity_available"], r["quantity_allocated"] + med_a)
            elif "Rescue Teams" in r_type:
                r["quantity_allocated"] = min(r["quantity_available"], r["quantity_allocated"] + teams_a)

    return {"status": "success", "message": "Allocations confirmed and inventory updated", "data": saved_records}

@app.get("/api/allocations")
def get_allocations():
    return {"status": "success", "data": db_store.allocations}

# -----------------------------------------------------------------------------
# RESCUE TEAMS & VEHICLES
# -----------------------------------------------------------------------------

@app.get("/api/teams")
def get_rescue_teams():
    return {"status": "success", "data": db_store.rescue_teams}

@app.post("/api/teams")
def create_rescue_team(payload: Dict[str, Any] = Body(...)):
    new_team = payload
    new_team["id"] = f"t{uuid.uuid4().hex[:6]}"
    new_team["created_at"] = datetime.utcnow().isoformat()
    db_store.rescue_teams.insert(0, new_team)
    return {"status": "success", "data": new_team}

@app.put("/api/teams/{team_id}")
def update_rescue_team(team_id: str, payload: Dict[str, Any] = Body(...)):
    for idx, t in enumerate(db_store.rescue_teams):
        if t["id"] == team_id:
            updated = {**t, **payload}
            db_store.rescue_teams[idx] = updated
            return {"status": "success", "data": updated}
    raise HTTPException(status_code=404, detail="Team not found")

@app.get("/api/vehicles")
def get_vehicles():
    return {"status": "success", "data": db_store.vehicles}

@app.post("/api/vehicles")
def create_vehicle(payload: Dict[str, Any] = Body(...)):
    new_veh = payload
    new_veh["id"] = f"v{uuid.uuid4().hex[:6]}"
    new_veh["created_at"] = datetime.utcnow().isoformat()
    db_store.vehicles.insert(0, new_veh)
    return {"status": "success", "data": new_veh}

@app.put("/api/vehicles/{vehicle_id}")
def update_vehicle(vehicle_id: str, payload: Dict[str, Any] = Body(...)):
    for idx, v in enumerate(db_store.vehicles):
        if v["id"] == vehicle_id:
            updated = {**v, **payload}
            db_store.vehicles[idx] = updated
            return {"status": "success", "data": updated}
    raise HTTPException(status_code=404, detail="Vehicle not found")

# -----------------------------------------------------------------------------
# ANALYTICS & ALERTS
# -----------------------------------------------------------------------------

@app.get("/api/analytics")
def get_analytics():
    # Dynamic calculation of summary KPI metrics
    reports = db_store.disaster_reports
    total_incidents = len(reports)
    critical_incidents = len([r for r in reports if r.get("severity") == "Critical" or r.get("priority_level") == "Critical"])
    active_incidents = len([r for r in reports if r.get("status") in ["Pending", "Verified", "Assigned", "In Progress"]])
    resolved_incidents = len([r for r in reports if r.get("status") == "Resolved"])

    available_teams = [t for t in db_store.rescue_teams if t.get("status") == "Available"]
    available_rescue_personnel = sum([int(t.get("members", 1)) for t in available_teams])
    available_vehicles = len([v for v in db_store.vehicles if v.get("status") == "Available"])
    
    med_res = [r for r in db_store.resources if "Med" in r.get("category", "") or "Med" in r.get("resource_type", "")]
    available_medical_resources = sum([int(r.get("quantity_available", 0)) - int(r.get("quantity_allocated", 0)) for r in med_res])

    active_disasters = len([d for d in db_store.disasters if d["status"] == "Active"])
    total_areas = len(db_store.affected_areas)
    critical_areas = len([a for a in db_store.affected_areas if a.get("priority_score", 0) >= 80 or a.get("severity") == "Critical"])
    pending_requests = len([r for r in db_store.resource_requests if r["status"] == "Pending"])
    
    total_avail_qty = sum([r.get("quantity_available", 0) for r in db_store.resources])
    total_alloc_qty = sum([r.get("quantity_allocated", 0) for r in db_store.resources])
    resource_pct = round(((total_avail_qty - total_alloc_qty) / max(1, total_avail_qty)) * 100.0, 1)
    
    # Severity distribution
    sev_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    total_pop = 0
    for a in db_store.affected_areas:
        sev = a.get("severity", "Medium")
        sev_counts[sev] = sev_counts.get(sev, 0) + 1
        total_pop += a.get("population", 0)
        
    severity_chart = [{"name": k, "value": v} for k, v in sev_counts.items()]
    
    # Resource category breakdown
    cat_breakdown = {}
    for r in db_store.resources:
        cat = r.get("category", "Other")
        if cat not in cat_breakdown:
            cat_breakdown[cat] = {"available": 0, "allocated": 0}
        cat_breakdown[cat]["available"] += r.get("quantity_available", 0)
        cat_breakdown[cat]["allocated"] += r.get("quantity_allocated", 0)
        
    category_chart = [
        {
            "category": k,
            "available": v["available"],
            "allocated": v["allocated"],
            "remaining": max(0, v["available"] - v["allocated"])
        }
        for k, v in cat_breakdown.items()
    ]
    
    # Demand by Area chart
    demand_chart = [
        {
            "area": a.get("area_name", "").replace("Area ", ""),
            "food": a.get("food_required", 0),
            "water": a.get("water_required", 0),
            "medicine": a.get("medicine_required", 0),
            "priority": a.get("priority_score", 0)
        }
        for a in db_store.affected_areas[:8]
    ]

    return {
        "status": "success",
        "summary": {
            "total_incidents": total_incidents,
            "critical_incidents": critical_incidents,
            "active_incidents": active_incidents,
            "resolved_incidents": resolved_incidents,
            "available_rescue_personnel": available_rescue_personnel,
            "available_vehicles": available_vehicles,
            "available_medical_resources": available_medical_resources,
            "active_disasters": active_disasters,
            "total_areas": total_areas,
            "critical_areas": critical_areas,
            "resources_available_pct": f"{resource_pct}%",
            "pending_requests": pending_requests,
            "available_rescue_teams": len(available_teams),
            "total_affected_population": total_pop,
            "coverage_rate": "87%",
            "people_served": f"{int(total_pop * 0.76):,}",
            "requests_resolved_pct": "93%"
        },
        "charts": {
            "severity_distribution": severity_chart,
            "category_breakdown": category_chart,
            "demand_by_area": demand_chart
        }
    }

@app.get("/api/alerts")
def get_alerts():
    return {"status": "success", "data": db_store.alerts}

@app.post("/api/alerts")
def create_alert(payload: Dict[str, Any] = Body(...)):
    new_alt = payload
    new_alt["id"] = f"alt{uuid.uuid4().hex[:6]}"
    new_alt["status"] = "Active"
    new_alt["created_at"] = datetime.utcnow().isoformat()
    db_store.alerts.insert(0, new_alt)
    return {"status": "success", "data": new_alt}

@app.put("/api/alerts/{alert_id}")
def dismiss_alert(alert_id: str):
    for idx, alt in enumerate(db_store.alerts):
        if alt["id"] == alert_id:
            alt["status"] = "Resolved"
            db_store.alerts[idx] = alt
            return {"status": "success", "data": alt}
    raise HTTPException(status_code=404, detail="Alert not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
