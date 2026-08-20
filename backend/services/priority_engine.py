"""
Priority Calculation Engine & Priority Queue Manager for Disaster Reports
Formula:
Priority Score = 0.40 * Severity + 0.25 * Population + 0.20 * Urgency + 0.15 * Resource Shortage
Score Range: 0 - 100

Classification:
0 - 30   = LOW
31 - 60  = MEDIUM
61 - 80  = HIGH
81 - 100 = CRITICAL
"""

import heapq
from typing import Dict, Any, Tuple, List

SEVERITY_MAPPING = {
    "Critical": 100.0,
    "High": 75.0,
    "Medium": 50.0,
    "Low": 25.0,
    "Unknown": 30.0
}

URGENCY_MAPPING = {
    "Critical": 100.0,
    "High": 75.0,
    "Medium": 50.0,
    "Low": 25.0,
    "Unknown": 30.0
}

def calculate_report_priority(
    severity: str, 
    people_affected: int, 
    urgency: str, 
    resource_count: int
) -> Tuple[float, str, Dict[str, float]]:
    """
    Computes report priority score (0 - 100) and classification label.
    """
    # 1. Severity Score (0 - 100)
    sev_score = SEVERITY_MAPPING.get(severity, 50.0)

    # 2. Population Score (0 - 100)
    pop = float(max(0, people_affected))
    if severity == "Critical" or urgency == "Critical":
        # Trapped victims in critical emergencies scale up faster
        pop_score = max(60.0, min(100.0, (pop / 20.0) * 100.0)) if pop > 0 else 40.0
    else:
        pop_score = min(100.0, (pop / 50.0) * 100.0) if pop > 0 else 20.0

    # 3. Urgency Score (0 - 100)
    urg_score = URGENCY_MAPPING.get(urgency, 50.0)

    # 4. Resource Shortage Score (0 - 100)
    # Each required resource type adds 33.3 points, capped at 100
    res_score = min(100.0, float(resource_count) * 33.3) if resource_count > 0 else 20.0

    # Weighted Sum Formula
    raw_score = (
        0.40 * sev_score +
        0.25 * pop_score +
        0.20 * urg_score +
        0.15 * res_score
    )

    priority_score = round(max(0.0, min(100.0, raw_score)), 1)

    # Classification
    if priority_score >= 81.0:
        priority_level = "Critical"
    elif priority_score >= 61.0:
        priority_level = "High"
    elif priority_score >= 31.0:
        priority_level = "Medium"
    else:
        priority_level = "Low"

    breakdown = {
        "severity_component": round(0.40 * sev_score, 1),
        "population_component": round(0.25 * pop_score, 1),
        "urgency_component": round(0.20 * urg_score, 1),
        "resource_component": round(0.15 * res_score, 1)
    }

    return priority_score, priority_level, breakdown


class PriorityQueueManager:
    """
    Priority Queue implementation using Python heapq.
    Maintains disaster reports sorted by priority_score descending.
    """
    def __init__(self):
        self._heap: List[Tuple[float, int, Dict[str, Any]]] = []
        self._counter = 0

    def push(self, report: Dict[str, Any]):
        # Negate priority_score so largest score comes first in min-heap
        score = float(report.get("priority_score", 0.0))
        self._counter += 1
        heapq.heappush(self._heap, (-score, self._counter, report))

    def pop(self) -> Dict[str, Any]:
        if not self._heap:
            return None
        _, _, report = heapq.heappop(self._heap)
        return report

    def peek_sorted_reports(self) -> List[Dict[str, Any]]:
        """Returns all reports sorted by priority score descending."""
        sorted_items = sorted(self._heap, key=lambda item: item[0])
        return [item[2] for item in sorted_items]

    def clear(self):
        self._heap = []
        self._counter = 0


# Global priority queue instance
priority_queue = PriorityQueueManager()
