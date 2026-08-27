"""
SMS & Emergency Reports API Router
Implements required disaster reporting endpoints:
- POST /sms/incoming
- GET /reports
- GET /reports/{id}
- GET /allocations
- GET /priority-ranking
"""

from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Body, Query, Request, Response
from fastapi.responses import PlainTextResponse, Response

from database import db_store
from services.sms_service import process_incoming_sms
from services.optimizer import run_optimization
from services.priority import calculate_priority_score

router = APIRouter(tags=["SMS & Emergency Reports"])

@router.post("/sms/incoming")
@router.post("/api/sms/incoming")
async def receive_incoming_sms(request: Request):
    """
    Twilio SMS Webhook & API Ingestion Endpoint:
    Receives incoming SMS text messages and sender phone numbers.
    Parses disaster parameters, checks for duplicates, computes priority score,
    stores report in PostgreSQL database, sends automated SMS reply acknowledgement,
    and feeds request into PuLP resource allocation pipeline.
    """
    content_type = request.headers.get("content-type", "")
    payload = {}

    if "application/x-www-form-urlencoded" in content_type:
        form_data = await request.form()
        payload = dict(form_data)
    else:
        try:
            payload = await request.json()
        except Exception:
            form_data = await request.form()
            payload = dict(form_data)

    result = process_incoming_sms(payload, source="SMS")

    # If incoming request is from Twilio Webhook user agent, return TwiML XML acknowledgement response
    user_agent = request.headers.get("user-agent", "").lower()
    if "twilio" in user_agent or "application/x-www-form-urlencoded" in content_type:
        report_data = result.get("data") or {}
        r_id = report_data.get("id", "rpt-sms")
        d_type = report_data.get("disaster_type", "Emergency")
        loc = report_data.get("location", "Location")
        p_level = report_data.get("priority_level", "HIGH")
        
        twiml_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>🚨 RESQ Received Report #{r_id}: {d_type} at {loc}. Priority: {p_level}. Emergency squad notified.</Message>
</Response>"""
        return Response(content=twiml_xml, media_type="application/xml")

    return result


@router.get("/reports")
@router.get("/api/reports")
def get_all_reports(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None)
):
    """
    Retrieves all stored SMS disaster reports with optional status and severity filtering.
    Sorted by priority score descending.
    """
    reports = list(db_store.disaster_reports)

    if status and status != "All":
        reports = [r for r in reports if r.get("status") == status]

    if severity and severity != "All":
        reports = [r for r in reports if r.get("severity") == severity or r.get("priority_level") == severity]

    reports = sorted(reports, key=lambda x: float(x.get("priority_score", 0.0)), reverse=True)
    return {
        "status": "success",
        "count": len(reports),
        "data": reports
    }


@router.get("/reports/{report_id}")
@router.get("/api/reports/{report_id}")
def get_report_by_id(report_id: str):
    """
    Retrieves a single disaster report by Report ID.
    """
    for r in db_store.disaster_reports:
        if r.get("id") == report_id or r.get("incident_id") == report_id or r.get("report_id") == report_id:
            return {
                "status": "success",
                "data": r
            }
    raise HTTPException(status_code=404, detail=f"Disaster report '{report_id}' not found.")


@router.get("/allocations")
@router.get("/api/allocations")
def get_resource_allocations():
    """
    Retrieves current resource allocation recommendations and confirmed dispatches.
    If no allocations saved yet, automatically runs PuLP Integer Linear Program solver.
    """
    if not db_store.allocations:
        solver_res = run_optimization(db_store.affected_areas, db_store.resources)
        return {
            "status": "success",
            "source": "PuLP Optimizer Live Solver",
            "run_id": solver_res.get("run_id"),
            "metrics": solver_res.get("metrics"),
            "data": solver_res.get("allocations", [])
        }

    return {
        "status": "success",
        "count": len(db_store.allocations),
        "data": db_store.allocations
    }


@router.get("/priority-ranking")
@router.get("/api/priority-ranking")
def get_priority_ranking():
    """
    Retrieves priority ranking of all active SMS disaster reports and affected areas.
    Sorted strictly by Priority Score descending (0 - 100).
    """
    # 1. Rank SMS disaster reports
    ranked_reports = sorted(
        db_store.disaster_reports,
        key=lambda r: float(r.get("priority_score", 0.0)),
        reverse=True
    )

    # 2. Rank Affected Areas
    ranked_areas = []
    for area in db_store.affected_areas:
        calc = calculate_priority_score(area)
        ranked_areas.append({
            **area,
            "priority_score": calc["score"],
            "priority_classification": calc["classification"],
            "priority_breakdown": calc["breakdown"]
        })
    ranked_areas = sorted(ranked_areas, key=lambda a: float(a["priority_score"]), reverse=True)

    return {
        "status": "success",
        "ranked_reports": ranked_reports,
        "ranked_areas": ranked_areas,
        "summary": {
            "total_reports": len(ranked_reports),
            "critical_reports": len([r for r in ranked_reports if r.get("priority_score", 0) >= 81 or r.get("severity") == "Critical"]),
            "top_priority_location": ranked_reports[0].get("location") if ranked_reports else "None"
        }
    }
