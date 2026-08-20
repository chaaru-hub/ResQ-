"""
Route Optimization Engine using Dijkstra's Algorithm
Calculates shortest/most efficient emergency dispatch routes between central supply hubs 
and disaster incident locations using graph network routing.
"""

import math
import heapq
from typing import List, Dict, Any, Tuple

# Logistics Network Waypoints in Regional Grid (Chennai / Bay Area)
WAYPOINTS = {
    "HUB_CENTRAL": (13.0827, 80.2707),   # Central Logistics Hub
    "HUB_DEPOT_A": (13.0067, 80.2570),   # Adyar South Depot
    "HUB_WEST": (13.0067, 80.2020),      # Guindy Power Grid Base
    "HUB_TAMBARAM": (12.9229, 80.1275),  # Tambaram Staging Base
    "WAY_1": (13.0500, 80.2500),         # Mount Road Junction
    "WAY_2": (13.0200, 80.2300),         # Saidapet Bridge
    "WAY_3": (12.9800, 80.2200),         # Velachery Main Staging
    "WAY_4": (13.1000, 80.2800),         # Harbor Approach
    "WAY_5": (13.0400, 80.2000),         # Koyambedu Junction
}

def haversine_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """Calculates distance in kilometers between two lat/lng coordinates."""
    R = 6371.0 # Earth radius in km
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# Graph edges with distance weights
GRAPH = {
    "HUB_CENTRAL": [("WAY_1", 3.8), ("WAY_4", 2.5), ("WAY_5", 5.2)],
    "WAY_1": [("HUB_CENTRAL", 3.8), ("WAY_2", 3.5), ("HUB_DEPOT_A", 4.9)],
    "WAY_2": [("WAY_1", 3.5), ("HUB_WEST", 3.2), ("WAY_3", 4.1)],
    "WAY_3": [("WAY_2", 4.1), ("HUB_DEPOT_A", 3.6), ("HUB_TAMBARAM", 8.5)],
    "HUB_DEPOT_A": [("WAY_1", 4.9), ("WAY_3", 3.6)],
    "HUB_WEST": [("WAY_2", 3.2), ("WAY_5", 3.9), ("HUB_TAMBARAM", 9.2)],
    "HUB_TAMBARAM": [("WAY_3", 8.5), ("HUB_WEST", 9.2)],
    "WAY_4": [("HUB_CENTRAL", 2.5)],
    "WAY_5": [("HUB_CENTRAL", 5.2), ("HUB_WEST", 3.9)]
}

def calculate_dijkstra_route(
    start_coords: Tuple[float, float], 
    end_coords: Tuple[float, float]
) -> Dict[str, Any]:
    """
    Computes shortest path between start_coords and end_coords using Dijkstra's algorithm.
    """
    # Map start_coords & end_coords to nearest graph waypoints
    start_node = min(WAYPOINTS.keys(), key=lambda k: haversine_distance(start_coords, WAYPOINTS[k]))
    end_node = min(WAYPOINTS.keys(), key=lambda k: haversine_distance(end_coords, WAYPOINTS[k]))

    # Dijkstra setup
    distances = {node: float('inf') for node in WAYPOINTS}
    previous = {node: None for node in WAYPOINTS}
    distances[start_node] = 0
    pq = [(0, start_node)]

    while pq:
        current_dist, current_node = heapq.heappop(pq)

        if current_dist > distances[current_node]:
            continue

        if current_node == end_node:
            break

        for neighbor, weight in GRAPH.get(current_node, []):
            distance = current_dist + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                previous[neighbor] = current_node
                heapq.heappush(pq, (distance, neighbor))

    # Reconstruct path
    path_nodes = []
    curr = end_node
    while curr:
        path_nodes.insert(0, curr)
        curr = previous[curr]

    if not path_nodes or path_nodes[0] != start_node:
        path_nodes = [start_node, end_node]

    # Convert nodes to lat/lng route points
    route_points = [list(start_coords)] + [list(WAYPOINTS[n]) for n in path_nodes] + [list(end_coords)]
    
    total_km = round(
        haversine_distance(start_coords, WAYPOINTS[start_node]) +
        (distances[end_node] if distances[end_node] != float('inf') else 5.0) +
        haversine_distance(WAYPOINTS[end_node], end_coords),
        2
    )

    # Estimate dispatch ETA (assuming 40 km/h emergency speed)
    est_minutes = int(round((total_km / 40.0) * 60)) + 5

    return {
        "algorithm": "Dijkstra Shortest Path",
        "total_distance_km": total_km,
        "estimated_duration_mins": est_minutes,
        "start_node": start_node,
        "end_node": end_node,
        "waypoints_count": len(route_points),
        "path_coordinates": route_points
    }
