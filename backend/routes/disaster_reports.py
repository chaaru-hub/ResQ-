"""
Disaster Reports API Router
Manages disaster report list, retrieval, status updates, admin verification, rescue team assignment, and incident completion.
Triggers automated Twilio WhatsApp notifications for emergency receipts and real-time status updates.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Body, Query

from database import db_store, supabase_client
from services.whatsapp_service import process_incoming_whatsapp_message
from services.priority_engine import calculate_report_priority
from services.resource_allocator import process_report_verification
from services.route_optimizer import calculate_dijkstra_route
from services.twilio_service import send_status_update

router = APIRouter(prefix="/api/disaster-reports", tags=["Disaster Reports"])


@router.get("")
def get_disaster_reports(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None)
):
    """Retrieves list of disaster reports with optional status and severity filtering."""
    reports = db_store.disaster_reports

    if status and status != "All":
        reports = [r for r in reports if r.get("status") == status]

    if severity and severity != "All":
        reports = [r for r in reports if r.get("severity") == severity or r.get("priority_level") == severity or r.get("priority") == severity]

    # Sort by priority_score descending
    reports = sorted(reports, key=lambda x: x.get("priority_score", 0.0), reverse=True)
    return {"status": "success", "count": len(reports), "data": reports}


@router.get("/{report_id}")
def get_disaster_report_by_id(report_id: str):
    """Retrieves a single disaster report by ID."""
    for r in db_store.disaster_reports:
        if r.get("id") == report_id or r.get("incident_id") == report_id:
            return {"status": "success", "data": r}
    raise HTTPException(status_code=404, detail="Disaster report not found.")


@router.post("/simulate")
def simulate_whatsapp_report(payload: Dict[str, Any] = Body(...)):
    """
    Demo / Development Mode Endpoint:
    Processes natural language WhatsApp messages through the EXACT SAME pipeline as live Twilio webhooks.
    """
    res = process_incoming_whatsapp_message(payload, source="WhatsApp (Simulated)")
    return res


@router.patch("/{report_id}/status")
def update_report_status(report_id: str, payload: Dict[str, Any] = Body(...)):
    """Updates status or editable fields of a disaster report and sends WhatsApp status updates."""
    for idx, r in enumerate(db_store.disaster_reports):
        if r.get("id") == report_id or r.get("incident_id") == report_id:
            old_status = r.get("status")
            new_status = payload.get("status", old_status)
            
            if new_status:
                r["status"] = new_status
            if "location" in payload and payload["location"]:
                r["location"] = payload["location"]
            if "latitude" in payload and payload["latitude"] is not None:
                r["latitude"] = float(payload["latitude"])
            if "longitude" in payload and payload["longitude"] is not None:
                r["longitude"] = float(payload["longitude"])
            if "people_affected" in payload and payload["people_affected"] is not None:
                r["people_affected"] = int(payload["people_affected"])
                r["affected_people"] = int(payload["people_affected"])
            if "severity" in payload and payload["severity"]:
                r["severity"] = payload["severity"]
            if "required_resources" in payload and isinstance(payload["required_resources"], list):
                r["required_resources"] = payload["required_resources"]
            if "assigned_team_id" in payload:
                r["assigned_team_id"] = payload["assigned_team_id"]
                r["assigned_team"] = payload.get("assigned_team_name", payload["assigned_team_id"])

            # Recalculate priority score & level
            p_score, p_level, _ = calculate_report_priority(
                severity=r.get("severity", "Medium"),
                people_affected=r.get("people_affected", 0),
                urgency=r.get("urgency", "Medium"),
                resource_count=len(r.get("required_resources", []))
            )
            r["priority_score"] = p_score
            r["priority_level"] = p_level
            r["priority"] = p_level.upper()
            r["updated_at"] = datetime.utcnow().isoformat()
            
            db_store.disaster_reports[idx] = r

            # Send WhatsApp status update if status changed
            if old_status != new_status and r.get("reporter_phone"):
                team_name = r.get("assigned_team_name") or r.get("assigned_team") or "Rescue Squad Alpha"
                send_status_update(r["reporter_phone"], new_status, team_name)

            if supabase_client:
                try:
                    supabase_client.table("disaster_reports").update(r).eq("id", report_id).execute()
                except Exception as e:
                    print(f"Supabase update report error: {e}")

            return {"status": "success", "data": r}

    raise HTTPException(status_code=404, detail="Disaster report not found.")


@router.post("/{report_id}/verify")
def verify_disaster_report(report_id: str):
    """
    Admin verification endpoint:
    Verifies pending report (status='Verified'), executes Greedy Resource Allocator, 
    and triggers Dijkstra shortest route optimization.
    """
    for idx, r in enumerate(db_store.disaster_reports):
        if r.get("id") == report_id or r.get("incident_id") == report_id:
            r["status"] = "Verified"
            r["updated_at"] = datetime.utcnow().isoformat()
            db_store.disaster_reports[idx] = r
            
            allocation_res = process_report_verification(r)

            if supabase_client:
                try:
                    supabase_client.table("disaster_reports").update({"status": "Verified"}).eq("id", report_id).execute()
                except Exception as e:
                    print(f"Supabase report verify error: {e}")

            return {
                "status": "success",
                "message": "Report verified. Greedy resource recommendations generated and Dijkstra route calculated.",
                "report": r,
                "allocation_pipeline": allocation_res
            }

    raise HTTPException(status_code=404, detail="Disaster report not found.")


@router.post("/{report_id}/assign")
def assign_team_to_report(report_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Admin assigns rescue team to an incident.
    Updates status to 'In Progress' / 'Assigned', computes Dijkstra shortest path,
    and sends automated WhatsApp update:
    '🚑 RESQ Update: A rescue team has been assigned to your emergency.'
    """
    team_id = payload.get("team_id", f"team_{uuid.uuid4().hex[:4]}")
    team_name = payload.get("team_name") or payload.get("assigned_team") or "Alpha Medical ResQ-1"
    
    for idx, r in enumerate(db_store.disaster_reports):
        if r.get("id") == report_id or r.get("incident_id") == report_id:
            r["status"] = "In Progress"
            r["assigned_team_id"] = team_id
            r["assigned_team_name"] = team_name
            r["assigned_team"] = team_name
            r["updated_at"] = datetime.utcnow().isoformat()
            
            lat = r.get("latitude") or 13.0827
            lng = r.get("longitude") or 80.2707
            central_depot = (13.0827, 80.2707)
            
            route_data = calculate_dijkstra_route(central_depot, (lat, lng))
            r["dijkstra_route"] = route_data

            db_store.disaster_reports[idx] = r

            # Update assigned team status in db_store.rescue_teams
            for t in db_store.rescue_teams:
                if t.get("id") == team_id or t.get("team_name") == team_name:
                    t["status"] = "On Mission"
                    t["assigned_area_name"] = r.get("location")

            # Send automated WhatsApp Notification
            if r.get("reporter_phone"):
                send_status_update(r["reporter_phone"], "In Progress", team_name)

            return {
                "status": "success",
                "message": f"Team '{team_name}' assigned to incident. WhatsApp update sent to reporter.",
                "report": r,
                "route": route_data
            }

    raise HTTPException(status_code=404, detail="Disaster report not found.")


@router.post("/{report_id}/complete")
def complete_disaster_report(report_id: str):
    """
    Admin completes a rescue operation.
    Updates status to 'Completed', frees assigned rescue team, and sends WhatsApp notification:
    '✅ RESQ Update: The rescue operation has been completed.'
    """
    for idx, r in enumerate(db_store.disaster_reports):
        if r.get("id") == report_id or r.get("incident_id") == report_id:
            r["status"] = "Completed"
            r["updated_at"] = datetime.utcnow().isoformat()
            
            # Free assigned rescue team
            assigned_team = r.get("assigned_team_name") or r.get("assigned_team")
            if assigned_team:
                for t in db_store.rescue_teams:
                    if t.get("team_name") == assigned_team or t.get("id") == r.get("assigned_team_id"):
                        t["status"] = "Available"
                        t["assigned_area_name"] = None

            db_store.disaster_reports[idx] = r

            # Send automated WhatsApp Notification
            if r.get("reporter_phone"):
                send_status_update(r["reporter_phone"], "Completed", assigned_team or "Rescue Squad")

            return {
                "status": "success",
                "message": "Incident marked as Completed. Rescue team released and WhatsApp update sent.",
                "report": r
            }

    raise HTTPException(status_code=404, detail="Disaster report not found.")
