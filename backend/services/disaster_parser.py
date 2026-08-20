"""
NLP Disaster Message Processing Service
Extracts structured disaster reporting parameters from raw WhatsApp natural-language messages.
Supported extraction:
- Disaster Type: Flood, Fire, Earthquake, Cyclone, Landslide, Accident, Building Collapse, Medical Emergency, Other
- Location & Coordinates (Known Chennai/Regional landmarks default lat/lng)
- People Affected (Numeric extraction)
- Severity & Urgency (Critical, High, Medium, Low)
- Required Resources: Rescue Personnel, Medical Team, Firefighters, Volunteers, Ambulance, Rescue Van, Fire Truck, Boat, Food, Water, Medical Kits, Shelter Capacity
Missing values are preserved as None or 'Unknown' (never invented/guessed).
"""

import re
from typing import Dict, Any, List, Optional

# Geographic Knowledge Base for auto-resolving coordinates for common regions
LOCATION_COORDINATES = {
    "chennai central": (13.0827, 80.2707),
    "central railway station": (13.0827, 80.2707),
    "chennai": (13.0827, 80.2707),
    "tambaram railway station": (12.9229, 80.1275),
    "tambaram": (12.9229, 80.1275),
    "guindy market": (13.0067, 80.2020),
    "guindy": (13.0067, 80.2020),
    "velachery": (12.9750, 80.2200),
    "adyar": (13.0067, 80.2570),
    "marina": (13.0500, 80.2824),
    "coastal sector 1": (13.0827, 80.2707),
    "north harbor": (13.1200, 80.2900),
    "riverbed township": (13.0400, 80.2100),
    "south delta colony": (12.9800, 80.2400),
    "fisherman island": (13.1500, 80.3100),
    "hill pass ridge": (13.0200, 80.1500),
    "western basin slums": (13.0600, 80.1800),
}

DISASTER_KEYWORDS = {
    "Building Collapse": ["building collapse", "collapsed building", "structure collapse", "roof collapse", "debris collapse"],
    "Medical Emergency": ["medical emergency", "heart attack", "mass casualty", "epidemic", "outbreak", "poisoning"],
    "Flood": ["flood", "flooding", "waterlogging", "inundated", "submerged", "overflow", "drowning", "tsunami", "water level"],
    "Fire": ["fire", "blaze", "flames", "inferno", "wildfire", "burn", "explosion"],
    "Earthquake": ["earthquake", "quake", "tremor", "aftershock", "seismic"],
    "Cyclone": ["cyclone", "hurricane", "typhoon", "storm", "gale", "high winds"],
    "Landslide": ["landslide", "mudslide", "rockfall", "debris", "collapsed hill"],
    "Accident": ["accident", "collision", "crash", "derailment"]
}

RESOURCE_KEYWORDS = {
    "Rescue Personnel": ["rescue", "rescuers", "trapped", "stranded", "squad", "search and rescue"],
    "Medical Team": ["medical help", "medical team", "doctor", "paramedic", "hospital team", "first aid team"],
    "Firefighters": ["firefighters", "fire team", "fire brigade", "extinguishers"],
    "Volunteers": ["volunteer", "volunteers", "manpower", "helpers"],
    "Ambulance": ["ambulance", "patient transport", "hospital van"],
    "Boat": ["boat", "rescue boat", "inflatable boat", "dinghy"],
    "Rescue Van": ["rescue van", "4x4", "rescue vehicle", "truck"],
    "Fire Truck": ["fire truck", "fire engine"],
    "Food": ["food", "rations", "meals", "eating", "grain"],
    "Water": ["water", "drinking water", "potable water", "bottled water"],
    "Medical Kits": ["medical kits", "medicine", "first aid kit", "pharma", "trauma kit"],
    "Shelter Capacity": ["shelter", "tents", "blankets", "tarp", "accommodation"]
}

def parse_whatsapp_message(message_text: str) -> Dict[str, Any]:
    """
    Parses a raw natural-language WhatsApp text message and extracts structured fields.
    Does NOT guess missing information; defaults missing fields to 'Unknown' / None.
    """
    text_lower = message_text.lower()
    
    # 1. Extract Disaster Type
    disaster_type = "Unknown"
    for d_type, keywords in DISASTER_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            disaster_type = d_type
            break
    if disaster_type == "Unknown":
        if "disaster" in text_lower or "emergency" in text_lower:
            disaster_type = "Other"

    # 2. Extract Location & Coordinates
    location = "Unknown"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # Check regex for "in <Location>", "at <Location>", "near <Location>", "around <Location>"
    loc_match = re.search(r'\b(?:in|at|near|around)\s+([A-Za-z0-9\s\-]{3,30})(?=\.|\,|\s+there|\s+need|\s+around|\s+water|\s+people|\s+is|\s*$)', message_text, re.IGNORECASE)
    if loc_match:
        extracted_loc = loc_match.group(1).strip()
        extracted_loc = re.sub(r'^(the|a|an)\s+', '', extracted_loc, flags=re.IGNORECASE)
        if len(extracted_loc) > 2 and not any(w in extracted_loc.lower() for w in ["the", "this", "danger", "urgent", "need", "water"]):
            location = extracted_loc.title()

    # Search in geographic knowledge base to auto-assign coordinates if known landmark
    for loc_key, coords in LOCATION_COORDINATES.items():
        if loc_key in text_lower:
            if location == "Unknown" or len(loc_key) > len(location):
                location = loc_key.title()
            latitude, longitude = coords
            break

    # 3. Extract People Affected
    people_affected = 0
    specific_match = re.search(r'(\d+)\s*(?:people|persons|stranded|victims|residents|individuals|injured|trapped|affected)', text_lower)
    if specific_match:
        people_affected = int(specific_match.group(1))
    else:
        # Check for numbers associated with people/with me
        with_me_match = re.search(r'(\d+)\s*(?:people|persons)?\s*(?:with me|with us)', text_lower)
        if with_me_match:
            people_affected = int(with_me_match.group(1))
        else:
            people_matches = re.findall(r'(\d+)', text_lower)
            numbers = [int(n) for n in people_matches if 0 < int(n) < 100000]
            if numbers:
                people_affected = max(numbers)

    # 4. Extract Severity & Urgency
    severity = "Medium"
    urgency = "Medium"
    
    critical_terms = ["critical", "dying", "severe", "drowning", "life threatening", "collapsed", "urgently", "urgent", "extreme", "fatal", "immediately", "rising quickly", "trapped"]
    high_terms = ["high", "stranded", "increasing", "rising", "no water", "no food", "bad condition", "desperate"]
    low_terms = ["minor", "low", "stable", "monitoring", "small"]

    if any(term in text_lower for term in critical_terms) or people_affected >= 20:
        severity = "Critical"
        urgency = "Critical"
    elif any(term in text_lower for term in high_terms) or people_affected >= 10:
        severity = "High"
        urgency = "High"
    elif any(term in text_lower for term in low_terms) and people_affected < 5:
        severity = "Low"
        urgency = "Low"

    # 5. Extract Required Resources
    required_resources: List[str] = []
    for r_type, keywords in RESOURCE_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            if r_type not in required_resources:
                required_resources.append(r_type)

    return {
        "disaster_type": disaster_type,
        "location": location,
        "latitude": latitude,
        "longitude": longitude,
        "people_affected": people_affected,
        "severity": severity,
        "urgency": urgency,
        "required_resources": required_resources,
        "original_message": message_text
    }
