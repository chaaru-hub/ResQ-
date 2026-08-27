"""
Legacy Compatibility Layer: Redirects legacy WhatsApp calls to SMS Service Engine.
"""

from typing import Dict, Any
from services.sms_service import process_incoming_sms

def process_incoming_whatsapp_message(payload: Dict[str, Any], source: str = "SMS") -> Dict[str, Any]:
    """Legacy redirect to process_incoming_sms."""
    return process_incoming_sms(payload, source=source)
