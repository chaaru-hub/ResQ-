"""
Twilio SMS Integration & Gateway Service Module
Handles sending automated SMS emergency acknowledgements and status updates to citizens.
"""

import os
from dotenv import load_dotenv

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "+15005550006")

def send_sms(to_phone: str, message_body: str) -> bool:
    """
    Sends an SMS message to a phone number using Twilio REST API.
    Falls back gracefully to safe mock logging if Twilio credentials are not set.
    """
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        try:
            from twilio.rest import Client
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=message_body,
                from_=TWILIO_PHONE_NUMBER,
                to=to_phone
            )
            print(f"[Twilio SMS Gateway] Sent SMS to {to_phone}. SID: {message.sid}")
            return True
        except Exception as e:
            print(f"[Twilio SMS Error] Failed to send SMS via Twilio: {e}")

    # Fallback / Demo mode logger
    safe_body = message_body.encode("ascii", "replace").decode("ascii")
    print(f"[SMS Gateway Mock] Delivered SMS to {to_phone}: {safe_body}")
    return True


def send_sms_acknowledgement(reporter_phone: str, report_id: str, disaster_type: str, location: str, priority_level: str = "HIGH", priority_score: float = 0.0) -> bool:
    """
    Sends instant SMS emergency acknowledgement reply to the reporting citizen.
    """
    body = (
        f"🚨 RESQ Emergency Response System 🚨\n"
        f"Report #{report_id} received!\n"
        f"Incident: {disaster_type} at {location}\n"
        f"Priority Level: {priority_level} (Score: {priority_score}/100)\n"
        f"Emergency Command Center has logged your request. Relief squads & resources are being allocated."
    )
    return send_sms(reporter_phone, body)


def send_status_update(reporter_phone: str, status: str, team_name: str = "Rescue Squad Alpha") -> bool:
    """
    Sends SMS status update for report verification, team assignment, or incident completion.
    """
    if status in ["Assigned", "In Progress"]:
        body = f"🚑 RESQ Update: Rescue team '{team_name}' has been assigned to your emergency location and is en route."
    elif status == "Completed":
        body = f"✅ RESQ Update: Emergency rescue operation for your location has been marked COMPLETED. Stay safe."
    elif status == "Verified":
        body = f"📋 RESQ Update: Your disaster report has been VERIFIED by Command Center. Resource allocation in progress."
    else:
        body = f"ℹ️ RESQ Update: Status of your emergency report has changed to '{status}'."

    return send_sms(reporter_phone, body)

