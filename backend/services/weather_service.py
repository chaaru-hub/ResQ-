"""
OpenWeatherMap API Integration Service for ResQ Disaster System
Provides live real-time weather monitoring, 5-day forecasts, disaster weather risk calculation,
and OpenWeather API connectivity testing with a robust fallback engine.
"""

import os
import json
import urllib.request
import urllib.parse
import math
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

def get_api_key() -> str:
    """Retrieve configured OpenWeather API Key from environment or runtime state."""
    key = os.getenv("OPENWEATHER_API_KEY", "") or os.getenv("VITE_OPENWEATHER_API_KEY", "")
    return key.strip()

def _simulate_weather(lat: float, lon: float, area_name: str = "") -> Dict[str, Any]:
    """
    Generates realistic, coordinate-deterministic simulated OpenWeather-formatted data
    when live API key is unavailable or offline.
    """
    # Use coords to deterministically seed realistic variation
    seed = (abs(lat) * 100 + abs(lon) * 10)
    now_ts = int(datetime.utcnow().timestamp())
    
    # Define weather condition profiles based on location & seed
    hash_val = int(seed) % 5
    if hash_val == 0:
        main_cond = "Rain"
        desc = "Heavy Intensity Rain & Thunderstorm"
        icon = "11d"
        temp = round(27.4 + (lat % 3), 1)
        humidity = 88
        wind_speed = round(14.5 + (lon % 4), 1)
        rain_1h = 18.5
        pressure = 1004
    elif hash_val == 1:
        main_cond = "Thunderstorm"
        desc = "Severe Squall & Tropical Thunderstorm"
        icon = "11d"
        temp = round(26.2 + (lat % 2), 1)
        humidity = 92
        wind_speed = round(22.8 + (lon % 5), 1)
        rain_1h = 32.0
        pressure = 998
    elif hash_val == 2:
        main_cond = "Clouds"
        desc = "Overcast Clouds & High Humidity"
        icon = "04d"
        temp = round(29.8 + (lat % 4), 1)
        humidity = 76
        wind_speed = round(8.2 + (lon % 3), 1)
        rain_1h = 2.1
        pressure = 1010
    elif hash_val == 3:
        main_cond = "Drizzle"
        desc = "Light Coastal Drizzle"
        icon = "09d"
        temp = round(28.1 + (lat % 2), 1)
        humidity = 84
        wind_speed = round(11.0 + (lon % 2), 1)
        rain_1h = 5.4
        pressure = 1008
    else:
        main_cond = "Clear"
        desc = "Clear Sky"
        icon = "01d"
        temp = round(31.5 + (lat % 3), 1)
        humidity = 62
        wind_speed = round(6.5 + (lon % 2), 1)
        rain_1h = 0.0
        pressure = 1012

    feels_like = round(temp + (humidity * 0.05), 1)

    return {
        "coord": {"lat": lat, "lon": lon},
        "weather": [
            {
                "id": 502 if main_cond == "Rain" else (211 if main_cond == "Thunderstorm" else 804),
                "main": main_cond,
                "description": desc,
                "icon": icon
            }
        ],
        "base": "stations",
        "main": {
            "temp": temp,
            "feels_like": feels_like,
            "temp_min": round(temp - 2.5, 1),
            "temp_max": round(temp + 3.0, 1),
            "pressure": pressure,
            "humidity": humidity,
            "sea_level": pressure,
            "grnd_level": pressure - 4
        },
        "visibility": 7000 if main_cond in ["Rain", "Thunderstorm"] else 10000,
        "wind": {
            "speed": wind_speed, # m/s or converted
            "deg": int((lat * 20 + lon * 10) % 360),
            "gust": round(wind_speed * 1.4, 1)
        },
        "rain": {"1h": rain_1h} if rain_1h > 0 else {},
        "clouds": {"all": 85 if main_cond in ["Rain", "Thunderstorm", "Clouds"] else 20},
        "dt": now_ts,
        "sys": {
            "type": 1,
            "id": 9218,
            "country": "IN",
            "sunrise": now_ts - 21600,
            "sunset": now_ts + 21600
        },
        "timezone": 19800,
        "id": int(abs(lat * 1000 + lon * 1000)),
        "name": area_name or f"Sector ({lat:.2f}, {lon:.2f})",
        "cod": 200,
        "is_live": False,
        "source": "Simulated Weather Engine (OpenWeather Compatible)"
    }

def fetch_current_weather(lat: float, lon: float, area_name: str = "") -> Dict[str, Any]:
    """
    Fetches real-time weather from OpenWeatherMap API for given coordinates,
    falling back to simulated weather data if key is missing/invalid.
    """
    api_key = get_api_key()
    if not api_key:
        data = _simulate_weather(lat, lon, area_name)
        data["risk_assessment"] = calculate_weather_risk(data)
        return data

    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "ResQ-Disaster-System/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                body = json.loads(resp.read().decode("utf-8"))
                body["is_live"] = True
                body["source"] = "OpenWeather API (Live)"
                if area_name and not body.get("name"):
                    body["name"] = area_name
                body["risk_assessment"] = calculate_weather_risk(body)
                return body
    except Exception as e:
        print(f"[OpenWeather Service] API fetch error ({e}). Using simulation engine.")

    fallback = _simulate_weather(lat, lon, area_name)
    fallback["risk_assessment"] = calculate_weather_risk(fallback)
    return fallback

def fetch_weather_forecast(lat: float, lon: float, area_name: str = "") -> Dict[str, Any]:
    """
    Fetches 5-day / 3-hour interval weather forecast from OpenWeather API or fallback generator.
    """
    api_key = get_api_key()
    if api_key:
        url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "ResQ-Disaster-System/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    body = json.loads(resp.read().decode("utf-8"))
                    body["is_live"] = True
                    body["source"] = "OpenWeather API (Live)"
                    return body
        except Exception as e:
            print(f"[OpenWeather Forecast] API fetch error: {e}")

    # Fallback simulated forecast list (8 steps over next 24-48 hours)
    now = datetime.utcnow()
    list_items = []
    base_temp = round(28.0 + (lat % 4), 1)
    
    for i in range(8):
        future_dt = now + timedelta(hours=i * 3)
        ts = int(future_dt.timestamp())
        is_rain = (i % 3 == 1 or i % 3 == 2)
        temp_val = round(base_temp + math.sin(i * 0.8) * 3.5, 1)
        
        list_items.append({
            "dt": ts,
            "main": {
                "temp": temp_val,
                "feels_like": round(temp_val + 2.0, 1),
                "temp_min": round(temp_val - 1.5, 1),
                "temp_max": round(temp_val + 1.5, 1),
                "pressure": 1005 - (i % 3),
                "humidity": 85 if is_rain else 65
            },
            "weather": [
                {
                    "id": 500 if is_rain else 800,
                    "main": "Rain" if is_rain else "Clear",
                    "description": "Moderate Rain" if is_rain else "Few Clouds",
                    "icon": "10d" if is_rain else "01d"
                }
            ],
            "clouds": {"all": 75 if is_rain else 20},
            "wind": {"speed": round(8.5 + (i * 1.2), 1), "deg": 140},
            "visibility": 8000 if is_rain else 10000,
            "pop": 0.85 if is_rain else 0.15,
            "rain": {"3h": 12.4} if is_rain else {},
            "dt_txt": future_dt.strftime("%Y-%m-%d %H:%M:%S")
        })

    return {
        "cod": "200",
        "message": 0,
        "cnt": len(list_items),
        "list": list_items,
        "city": {
            "name": area_name or f"Sector ({lat:.2f}, {lon:.2f})",
            "coord": {"lat": lat, "lon": lon},
            "country": "IN"
        },
        "is_live": False,
        "source": "Simulated Weather Engine"
    }

def calculate_weather_risk(weather_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes a Disaster Weather Hazard Index (0-100) and extracts active warnings.
    """
    risk_score = 10.0
    hazards = []
    
    # 1. Rain & Precipitation Impact
    rain_data = weather_data.get("rain", {})
    rain_1h = rain_data.get("1h", 0.0) or rain_data.get("3h", 0.0) / 3.0
    weather_main = ""
    weather_desc = ""
    if weather_data.get("weather") and len(weather_data["weather"]) > 0:
        weather_main = weather_data["weather"][0].get("main", "")
        weather_desc = weather_data["weather"][0].get("description", "").lower()

    if "thunderstorm" in weather_main.lower() or "thunderstorm" in weather_desc:
        risk_score += 35.0
        hazards.append("Severe Thunderstorm Warning")
    elif "rain" in weather_main.lower() or rain_1h > 0:
        if rain_1h > 20 or "heavy" in weather_desc:
            risk_score += 30.0
            hazards.append("Flash Flood / Torrential Rain Alert")
        elif rain_1h > 5:
            risk_score += 18.0
            hazards.append("Moderate Rainfall Impact")
        else:
            risk_score += 8.0
            hazards.append("Light Precipitation")

    # 2. Wind Speed & Squall Hazard (m/s convert to km/h)
    wind_obj = weather_data.get("wind", {})
    wind_ms = wind_obj.get("speed", 0.0)
    wind_kmh = wind_ms * 3.6 if wind_ms < 100 else wind_ms # check if m/s or km/h
    
    if wind_kmh > 60 or "squall" in weather_desc or "gale" in weather_desc:
        risk_score += 30.0
        hazards.append("Gale-Force Winds / Severe Storm Risk")
    elif wind_kmh > 35:
        risk_score += 15.0
        hazards.append("High Winds (Drone & Helicopter Advisory)")
    elif wind_kmh > 20:
        risk_score += 8.0

    # 3. Atmospheric Pressure (Low pressure = Storm / Cyclone system)
    pressure = weather_data.get("main", {}).get("pressure", 1013)
    if pressure < 1000:
        risk_score += 20.0
        hazards.append("Low Atmospheric Pressure (Cyclone / Storm Cell)")
    elif pressure < 1005:
        risk_score += 10.0

    # 4. Temperature Extremes
    temp = weather_data.get("main", {}).get("temp", 25.0)
    if temp > 42.0:
        risk_score += 20.0
        hazards.append("Extreme Heatwave Risk")
    elif temp < 5.0:
        risk_score += 15.0
        hazards.append("Severe Cold Wave")

    # 5. Low Visibility
    visibility = weather_data.get("visibility", 10000)
    if visibility < 3000:
        risk_score += 10.0
        hazards.append("Low Visibility Navigation Warning")

    final_score = min(100.0, round(risk_score, 1))
    
    if final_score >= 75.0:
        level = "Extreme"
    elif final_score >= 50.0:
        level = "High"
    elif final_score >= 30.0:
        level = "Moderate"
    else:
        level = "Low"

    return {
        "weather_risk_score": final_score,
        "risk_level": level,
        "active_hazards": hazards if hazards else ["Normal Weather Conditions"],
        "wind_kmh": round(wind_kmh, 1),
        "rain_mm_h": round(rain_1h, 1),
        "pressure_hpa": pressure,
        "temperature_c": temp
    }

def verify_openweather_key(api_key: str) -> Dict[str, Any]:
    """
    Sends a test request to OpenWeather API to check key validity.
    """
    if not api_key or not api_key.strip():
        return {
            "valid": False,
            "message": "API key is empty.",
            "is_live": False
        }

    clean_key = api_key.strip()
    url = f"https://api.openweathermap.org/data/2.5/weather?lat=13.0827&lon=80.2707&appid={clean_key}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "ResQ-Key-Tester/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                return {
                    "valid": True,
                    "message": "OpenWeather API Key verified successfully!",
                    "is_live": True
                }
    except urllib.error.HTTPError as e:
        if e.code == 401:
            return {"valid": False, "message": "Invalid OpenWeather API Key (401 Unauthorized).", "is_live": False}
        return {"valid": False, "message": f"OpenWeather API returned status code {e.code}.", "is_live": False}
    except Exception as e:
        return {"valid": False, "message": f"Connection error: {str(e)}", "is_live": False}

    return {"valid": False, "message": "Verification failed.", "is_live": False}
