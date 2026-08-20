"""
Unified WhatsApp Message Processing Service
Common pipeline for live Twilio WhatsApp webhooks and Demo Mode simulation.
"""

import os
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

from database import db_store, supabase_client
from services.disaster_parser import parse_whatsapp_message
from services.priority_engine import calculate_report_priority, priority_queue

# Optional Twilio client import for sending WhatsApp replies
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "+14155238886")
TWILIO_CONTENT_SID = os.getenv("TWILIO_CONTENT_SID", "")

def send_whatsapp_acknowledgment(to_phone: str, message_id: str):
    """
    Sends automatic WhatsApp acknowledgment response using Twilio API if credentials configured.
    """
    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN):
        return None

    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        target_phone = to_phone if to_phone.startswith("whatsapp:") else f"whatsapp:{to_phone}"
        from_phone = TWILIO_WHATSAPP_NUMBER if TWILIO_WHATSAPP_NUMBER.startswith("whatsapp:") else f"whatsapp:{TWILIO_WHATSAPP_NUMBER}"

        try:
            msg = client.messages.create(
                body="Your emergency report has been received by ResQ. Our response team is reviewing your request.",
                from_=from_phone,
                to=target_phone
            )
            return msg.sid
        except Exception:
            # Fall back to template ContentSid if required by Twilio WhatsApp Business Profile
            msg = client.messages.create(
                from_=from_phone,
                to=target_phone,
                content_sid=TWILIO_CONTENT_SID
            )
            return msg.sid
    except Exception as e:
        print(f"Twilio auto-reply notification error: {e}")
        return None


def process_incoming_whatsapp_message(payload: Dict[str, Any], source: str = "WhatsApp") -> Dict[str, Any]:
    """
    Common Message Processor for both Twilio WhatsApp webhook and /simulate endpoint.
    """
    # 1. Extract payload attributes (handling Twilio form fields, Cloud API JSON, or simulation JSON)
    reporter_phone = payload.get("From") or payload.get("reporter_phone") or "+91 98401 99887"
    if reporter_phone.startswith("whatsapp:"):
        reporter_phone = reporter_phone.replace("whatsapp:", "")

    message_text = payload.get("Body") or payload.get("message") or payload.get("original_message") or ""
    message_id = payload.get("MessageSid") or payload.get("message_id") or f"msg_{uuid.uuid4().hex[:8]}"
    media_url = payload.get("MediaUrl0") or payload.get("media_url") or None

    if not message_text and not media_url:
        return {"status": "ignored", "reason": "No text or media content in message"}

    # 2. Run NLP Disaster Parser
    parsed = parse_whatsapp_message(message_text or "Emergency situation photo attached")

    # Allow overriding coordinates / location if passed in simulation
    if payload.get("location") and payload.get("location") != "Unknown":
        parsed["location"] = payload.get("location")
    if payload.get("latitude") is not None:
        parsed["latitude"] = float(payload.get("latitude"))
    if payload.get("longitude") is not None:
        parsed["longitude"] = float(payload.get("longitude"))

    # 3. Calculate Priority Score & Level
    p_score, p_level, breakdown = calculate_report_priority(
        severity=parsed["severity"],
        people_affected=parsed["people_affected"],
        urgency=parsed["urgency"],
        resource_count=len(parsed["required_resources"])
    )

    now_iso = datetime.utcnow().isoformat()

    new_report = {
        "id": f"rpt_wa_{uuid.uuid4().hex[:6]}",
        "reporter_phone": reporter_phone,
        "message_id": message_id,
        "original_message": message_text,
        "disaster_type": parsed["disaster_type"],
        "location": parsed["location"],
        "latitude": parsed["latitude"],
        "longitude": parsed["longitude"],
        "people_affected": parsed["people_affected"],
        "severity": parsed["severity"],
        "urgency": parsed["urgency"],
        "required_resources": parsed["required_resources"],
        "priority_score": p_score,
        "priority_level": p_level,
        "status": "Pending",
        "source": source,
        "assigned_team_id": None,
        "media_url": media_url,
        "created_at": now_iso,
        "updated_at": now_iso
    }

    # 4. Enqueue report into Priority Queue
    priority_queue.push(new_report)

    # 5. Save report to in-memory db_store and Supabase
    db_store.disaster_reports.insert(0, new_report)

    if supabase_client:
        try:
            supabase_client.table("disaster_reports").insert(new_report).execute()
        except Exception as e:
            print(f"Supabase disaster_reports insert error: {e}")

    # 6. Generate Critical Alert if Priority Level is Critical
    if p_level == "Critical":
        db_store.alerts.insert(0, {
            "id": f"alt_{uuid.uuid4().hex[:6]}",
            "title": f"CRITICAL WHATSAPP EMERGENCY: {parsed['disaster_type']} at {parsed['location']}",
            "message": f"Stranded count: {parsed['people_affected']} people. Priority: {p_score}/100. Message: '{message_text}'",
            "severity": "Critical",
            "status": "Active",
            "created_at": now_iso
        })

    # 7. Send WhatsApp Acknowledgment if Twilio set
    tw_ack = send_whatsapp_acknowledgment(reporter_phone, message_id)

    return {
        "status": "success",
        "message": "WhatsApp emergency message processed successfully",
        "data": new_report,
        "priority_breakdown": breakdown,
        "twilio_acknowledgment": tw_ack
    }
