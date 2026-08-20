"""
WhatsApp Webhook API Router
Receives incoming WhatsApp emergency reports from Twilio (/webhook/whatsapp and /webhooks/whatsapp).
Extracts sender, message body, logs incoming payload, creates incident, assesses priority, and returns valid TwiML XML response.
"""

import os
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Request, Response, HTTPException, Query

from services.whatsapp_service import process_incoming_whatsapp_message
from services.twilio_service import generate_twiml_response, format_incident_id

# Configure logger
logger = logging.getLogger("resq_whatsapp")
logging.basicConfig(level=logging.INFO)

# Router for /webhook/whatsapp
router = APIRouter(tags=["WhatsApp Webhook"])

WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "resq_emergency_verify_token")


@router.get("/webhook/whatsapp", summary="WhatsApp Verification Endpoint")
@router.get("/webhooks/whatsapp", summary="WhatsApp Verification Endpoint (Legacy)")
def verify_whatsapp_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token")
):
    """
    WhatsApp Verification Endpoint (Meta Cloud API / Twilio URL ping).
    """
    if hub_mode == "subscribe" and hub_verify_token == WHATSAPP_VERIFY_TOKEN:
        return Response(content=hub_challenge, media_type="text/plain")
    
    if hub_verify_token == WHATSAPP_VERIFY_TOKEN or not hub_verify_token:
        return Response(content=hub_challenge or "VERIFIED", media_type="text/plain")

    raise HTTPException(status_code=403, detail="Verification token mismatch.")


@router.post("/webhook/whatsapp", summary="Receives incoming WhatsApp emergency reports from Twilio.")
@router.post("/webhooks/whatsapp", summary="Receives incoming WhatsApp emergency reports from Twilio (Legacy).")
async def receive_whatsapp_webhook(request: Request):
    """
    Receives incoming WhatsApp emergency reports from Twilio:
    - Extracts sender's WhatsApp number (From)
    - Extracts message body (Body)
    - Extracts MessageSid
    - Logs the received message
    - Processes emergency report into Priority Queue & Incident DB
    - Returns valid TwiML XML response
    """
    payload = {}
    content_type = request.headers.get("content-type", "")

    # 1. Parse incoming payload (Twilio sends application/x-www-form-urlencoded)
    if "application/x-www-form-urlencoded" in content_type:
        form_data = await request.form()
        payload = dict(form_data)
    else:
        try:
            payload = await request.json()
        except Exception:
            form_data = await request.form()
            payload = dict(form_data)

    # 2. Extract key Twilio fields
    sender_phone = payload.get("From", "Unknown")
    message_body = payload.get("Body", payload.get("message", ""))
    message_sid = payload.get("MessageSid", "")

    # 3. Log incoming message (strictly excluding credentials)
    logger.info(f"📱 [Twilio Webhook] Received WhatsApp message from [{sender_phone}]: '{message_body}' (SID: {message_sid})")

    # 4. Process emergency report through NLP parser and Priority assessment engine
    res = process_incoming_whatsapp_message(payload, source="WhatsApp Webhook")

    # 5. Format dynamic receipt message for TwiML XML
    incident_data = res.get("data", {})
    raw_id = incident_data.get("id", "RESQ-1001")
    formatted_id = format_incident_id(raw_id)
    priority_level = incident_data.get("priority_level", incident_data.get("priority", "HIGH")).upper()

    twiml_msg = (
        f"🚨 RESQ Emergency Report Received\n\n"
        f"Your emergency report has been successfully registered.\n\n"
        f"Incident ID: {formatted_id}\n"
        f"Priority: {priority_level}\n"
        f"Status: Processing\n\n"
        f"A response team is being assigned."
    )

    twiml_xml = generate_twiml_response(twiml_msg)

    # 6. Return TwiML XML content
    return Response(content=twiml_xml, media_type="application/xml")
