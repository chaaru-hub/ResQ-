"""
Priority Calculation Engine
Calculates dynamic emergency priority scores (0 - 100) based on weighted factors:
- Disaster Severity (30 pts max)
- Population Affected (20 pts max)
- Medical Emergency Ratio (25 pts max)
- Resource Shortage Ratio (15 pts max)
- Vulnerable Population / Time Urgency (10 pts max)
"""

from typing import Dict, Any

# Configurable Weights (Can be updated via API / settings)
DEFAULT_WEIGHTS = {
    "severity_max": 30.0,
    "population_max": 20.0,
    "medical_max": 25.0,
    "resource_shortage_max": 15.0,
    "vulnerability_max": 10.0,
}

SEVERITY_LEVELS = {
    "Critical": 1.0,
    "High": 0.75,
    "Medium": 0.50,
    "Low": 0.25,
}

def calculate_priority_score(area: Dict[str, Any], custom_weights: Dict[str, float] = None) -> Dict[str, Any]:
    """
    Computes priority score (0-100) and classification for an affected area.
    """
    weights = {**DEFAULT_WEIGHTS, **(custom_weights or {})}
    
    # 1. Severity Factor (0 to 30)
    sev_str = area.get("severity", "Medium")
    sev_factor = SEVERITY_LEVELS.get(sev_str, 0.5)
    sev_score = sev_factor * weights["severity_max"]
    
    # 2. Population Factor (Scaled log or capped linear, 0 to 20)
    # Assume 10,000+ affected population gets full 20 points
    pop = float(area.get("population", 0))
    pop_factor = min(1.0, pop / 10000.0)
    pop_score = pop_factor * weights["population_max"]
    
    # 3. Medical Emergency Factor (0 to 25)
    # Medical cases ratio relative to population or absolute severity
    medical_cases = float(area.get("medical_cases", 0))
    if pop > 0:
        med_ratio = min(1.0, (medical_cases / pop) * 20.0) # 5% medical cases is severe
    else:
        med_ratio = min(1.0, medical_cases / 300.0)
    med_score = med_ratio * weights["medical_max"]
    
    # 4. Resource Shortage Factor (0 to 15)
    # Aggregated demand of food, water, medicine
    food_req = float(area.get("food_required", 0))
    water_req = float(area.get("water_required", 0))
    med_req = float(area.get("medicine_required", 0))
    total_req = food_req + water_req + med_req
    shortage_factor = min(1.0, total_req / 5000.0)
    shortage_score = shortage_factor * weights["resource_shortage_max"]
    
    # 5. Vulnerable Population Factor (0 to 10)
    vulnerable = float(area.get("vulnerable_population", 0))
    if pop > 0:
        vuln_factor = min(1.0, vulnerable / pop)
    else:
        vuln_factor = min(1.0, vulnerable / 2000.0)
    vuln_score = vuln_factor * weights["vulnerability_max"]
    
    # Total Score (0 - 100)
    total_score = round(sev_score + pop_score + med_score + shortage_score + vuln_score, 1)
    total_score = max(0.0, min(100.0, total_score))
    
    # Classification
    if total_score >= 80.0:
        classification = "Critical"
    elif total_score >= 60.0:
        classification = "High"
    elif total_score >= 40.0:
        classification = "Medium"
    else:
        classification = "Low"
        
    return {
        "score": total_score,
        "classification": classification,
        "breakdown": {
            "severity_score": round(sev_score, 1),
            "population_score": round(pop_score, 1),
            "medical_score": round(med_score, 1),
            "shortage_score": round(shortage_score, 1),
            "vulnerability_score": round(vuln_score, 1)
        }
    }
