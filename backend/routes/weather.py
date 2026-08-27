"""
FastAPI Router - OpenWeather Map API Endpoints
Provides endpoints for live current weather, 5-day forecasts, disaster zone weather alerts,
and OpenWeather API Key status validation.
"""

import os
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel

from services.weather_service import (
    fetch_current_weather,
    fetch_weather_forecast,
    calculate_weather_risk,
    verify_openweather_key,
    get_api_key
)
from database import db_store

router = APIRouter(prefix="/api/weather", tags=["OpenWeather"])

class WeatherKeyConfig(BaseModel):
    api_key: str

@router.get("/status")
def get_weather_status():
    """Returns current OpenWeather API connection status and active configuration."""
    key = get_api_key()
    has_key = bool(key)
    masked_key = f"{key[:4]}...{key[-4:]}" if len(key) >= 8 else ("Configured" if has_key else "Not Set")
    
    return {
        "status": "Configured (Live)" if has_key else "Simulated Mode (No API Key)",
        "has_api_key": has_key,
        "masked_key": masked_key,
        "provider": "OpenWeatherMap API v2.5",
        "units_supported": ["metric", "imperial"]
    }

@router.get("/current")
def get_current_weather(
    lat: float = Query(13.0827, description="Latitude degree"),
    lon: float = Query(80.2707, description="Longitude degree"),
    location: Optional[str] = Query(None, description="Optional area or location name")
):
    """
    Fetch current weather and weather risk score for specified coordinates.
    """
    return fetch_current_weather(lat=lat, lon=lon, area_name=location or "")

@router.get("/forecast")
def get_weather_forecast(
    lat: float = Query(13.0827, description="Latitude degree"),
    lon: float = Query(80.2707, description="Longitude degree"),
    location: Optional[str] = Query(None, description="Optional location name")
):
    """
    Fetch 5-day / 3-hour interval weather forecast for specified coordinates.
    """
    return fetch_weather_forecast(lat=lat, lon=lon, area_name=location or "")

@router.get("/area/{area_id}")
def get_area_weather(area_id: str):
    """
    Fetch weather condition and hazard risk assessment specifically for an affected area ID.
    """
    areas = db_store.affected_areas
    target_area = next((a for a in areas if str(a.get("id")) == str(area_id)), None)
    
    if not target_area:
        raise HTTPException(status_code=404, detail=f"Affected Area ID '{area_id}' not found.")
        
    lat = float(target_area.get("latitude", 13.0827))
    lon = float(target_area.get("longitude", 80.2707))
    area_name = target_area.get("area_name", "Disaster Area")
    
    weather_data = fetch_current_weather(lat=lat, lon=lon, area_name=area_name)
    weather_data["area_id"] = area_id
    weather_data["area_severity"] = target_area.get("severity", "Medium")
    weather_data["population"] = target_area.get("population", 0)
    
    return weather_data

@router.get("/overview")
def get_weather_overview():
    """
    Fetch aggregated weather status, hazard warnings, and individual weather summaries
    across all active disaster response zones.
    """
    areas = db_store.affected_areas
    area_weathers = []
    all_hazards = set()
    total_risk_score = 0.0
    
    for area in areas:
        lat = float(area.get("latitude", 13.0827))
        lon = float(area.get("longitude", 80.2707))
        area_name = area.get("area_name", f"Area {area.get('id')}")
        
        w_data = fetch_current_weather(lat=lat, lon=lon, area_name=area_name)
        risk = w_data.get("risk_assessment", {})
        
        total_risk_score += risk.get("weather_risk_score", 0.0)
        for h in risk.get("active_hazards", []):
            if h != "Normal Weather Conditions":
                all_hazards.add(h)
                
        area_weathers.append({
            "area_id": area.get("id"),
            "area_name": area_name,
            "disaster_id": area.get("disaster_id"),
            "latitude": lat,
            "longitude": lon,
            "severity": area.get("severity", "Medium"),
            "weather_temp": w_data.get("main", {}).get("temp"),
            "weather_feels_like": w_data.get("main", {}).get("feels_like"),
            "weather_description": w_data.get("weather", [{}])[0].get("description", "N/A"),
            "weather_icon": w_data.get("weather", [{}])[0].get("icon", "01d"),
            "humidity": w_data.get("main", {}).get("humidity"),
            "wind_speed_kmh": risk.get("wind_kmh", 0.0),
            "rain_mm_h": risk.get("rain_mm_h", 0.0),
            "weather_risk_score": risk.get("weather_risk_score", 0.0),
            "risk_level": risk.get("risk_level", "Low"),
            "active_hazards": risk.get("active_hazards", []),
            "is_live": w_data.get("is_live", False)
        })
        
    avg_risk = round(total_risk_score / len(areas), 1) if areas else 0.0
    
    return {
        "total_monitored_areas": len(areas),
        "average_weather_risk_score": avg_risk,
        "active_hazard_warnings": list(all_hazards),
        "areas_weather": area_weathers,
        "has_live_api": any(w.get("is_live", False) for w in area_weathers),
        "source": "OpenWeatherMap API" if any(w.get("is_live", False) for w in area_weathers) else "Simulated OpenWeather Engine"
    }

@router.post("/config")
def configure_openweather_key(config: WeatherKeyConfig):
    """
    Test and set OpenWeather API Key for runtime server session.
    """
    key = config.api_key.strip()
    result = verify_openweather_key(key)
    
    if result.get("valid"):
        os.environ["OPENWEATHER_API_KEY"] = key
        
    return {
        "success": result.get("valid", False),
        "message": result.get("message"),
        "is_live": result.get("is_live", False),
        "active_key_preview": f"{key[:4]}...{key[-4:]}" if len(key) >= 8 else key
    }
