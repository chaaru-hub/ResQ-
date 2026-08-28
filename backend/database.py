"""
Database Store & Supabase Connection Handler
Handles live Supabase connection with local state fallback to ensure 
instant, reliable, robust operation out-of-the-box.
"""

import os
import uuid
from datetime import datetime
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", ""))

supabase_client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(" Connected to Supabase PostgreSQL database.")
    except Exception as e:
        print(f" Supabase init notice: {e}. Defaulting to hybrid memory database engine.")

# In-Memory Realistic Demo Storage Engine
INITIAL_DISASTERS = [
    {
        "id": "d101",
        "name": "Cyclone Vardah Relief & Storm Emergency",
        "type": "Cyclone",
        "location": "Coastal Zone - East Bay",
        "severity": "Critical",
        "description": "Category 4 tropical cyclone causing coastal inundation, power grid breakdown, and mass displacement.",
        "date": "2026-08-10",
        "status": "Active",
        "created_at": "2026-08-10T08:00:00Z"
    },
    {
        "id": "d102",
        "name": "River Kaveri Flash Flooding",
        "type": "Flood",
        "location": "Central River Basin & Lowlands",
        "severity": "High",
        "description": "Heavy monsoon discharge inundating 12 low-lying residential sectors and agricultural blocks.",
        "date": "2026-08-11",
        "status": "Active",
        "created_at": "2026-08-11T09:30:00Z"
    },
    {
        "id": "d103",
        "name": "Western Ghats Landslide Emergency",
        "type": "Landslide",
        "location": "Mountain Ridge Sector 4",
        "severity": "Medium",
        "description": "Mudslide blocking national arterial highways and cutting off communications to remote villages.",
        "date": "2026-08-12",
        "status": "Monitoring",
        "created_at": "2026-08-12T14:15:00Z"
    }
]

INITIAL_AREAS = [
    {
        "id": "a1",
        "disaster_id": "d101",
        "area_name": "Area A - Coastal Sector 1",
        "population": 8500,
        "severity": "Critical",
        "medical_cases": 280,
        "vulnerable_population": 2100,
        "latitude": 13.0827,
        "longitude": 80.2707,
        "food_required": 2200,
        "water_required": 3500,
        "medicine_required": 450,
        "priority_score": 94.2,
        "status": "Critical"
    },
    {
        "id": "a2",
        "disaster_id": "d101",
        "area_name": "Area B - North Harbor",
        "population": 6200,
        "severity": "Critical",
        "medical_cases": 190,
        "vulnerable_population": 1400,
        "latitude": 13.1200,
        "longitude": 80.2900,
        "food_required": 1800,
        "water_required": 2600,
        "medicine_required": 320,
        "priority_score": 87.5,
        "status": "Critical"
    },
    {
        "id": "a3",
        "disaster_id": "d102",
        "area_name": "Area C - Riverbed Township",
        "population": 9400,
        "severity": "High",
        "medical_cases": 140,
        "vulnerable_population": 1800,
        "latitude": 13.0400,
        "longitude": 80.2100,
        "food_required": 2500,
        "water_required": 4000,
        "medicine_required": 280,
        "priority_score": 78.4,
        "status": "High"
    },
    {
        "id": "a4",
        "disaster_id": "d102",
        "area_name": "Area D - South Delta Colony",
        "population": 4800,
        "severity": "High",
        "medical_cases": 95,
        "vulnerable_population": 900,
        "latitude": 12.9800,
        "longitude": 80.2400,
        "food_required": 1200,
        "water_required": 2000,
        "medicine_required": 160,
        "priority_score": 71.1,
        "status": "High"
    },
    {
        "id": "a5",
        "disaster_id": "d101",
        "area_name": "Area E - Fisherman Island",
        "population": 3100,
        "severity": "Critical",
        "medical_cases": 125,
        "vulnerable_population": 750,
        "latitude": 13.1500,
        "longitude": 80.3100,
        "food_required": 1100,
        "water_required": 1600,
        "medicine_required": 210,
        "priority_score": 89.0,
        "status": "Critical"
    },
    {
        "id": "a6",
        "disaster_id": "d103",
        "area_name": "Area F - Hill Pass Ridge",
        "population": 2400,
        "severity": "Medium",
        "medical_cases": 45,
        "vulnerable_population": 420,
        "latitude": 13.0100,
        "longitude": 80.1500,
        "food_required": 800,
        "water_required": 1200,
        "medicine_required": 90,
        "priority_score": 56.3,
        "status": "Medium"
    },
    {
        "id": "a7",
        "disaster_id": "d102",
        "area_name": "Area G - Western Basin Slums",
        "population": 7100,
        "severity": "High",
        "medical_cases": 160,
        "vulnerable_population": 1600,
        "latitude": 13.0600,
        "longitude": 80.1800,
        "food_required": 2100,
        "water_required": 3100,
        "medicine_required": 240,
        "priority_score": 76.8,
        "status": "High"
    },
    {
        "id": "a8",
        "disaster_id": "d103",
        "area_name": "Area H - Highland Village",
        "population": 1800,
        "severity": "Low",
        "medical_cases": 15,
        "vulnerable_population": 220,
        "latitude": 13.1800,
        "longitude": 80.1200,
        "food_required": 500,
        "water_required": 800,
        "medicine_required": 40,
        "priority_score": 38.5,
        "status": "Low"
    },
    {
        "id": "a9",
        "disaster_id": "d101",
        "area_name": "Area I - Industrial Belt Shelter",
        "population": 5500,
        "severity": "High",
        "medical_cases": 110,
        "vulnerable_population": 850,
        "latitude": 13.1000,
        "longitude": 80.2200,
        "food_required": 1600,
        "water_required": 2400,
        "medicine_required": 180,
        "priority_score": 68.2,
        "status": "High"
    },
    {
        "id": "a10",
        "disaster_id": "d102",
        "area_name": "Area J - Central Railway Depot",
        "population": 3900,
        "severity": "Medium",
        "medical_cases": 50,
        "vulnerable_population": 500,
        "latitude": 13.0750,
        "longitude": 80.2600,
        "food_required": 950,
        "water_required": 1400,
        "medicine_required": 110,
        "priority_score": 52.1,
        "status": "Medium"
    }
]

INITIAL_RESOURCES = [
    # Essential Supplies
    {"id": "r1", "resource_name": "Food Rations Packets", "resource_type": "Food", "category": "Essential Supplies", "quantity_available": 18500, "quantity_allocated": 11200, "unit": "packets", "location": "Central Logistics Hub", "minimum_threshold": 3000},
    {"id": "r2", "resource_name": "Potable Water Cans (20L)", "resource_type": "Drinking Water", "category": "Essential Supplies", "quantity_available": 26000, "quantity_allocated": 17500, "unit": "cans", "location": "Water Purification Base A", "minimum_threshold": 5000},
    {"id": "r3", "resource_name": "Essential Trauma & Antibiotic Kits", "resource_type": "Medicine", "category": "Essential Supplies", "quantity_available": 2800, "quantity_allocated": 1650, "unit": "kits", "location": "Apex Medical Depot", "minimum_threshold": 500},
    {"id": "r4", "resource_name": "Thermal Wool Blankets", "resource_type": "Blankets", "category": "Essential Supplies", "quantity_available": 4500, "quantity_allocated": 2200, "unit": "pieces", "location": "Central Logistics Hub", "minimum_threshold": 1000},
    {"id": "r5", "resource_name": "Emergency Clothing Kits", "resource_type": "Clothes", "category": "Essential Supplies", "quantity_available": 3200, "quantity_allocated": 1400, "unit": "sets", "location": "Central Logistics Hub", "minimum_threshold": 800},
    # Emergency Equipment
    {"id": "r6", "resource_name": "Field Trauma First Aid Kits", "resource_type": "First Aid Kits", "category": "Emergency Equipment", "quantity_available": 1200, "quantity_allocated": 750, "unit": "kits", "location": "Apex Medical Depot", "minimum_threshold": 200},
    {"id": "r7", "resource_name": "High-Pressure Oxygen Cylinders", "resource_type": "Oxygen Cylinders", "category": "Emergency Equipment", "quantity_available": 650, "quantity_allocated": 410, "unit": "cylinders", "location": "Apex Medical Depot", "minimum_threshold": 100},
    {"id": "r8", "resource_name": "Heavy-Duty Hydraulic Rescue Cutters", "resource_type": "Rescue Equipment", "category": "Emergency Equipment", "quantity_available": 140, "quantity_allocated": 95, "unit": "sets", "location": "NDRF Armory", "minimum_threshold": 30},
    {"id": "r9", "resource_name": "Mobile Diesel Generators 50kW", "resource_type": "Generators", "category": "Emergency Equipment", "quantity_available": 85, "quantity_allocated": 52, "unit": "units", "location": "Power Grid ResQ Base", "minimum_threshold": 15},
    # Human Resources
    {"id": "r10", "resource_name": "Emergency Doctors & Surgeons", "resource_type": "Doctors", "category": "Human Resources", "quantity_available": 65, "quantity_allocated": 48, "unit": "personnel", "location": "District General Hospital", "minimum_threshold": 10},
    {"id": "r11", "resource_name": "Trauma Care Nurses", "resource_type": "Nurses", "category": "Human Resources", "quantity_available": 140, "quantity_allocated": 98, "unit": "personnel", "location": "District General Hospital", "minimum_threshold": 25},
    {"id": "r12", "resource_name": "NDRF Search & Rescue Teams", "resource_type": "Rescue Teams", "category": "Human Resources", "quantity_available": 24, "quantity_allocated": 16, "unit": "teams", "location": "National Response Camp", "minimum_threshold": 5},
    {"id": "r13", "resource_name": "Civil Defense Volunteers", "resource_type": "Volunteers", "category": "Human Resources", "quantity_available": 450, "quantity_allocated": 280, "unit": "volunteers", "location": "Civic Staging Ground", "minimum_threshold": 50},
    # Vehicles
    {"id": "r14", "resource_name": "Advanced Life Support Ambulances", "resource_type": "Ambulance", "category": "Vehicles", "quantity_available": 32, "quantity_allocated": 24, "unit": "vehicles", "location": "Medical Fleet Depot", "minimum_threshold": 6},
    {"id": "r15", "resource_name": "All-Terrain Rescue Vehicles (4x4)", "resource_type": "Rescue Vehicle", "category": "Vehicles", "quantity_available": 28, "quantity_allocated": 19, "unit": "vehicles", "location": "NDRF Armory", "minimum_threshold": 5},
    {"id": "r16", "resource_name": "Heavy Supply Cargo Trucks (10T)", "resource_type": "Supply Truck", "category": "Vehicles", "quantity_available": 40, "quantity_allocated": 27, "unit": "trucks", "location": "Central Logistics Hub", "minimum_threshold": 8},
    {"id": "r17", "resource_name": "Motorized Inflatable Rescue Boats", "resource_type": "Boat", "category": "Vehicles", "quantity_available": 35, "quantity_allocated": 26, "unit": "boats", "location": "Coastal Guard Station", "minimum_threshold": 6}
]

INITIAL_REQUESTS = [
    {"id": "req1", "area_id": "a1", "area_name": "Area A - Coastal Sector 1", "resource_type": "Medicine", "quantity": 150, "urgency": "Critical", "description": "Severe outbreak of waterborne gastroenteritis following floodwaters.", "status": "Pending", "created_at": "2026-08-13T10:15:00Z"},
    {"id": "req2", "area_id": "a2", "area_name": "Area B - North Harbor", "resource_type": "Food", "quantity": 800, "urgency": "Critical", "description": "Relief camp stranded without grain & dry rations.", "status": "Pending", "created_at": "2026-08-13T11:00:00Z"},
    {"id": "req3", "area_id": "a5", "area_name": "Area E - Fisherman Island", "resource_type": "Drinking Water", "quantity": 1200, "urgency": "Critical", "description": "Saline contamination of local wells. Zero potable water remaining.", "status": "Pending", "created_at": "2026-08-13T11:30:00Z"},
    {"id": "req4", "area_id": "a3", "area_name": "Area C - Riverbed Township", "resource_type": "Rescue Teams", "quantity": 3, "urgency": "High", "description": "Structural collapse reported near bridge embankment. 12 trapped.", "status": "Approved", "created_at": "2026-08-13T12:00:00Z"},
    {"id": "req5", "area_id": "a7", "area_name": "Area G - Western Basin Slums", "resource_type": "Ambulance", "quantity": 4, "urgency": "High", "description": "Critical patient transfers needed for elderly flood victims.", "status": "Pending", "created_at": "2026-08-13T12:45:00Z"},
    {"id": "req6", "area_id": "a4", "area_name": "Area D - South Delta Colony", "resource_type": "Generators", "quantity": 2, "urgency": "Medium", "description": "Power grid failed at local community clinic.", "status": "Pending", "created_at": "2026-08-13T13:10:00Z"},
    {"id": "req7", "area_id": "a6", "area_name": "Area F - Hill Pass Ridge", "resource_type": "First Aid Kits", "quantity": 60, "urgency": "Medium", "description": "Landslide trauma injuries requiring basic wound dressing.", "status": "Fulfilled", "created_at": "2026-08-13T09:00:00Z"},
    {"id": "req8", "area_id": "a9", "area_name": "Area I - Industrial Belt Shelter", "resource_type": "Blankets", "quantity": 500, "urgency": "Low", "description": "Overnight temp drops affecting evacuees.", "status": "Pending", "created_at": "2026-08-13T14:00:00Z"},
    {"id": "req9", "area_id": "a10", "area_name": "Area J - Central Railway Depot", "resource_type": "Volunteers", "quantity": 25, "urgency": "Medium", "description": "Assistance needed to unload incoming supply freight trains.", "status": "Pending", "created_at": "2026-08-13T14:30:00Z"},
    {"id": "req10", "area_id": "a1", "area_name": "Area A - Coastal Sector 1", "resource_type": "Oxygen Cylinders", "quantity": 20, "urgency": "Critical", "description": "Emergency ICU ward setup at field hospital.", "status": "Approved", "created_at": "2026-08-13T15:00:00Z"}
]

INITIAL_TEAMS = [
    {"id": "t1", "team_name": "Alpha Medical ResQ-1", "leader": "Dr. Aris Thorne", "members": 8, "specialization": "Medical", "location": "Coastal Sector 1", "status": "On Mission", "assigned_area_id": "a1", "assigned_area_name": "Area A - Coastal Sector 1"},
    {"id": "t2", "team_name": "Bravo NDRF Battalion 4", "leader": "Capt. Rajesh Kumar", "members": 15, "specialization": "Search & Rescue", "location": "Riverbed Township", "status": "Assigned", "assigned_area_id": "a3", "assigned_area_name": "Area C - Riverbed Township"},
    {"id": "t3", "team_name": "Charlie Coast Guard Squad", "leader": "Cmdr. Vikram Sethi", "members": 12, "specialization": "Evacuation", "location": "Fisherman Island", "status": "On Mission", "assigned_area_id": "a5", "assigned_area_name": "Area E - Fisherman Island"},
    {"id": "t4", "team_name": "Delta Hazmat Response", "leader": "Lt. Maya Lin", "members": 6, "specialization": "Hazmat", "location": "Central Depot", "status": "Available", "assigned_area_id": None, "assigned_area_name": None},
    {"id": "t5", "team_name": "Echo General Relief Contingent", "leader": "Sgt. David Miller", "members": 20, "specialization": "General Relief", "location": "North Harbor", "status": "Available", "assigned_area_id": None, "assigned_area_name": None}
]

INITIAL_VEHICLES = [
    {"id": "v1", "vehicle_id": "AMB-101", "type": "Ambulance", "driver": "K. R. Suresh", "capacity": 2, "location": "Coastal Sector 1", "status": "Assigned", "assigned_area_id": "a1", "assigned_area_name": "Area A - Coastal Sector 1"},
    {"id": "v2", "vehicle_id": "AMB-104", "type": "Ambulance", "driver": "M. Praveen", "capacity": 2, "location": "North Harbor", "status": "In Transit", "assigned_area_id": "a2", "assigned_area_name": "Area B - North Harbor"},
    {"id": "v3", "vehicle_id": "TRK-501", "type": "Supply Truck", "driver": "G. Selvam", "capacity": 10000, "location": "Central Logistics Hub", "status": "Available", "assigned_area_id": None, "assigned_area_name": None},
    {"id": "v4", "vehicle_id": "TRK-508", "type": "Supply Truck", "driver": "P. Ramesh", "capacity": 10000, "location": "Riverbed Township", "status": "Assigned", "assigned_area_id": "a3", "assigned_area_name": "Area C - Riverbed Township"},
    {"id": "v5", "vehicle_id": "BOAT-22", "type": "Boat", "driver": "N. Antony", "capacity": 12, "location": "Fisherman Island", "status": "In Transit", "assigned_area_id": "a5", "assigned_area_name": "Area E - Fisherman Island"},
    {"id": "v6", "vehicle_id": "RES-402", "type": "Rescue Vehicle", "driver": "V. Anand", "capacity": 6, "location": "Western Basin Slums", "status": "Assigned", "assigned_area_id": "a7", "assigned_area_name": "Area G - Western Basin Slums"},
    {"id": "v7", "vehicle_id": "HELI-01", "type": "Helicopter", "driver": "Wg Cmdr R. Sharma", "capacity": 8, "location": "Air Force Staging Hub", "status": "Available", "assigned_area_id": None, "assigned_area_name": None},
    {"id": "v8", "vehicle_id": "TRK-512", "type": "Supply Truck", "driver": "S. Murugan", "capacity": 10000, "location": "Central Logistics Hub", "status": "Available", "assigned_area_id": None, "assigned_area_name": None}
]

INITIAL_ALERTS = [
    {"id": "alt0", "title": "Critical ICU Oxygen Shortage", "message": "Emergency ICU ward at Coastal Sector 1 field hospital reports 0 backup oxygen cylinders. 15 critical patients pending emergency dispatch.", "severity": "Critical", "status": "Active", "created_at": "2026-08-13T17:00:00Z"},
    {"id": "alt1", "title": "Critical Medicine Shortage", "message": "Medicine inventory in Area A - Coastal Sector 1 is below safety threshold (85% deficit). Urgent dispatch recommended.", "severity": "Critical", "status": "Active", "created_at": "2026-08-13T11:20:00Z"},
    {"id": "alt2", "title": "Food Inventory Warning", "message": "Food ration inventory at Central Logistics Hub reached minimum safety threshold (30% capacity remaining).", "severity": "Warning", "status": "Active", "created_at": "2026-08-13T12:00:00Z"},
    {"id": "alt3", "title": "Emergency Request Incoming", "message": "New critical emergency request req10 for Oxygen Cylinders logged by Area A Field Hospital.", "severity": "Emergency", "status": "Active", "created_at": "2026-08-13T15:00:00Z"},
    {"id": "alt4", "title": "Flash Flood Wave Approaching", "message": "Hydrological telemetry indicates a 1.2m surge wave reaching Riverbed Township within 3 hours.", "severity": "Critical", "status": "Active", "created_at": "2026-08-13T16:10:00Z"}
]

INITIAL_REPORTS = []

INITIAL_SAFE_LOCATIONS = [
    # Hospitals & Trauma Centers
    {
        "id": "loc_h1",
        "name": "Apollo Emergency & Trauma Hospital",
        "facility_type": "Hospital",
        "icon": "hospital",
        "latitude": 13.0604,
        "longitude": 80.2496,
        "address": "21 Greams Lane, Thousand Lights",
        "phone": "+91 44 2829 0200",
        "capacity": "250 Emergency Beds",
        "icu_available": 35,
        "status": "Operational 24/7"
    },
    {
        "id": "loc_h2",
        "name": "Government General Hospital & ICU Hub",
        "facility_type": "Hospital",
        "icon": "hospital",
        "latitude": 13.0815,
        "longitude": 80.2777,
        "address": "EVR Periyar Salai, Park Town",
        "phone": "+91 44 2530 5000",
        "capacity": "500 Emergency Beds",
        "icu_available": 60,
        "status": "Operational 24/7"
    },
    {
        "id": "loc_h3",
        "name": "Tambaram District Trauma & Surgical Center",
        "facility_type": "Hospital",
        "icon": "hospital",
        "latitude": 12.9240,
        "longitude": 80.1290,
        "address": "GST Road, Tambaram Sanatorium",
        "phone": "+91 44 2241 8000",
        "capacity": "180 Emergency Beds",
        "icu_available": 20,
        "status": "Operational 24/7"
    },
    {
        "id": "loc_h4",
        "name": "Stanley Medical Apex Trauma Care",
        "facility_type": "Hospital",
        "icon": "hospital",
        "latitude": 13.1030,
        "longitude": 80.2870,
        "address": "Old Jail Road, Royapuram",
        "phone": "+91 44 2528 1351",
        "capacity": "320 Emergency Beds",
        "icu_available": 40,
        "status": "Operational 24/7"
    },
    {
        "id": "loc_h5",
        "name": "Chromepet Emergency Medical Base",
        "facility_type": "Hospital",
        "icon": "hospital",
        "latitude": 12.9510,
        "longitude": 80.1410,
        "address": "Station Road, Chromepet",
        "phone": "+91 44 2265 1122",
        "capacity": "120 Emergency Beds",
        "icu_available": 15,
        "status": "Operational 24/7"
    },
    {
        "id": "loc_h6",
        "name": "MIOT International Trauma Hospital",
        "facility_type": "Hospital",
        "icon": "hospital",
        "latitude": 13.0247,
        "longitude": 80.1785,
        "address": "Mount-Poonamallee Road, Manapakkam / Porur",
        "phone": "+91 44 4200 2288",
        "capacity": "300 Emergency ICU Beds",
        "icu_available": 45,
        "status": "Operational 24/7"
    },
    {
        "id": "loc_h7",
        "name": "Sri Ramachandra Medical Center & Emergency Hub",
        "facility_type": "Hospital",
        "icon": "hospital",
        "latitude": 13.0375,
        "longitude": 80.1412,
        "address": "No.1 Ramachandra Nagar, Porur",
        "phone": "+91 44 4592 8500",
        "capacity": "450 Emergency Beds",
        "icu_available": 55,
        "status": "Operational 24/7"
    },
    {
        "id": "loc_h8",
        "name": "SIMS Super Specialty Emergency Hospital",
        "facility_type": "Hospital",
        "icon": "hospital",
        "latitude": 13.0512,
        "longitude": 80.2120,
        "address": "Metro Station Complex, Vadapalani",
        "phone": "+91 44 2000 2000",
        "capacity": "280 Trauma Beds",
        "icu_available": 30,
        "status": "Operational 24/7"
    },
    {
        "id": "loc_h9",
        "name": "Prashanth Emergency Hospital & Trauma Center",
        "facility_type": "Hospital",
        "icon": "hospital",
        "latitude": 12.9780,
        "longitude": 80.2220,
        "address": "Velachery Main Road, Velachery",
        "phone": "+91 44 4227 7777",
        "capacity": "190 Emergency Beds",
        "icu_available": 25,
        "status": "Operational 24/7"
    },
    {
        "id": "loc_h10",
        "name": "Gleneagles Global Trauma & Emergency City",
        "facility_type": "Hospital",
        "icon": "hospital",
        "latitude": 12.9062,
        "longitude": 80.1983,
        "address": "Cheran Nagar, Perumbakkam / Medavakkam",
        "phone": "+91 44 4477 7000",
        "capacity": "350 Critical Care Beds",
        "icu_available": 50,
        "status": "Operational 24/7"
    },
    {
        "id": "loc_h11",
        "name": "Fortis Malar Emergency Care",
        "facility_type": "Hospital",
        "icon": "hospital",
        "latitude": 13.0041,
        "longitude": 80.2568,
        "address": "First Main Road, Gandhi Nagar, Adyar",
        "phone": "+91 44 4289 2222",
        "capacity": "160 Emergency Beds",
        "icu_available": 20,
        "status": "Operational 24/7"
    },
    {
        "id": "loc_h12",
        "name": "Sir Ivan Stedeford Emergency Hospital",
        "facility_type": "Hospital",
        "icon": "hospital",
        "latitude": 13.1180,
        "longitude": 80.1550,
        "address": "Ambattur OT, Ambattur",
        "phone": "+91 44 2658 0137",
        "capacity": "140 Emergency Beds",
        "icu_available": 18,
        "status": "Operational 24/7"
    },
    {
        "id": "loc_h13",
        "name": "Avadi Ordnance Emergency Medical Unit",
        "facility_type": "Hospital",
        "icon": "hospital",
        "latitude": 13.1250,
        "longitude": 80.0980,
        "address": "OFR Estate, Avadi",
        "phone": "+91 44 2638 2141",
        "capacity": "150 Emergency Beds",
        "icu_available": 22,
        "status": "Operational 24/7"
    },
    {
        "id": "loc_h14",
        "name": "Madhavaram Community Emergency Hospital",
        "facility_type": "Hospital",
        "icon": "hospital",
        "latitude": 13.1480,
        "longitude": 80.2310,
        "address": "GNT Road, Madhavaram",
        "phone": "+91 44 2553 0100",
        "capacity": "110 Emergency Beds",
        "icu_available": 12,
        "status": "Operational 24/7"
    },
    # Relief Shelters & Evacuation Centers
    {
        "id": "loc_s1",
        "name": "Tambaram Indoor Stadium Relief Shelter",
        "facility_type": "Relief Shelter",
        "icon": "shelter",
        "latitude": 12.9200,
        "longitude": 80.1250,
        "address": "Gandhi Road, West Tambaram",
        "phone": "1800-425-1088",
        "capacity": "1,500 Evacuees",
        "food_water_status": "Abundant Supplies",
        "status": "Active Safe Zone"
    },
    {
        "id": "loc_s2",
        "name": "Central Community Disaster Shelter",
        "facility_type": "Relief Shelter",
        "icon": "shelter",
        "latitude": 13.0850,
        "longitude": 80.2650,
        "address": "Ripon Building Complex, Central",
        "phone": "1800-425-1089",
        "capacity": "3,000 Evacuees",
        "food_water_status": "Abundant Supplies",
        "status": "Active Safe Zone"
    },
    {
        "id": "loc_s3",
        "name": "North Harbor Coastal Evacuation Base",
        "facility_type": "Relief Shelter",
        "icon": "shelter",
        "latitude": 13.1250,
        "longitude": 80.2950,
        "address": "Harbor High School Grounds",
        "phone": "1800-425-1090",
        "capacity": "2,000 Evacuees",
        "food_water_status": "Stocked",
        "status": "Active Safe Zone"
    },
    {
        "id": "loc_s4",
        "name": "Western Basin Disaster Relief Camp",
        "facility_type": "Relief Shelter",
        "icon": "shelter",
        "latitude": 13.0550,
        "longitude": 80.1750,
        "address": "Punamallee High Road Assembly Hub",
        "phone": "1800-425-1091",
        "capacity": "1,200 Evacuees",
        "food_water_status": "Stocked",
        "status": "Active Safe Zone"
    },
    # Fire & Police First Responder Bases
    {
        "id": "loc_f1",
        "name": "Tambaram Fire & Heavy Rescue Station",
        "facility_type": "Fire Station",
        "icon": "fire",
        "latitude": 12.9260,
        "longitude": 80.1310,
        "address": "GST Road, Tambaram East",
        "phone": "101",
        "capacity": "6 Rescue Engines",
        "status": "High Alert"
    },
    {
        "id": "loc_f2",
        "name": "Central Heavy Fire & Hazmat Station",
        "facility_type": "Fire Station",
        "icon": "fire",
        "latitude": 13.0800,
        "longitude": 80.2720,
        "address": "High Court Compound, Central",
        "phone": "101",
        "capacity": "10 Rescue Engines",
        "status": "High Alert"
    },
    {
        "id": "loc_p1",
        "name": "Tambaram Police Command & Evacuation Control",
        "facility_type": "Police Hub",
        "icon": "police",
        "latitude": 12.9210,
        "longitude": 80.1280,
        "address": "MUD Complex, Tambaram",
        "phone": "100",
        "capacity": "Command Squads Active",
        "status": "24/7 Command Patrol"
    }
]


# Database Access Interface
class LocalDatabaseStore:
    def __init__(self):
        self.disasters = list(INITIAL_DISASTERS)
        self.affected_areas = list(INITIAL_AREAS)
        self.resources = list(INITIAL_RESOURCES)
        self.resource_requests = list(INITIAL_REQUESTS)
        self.rescue_teams = list(INITIAL_TEAMS)
        self.vehicles = list(INITIAL_VEHICLES)
        self.alerts = list(INITIAL_ALERTS)
        self.disaster_reports = list(INITIAL_REPORTS)
        self.safe_locations = list(INITIAL_SAFE_LOCATIONS)
        self.allocations = []

db_store = LocalDatabaseStore()
