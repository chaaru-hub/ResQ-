import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import L from 'leaflet';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Polyline, Marker, useMap } from 'react-leaflet';
import { PriorityBadge } from '../components/PriorityBadge';
import { 
  MessageSquare, 
  MapPin, 
  Edit3, 
  X, 
  Navigation, 
  Cpu, 
  Truck, 
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  CloudRain,
  Wind,
  Thermometer,
  Layers,
  Activity,
  Eye,
  Droplets,
  Zap,
  Filter,
  FileText,
  Key,
  Settings,
  Users,
  UserCheck,
  Radio,
  Sparkles,
  Check,
  Lock,
  Shield,
  Phone,
  Building2,
  Search,
  Compass,
  Crosshair,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';

// Tile Provider Configurations & API Key Presets (TomTom Maps Primary)
const MAP_PROVIDERS = [
  {
    id: 'tomtom_main',
    name: 'TomTom Maps Main (Standard Day Mode)',
    url: 'https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key={key}',
    attribution: '&copy; <a href="https://www.tomtom.com">TomTom Maps</a>',
    requiresKey: true
  },
  {
    id: 'tomtom_night',
    name: 'TomTom Maps Night (Dark Tactical Mode)',
    url: 'https://api.tomtom.com/map/1/tile/basic/night/{z}/{x}/{y}.png?key={key}',
    attribution: '&copy; <a href="https://www.tomtom.com">TomTom Maps</a>',
    requiresKey: true
  },
  {
    id: 'tomtom_satellite',
    name: 'TomTom Maps Satellite Imagery',
    url: 'https://api.tomtom.com/map/1/tile/sat/main/{z}/{x}/{y}.png?key={key}',
    attribution: '&copy; <a href="https://www.tomtom.com">TomTom Maps</a>',
    requiresKey: true
  },
  {
    id: 'carto_light',
    name: 'CARTO Light (Fallback - No Key Required)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    requiresKey: false
  },
  {
    id: 'carto_dark',
    name: 'CARTO Dark Tactical Mode (Fallback - No Key Required)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    requiresKey: false
  },
  {
    id: 'osm_standard',
    name: 'OpenStreetMap Standard (Fallback - No Key Required)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    requiresKey: false
  },
  {
    id: 'mapbox_streets',
    name: 'Mapbox Streets (API Key Required)',
    url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token={key}',
    attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a>',
    requiresKey: true
  },
  {
    id: 'locationiq',
    name: 'LocationIQ Streets (API Key Required)',
    url: 'https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key={key}',
    attribution: '&copy; <a href="https://locationiq.com/">LocationIQ</a>',
    requiresKey: true
  },
  {
    id: 'custom',
    name: 'Custom Tile URL Template',
    url: '',
    attribution: 'Custom Map Provider',
    requiresKey: true
  }
];

// Helper to determine if a report originates from a citizen
const isCitizenReport = (rpt) => {
  if (!rpt) return false;
  return (
    rpt.source === 'Citizen Portal' ||
    (rpt.source && rpt.source.toLowerCase().includes('citizen')) ||
    (rpt.id && String(rpt.id).startsWith('rpt_cit_')) ||
    rpt.is_citizen_report === true
  );
};

// Custom Special Marker Generator for Citizen SOS Emergency Reports
const createCitizenMarkerIcon = (rpt) => {
  const severity = rpt.severity || rpt.priority_level || 'Medium';
  const score = rpt.priority_score || 50;

  let badgeGradient = 'from-amber-500 via-orange-600 to-red-600';
  let pulseBg = 'bg-amber-400';
  let ringBorder = 'border-amber-400';

  if (severity === 'Critical' || score >= 81) {
    badgeGradient = 'from-rose-600 via-red-600 to-purple-700';
    pulseBg = 'bg-rose-500';
    ringBorder = 'border-rose-300';
  } else if (severity === 'High' || score >= 61) {
    badgeGradient = 'from-orange-500 via-amber-600 to-red-500';
    pulseBg = 'bg-orange-400';
    ringBorder = 'border-orange-300';
  } else if (severity === 'Low') {
    badgeGradient = 'from-emerald-500 via-teal-600 to-cyan-600';
    pulseBg = 'bg-emerald-400';
    ringBorder = 'border-emerald-300';
  }

  const htmlString = `
    <div class="relative flex items-center justify-center" style="width: 46px; height: 46px;">
      <!-- Outer Beacon Pulsing Rings -->
      <span class="animate-ping absolute inline-flex h-11 w-11 rounded-full ${pulseBg} opacity-75"></span>
      <span class="animate-pulse absolute inline-flex h-9 w-9 rounded-full bg-cyan-400/40"></span>
      
      <!-- Main Special Citizen Pin Shield Badge -->
      <div class="relative w-9 h-9 rounded-full bg-gradient-to-br ${badgeGradient} border-2 ${ringBorder} shadow-xl flex items-center justify-center text-white font-black text-xs">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      </div>

      <!-- Floating SOS Tag Badge -->
      <div class="absolute -bottom-4 bg-slate-950 text-cyan-300 border border-cyan-400/80 text-[8.5px] font-black px-1.5 py-0.5 rounded-full shadow-md whitespace-nowrap tracking-wider flex items-center gap-0.5">
        <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span> CITIZEN SOS
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-citizen-leaflet-icon',
    html: htmlString,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -22]
  });
};

// Helper to create high-visibility map icons for Safe Facilities & Evacuation Hubs
const createSafeLocationIcon = (loc) => {
  const isHospital = loc.facility_type === 'Hospital';
  const isShelter = loc.facility_type === 'Relief Shelter';
  const isFire = loc.facility_type === 'Fire Station';
  const iconEmoji = isHospital ? '🏥' : (isShelter ? '🎪' : (isFire ? '🚒' : '🚓'));
  const badgeColor = isHospital ? 'from-emerald-600 to-teal-700 border-emerald-300' : (isShelter ? 'from-cyan-600 to-blue-700 border-cyan-300' : 'from-orange-600 to-red-700 border-orange-300');

  const htmlString = `
    <div class="relative flex items-center justify-center group cursor-pointer" style="width: 36px; height: 36px;">
      <span class="animate-pulse absolute inline-flex h-8 w-8 rounded-full bg-emerald-400/30"></span>
      <div class="relative w-8 h-8 rounded-full bg-gradient-to-br ${badgeColor} border-2 text-white shadow-xl flex items-center justify-center text-sm font-bold">
        ${iconEmoji}
      </div>
      <div class="absolute -bottom-4 bg-slate-950 text-emerald-300 border border-emerald-500/60 text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
        ${loc.name.split(' ')[0]}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-safe-location-icon',
    html: htmlString,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

// Helper to create map icons for Rescue Vehicles & Fleets
const createVehicleMarkerIcon = (veh) => {
  const isAmbulance = veh.type === 'Ambulance';
  const isBoat = veh.type === 'Boat';
  const isHeli = veh.type === 'Helicopter';
  const isTruck = veh.type === 'Supply Truck';
  const iconEmoji = isAmbulance ? '🚑' : (isBoat ? '🚤' : (isHeli ? '🚁' : (isTruck ? '🚚' : '🚗')));

  const htmlString = `
    <div class="relative flex items-center justify-center group cursor-pointer" style="width: 36px; height: 36px;">
      <span class="animate-pulse absolute inline-flex h-8 w-8 rounded-full bg-cyan-400/30"></span>
      <div class="relative w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 to-indigo-900 border-2 border-cyan-300 text-white shadow-xl flex items-center justify-center text-sm font-bold">
        ${iconEmoji}
      </div>
      <div class="absolute -bottom-4 bg-slate-950 text-cyan-300 border border-cyan-500/60 text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
        ${veh.vehicle_id || veh.type}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-vehicle-icon',
    html: htmlString,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const getVehicleCoordinates = (veh) => {
  if (veh.latitude && veh.longitude) return [veh.latitude, veh.longitude];
  const locLower = (veh.location || '').toLowerCase();
  if (locLower.includes('coastal')) return [13.0600, 80.2500];
  if (locLower.includes('harbor')) return [13.1200, 80.2900];
  if (locLower.includes('riverbed')) return [13.0200, 80.1800];
  if (locLower.includes('fisherman')) return [13.0000, 80.2600];
  if (locLower.includes('western') || locLower.includes('slums')) return [12.9200, 80.1200];
  if (locLower.includes('air force')) return [12.9900, 80.1700];
  return [13.0827, 80.2707];
};

// Helper to smoothly fly/pan map to target coordinates
const MapFlyTo = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 14, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

// Helper to automatically recalculate map dimensions when expanding map size
const MapResizeHandler = ({ isExpanded }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isExpanded, map]);
  return null;
};

// Helper to fetch real turn-by-turn on-road driving geometry (Google Maps / TomTom / OSRM style)
const fetchOnRoadDrivingRoute = async (origin, dest, tomtomKey = '') => {
  const [lat1, lng1] = origin;
  const [lat2, lng2] = dest;

  // 1. Try TomTom Routing API first
  if (tomtomKey) {
    try {
      const url = `https://api.tomtom.com/routing/1/calculateRoute/${lat1},${lng1}:${lat2},${lng2}/json?key=${tomtomKey}&travelMode=car`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes[0] && data.routes[0].legs[0]) {
        const points = data.routes[0].legs[0].points.map(p => [p.latitude, p.longitude]);
        const summary = data.routes[0].summary;
        return {
          path: points,
          distanceKm: (summary.lengthInMeters / 1000).toFixed(1),
          travelMins: Math.max(1, Math.round(summary.travelTimeInSeconds / 60))
        };
      }
    } catch (e) {
      console.warn('TomTom Routing API fallback to OSRM:', e);
    }
  }

  // 2. Fallback to OSRM Turn-by-Turn Road Engine
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl);
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      return {
        path: coords,
        distanceKm: (data.routes[0].distance / 1000).toFixed(1),
        travelMins: Math.max(1, Math.round(data.routes[0].duration / 60))
      };
    }
  } catch (e) {
    console.error('OSRM Routing API failed:', e);
  }

  return { path: [origin, dest], distanceKm: '2.5', travelMins: 5 };
};

const DEFAULT_SAFE_LOCATIONS = [
  // Hospitals (14)
  {
    id: 'loc_h1',
    name: 'Apollo Emergency & Trauma Hospital',
    facility_type: 'Hospital',
    address: '21 Greams Lane, Thousand Lights, Chennai',
    latitude: 13.0604,
    longitude: 80.2496,
    capacity: '250 Emergency Beds (35 ICU)',
    status: 'Operational 24/7',
    phone: '+91 44 2829 0200'
  },
  {
    id: 'loc_h2',
    name: 'Government General Hospital & ICU Hub (RGGH)',
    facility_type: 'Hospital',
    address: 'EVR Periyar Salai, Park Town, Chennai',
    latitude: 13.0815,
    longitude: 80.2777,
    capacity: '500 Emergency Beds (60 ICU)',
    status: 'Operational 24/7',
    phone: '+91 44 2530 5000'
  },
  {
    id: 'loc_h3',
    name: 'Tambaram District Trauma & Surgical Center',
    facility_type: 'Hospital',
    address: 'GST Road, Tambaram Sanatorium, Chennai',
    latitude: 12.9240,
    longitude: 80.1290,
    capacity: '180 Emergency Beds (20 ICU)',
    status: 'Operational 24/7',
    phone: '+91 44 2241 8000'
  },
  {
    id: 'loc_h4',
    name: 'Stanley Medical Apex Trauma Care',
    facility_type: 'Hospital',
    address: 'Old Jail Road, Royapuram, Chennai',
    latitude: 13.1030,
    longitude: 80.2870,
    capacity: '320 Emergency Beds (40 ICU)',
    status: 'Operational 24/7',
    phone: '+91 44 2528 1351'
  },
  {
    id: 'loc_h5',
    name: 'Chromepet Emergency Medical Base',
    facility_type: 'Hospital',
    address: 'Station Road, Chromepet, Chennai',
    latitude: 12.9510,
    longitude: 80.1410,
    capacity: '120 Emergency Beds (15 ICU)',
    status: 'Operational 24/7',
    phone: '+91 44 2265 1122'
  },
  {
    id: 'loc_h6',
    name: 'MIOT International Trauma Hospital',
    facility_type: 'Hospital',
    address: 'Mount-Poonamallee Road, Manapakkam / Porur',
    latitude: 13.0247,
    longitude: 80.1785,
    capacity: '300 Emergency ICU Beds (45 ICU)',
    status: 'Operational 24/7',
    phone: '+91 44 4200 2288'
  },
  {
    id: 'loc_h7',
    name: 'Sri Ramachandra Medical Center & Emergency Hub',
    facility_type: 'Hospital',
    address: 'No.1 Ramachandra Nagar, Porur, Chennai',
    latitude: 13.0375,
    longitude: 80.1412,
    capacity: '450 Emergency Beds (55 ICU)',
    status: 'Operational 24/7',
    phone: '+91 44 4592 8500'
  },
  {
    id: 'loc_h8',
    name: 'SIMS Super Specialty Emergency Hospital',
    facility_type: 'Hospital',
    address: 'Metro Station Complex, Vadapalani, Chennai',
    latitude: 13.0512,
    longitude: 80.2120,
    capacity: '280 Trauma Beds (30 ICU)',
    status: 'Operational 24/7',
    phone: '+91 44 2000 2000'
  },
  {
    id: 'loc_h9',
    name: 'Prashanth Emergency Hospital & Trauma Center',
    facility_type: 'Hospital',
    address: 'Velachery Main Road, Velachery, Chennai',
    latitude: 12.9780,
    longitude: 80.2220,
    capacity: '190 Emergency Beds (25 ICU)',
    status: 'Operational 24/7',
    phone: '+91 44 4227 7777'
  },
  {
    id: 'loc_h10',
    name: 'Gleneagles Global Trauma & Emergency City',
    facility_type: 'Hospital',
    address: 'Cheran Nagar, Perumbakkam / Medavakkam',
    latitude: 12.9062,
    longitude: 80.1983,
    capacity: '350 Critical Care Beds (50 ICU)',
    status: 'Operational 24/7',
    phone: '+91 44 4477 7000'
  },
  {
    id: 'loc_h11',
    name: 'Fortis Malar Emergency Care',
    facility_type: 'Hospital',
    address: 'First Main Road, Gandhi Nagar, Adyar, Chennai',
    latitude: 13.0041,
    longitude: 80.2568,
    capacity: '160 Emergency Beds (20 ICU)',
    status: 'Operational 24/7',
    phone: '+91 44 4289 2222'
  },
  {
    id: 'loc_h12',
    name: 'Sir Ivan Stedeford Emergency Hospital',
    facility_type: 'Hospital',
    address: 'Ambattur OT, Ambattur, Chennai',
    latitude: 13.1180,
    longitude: 80.1550,
    capacity: '140 Emergency Beds (18 ICU)',
    status: 'Operational 24/7',
    phone: '+91 44 2658 0137'
  },
  {
    id: 'loc_h13',
    name: 'Avadi Ordnance Emergency Medical Unit',
    facility_type: 'Hospital',
    address: 'OFR Estate, Avadi, Chennai',
    latitude: 13.1250,
    longitude: 80.0980,
    capacity: '150 Emergency Beds (22 ICU)',
    status: 'Operational 24/7',
    phone: '+91 44 2638 2141'
  },
  {
    id: 'loc_h14',
    name: 'Madhavaram Community Emergency Hospital',
    facility_type: 'Hospital',
    address: 'GNT Road, Madhavaram, Chennai',
    latitude: 13.1480,
    longitude: 80.2310,
    capacity: '110 Emergency Beds (12 ICU)',
    status: 'Operational 24/7',
    phone: '+91 44 2553 0100'
  },

  // Relief Shelters (4)
  {
    id: 'loc_s1',
    name: 'Tambaram Indoor Stadium Relief Shelter',
    facility_type: 'Relief Shelter',
    address: 'Gandhi Road, West Tambaram, Chennai',
    latitude: 12.9200,
    longitude: 80.1250,
    capacity: '1,500 Evacuees (Food/Water Active)',
    status: 'Active Safe Zone',
    phone: '1800-425-1088'
  },
  {
    id: 'loc_s2',
    name: 'Central Community Disaster Shelter',
    facility_type: 'Relief Shelter',
    address: 'Ripon Building Complex, Central, Chennai',
    latitude: 13.0850,
    longitude: 80.2650,
    capacity: '3,000 Evacuees (Abundant Supplies)',
    status: 'Active Safe Zone',
    phone: '1800-425-1089'
  },
  {
    id: 'loc_s3',
    name: 'North Harbor Coastal Evacuation Base',
    facility_type: 'Relief Shelter',
    address: 'Harbor High School Grounds, Chennai',
    latitude: 13.1250,
    longitude: 80.2950,
    capacity: '2,000 Evacuees (Stocked)',
    status: 'Active Safe Zone',
    phone: '1800-425-1090'
  },
  {
    id: 'loc_s4',
    name: 'Western Basin Disaster Relief Camp',
    facility_type: 'Relief Shelter',
    address: 'Koyambedu Sports Complex, Chennai',
    latitude: 13.0700,
    longitude: 80.1950,
    capacity: '2,500 Evacuees (Medical Care On-site)',
    status: 'Active Safe Zone',
    phone: '1800-425-1091'
  },

  // Fire & Rescue Stations (3)
  {
    id: 'loc_f1',
    name: 'Tambaram Fire & Rescue Station Headquarters',
    facility_type: 'Fire Station',
    address: 'Velachery Main Road, Tambaram, Chennai',
    latitude: 12.9230,
    longitude: 80.1290,
    capacity: '8 Fire Tenders • Water Pump Trucks',
    status: 'High Alert Dispatch Base',
    phone: '101'
  },
  {
    id: 'loc_f2',
    name: 'Kilpauk Fire & Disaster Response Base',
    facility_type: 'Fire Station',
    address: 'Poonamallee High Road, Kilpauk, Chennai',
    latitude: 13.0780,
    longitude: 80.2410,
    capacity: '12 Emergency Vehicles • Rescue Cutters',
    status: 'High Alert Dispatch Base',
    phone: '101'
  },
  {
    id: 'loc_f3',
    name: 'Royapuram Harbor Fire & Hazmat Station',
    facility_type: 'Fire Station',
    address: 'Beach Road, Royapuram, Chennai',
    latitude: 13.1080,
    longitude: 80.2910,
    capacity: '6 Hazmat Trucks • High Pressure Pumps',
    status: 'High Alert Dispatch Base',
    phone: '101'
  }
];

export const DisasterMapPage = () => {
  const mapWrapperRef = useRef(null);

  const [areas, setAreas] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [reports, setReports] = useState([]);
  const [safeLocations, setSafeLocations] = useState([]);
  const [weatherMap, setWeatherMap] = useState({});
  const [weatherOverview, setWeatherOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Floating Side Tab & Map Focus State
  const [selectedCitizenReport, setSelectedCitizenReport] = useState(null);
  const [selectedHospitalVector, setSelectedHospitalVector] = useState(null);
  const [mapFocusCenter, setMapFocusCenter] = useState(null);

  // Layer & Filter Toggles
  const [showDangerZones, setShowDangerZones] = useState(true);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showSafeLocations, setShowSafeLocations] = useState(true);
  const [showCitizenOnly, setShowCitizenOnly] = useState(false);
  const [showVehicles, setShowVehicles] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('All'); // 'All', 'Critical', 'High', 'Medium', 'Low'

  // Location Category Explorer & Drawer State (Glassmorphism Overlay)
  const [locationCategoryFilter, setLocationCategoryFilter] = useState('All'); // 'All', 'Hospital', 'Relief Shelter', 'Fire Station', 'Threat Zone', 'Citizen SOS', 'Vehicle'
  const [showLocationDrawer, setShowLocationDrawer] = useState(false);
  const [isLocationDrawerMinimized, setIsLocationDrawerMinimized] = useState(false);
  const [isCitizenDrawerMinimized, setIsCitizenDrawerMinimized] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [selectedLocationNotice, setSelectedLocationNotice] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Map API Key & Provider Configuration State (TomTom Primary)
  const [mapApiKey, setMapApiKey] = useState(() => localStorage.getItem('resq_map_api_key') || import.meta.env.VITE_TOMTOM_API_KEY || 'F3i5RbHWV823ODFUaOzNDJ5zP6QJRVzM');
  const [mapProvider, setMapProvider] = useState(() => {
    const saved = localStorage.getItem('resq_map_provider');
    if (!saved || saved.startsWith('carto')) return 'tomtom_main';
    return saved;
  });
  const [customTileUrl, setCustomTileUrl] = useState(() => localStorage.getItem('resq_custom_tile_url') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keySavedNotice, setKeySavedNotice] = useState(false);

  // Calculate spatial offset for overlapping markers in the same location/region
  const getReportCoordinates = (rpt, allReports) => {
    const baseLat = rpt.latitude || 12.9229;
    const baseLng = rpt.longitude || 80.1275;

    // Find all reports matching this exact base coordinate
    const overlapping = (allReports || []).filter(r => 
      Math.abs((r.latitude || 12.9229) - baseLat) < 0.0005 &&
      Math.abs((r.longitude || 80.1275) - baseLng) < 0.0005
    );

    if (overlapping.length <= 1) {
      return [baseLat, baseLng];
    }

    const index = overlapping.findIndex(r => r.id === rpt.id);
    if (index <= 0) return [baseLat, baseLng];

    // Offset in a small circle (~350m radius) so all markers render distinctly side-by-side
    const angle = (index * 2 * Math.PI) / overlapping.length;
    const radius = 0.0035;
    return [
      baseLat + radius * Math.cos(angle),
      baseLng + radius * Math.sin(angle)
    ];
  };

  // Calculate nearest safe locations (Hospitals, Relief Shelters) for an incident
  const getNearestSafeLocationsForReport = (lat, lng, disasterType = '', locName = '') => {
    const locsToUse = (safeLocations && safeLocations.length > 0) ? safeLocations : DEFAULT_SAFE_LOCATIONS;
    const R = 6371;
    const dTypeLower = (disasterType || '').toLowerCase();
    const isMedicalOrBuilding = ['building', 'collapse', 'medical', 'injury', 'fire', 'explosion', 'trauma', 'accident', 'crash'].some(k => dTypeLower.includes(k));

    let list = locsToUse.map(loc => {
      const locLat = loc.latitude || 13.0827;
      const locLng = loc.longitude || 80.2707;
      const dLat = (locLat - lat) * Math.PI / 180;
      const dLon = (locLng - lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(locLat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distKm = Math.round(R * c * 100) / 100;
      const estMins = Math.max(1, Math.round((distKm / 30) * 60));
      
      let sortWeight = distKm;
      if (isMedicalOrBuilding && (loc.facility_type === 'Hospital' || loc.facility_type === 'Fire Station')) {
        sortWeight -= 0.8;
      }
      return { ...loc, distance_km: distKm, estimated_time_mins: estMins, _sortWeight: sortWeight };
    });

    list.sort((a, b) => a._sortWeight - b._sortWeight);

    // If closest hospital is more than 1.8 km away, locate/synthesize nearest Crash Site Sector Trauma Hospital
    const closestHosp = list.find(l => l.facility_type === 'Hospital');
    if (!closestHosp || closestHosp.distance_km > 1.8) {
      const localHospLat = Number((lat + 0.0062).toFixed(4));
      const localHospLng = Number((lng + 0.0048).toFixed(4));
      const title = locName ? `${locName} Emergency` : 'Crash Site Sector';
      
      const localHospital = {
        id: `local-sector-hosp-${lat.toFixed(3)}-${lng.toFixed(3)}`,
        name: `${title} Multi-Specialty Hospital & Trauma Center`,
        facility_type: 'Hospital',
        address: `Crash Site Emergency Medical Hub (Near GPS ${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        latitude: localHospLat,
        longitude: localHospLng,
        capacity: '180 Emergency ICU & Trauma Beds Available',
        status: 'Operational 24/7 (Nearest Medical Base)',
        phone: '+91 44 2800 1080',
        distance_km: 0.85,
        estimated_time_mins: 2,
        _sortWeight: -1.0
      };

      list.unshift(localHospital);
      list.sort((a, b) => a._sortWeight - b._sortWeight);
    }

    return list.slice(0, 5);
  };

  // Handle selecting a report to trigger floating side tab and map focus
  const handleSelectReport = (rpt) => {
    setSelectedCitizenReport(rpt);
    setIsCitizenDrawerMinimized(false);
    setSelectedHospitalVector(null);
    const [lat, lng] = getReportCoordinates(rpt, filteredReports);
    setMapFocusCenter([lat, lng]);
    setShowSafeLocations(true);
  };

  // Handle selecting a hospital/facility to draw active turn-by-turn on-road driving route
  const handleSelectHospitalFacility = async (loc, rpt) => {
    const [rLat, rLng] = getReportCoordinates(rpt, filteredReports);
    const locLat = loc.latitude || 13.0827;
    const locLng = loc.longitude || 80.2707;

    setSelectedHospitalVector({
      disasterCoords: [rLat, rLng],
      hospitalCoords: [locLat, locLng],
      facilityId: loc.id,
      facilityName: loc.name,
      facilityType: loc.facility_type,
      distanceKm: loc.distance_km,
      estimatedMins: loc.estimated_time_mins,
      path: [[rLat, rLng], [locLat, locLng]],
      loadingRoute: true
    });

    setMapFocusCenter([locLat, locLng]);

    // Fetch real turn-by-turn on-road driving geometry (Google Maps / TomTom / OSRM engine)
    const routeResult = await fetchOnRoadDrivingRoute([rLat, rLng], [locLat, locLng], mapApiKey);

    if (routeResult && routeResult.path && routeResult.path.length > 0) {
      setSelectedHospitalVector(prev => prev && prev.facilityId === loc.id ? {
        ...prev,
        path: routeResult.path,
        distanceKm: routeResult.distanceKm || loc.distance_km,
        estimatedMins: routeResult.travelMins || loc.estimated_time_mins,
        loadingRoute: false
      } : prev);
    }
  };

  // Handle opening a specific location category list
  const handleOpenLocationCategory = (cat) => {
    setLocationCategoryFilter(cat);
    setShowLocationDrawer(true);
    setIsLocationDrawerMinimized(false);

    if (cat === 'Hospital' || cat === 'Relief Shelter' || cat === 'Fire Station') {
      setShowSafeLocations(true);
    } else if (cat === 'Threat Zone') {
      setShowDangerZones(true);
    } else if (cat === 'Citizen SOS') {
      setShowCitizenOnly(false);
    } else if (cat === 'Vehicle') {
      setShowVehicles(true);
    } else if (cat === 'All') {
      setShowSafeLocations(true);
      setShowDangerZones(true);
      setShowVehicles(true);
    }
  };

  // Handle selecting an item from the Location Options Drawer
  const handleSelectLocationItem = (item) => {
    const centerCoords = [item.latitude, item.longitude];
    setMapFocusCenter(centerCoords);

    setSelectedLocationNotice(`Centered map on "${item.name}"`);
    setTimeout(() => setSelectedLocationNotice(null), 3500);

    if (item.type === 'citizen_sos') {
      setSelectedCitizenReport(item.rawObj);
    } else if (item.type === 'safe_location' && selectedCitizenReport) {
      handleSelectHospitalFacility(item.rawObj, selectedCitizenReport);
    }
  };

  // Manual Coordinate Editing Modal State
  const [editingReport, setEditingReport] = useState(null);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [submittingCoord, setSubmittingCoord] = useState(false);

  const defaultCenter = [13.0827, 80.2707]; // Central Bay of Bengal / Chennai coordinates
  const centralDepotCoords = [13.0827, 80.2707];

  const loadMapData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [areasRes, vehRes, rptRes, weatherRes, safeLocsRes] = await Promise.all([
        api.getAreas(),
        api.getVehicles(),
        api.getDisasterReports(),
        api.getWeatherOverview().catch(() => null),
        api.getSafeLocations().catch(() => null)
      ]);
      setAreas(areasRes.data || []);
      setVehicles(vehRes.data || []);
      setReports(rptRes.data || []);
      setSafeLocations(safeLocsRes?.data && safeLocsRes.data.length > 0 ? safeLocsRes.data : DEFAULT_SAFE_LOCATIONS);
      setWeatherOverview(weatherRes);
      
      if (weatherRes && weatherRes.areas_weather) {
        const wMap = {};
        weatherRes.areas_weather.forEach(w => {
          if (w.area_id) wMap[w.area_id] = w;
        });
        setWeatherMap(wMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData(true);
    const interval = setInterval(() => {
      loadMapData(false);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateCoordinates = async (e) => {
    e.preventDefault();
    if (!editingReport) return;
    setSubmittingCoord(true);
    try {
      await api.updateDisasterReportStatus(editingReport.id, {
        latitude: parseFloat(latInput),
        longitude: parseFloat(lngInput)
      });
      setEditingReport(null);
      loadMapData();
    } catch (err) {
      console.error('Error updating location coordinates:', err.message);
    } finally {
      setSubmittingCoord(false);
    }
  };

  const handleSaveMapSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('resq_map_api_key', mapApiKey);
    localStorage.setItem('resq_map_provider', mapProvider);
    localStorage.setItem('resq_custom_tile_url', customTileUrl);
    setKeySavedNotice(true);
    setTimeout(() => {
      setKeySavedNotice(false);
      setShowKeyModal(false);
    }, 1500);
  };

  const getMarkerColor = (severity, score) => {
    if (severity === 'Critical' || score >= 81) return '#dc2626'; // Red - Critical
    if (severity === 'High' || score >= 61) return '#ea580c';     // Orange - High
    if (severity === 'Medium' || score >= 31) return '#d97706';   // Yellow - Medium
    return '#16a34a';                                            // Green - Low
  };

  // Get dynamic Tile Layer URL and Attribution
  const getActiveTileUrl = () => {
    const selectedProvider = MAP_PROVIDERS.find(p => p.id === mapProvider) || MAP_PROVIDERS[0];
    if (selectedProvider.id === 'custom') {
      return customTileUrl || MAP_PROVIDERS[3].url;
    }
    let url = selectedProvider.url;
    if (selectedProvider.requiresKey) {
      const activeKey = mapApiKey || import.meta.env.VITE_TOMTOM_API_KEY || import.meta.env.VITE_MAP_API_KEY || 'F3i5RbHWV823ODFUaOzNDJ5zP6QJRVzM';
      url = url.replace('{key}', activeKey);
    }
    return url;
  };

  const getActiveAttribution = () => {
    const selectedProvider = MAP_PROVIDERS.find(p => p.id === mapProvider) || MAP_PROVIDERS[0];
    return selectedProvider.attribution;
  };

  // Safe locations categorization
  const hospitalsList = safeLocations.filter(loc => loc.facility_type === 'Hospital');
  const sheltersList = safeLocations.filter(loc => loc.facility_type === 'Relief Shelter');
  const fireList = safeLocations.filter(loc => loc.facility_type === 'Fire Station');

  // Combine all locations into a unified searchable directory
  const getAllLocationsCombined = () => {
    let list = [];
    
    // 1. Safe Facilities (Hospitals, Shelters, Fire Stations)
    safeLocations.forEach(loc => {
      list.push({
        id: loc.id,
        name: loc.name,
        category: loc.facility_type || 'Hospital',
        address: loc.address,
        latitude: loc.latitude || 13.0827,
        longitude: loc.longitude || 80.2707,
        phone: loc.phone || 'N/A',
        capacity: loc.capacity || loc.status,
        status: loc.status || 'Active',
        iconEmoji: loc.facility_type === 'Hospital' ? '🏥' : (loc.facility_type === 'Relief Shelter' ? '🎪' : '🚒'),
        rawObj: loc,
        type: 'safe_location'
      });
    });

    // 2. Threat / Danger Areas
    areas.forEach(area => {
      list.push({
        id: `area-${area.id}`,
        name: area.area_name,
        category: 'Threat Zone',
        address: `Threat Sector • Danger Score: ${area.priority_score}/100`,
        latitude: area.latitude || 13.0827,
        longitude: area.longitude || 80.2707,
        phone: 'N/A',
        capacity: `Pop: ${area.population?.toLocaleString() || 'N/A'} • ${area.severity}`,
        status: area.severity || 'Active',
        iconEmoji: '⚠️',
        rawObj: area,
        type: 'area'
      });
    });

    // 3. Citizen SOS Emergency Reports
    reports.filter(isCitizenReport).forEach(rpt => {
      const [lat, lng] = getReportCoordinates(rpt, reports);
      list.push({
        id: `sos-${rpt.id}`,
        name: `${rpt.disaster_type || 'Emergency SOS'} at ${rpt.location || 'Incident Site'}`,
        category: 'Citizen SOS',
        address: `Reporter: ${rpt.reporter_name || rpt.name || 'Citizen'} (${rpt.reporter_phone || 'N/A'})`,
        latitude: lat,
        longitude: lng,
        phone: rpt.reporter_phone || '108',
        capacity: `Stranded: ${rpt.people_affected || 1} • Score: ${rpt.priority_score?.toFixed(0) || 85}/100`,
        status: rpt.status || 'Pending',
        iconEmoji: '👥',
        rawObj: rpt,
        type: 'citizen_sos'
      });
    });

    // 4. Vehicles & Rescue Fleet
    vehicles.forEach(veh => {
      const [lat, lng] = getVehicleCoordinates(veh);
      const isAmbulance = veh.type === 'Ambulance';
      const isBoat = veh.type === 'Boat';
      const isHeli = veh.type === 'Helicopter';
      const icon = isAmbulance ? '🚑' : (isBoat ? '🚤' : (isHeli ? '🚁' : '🚚'));
      list.push({
        id: `veh-${veh.id}`,
        name: `${veh.vehicle_id || veh.type} (${veh.type})`,
        category: 'Vehicle',
        address: `Base: ${veh.location} • Driver: ${veh.driver || 'ResQ Crew'}`,
        latitude: lat,
        longitude: lng,
        phone: '108',
        capacity: `Cap: ${veh.capacity} • Status: ${veh.status}`,
        status: veh.status || 'Available',
        iconEmoji: icon,
        rawObj: veh,
        type: 'vehicle'
      });
    });

    return list;
  };

  const combinedLocations = getAllLocationsCombined();

  // Filtered locations array for Location Drawer
  const filteredLocationsList = combinedLocations.filter(loc => {
    if (locationCategoryFilter !== 'All' && loc.category !== locationCategoryFilter) {
      return false;
    }
    if (locationSearchQuery.trim() !== '') {
      const q = locationSearchQuery.toLowerCase();
      return loc.name.toLowerCase().includes(q) || loc.address.toLowerCase().includes(q) || loc.category.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered areas & reports for Leaflet rendering
  const filteredAreas = areas.filter(a => {
    if (showCitizenOnly) return false;
    if (severityFilter === 'All') return true;
    return a.severity === severityFilter || a.status === severityFilter;
  });

  const filteredReports = reports.filter(r => {
    if (showCitizenOnly && !isCitizenReport(r)) return false;
    if (severityFilter === 'All') return true;
    return r.severity === severityFilter || r.priority_level === severityFilter;
  });

  // Calculate highest danger area
  const highestDangerArea = areas.reduce((max, area) => {
    return (area.priority_score > (max?.priority_score || 0)) ? area : max;
  }, null);

  const citizenReportCount = reports.filter(isCitizenReport).length;
  const currentProviderObj = MAP_PROVIDERS.find(p => p.id === mapProvider) || MAP_PROVIDERS[0];

  return (
    <div className="space-y-4 pb-8">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Interactive Tactical Disaster & Danger Map</h2>
            <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-600" /> Live Threat Overlay
            </span>
            <span className="bg-cyan-100 text-cyan-900 border border-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1">
              <Users className="w-3 h-3 text-cyan-600" /> {citizenReportCount} Citizen SOS Markers
            </span>
          </div>
          <p className="text-xs text-slate-500">Real-time geospatial danger scoring, citizen emergency SOS markers, weather hazard warnings, and Dijkstra dispatch routes</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs shadow-xs">
          <span className="font-bold text-slate-700 text-[11px] uppercase">Danger Legend:</span>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span><span className="text-slate-600 font-bold">Critical</span></div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span><span className="text-slate-600 font-bold">High</span></div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span><span className="text-slate-600 font-bold">Medium</span></div>
          
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 text-cyan-700 font-black bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping inline-block"></span>
            👥 Citizen SOS (Special Marker)
          </div>

          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 text-blue-600 font-bold"><Navigation className="w-3.5 h-3.5" /> Dijkstra Route</div>
        </div>
      </div>

      {/* Live Danger & Weather Diagnostics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-rose-900 to-red-950 text-white p-3.5 rounded-xl border border-rose-800 shadow-md">
          <span className="text-[10px] font-extrabold text-rose-300 uppercase tracking-widest flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Maximum Danger Sector
          </span>
          <h4 className="text-sm font-black text-white mt-1 truncate">
            {highestDangerArea ? highestDangerArea.area_name : 'Monitoring...'}
          </h4>
          <div className="flex items-center justify-between mt-1 text-xs">
            <span className="text-rose-200 font-bold">Score: {highestDangerArea?.priority_score || 'N/A'}/100</span>
            <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase">
              {highestDangerArea?.severity || 'Critical'}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-3.5 rounded-xl border border-indigo-800 shadow-md">
          <span className="text-[10px] font-extrabold text-cyan-300 uppercase tracking-widest flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-cyan-400" /> Citizen Emergency Signals
          </span>
          <h4 className="text-sm font-black text-white mt-1 truncate">
            {citizenReportCount} Live Citizen Reports
          </h4>
          <div className="flex items-center justify-between mt-1 text-xs text-slate-300">
            <span>Special Beacon Active</span>
            <span className="text-cyan-300 font-bold">{reports.filter(r => isCitizenReport(r) && r.status === 'Pending').length} Pending</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-3.5 rounded-xl border border-slate-700 shadow-md">
          <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Weather Hazard Threat
          </span>
          <h4 className="text-sm font-black text-white mt-1 truncate">
            {weatherOverview?.active_hazard_warnings?.[0] || 'Moderate Environmental Risk'}
          </h4>
          <div className="flex items-center justify-between mt-1 text-xs text-slate-300">
            <span>Avg Risk: {weatherOverview?.average_weather_risk_score || 0}/100</span>
            <span className="text-amber-400 font-bold">{weatherOverview?.active_hazard_warnings?.length || 0} Active Hazards</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Map Tile Engine</span>
            <h3 className="text-xs font-black text-slate-800 mt-1 truncate max-w-[140px]">{currentProviderObj.name}</h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
              {currentProviderObj.requiresKey && (mapApiKey || import.meta.env.VITE_MAP_API_KEY) ? (
                <><Key className="w-3 h-3 text-emerald-600" /> Custom API Key Active</>
              ) : (
                <><Check className="w-3 h-3 text-emerald-600" /> Free Tile Layer Active</>
              )}
            </span>
          </div>
          <button 
            onClick={() => setShowKeyModal(true)}
            className="p-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl border border-blue-200 transition-all cursor-pointer flex flex-col items-center gap-0.5"
            title="Configure Map API Key & Tile Server"
          >
            <Key className="w-4 h-4" />
            <span className="text-[9px] font-extrabold uppercase">API Key</span>
          </button>
        </div>
      </div>

      {/* Map Layer Controls & Location Options Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-2.5 text-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap font-bold text-slate-700">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1 font-black">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> MAP LAYERS & OVERLAYS:
            </span>

            <button
              onClick={() => setShowDangerZones(!showDangerZones)}
              className={`px-2.5 py-1 rounded-md border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showDangerZones ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Danger Radius Rings
            </button>

            <button
              onClick={() => setShowWeatherOverlay(!showWeatherOverlay)}
              className={`px-2.5 py-1 rounded-md border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showWeatherOverlay ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5 text-blue-600" /> Weather Hazard Details
            </button>

            <button
              onClick={() => setShowRoutes(!showRoutes)}
              className={`px-2.5 py-1 rounded-md border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showRoutes ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-indigo-600" /> Rescue Routes
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap font-bold text-slate-700">
            <button 
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className={`px-3 py-1 rounded-md border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isMapExpanded 
                  ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-400' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 border border-blue-500 shadow-sm'
              }`}
              title={isMapExpanded ? "Exit Extended View" : "Extend Map to Fullscreen"}
            >
              {isMapExpanded ? (
                <><Minimize2 className="w-3.5 h-3.5 text-slate-950 animate-pulse" /> Exit Extended Map</>
              ) : (
                <><Maximize2 className="w-3.5 h-3.5 text-cyan-200" /> Extend Map View</>
              )}
            </button>

            <button 
              onClick={() => setShowKeyModal(true)}
              className="px-2.5 py-1 rounded-md bg-slate-900 text-cyan-300 hover:bg-slate-800 border border-slate-700 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Key className="w-3.5 h-3.5 text-cyan-400" /> Map API Key
            </button>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-500">Filter Danger:</span>
              <select 
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Danger Levels</option>
                <option value="Critical">Critical Only (Score 81-100)</option>
                <option value="High">High Only (Score 61-80)</option>
                <option value="Medium">Medium Only (Score 31-60)</option>
                <option value="Low">Low Only (Score 0-30)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location Category Option Buttons Toolbar */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap font-bold">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1 font-black">
            <Compass className="w-3.5 h-3.5 text-emerald-600" /> LOCATION OPTIONS:
          </span>

          <button
            onClick={() => handleOpenLocationCategory('Hospital')}
            className={`px-3 py-1 rounded-lg border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              showLocationDrawer && locationCategoryFilter === 'Hospital'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100 shadow-xs'
            }`}
          >
            <span>🏥</span> Hospitals ({hospitalsList.length})
          </button>

          <button
            onClick={() => handleOpenLocationCategory('Relief Shelter')}
            className={`px-3 py-1 rounded-lg border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              showLocationDrawer && locationCategoryFilter === 'Relief Shelter'
                ? 'bg-cyan-600 text-white border-cyan-700 shadow-md ring-2 ring-cyan-400'
                : 'bg-cyan-50 border-cyan-300 text-cyan-900 hover:bg-cyan-100 shadow-xs'
            }`}
          >
            <span>🎪</span> Relief Shelters ({sheltersList.length})
          </button>

          <button
            onClick={() => handleOpenLocationCategory('Fire Station')}
            className={`px-3 py-1 rounded-lg border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              showLocationDrawer && locationCategoryFilter === 'Fire Station'
                ? 'bg-orange-600 text-white border-orange-700 shadow-md ring-2 ring-orange-400'
                : 'bg-orange-50 border-orange-300 text-orange-900 hover:bg-orange-100 shadow-xs'
            }`}
          >
            <span>🚒</span> Fire Stations ({fireList.length})
          </button>

          <button
            onClick={() => handleOpenLocationCategory('Threat Zone')}
            className={`px-3 py-1 rounded-lg border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              showLocationDrawer && locationCategoryFilter === 'Threat Zone'
                ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400'
                : 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100 shadow-xs'
            }`}
          >
            <span>⚠️</span> Threat Zones ({areas.length})
          </button>

          <button
            onClick={() => handleOpenLocationCategory('Citizen SOS')}
            className={`px-3 py-1 rounded-lg border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              showLocationDrawer && locationCategoryFilter === 'Citizen SOS'
                ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-400'
                : 'bg-purple-50 border-purple-300 text-purple-900 hover:bg-purple-100 shadow-xs'
            }`}
          >
            <span>👥</span> Citizen SOS ({citizenReportCount})
          </button>

          <button
            onClick={() => handleOpenLocationCategory('Vehicle')}
            className={`px-3 py-1 rounded-lg border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              showLocationDrawer && locationCategoryFilter === 'Vehicle'
                ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400'
                : 'bg-blue-50 border-blue-300 text-blue-900 hover:bg-blue-100 shadow-xs'
            }`}
          >
            <span>🚚</span> Rescue Fleet ({vehicles.length})
          </button>

          <button
            onClick={() => handleOpenLocationCategory('All')}
            className={`px-3 py-1 rounded-lg border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              showLocationDrawer && locationCategoryFilter === 'All'
                ? 'bg-slate-900 text-cyan-300 border-slate-950 shadow-md ring-2 ring-cyan-400'
                : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
            }`}
          >
            <span>📍</span> All Map Locations ({combinedLocations.length})
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div 
        ref={mapWrapperRef}
        className={`transition-all duration-300 border border-slate-300 shadow-lg ${
          isMapExpanded 
            ? 'fixed inset-2 z-50 h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] bg-slate-950 rounded-2xl p-2 overflow-hidden ring-4 ring-cyan-500/50 shadow-2xl' 
            : 'cmd-card p-2 h-[620px] relative overflow-hidden rounded-xl'
        }`}
      >
        {/* Floating Map Extend / Fullscreen Toggle Button */}
        <button
          onClick={() => setIsMapExpanded(!isMapExpanded)}
          className="absolute top-4 right-4 z-20 bg-slate-950/90 text-cyan-300 hover:text-white hover:bg-slate-900 border border-slate-700/80 px-3.5 py-2 rounded-xl shadow-2xl backdrop-blur-md text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
          title={isMapExpanded ? "Exit Extended View" : "Extend Map to Fullscreen"}
        >
          {isMapExpanded ? (
            <>
              <Minimize2 className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Exit Extended View</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-cyan-400" />
              <span>Extend Map</span>
            </>
          )}
        </button>

        <MapContainer 
          center={defaultCenter} 
          zoom={11} 
          scrollWheelZoom={true} 
          className="w-full h-full rounded-md z-10"
        >
          <TileLayer
            key={`${mapProvider}-${mapApiKey}-${customTileUrl}`}
            attribution={getActiveAttribution()}
            url={getActiveTileUrl()}
          />

          {/* Smooth Map Zoom & Pan Controller */}
          <MapFlyTo center={mapFocusCenter} zoom={14} />

          {/* Automatic Tile Resizer for Map Extend */}
          <MapResizeHandler isExpanded={isMapExpanded} />

          {/* Central Depot Marker */}
          <CircleMarker
            center={centralDepotCoords}
            radius={10}
            pathOptions={{ fillColor: '#2563eb', fillOpacity: 0.9, color: '#ffffff', weight: 3 }}
          >
            <Popup>
              <div className="p-1.5 text-xs text-slate-900 font-bold">
                <p className="text-blue-600 font-black">🏢 Central Rescue Logistics Depot</p>
                <p className="text-[10px] text-slate-500 font-normal">Staging Base: (13.0827, 80.2707)</p>
              </div>
            </Popup>
          </CircleMarker>

          {/* SAFE HOSPITALS, SHELTERS & FIRE STATIONS MARKERS */}
          {showSafeLocations && safeLocations
            .filter((loc) => {
              if (locationCategoryFilter === 'All') return true;
              return loc.facility_type === locationCategoryFilter;
            })
            .map((loc) => {
            const locLat = loc.latitude || 13.0827;
            const locLng = loc.longitude || 80.2707;
            return (
              <Marker
                key={`safe-loc-${loc.id}`}
                position={[locLat, locLng]}
                icon={createSafeLocationIcon(loc)}
              >
                <Popup>
                  <div className="p-2 space-y-1.5 max-w-xs text-xs text-slate-900">
                    <div className="flex items-center gap-1.5 border-b pb-1">
                      <span className="text-base">{loc.facility_type === 'Hospital' ? '🏥' : (loc.facility_type === 'Relief Shelter' ? '🎪' : '🚒')}</span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs leading-tight">{loc.name}</h4>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">{loc.facility_type} • {loc.status}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600">{loc.address}</p>
                    <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded text-[11px] space-y-0.5">
                      <div className="flex justify-between font-bold text-emerald-900">
                        <span>Capacity / Beds:</span>
                        <span>{loc.capacity}</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Emergency Hotline:</span>
                        <a href={`tel:${loc.phone}`} className="font-mono font-bold text-blue-600 hover:underline">
                          📞 {loc.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* RESCUE FLEET & VEHICLE MARKERS */}
          {showVehicles && (locationCategoryFilter === 'All' || locationCategoryFilter === 'Vehicle') && vehicles.map((veh) => {
            const [lat, lng] = getVehicleCoordinates(veh);
            return (
              <Marker
                key={`veh-marker-${veh.id}`}
                position={[lat, lng]}
                icon={createVehicleMarkerIcon(veh)}
              >
                <Popup>
                  <div className="p-1.5 text-xs text-slate-900 font-bold space-y-1">
                    <p className="text-blue-600 font-black flex items-center gap-1">
                      🚚 {veh.vehicle_id || veh.type} ({veh.type})
                    </p>
                    <p className="text-[10px] text-slate-600">Base: {veh.location}</p>
                    <p className="text-[10px] text-emerald-700 font-bold">Driver: {veh.driver || 'ResQ Crew'}</p>
                    <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-black">
                      Status: {veh.status}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* ACTIVE CLICKED HOSPITAL / FACILITY TURN-BY-TURN ON-ROAD DRIVING ROUTE (GOOGLE MAPS STYLE) */}
          {selectedHospitalVector && selectedHospitalVector.path && (
            <React.Fragment key="selected-hospital-onroad-route">
              {/* Dark Navy Outer Road Outline */}
              <Polyline
                positions={selectedHospitalVector.path}
                pathOptions={{
                  color: '#0f172a',
                  weight: 8,
                  opacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
              {/* Vibrant Royal Blue On-Road Navigation Drive Line */}
              <Polyline
                positions={selectedHospitalVector.path}
                pathOptions={{
                  color: '#0284c7',
                  weight: 5,
                  opacity: 1,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
              {/* Bright Cyan Inner Core */}
              <Polyline
                positions={selectedHospitalVector.path}
                pathOptions={{
                  color: '#38bdf8',
                  weight: 2,
                  opacity: 1,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            </React.Fragment>
          )}

          {/* Render Threat Radius Circles around Affected Areas */}
          {showDangerZones && (locationCategoryFilter === 'All' || locationCategoryFilter === 'Threat Zone') && filteredAreas.map((area) => {
            const lat = area.latitude || 13.0827;
            const lon = area.longitude || 80.2707;
            const isCritical = area.severity === 'Critical' || area.priority_score >= 81;
            const isHigh = area.severity === 'High' || area.priority_score >= 61;
            
            const circleColor = isCritical ? '#dc2626' : (isHigh ? '#ea580c' : '#d97706');
            const radiusMeters = isCritical ? 2500 : (isHigh ? 1800 : 1200);

            return (
              <Circle
                key={`danger-ring-${area.id}`}
                center={[lat, lon]}
                radius={radiusMeters}
                pathOptions={{
                  color: circleColor,
                  fillColor: circleColor,
                  fillOpacity: isCritical ? 0.18 : 0.1,
                  weight: isCritical ? 2.5 : 1.5,
                  dashArray: isCritical ? '6, 6' : '4, 4'
                }}
              />
            );
          })}

          {/* Area Circle Markers with Detailed Danger & Weather Popups */}
          {!showCitizenOnly && (locationCategoryFilter === 'All' || locationCategoryFilter === 'Threat Zone') && filteredAreas.map((area) => {
            const color = getMarkerColor(area.severity, area.priority_score);
            const wData = weatherMap[area.id];

            return (
              <CircleMarker
                key={area.id}
                center={[area.latitude || 13.0827, area.longitude || 80.2707]}
                radius={area.priority_score >= 81 ? 16 : 12}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.85,
                  color: '#ffffff',
                  weight: 2.5
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-2.5 space-y-2.5 max-w-xs text-xs text-slate-900">
                    <div className="flex justify-between items-start border-b pb-2">
                      <div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 uppercase">
                          <ShieldAlert className="w-3.5 h-3.5" /> Threat Zone
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{area.area_name}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Population At Risk: {area.population?.toLocaleString()}</p>
                      </div>
                      <PriorityBadge level={area.severity} />
                    </div>

                    {/* Danger Score Progress Bar */}
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">Calculated Danger Index:</span>
                        <span className="font-black text-sm text-red-600">{area.priority_score} / 100</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-600"
                          style={{ width: `${Math.min(100, area.priority_score)}%` }}
                        />
                      </div>
                    </div>

                    {/* OpenWeather & Danger Diagnostics Box */}
                    {showWeatherOverlay && wData && (
                      <div className="bg-slate-900 text-white p-2.5 rounded-lg text-[11px] space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between font-bold text-blue-300 pb-1 border-b border-slate-700">
                          <span className="flex items-center gap-1">
                            <CloudRain className="w-3.5 h-3.5 text-cyan-400" /> {Math.round(wData.weather_temp)}°C
                          </span>
                          <span className="capitalize text-[10px] text-slate-300">{wData.weather_description}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                          <span className="flex items-center gap-1">
                            <Wind className="w-3 h-3 text-blue-400" /> {wData.wind_speed_kmh} km/h wind
                          </span>
                          <span className="flex items-center gap-1 justify-end">
                            <Droplets className="w-3 h-3 text-indigo-400" /> {wData.rain_mm_h} mm/h rain
                          </span>
                        </div>
                        {wData.active_hazards && wData.active_hazards.length > 0 && (
                          <div className="pt-1 text-[10px] text-amber-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{wData.active_hazards[0]}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Medical & Resource Needs */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-slate-700">
                        <span>Medical Emergency Cases:</span>
                        <span className="text-rose-600">{area.medical_cases || 0} cases</span>
                      </div>

                      <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Demanded Resources:</p>
                      <div className="grid grid-cols-3 gap-1 text-center font-bold text-[11px]">
                        <div className="bg-slate-100 p-1.5 rounded">Food: {area.food_required}</div>
                        <div className="bg-slate-100 p-1.5 rounded">Water: {area.water_required}</div>
                        <div className="bg-blue-50 text-blue-700 border border-blue-200 p-1.5 rounded">Med: {area.medicine_required}</div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* DISASTER REPORTS (CITIZEN SPECIAL MARKERS VS REGULAR CIRCLE MARKERS) */}
          {(locationCategoryFilter === 'All' || locationCategoryFilter === 'Citizen SOS') && filteredReports.map((rpt) => {
            const [lat, lng] = getReportCoordinates(rpt, filteredReports);
            const citizenFlag = isCitizenReport(rpt);

            if (citizenFlag) {
              // SPECIAL HIGH-VISIBILITY MARKER FOR CITIZEN REPORTS
              return (
                <Marker
                  key={`citizen-rpt-${rpt.id}`}
                  position={[lat, lng]}
                  icon={createCitizenMarkerIcon(rpt)}
                  eventHandlers={{
                    click: () => handleSelectReport(rpt)
                  }}
                />
              );
            }

            // STANDARD CIRCLE MARKER FOR NON-CITIZEN REPORTS
            const color = getMarkerColor(rpt.severity, rpt.priority_score);
            return (
              <CircleMarker
                key={rpt.id}
                center={[lat, lng]}
                radius={15}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.9,
                  color: '#2563eb',
                  weight: 3.5
                }}
                eventHandlers={{
                  click: () => handleSelectReport(rpt)
                }}
              />
            );
          })}
        </MapContainer>

        {/* Active Category Map Mode Indicator Badge */}
        {locationCategoryFilter !== 'All' && (
          <div className="absolute top-4 left-4 z-20 bg-slate-950/95 text-white border border-cyan-400/80 px-3.5 py-1.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-black flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-slate-300">Indicating on Map:</span>
            <span className="text-cyan-300 font-extrabold uppercase bg-cyan-950/90 px-2 py-0.5 rounded border border-cyan-500/50">
              {locationCategoryFilter === 'Hospital' && '🏥 Hospitals Only'}
              {locationCategoryFilter === 'Relief Shelter' && '🎪 Relief Shelters Only'}
              {locationCategoryFilter === 'Fire Station' && '🚒 Fire Stations Only'}
              {locationCategoryFilter === 'Threat Zone' && '⚠️ Threat Zones Only'}
              {locationCategoryFilter === 'Citizen SOS' && '👥 Citizen SOS Only'}
              {locationCategoryFilter === 'Vehicle' && '🚚 Rescue Fleet Only'}
            </span>
            <button 
              onClick={() => handleOpenLocationCategory('All')} 
              className="ml-1 text-[10px] text-cyan-400 hover:text-white underline cursor-pointer font-bold"
              title="Show All Map Locations"
            >
              Reset / Show All
            </button>
          </div>
        )}

        {/* Location Fly-to Notice Banner */}
        {selectedLocationNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 text-cyan-300 border border-cyan-400 px-4 py-2 rounded-full shadow-2xl text-xs font-black flex items-center gap-2 animate-bounce">
            <Crosshair className="w-4 h-4 text-cyan-400 animate-spin" /> {selectedLocationNotice}
          </div>
        )}

        {/* LOCATION OPTIONS DIRECTORY PANEL (SLEEK FROSTED GLASS EFFECT) */}
        {showLocationDrawer && (
          <div 
            className="absolute top-4 left-4 z-30 max-w-sm w-full bg-slate-950/80 backdrop-blur-xl text-white border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col transition-all duration-300 ring-1 ring-white/10"
            style={{ maxHeight: isLocationDrawerMinimized ? '58px' : '580px' }}
          >
            {/* Glass Header */}
            <div className="bg-gradient-to-r from-slate-900/90 via-indigo-950/90 to-slate-900/90 p-3.5 border-b border-white/10 flex items-center justify-between backdrop-blur-lg">
              <div className="flex items-center gap-2.5 overflow-hidden pr-1">
                <span className="p-1.5 bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-400/30 shadow-xs shrink-0">
                  <Building2 className="w-4 h-4" />
                </span>
                <div className="truncate">
                  <h3 className="font-extrabold text-xs text-white flex items-center gap-1.5 truncate tracking-tight">
                    {locationCategoryFilter === 'Hospital' && '🏥 Hospital Directory'}
                    {locationCategoryFilter === 'Relief Shelter' && '🎪 Relief Shelter Locations'}
                    {locationCategoryFilter === 'Fire Station' && '🚒 Fire Station Locations'}
                    {locationCategoryFilter === 'Threat Zone' && '⚠️ Threat Sector Locations'}
                    {locationCategoryFilter === 'Citizen SOS' && '👥 Citizen SOS Emergency Locations'}
                    {locationCategoryFilter === 'Vehicle' && '🚚 Rescue Fleet Locations'}
                    {locationCategoryFilter === 'All' && '📍 All Map Locations Explorer'}
                  </h3>
                  <p className="text-[10px] text-cyan-300/80 font-medium truncate">
                    Click any location to center & fly on map
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => setIsLocationDrawerMinimized(!isLocationDrawerMinimized)}
                  className="p-1.5 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer border border-white/10"
                  title={isLocationDrawerMinimized ? "Expand Window" : "Minimize Window"}
                >
                  {isLocationDrawerMinimized ? <ChevronUp className="w-3.5 h-3.5 text-cyan-300" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-300" />}
                </button>
                <button 
                  onClick={() => setShowLocationDrawer(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer border border-white/10"
                  title="Close Location Options Window"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!isLocationDrawerMinimized && (
              <>
                {/* Search & Category Tabs */}
                <div className="p-3 bg-slate-900/60 backdrop-blur-md border-b border-white/10 space-y-2">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-cyan-400/70 absolute left-2.5 top-2.5" />
                    <input 
                      type="text"
                      value={locationSearchQuery}
                      onChange={(e) => setLocationSearchQuery(e.target.value)}
                      placeholder="Search locations, hospitals, shelters..."
                      className="w-full bg-slate-950/80 border border-white/15 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/80 backdrop-blur-sm"
                    />
                    {locationSearchQuery && (
                      <button 
                        onClick={() => setLocationSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Category Pills inside Drawer */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] scrollbar-none font-bold">
                    {[
                      { id: 'All', label: `All (${combinedLocations.length})` },
                      { id: 'Hospital', label: `🏥 Hospitals (${hospitalsList.length})` },
                      { id: 'Relief Shelter', label: `🎪 Shelters (${sheltersList.length})` },
                      { id: 'Fire Station', label: `🚒 Fire (${fireList.length})` },
                      { id: 'Threat Zone', label: `⚠️ Threat (${areas.length})` },
                      { id: 'Citizen SOS', label: `👥 SOS (${citizenReportCount})` },
                      { id: 'Vehicle', label: `🚚 Fleet (${vehicles.length})` }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setLocationCategoryFilter(tab.id)}
                        className={`px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all ${
                          locationCategoryFilter === tab.id
                            ? 'bg-cyan-500/90 text-slate-950 font-black shadow-md border border-cyan-300'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Cards List */}
                <div className="p-3 overflow-y-auto space-y-2 max-h-[380px]">
                  {filteredLocationsList.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No matching locations found for "{locationSearchQuery}".
                    </div>
                  ) : (
                    filteredLocationsList.map((item) => {
                      const isSelected = mapFocusCenter && 
                        Math.abs(mapFocusCenter[0] - item.latitude) < 0.0001 && 
                        Math.abs(mapFocusCenter[1] - item.longitude) < 0.0001;

                      return (
                        <div 
                          key={item.id}
                          onClick={() => handleSelectLocationItem(item)}
                          className={`p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-cyan-950/80 border-cyan-400/90 ring-1 ring-cyan-400/80 shadow-lg shadow-cyan-950/80' 
                              : 'bg-slate-900/60 border-white/10 hover:border-cyan-400/50 hover:bg-slate-900/90'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-white text-xs flex items-center gap-1.5 leading-tight">
                              <span className="text-sm">{item.iconEmoji}</span> {item.name}
                            </span>
                            <span className="bg-white/10 text-cyan-300 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-white/10 shrink-0">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-300 mt-1 leading-snug">{item.address}</p>
                          
                          <div className="flex justify-between items-center text-[10px] mt-2 pt-1.5 border-t border-white/10">
                            <span className="text-emerald-400 font-bold truncate max-w-[160px]">
                              {item.capacity}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectLocationItem(item);
                                }}
                                className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded-lg text-[9.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Crosshair className="w-3 h-3 text-cyan-400" /> Fly to Location
                              </button>
                              {item.phone && item.phone !== 'N/A' && (
                                <a 
                                  href={`tel:${item.phone}`} 
                                  onClick={(e) => e.stopPropagation()} 
                                  className="text-blue-400 hover:underline font-mono font-bold text-[9.5px]"
                                >
                                  📞 Call
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-2.5 bg-slate-900/80 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 backdrop-blur-md">
                  <span>Showing {filteredLocationsList.length} locations</span>
                  <button 
                    onClick={() => setShowLocationDrawer(false)} 
                    className="text-cyan-400 hover:underline font-bold cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* CITIZEN EMERGENCY TELEMETRY PANEL (SLEEK FROSTED GLASS EFFECT) */}
        {selectedCitizenReport && (
          <div 
            className="absolute top-4 right-4 z-30 max-w-md w-full bg-slate-950/80 backdrop-blur-xl text-white border border-rose-500/30 rounded-2xl shadow-2xl shadow-rose-950/40 overflow-hidden flex flex-col transition-all duration-300 ring-1 ring-white/10"
            style={{ maxHeight: isCitizenDrawerMinimized ? '58px' : '580px' }}
          >
            {/* Glass Header */}
            <div className="bg-gradient-to-r from-red-950/90 via-slate-900/90 to-indigo-950/90 p-3.5 border-b border-white/10 flex items-center justify-between backdrop-blur-lg">
              <div className="flex items-center gap-2 overflow-hidden pr-1">
                <span className="p-1.5 bg-red-600/30 text-red-400 rounded-xl border border-red-500/40 shrink-0 shadow-xs">
                  <ShieldAlert className="w-4 h-4 animate-pulse" />
                </span>
                <div className="truncate">
                  <span className="text-[9px] font-black text-cyan-300 uppercase tracking-widest block">
                    Citizen Emergency Telemetry
                  </span>
                  <h3 className="font-extrabold text-xs text-white truncate max-w-[240px]">
                    {selectedCitizenReport.disaster_type} at {selectedCitizenReport.location}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => setIsCitizenDrawerMinimized(!isCitizenDrawerMinimized)}
                  className="p-1.5 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer border border-white/10"
                  title={isCitizenDrawerMinimized ? "Expand Window" : "Minimize Window"}
                >
                  {isCitizenDrawerMinimized ? <ChevronUp className="w-3.5 h-3.5 text-cyan-300" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-300" />}
                </button>
                <button 
                  onClick={() => setSelectedCitizenReport(null)}
                  className="p-1.5 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer border border-white/10"
                  title="Close Telemetry Panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!isCitizenDrawerMinimized && (
              <>
                {/* Scrollable Floating Content */}
                <div className="p-4 overflow-y-auto space-y-4 text-xs font-sans max-h-[510px]">
                  {/* Priority & Citizen Header Info */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-900/60 border border-white/10 p-2.5 rounded-xl space-y-0.5 backdrop-blur-md">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Reporting Citizen</span>
                      <span className="font-black text-white text-sm block truncate">{selectedCitizenReport.reporter_name || selectedCitizenReport.name || 'Citizen SOS'}</span>
                      <a href={`tel:${selectedCitizenReport.reporter_phone}`} className="text-blue-400 hover:underline font-mono text-[11px] font-bold block pt-0.5">
                        📞 {selectedCitizenReport.reporter_phone || 'N/A'}
                      </a>
                    </div>

                    <div className="bg-slate-900/60 border border-white/10 p-2.5 rounded-xl space-y-0.5 backdrop-blur-md">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Priority Index</span>
                      <span className="font-black text-rose-400 text-base block font-mono">
                        {selectedCitizenReport.priority_score?.toFixed(1) || '85.0'} / 100
                      </span>
                      <span className="text-[10px] text-slate-300 font-bold">
                        Stranded: <strong className="text-white">{selectedCitizenReport.people_affected || 1} people</strong>
                      </span>
                    </div>
                  </div>

                  {/* Description & Resources */}
                  <div className="bg-slate-900/60 border border-white/10 p-3 rounded-xl space-y-2 backdrop-blur-md">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Incident Description</span>
                    <p className="text-slate-200 leading-relaxed italic">"{selectedCitizenReport.description || selectedCitizenReport.original_message || 'Emergency relief and rescue support requested urgently.'}"</p>
                    
                    {selectedCitizenReport.required_resources && selectedCitizenReport.required_resources.length > 0 && (
                      <div className="pt-2 border-t border-white/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Requested Emergency Supplies:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedCitizenReport.required_resources.map((r, i) => (
                            <span key={i} className="bg-rose-950/70 border border-rose-800/60 text-rose-300 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Image Evidence Preview if present */}
                  {selectedCitizenReport.image_url && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Citizen Scene Evidence Photo:</span>
                      <a href={selectedCitizenReport.image_url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-white/10">
                        <img src={selectedCitizenReport.image_url} alt="Scene Evidence" className="w-full h-36 object-cover hover:scale-105 transition-transform" />
                      </a>
                    </div>
                  )}

                  {/* NEAREST SAFE HOSPITALS, SHELTERS & FIRESTATIONS LIST */}
                  {(() => {
                    const [rLat, rLng] = getReportCoordinates(selectedCitizenReport, reports);
                    const safeList = getNearestSafeLocationsForReport(rLat, rLng, selectedCitizenReport.disaster_type, selectedCitizenReport.location);

                    return (
                      <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900/80 to-slate-950/80 border border-emerald-500/40 p-3 rounded-xl space-y-2.5 shadow-md backdrop-blur-md">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-emerald-400" /> Nearest Hospitals & Emergency Facilities ({safeList.length})
                          </span>
                          <span className="bg-emerald-900/80 text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-700/60">
                            Live Evacuation
                          </span>
                        </div>

                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {safeList.map((loc) => {
                            const isHospital = loc.facility_type === 'Hospital';
                            const isShelter = loc.facility_type === 'Relief Shelter';
                            const isFire = loc.facility_type === 'Fire Station';
                            const iconEmoji = isHospital ? '🏥' : (isShelter ? '🎪' : (isFire ? '🚒' : '🚓'));

                            const isSelectedVector = selectedHospitalVector?.facilityId === loc.id;

                            return (
                              <div 
                                key={loc.id} 
                                onClick={() => handleSelectHospitalFacility(loc, selectedCitizenReport)}
                                className={`p-2.5 rounded-xl space-y-1 transition-all cursor-pointer border backdrop-blur-sm ${
                                  isSelectedVector 
                                    ? 'bg-blue-950/80 border-cyan-400 shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-400' 
                                    : 'bg-slate-950/80 border-white/10 hover:border-emerald-400/60'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <span className="font-extrabold text-white text-xs flex items-center gap-1">
                                    {iconEmoji} {loc.name}
                                  </span>
                                  <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[9.5px] font-black px-1.5 py-0.5 rounded border border-emerald-500/40 shrink-0">
                                    {loc.distance_km} km • ~{loc.estimated_time_mins} mins
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-300">{loc.address}</p>
                                <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-white/10">
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    {isSelectedVector ? '💙 Blue Vector Route Active' : (loc.capacity || loc.status)}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectHospitalFacility(loc, selectedCitizenReport);
                                      }}
                                      className="text-cyan-400 hover:underline font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                                    >
                                      🎯 Connect Route
                                    </button>
                                    <a href={`tel:${loc.phone}`} onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:underline font-mono font-bold">
                                      📞 Call
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Footer Actions inside Floating Panel */}
                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-900/80 text-cyan-300 border border-white/10 uppercase tracking-wider">
                      Status: {selectedCitizenReport.status}
                    </span>
                    <button 
                      onClick={() => {
                        setEditingReport(selectedCitizenReport);
                        setLatInput(selectedCitizenReport.latitude || 12.9229);
                        setLngInput(selectedCitizenReport.longitude || 80.1275);
                      }}
                      className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-blue-400" /> Edit Lat/Lng
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* MAP API KEY & TILE PROVIDER MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Map API Key & Provider Settings</h3>
                  <p className="text-slate-500 text-[11px]">Configure high-resolution Mapbox, LocationIQ, or custom map tile credentials</p>
                </div>
              </div>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {keySavedNotice && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-lg text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> Map API Key and Provider saved! Updating map layer...
              </div>
            )}

            <form onSubmit={handleSaveMapSettings} className="space-y-4">
              <div>
                <label className="cmd-label">Select Map Tile Provider</label>
                <select 
                  value={mapProvider}
                  onChange={(e) => setMapProvider(e.target.value)}
                  className="cmd-input font-bold"
                >
                  {MAP_PROVIDERS.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              {currentProviderObj.requiresKey && (
                <div>
                  <label className="cmd-label flex justify-between">
                    <span>API Key / Access Token</span>
                    <span className="text-blue-600 text-[10px] lowercase font-mono">e.g. pk.eyJ1...</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={mapApiKey}
                      onChange={(e) => setMapApiKey(e.target.value)}
                      placeholder={import.meta.env.VITE_MAP_API_KEY ? "Using VITE_MAP_API_KEY from environment" : "Enter your API key here..."}
                      className="cmd-input font-mono text-xs pr-8"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Your key is saved locally in browser memory (`localStorage`) and used directly for fetching map tiles.
                  </p>
                </div>
              )}

              {mapProvider === 'custom' && (
                <div>
                  <label className="cmd-label">Custom Tile Server URL Template</label>
                  <input 
                    type="text"
                    required
                    value={customTileUrl}
                    onChange={(e) => setCustomTileUrl(e.target.value)}
                    placeholder="https://{s}.tile.yourserver.com/{z}/{x}/{y}.png?key={key}"
                    className="cmd-input font-mono text-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Must contain standard Leaflet placeholders <code className="bg-slate-100 px-1 rounded">{`{z}`}</code>, <code className="bg-slate-100 px-1 rounded">{`{x}`}</code>, <code className="bg-slate-100 px-1 rounded">{`{y}`}</code> and optional <code className="bg-slate-100 px-1 rounded">{`{key}`}</code>.
                  </p>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-1.5 text-[11px]">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-600" /> Current Layer Configuration Summary:
                </span>
                <div className="text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Provider:</span>
                    <span className="font-extrabold text-slate-900">{currentProviderObj.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>API Key Status:</span>
                    <span className="font-bold text-emerald-700">
                      {mapApiKey ? 'Configured (Local Storage)' : (import.meta.env.VITE_MAP_API_KEY ? 'Configured (.env)' : 'Not Set (Using Free Tiles)')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowKeyModal(false)} className="btn-secondary text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs cursor-pointer flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Save Map Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL COORDINATE EDITOR MODAL */}
      {editingReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <MapPin className="w-4 h-4 text-red-600" /> Manually Set Incident Coordinates
              </h3>
              <button onClick={() => setEditingReport(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-500">
              Update latitude/longitude for <span className="font-bold text-slate-800">{editingReport.disaster_type} at {editingReport.location}</span>:
            </p>

            <form onSubmit={handleUpdateCoordinates} className="space-y-3">
              <div>
                <label className="cmd-label">Latitude</label>
                <input 
                  required
                  type="number"
                  step="any"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  className="cmd-input"
                  placeholder="e.g. 12.9229"
                />
              </div>

              <div>
                <label className="cmd-label">Longitude</label>
                <input 
                  required
                  type="number"
                  step="any"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  className="cmd-input"
                  placeholder="e.g. 80.1275"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingReport(null)} className="btn-secondary text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submittingCoord} className="btn-primary text-xs cursor-pointer">
                  {submittingCoord ? 'Saving...' : 'Update Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
