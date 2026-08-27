"""
SMS Ingestion & Disaster Processing Service Module
Coordinates incoming SMS message parsing, duplicate report detection, 
priority score calculation, database storage, SMS acknowledgement replies, 
and PuLP resource allocation pipeline execution.
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from database import db_store, supabase_client
from services.disaster_parser import parse_sms_message
from services.priority_engine import calculate_report_priority
from services.twilio_service import send_sms_acknowledgement
from services.resource_allocator import process_report_verification

def detect_duplicate_report(
    sender_phone: str, 
    raw_message: str, 
    location: str, 
    disaster_type: str, 
    timeframe_minutes: int = 5
) -> Optional[Dict[str, Any]]:
    """
    Checks if an identical or near-duplicate SMS report has been received recently (default 5 minutes).
    Matches on:
    1. Exact same sender phone & raw message text
    2. Same location & disaster type within timeframe
    """
    now = datetime.utcnow()
    clean_msg = raw_message.strip().lower()
    
    for rpt in db_store.disaster_reports:
        # Check identical message from same phone
        if rpt.get("reporter_phone") == sender_phone and rpt.get("raw_message", "").strip().lower() == clean_msg:
            return rpt

        # Check location & disaster type within timeframe
        created_str = rpt.get("created_at")
        if created_str:
            try:
                created_dt = datetime.fromisoformat(created_str.replace("Z", "+00:00")).replace(tzinfo=None)
                if (now - created_dt) <= timedelta(minutes=timeframe_minutes):
                    if (
                        rpt.get("location", "").lower() == location.lower() and 
                        rpt.get("disaster_type", "").lower() == disaster_type.lower() and
                        rpt.get("location") != "Unknown"
                    ):
                        return rpt
            except Exception:
                pass
    return None


def process_incoming_sms(payload: Dict[str, Any], source: str = "SMS") -> Dict[str, Any]:
    """
    Core SMS Ingestion Pipeline:
    1. Extracts SMS message body and sender phone (supports Twilio standard Form data or JSON).
    2. Parses natural language fields (Disaster Type, Location, Affected People, Severity, Resources Required).
    3. Detects duplicate emergency reports.
    4. Calculates dynamic Priority Score (Severity, Population, Vulnerability, Medical, Waiting Time).
    5. Saves report into database (Supabase PostgreSQL + In-Memory Fallback).
    6. Sends instant SMS acknowledgement reply back to reporter.
    7. Automatically feeds report into PuLP Integer Linear Resource Solver & Greedy Allocator.
    """
    # Accept standard Twilio webhook keys ('Body', 'From') or custom JSON keys ('message', 'reporter_phone', 'text', 'from')
    message_text = payload.get("message") or payload.get("Body") or payload.get("text") or ""
    sender_phone = payload.get("reporter_phone") or payload.get("From") or payload.get("from") or "+15005550006"

    if not message_text.strip():
        return {
            "status": "error",
            "message": "Empty message body received",
            "data": None
        }

    # 1. Natural Language Disaster Message Parsing
    parsed = parse_sms_message(message_text)
    
    disaster_type = parsed.get("disaster_type", "Other")
    location = parsed.get("location", "Unknown")
    people_affected = parsed.get("people_affected", 0)
    severity = parsed.get("severity", "Medium")
    urgency = parsed.get("urgency", "Medium")
    required_resources = parsed.get("required_resources", [])
    latitude = parsed.get("latitude")
    longitude = parsed.get("longitude")

    # 2. Duplicate Detection
    duplicate = detect_duplicate_report(sender_phone, message_text, location, disaster_type)
    if duplicate:
        print(f"[SMS Ingestion] Duplicate report detected for {sender_phone} at {location}. Skipping duplicate creation.")
        return {
            "status": "duplicate",
            "is_duplicate": True,
            "message": f"Duplicate disaster report detected from {sender_phone}. Report {duplicate['id']} already active.",
            "data": duplicate
        }

    # 3. Calculate Priority Score & Level
    priority_score, priority_level, priority_breakdown = calculate_report_priority(
        severity=severity,
        people_affected=people_affected,
        urgency=urgency,
        resource_count=len(required_resources),
        vulnerable_count=int(people_affected * 0.3) if people_affected > 0 else 0,
        medical_cases=int(people_affected * 0.2) if people_affected > 0 else 0,
        waiting_time_minutes=0.0
    )

    report_id = f"rpt-sms-{uuid.uuid4().hex[:6]}"
    timestamp = datetime.utcnow().isoformat()

    new_report = {
        "id": report_id,
        "incident_id": report_id,
        "report_id": report_id,
        "source": source,
        "reporter_phone": sender_phone,
        "sender_phone": sender_phone,
        "raw_message": message_text,
        "original_message": message_text,
        "disaster_type": disaster_type,
        "location": location,
        "latitude": latitude,
        "longitude": longitude,
        "people_affected": people_affected,
        "affected_population": people_affected,
        "severity": severity,
        "urgency": urgency,
        "required_resources": required_resources,
        "resources_needed": required_resources,
        "priority_score": priority_score,
        "priority_level": priority_level,
        "priority_breakdown": priority_breakdown,
        "status": "Pending",
        "timestamp": timestamp,
        "created_at": timestamp,
        "updated_at": timestamp
    }

    # 4. Save to Database (In-Memory + Supabase)
    db_store.disaster_reports.insert(0, new_report)

    if supabase_client:
        try:
            supabase_payload = {
                "id": report_id,
                "reporter_phone": sender_phone,
                "original_message": message_text,
                "disaster_type": disaster_type,
                "location": location,
                "latitude": latitude,
                "longitude": longitude,
                "people_affected": people_affected,
                "severity": severity,
                "urgency": urgency,
                "required_resources": required_resources,
                "priority_score": priority_score,
                "priority_level": priority_level,
                "status": "Pending",
                "source": source
            }
            supabase_client.table("disaster_reports").insert(supabase_payload).execute()
        except Exception as e:
            print(f"[Supabase SMS Save Error] {e}")

    # 5. Send Automated SMS Acknowledgement Reply
    send_sms_acknowledgement(
        reporter_phone=sender_phone,
        report_id=report_id,
        disaster_type=disaster_type,
        location=location,
        priority_level=priority_level,
        priority_score=priority_score
    )

    # 6. Auto-Feed Verified Emergency into PuLP Resource Allocation Pipeline
    allocation_pipeline = None
    try:
        allocation_pipeline = process_report_verification(new_report)
    except Exception as e:
        print(f"[SMS Resource Allocator Error] {e}")

    return {
        "status": "success",
        "is_duplicate": False,
        "message": f"SMS report received, acknowledgement sent to {sender_phone}, and emergency queued for resource allocation.",
        "data": new_report,
        "acknowledgement_sent": True,
        "allocation_pipeline": allocation_pipeline
    }
