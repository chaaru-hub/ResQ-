"""
Twilio WhatsApp Integration Module for RESQ Disaster Response System.
Reads credentials strictly from environment variables and provides high-level messaging helpers.
"""

import os
from typing import Optional

# Environment variables
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "+14155238886")
TWILIO_CONTENT_SID = os.getenv("TWILIO_CONTENT_SID", "HXb5b62575e6e4ff6129ad7c8efe1f983e")

def safe_log(msg: str):
    """Safely prints log output stripping unprintable Windows cp1252 characters."""
    try:
        print(msg.encode('ascii', errors='ignore').decode('ascii'))
    except Exception:
        pass

def format_incident_id(raw_id: str) -> str:
    """Formats incident ID as RESQ-XXXX."""
    if not raw_id:
        return "RESQ-1001"
    clean = str(raw_id).replace("rpt_wa_", "").replace("rpt_", "").replace("inc_", "")
    return f"RESQ-{clean[:6].upper()}"

def get_twilio_client():
    """Returns an authenticated Twilio REST Client if credentials exist."""
    sid = os.getenv("TWILIO_ACCOUNT_SID", TWILIO_ACCOUNT_SID)
    token = os.getenv("TWILIO_AUTH_TOKEN", TWILIO_AUTH_TOKEN)
    
    if not (sid and token):
        safe_log("[Twilio NOTICE] Credentials missing in environment variables. Skipping live message send.")
        return None

    try:
        from twilio.rest import Client
        return Client(sid, token)
    except Exception as e:
        safe_log(f"[Twilio NOTICE] Failed to initialize Twilio Client: {e}")
        return None


def send_whatsapp_message(to_phone: str, message_text: str) -> Optional[str]:
    """
    Sends a WhatsApp message using Twilio REST API.
    Fallback to ContentSid template if required by Twilio sandbox/profile.
    """
    client = get_twilio_client()
    if not client:
        return None

    try:
        sender_num = os.getenv("TWILIO_WHATSAPP_NUMBER", TWILIO_WHATSAPP_NUMBER)
        from_phone = sender_num if sender_num.startswith("whatsapp:") else f"whatsapp:{sender_num}"
        
        # Clean phone number
        clean_phone = to_phone.replace(" ", "").replace("-", "")
        target_phone = clean_phone if clean_phone.startswith("whatsapp:") else f"whatsapp:{clean_phone}"

        try:
            msg = client.messages.create(
                body=message_text,
                from_=from_phone,
                to=target_phone
            )
            safe_log(f"[Twilio SUCCESS] Message sent to {target_phone}. SID: {msg.sid}")
            return msg.sid
        except Exception as body_err:
            content_sid = os.getenv("TWILIO_CONTENT_SID", TWILIO_CONTENT_SID)
            if content_sid:
                try:
                    msg = client.messages.create(
                        from_=from_phone,
                        to=target_phone,
                        content_sid=content_sid
                    )
                    safe_log(f"[Twilio SUCCESS] ContentSid template sent to {target_phone}. SID: {msg.sid}")
                    return msg.sid
                except Exception as t_err:
                    safe_log(f"[Twilio NOTICE] ContentSid fallback error: {t_err}")
            safe_log(f"[Twilio NOTICE] Outbound send note for {to_phone}: {body_err}")
            return None
    except Exception as e:
        safe_log(f"[Twilio NOTICE] Error in send_whatsapp_message for {to_phone}: {e}")
        return None


def send_emergency_acknowledgment(to_phone: str, disaster_type: str, location: str, priority: str, incident_id: str = "RESQ-1001") -> Optional[str]:
    """
    Sends the initial automated WhatsApp confirmation response after an emergency report is logged.
    """
    try:
        formatted_id = format_incident_id(incident_id)
        msg_body = (
            f"🚨 RESQ Emergency Report Received\n\n"
            f"Your emergency report has been successfully registered.\n\n"
            f"Incident ID: {formatted_id}\n"
            f"Incident: {disaster_type}\n"
            f"Location: {location}\n"
            f"Priority: {str(priority).upper()}\n"
            f"Status: Processing\n\n"
            f"A response team is being assigned."
        )
        return send_whatsapp_message(to_phone, msg_body)
    except Exception as e:
        safe_log(f"[Twilio NOTICE] Acknowledgment notice: {e}")
        return None


def send_status_update(to_phone: str, status: str, team_name: str = "Rescue Team 01", incident_id: str = "RESQ-1001") -> Optional[str]:
    """
    Sends automated WhatsApp status updates when team is assigned, en route, or operation completed.
    """
    try:
        formatted_id = format_incident_id(incident_id)
        
        if status in ["ASSIGNED", "Assigned", "In Progress", "IN_PROGRESS"]:
            msg_body = (
                f"🚑 RESQ Update\n\n"
                f"A rescue team has been assigned to your emergency.\n\n"
                f"Incident ID: {formatted_id}\n"
                f"Team: {team_name}\n"
                f"Status: ASSIGNED"
            )
        elif status in ["ON_THE_WAY", "On the Way", "En Route"]:
            msg_body = (
                f"🚑 RESQ Update\n\n"
                f"Your rescue team is on the way.\n\n"
                f"Incident ID: {formatted_id}\n"
                f"Team: {team_name}\n"
                f"Status: ON THE WAY"
            )
        elif status in ["RESOLVED", "Completed", "Resolved", "COMPLETED"]:
            msg_body = (
                f"✅ RESQ Update\n\n"
                f"Your emergency response has been completed.\n\n"
                f"Incident ID: {formatted_id}\n"
                f"Status: RESOLVED"
            )
        elif status in ["UNAVAILABLE", "No Team"]:
            msg_body = (
                f"⚠️ RESQ Update\n\n"
                f"Your emergency has been registered and marked as HIGH priority.\n\n"
                f"Currently no suitable response team is available.\n"
                f"The incident remains in the priority queue."
            )
        else:
            msg_body = (
                f"ℹ️ RESQ Update\n\n"
                f"Incident ID: {formatted_id}\n"
                f"Status: {status}"
            )

        return send_whatsapp_message(to_phone, msg_body)
    except Exception as e:
        safe_log(f"[Twilio NOTICE] Status update notice: {e}")
        return None


def generate_twiml_response(message_text: str) -> str:
    """
    Generates a valid TwiML XML string response for incoming Twilio webhooks.
    """
    try:
        from twilio.twiml.messaging_response import MessagingResponse
        resp = MessagingResponse()
        resp.message(message_text)
        return str(resp)
    except Exception:
        escaped_text = (
            message_text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<Response>\n'
            f'    <Message>{escaped_text}</Message>\n'
            '</Response>'
        )
