import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import L from 'leaflet';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Polyline, Marker } from 'react-leaflet';
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
  Image as ImageIcon
} from 'lucide-react';

// Tile Provider Configurations & API Key Presets
const MAP_PROVIDERS = [
  {
    id: 'carto_light',
    name: 'CARTO Light (Default - No Key Required)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    requiresKey: false
  },
  {
    id: 'carto_dark',
    name: 'CARTO Dark Tactical Mode (No Key Required)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    requiresKey: false
  },
  {
    id: 'osm_standard',
    name: 'OpenStreetMap Standard (No Key Required)',
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
    id: 'mapbox_satellite',
    name: 'Mapbox Satellite High-Res (API Key Required)',
    url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token={key}',
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

export const DisasterMapPage = () => {
  const [areas, setAreas] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [reports, setReports] = useState([]);
  const [weatherMap, setWeatherMap] = useState({});
  const [weatherOverview, setWeatherOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Layer & Filter Toggles
  const [showDangerZones, setShowDangerZones] = useState(true);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showCitizenOnly, setShowCitizenOnly] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('All'); // 'All', 'Critical', 'High', 'Medium', 'Low'

  // Map API Key & Provider Configuration State
  const [mapApiKey, setMapApiKey] = useState(() => localStorage.getItem('resq_map_api_key') || '');
  const [mapProvider, setMapProvider] = useState(() => localStorage.getItem('resq_map_provider') || 'carto_light');
  const [customTileUrl, setCustomTileUrl] = useState(() => localStorage.getItem('resq_custom_tile_url') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keySavedNotice, setKeySavedNotice] = useState(false);

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
      const [areasRes, vehRes, rptRes, weatherRes] = await Promise.all([
        api.getAreas(),
        api.getVehicles(),
        api.getDisasterReports(),
        api.getWeatherOverview().catch(() => null)
      ]);
      setAreas(areasRes.data || []);
      setVehicles(vehRes.data || []);
      setReports(rptRes.data || []);
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
      return customTileUrl || MAP_PROVIDERS[0].url;
    }
    let url = selectedProvider.url;
    if (selectedProvider.requiresKey) {
      const activeKey = mapApiKey || import.meta.env.VITE_MAP_API_KEY || 'demo_key';
      url = url.replace('{key}', activeKey);
    }
    return url;
  };

  const getActiveAttribution = () => {
    const selectedProvider = MAP_PROVIDERS.find(p => p.id === mapProvider) || MAP_PROVIDERS[0];
    return selectedProvider.attribution;
  };

  // Filtered areas & reports
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

      {/* Map Layer Controls & Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap font-bold text-slate-700">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-blue-600" /> Map Layers:
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

          <button
            onClick={() => setShowCitizenOnly(!showCitizenOnly)}
            className={`px-2.5 py-1 rounded-md border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              showCitizenOnly ? 'bg-cyan-100 border-cyan-400 text-cyan-900 shadow-xs font-black' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-600" /> Citizen SOS Only ({citizenReportCount})
          </button>
        </div>

        {/* Severity & Map API Key Actions */}
        <div className="flex items-center gap-2 flex-wrap font-bold text-slate-700">
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

      {/* Main Map Container */}
      <div className="cmd-card p-2 h-[620px] relative overflow-hidden shadow-lg border border-slate-300">
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

          {/* Render Threat Radius Circles around Affected Areas */}
          {showDangerZones && filteredAreas.map((area) => {
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

          {/* Render Dijkstra Route Polylines for Verified/Assigned Reports */}
          {showRoutes && filteredReports.map((rpt) => {
            if (!rpt.latitude || !rpt.longitude) return null;
            const rptCoords = [rpt.latitude, rpt.longitude];

            const routePath = rpt.dijkstra_route?.path_coordinates || [
              centralDepotCoords,
              [13.0200, 80.2300],
              rptCoords
            ];

            const isVerifiedOrAssigned = rpt.status === 'Verified' || rpt.status === 'Assigned' || rpt.status === 'In Progress';

            return isVerifiedOrAssigned ? (
              <Polyline 
                key={`route-${rpt.id}`}
                positions={routePath} 
                pathOptions={{ color: '#2563eb', weight: 4, dashArray: '6, 6', opacity: 0.85 }} 
              />
            ) : null;
          })}

          {/* Area Circle Markers with Detailed Danger & Weather Popups */}
          {!showCitizenOnly && filteredAreas.map((area) => {
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
          {filteredReports.map((rpt) => {
            const lat = rpt.latitude || 12.9229;
            const lng = rpt.longitude || 80.1275;
            const citizenFlag = isCitizenReport(rpt);

            if (citizenFlag) {
              // SPECIAL HIGH-VISIBILITY MARKER FOR CITIZEN REPORTS
              return (
                <Marker
                  key={`citizen-rpt-${rpt.id}`}
                  position={[lat, lng]}
                  icon={createCitizenMarkerIcon(rpt)}
                >
                  <Popup>
                    <div className="p-2.5 space-y-2.5 max-w-xs text-xs text-slate-900">
                      {/* Special Banner Header */}
                      <div className="bg-gradient-to-r from-cyan-900 via-blue-900 to-indigo-950 text-white p-2.5 -mx-2.5 -mt-2.5 rounded-t-lg shadow-sm">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-cyan-300">
                          <span className="flex items-center gap-1 tracking-wider">
                            <Users className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Citizen Emergency SOS
                          </span>
                          <span className="bg-cyan-400/20 text-cyan-200 px-1.5 py-0.5 rounded border border-cyan-400/40 font-mono text-[9px]">
                            {rpt.id}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-white text-sm mt-1 leading-tight">{rpt.disaster_type} at {rpt.location}</h4>
                        <p className="text-[10px] text-cyan-200 mt-0.5">Submitted via Citizen ResQ Portal</p>
                      </div>

                      {/* Contact Info Card */}
                      <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg space-y-1 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Reporting Citizen:</span>
                          <span className="font-bold text-slate-900">{rpt.reporter_name || rpt.name || 'Anonymous Citizen'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Contact Phone:</span>
                          <a href={`tel:${rpt.reporter_phone}`} className="font-bold text-blue-600 hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3 text-blue-500" /> {rpt.reporter_phone || 'N/A'}
                          </a>
                        </div>
                      </div>

                      {/* People Stranded / Priority */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-rose-50 border border-rose-200 p-2 rounded-lg">
                          <p className="font-bold text-rose-800 uppercase text-[9px]">People Stranded:</p>
                          <p className="font-black text-rose-950 text-base">{rpt.people_affected || rpt.affected_people || 1}</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg">
                          <p className="font-bold text-amber-800 uppercase text-[9px]">Priority Score:</p>
                          <p className="font-black text-amber-950 text-base">{rpt.priority_score} / 100</p>
                        </div>
                      </div>

                      {/* Description & Resources */}
                      {rpt.description && (
                        <div className="bg-slate-100 p-2 rounded text-[11px] text-slate-700 italic border border-slate-200">
                          "{rpt.description}"
                        </div>
                      )}

                      {/* Image Thumbnail Preview if provided */}
                      {rpt.image_url && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-slate-400" /> Citizen Attached Photo:
                          </span>
                          <a href={rpt.image_url} target="_blank" rel="noreferrer" className="block rounded overflow-hidden border border-slate-300">
                            <img src={rpt.image_url} alt="Disaster Evidence" className="w-full h-24 object-cover hover:scale-105 transition-transform" />
                          </a>
                        </div>
                      )}

                      {/* Required Resources List */}
                      <div>
                        <p className="font-bold text-slate-700 text-[10px] uppercase">Requested Resources:</p>
                        <p className="font-semibold text-slate-800 text-[11px] mt-0.5">
                          {rpt.required_resources && rpt.required_resources.length > 0 
                            ? rpt.required_resources.join(', ') 
                            : (rpt.resources_needed ? rpt.resources_needed.join(', ') : 'Immediate Evacuation & Support')}
                        </p>
                      </div>

                      {/* Assigned Squad Banner */}
                      {rpt.assigned_team_name && (
                        <div className="bg-blue-50 border border-blue-200 p-2 rounded text-[11px] text-blue-900 font-bold flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <span className="text-[9px] uppercase text-blue-600 block">Dispatch Unit Assigned</span>
                            {rpt.assigned_team_name}
                          </div>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="pt-2 border-t flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-200 text-slate-800 uppercase">
                          Status: {rpt.status}
                        </span>
                        <button 
                          onClick={() => {
                            setEditingReport(rpt);
                            setLatInput(rpt.latitude || 12.9229);
                            setLngInput(rpt.longitude || 80.1275);
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Edit Lat/Lng
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
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
              >
                <Popup>
                  <div className="p-2.5 space-y-2 max-w-xs text-xs text-slate-900">
                    <div className="flex justify-between items-start border-b pb-1.5">
                      <div>
                        <div className="flex items-center gap-1 text-blue-700 font-bold text-[11px]">
                          <FileText className="w-3.5 h-3.5" /> Incident Report
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{rpt.disaster_type} at {rpt.location}</h4>
                      </div>
                      <PriorityBadge level={rpt.severity || rpt.priority_level} />
                    </div>

                    <div className="bg-slate-100 p-2 rounded text-[11px]">
                      <p className="font-bold text-slate-500 uppercase text-[10px]">People Stranded / Affected:</p>
                      <p className="font-black text-slate-900 text-sm">{rpt.people_affected || 'Unknown'}</p>
                    </div>

                    <div className="bg-red-50 p-2 rounded flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Calculated Priority:</span>
                      <span className="font-black text-red-600 text-sm">{rpt.priority_score} / 100</span>
                    </div>

                    <div>
                      <p className="font-bold text-slate-700 text-[10px] uppercase">Required Resources:</p>
                      <p className="font-semibold text-slate-800 text-[11px]">
                        {rpt.required_resources && rpt.required_resources.length > 0 ? rpt.required_resources.join(', ') : 'None specified'}
                      </p>
                    </div>

                    {rpt.assigned_team_name && (
                      <div className="bg-blue-50 border border-blue-200 p-1.5 rounded text-[11px] text-blue-900 font-bold flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-blue-600" /> Squad Assigned: {rpt.assigned_team_name}
                      </div>
                    )}

                    <div className="pt-2 border-t flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">Status: {rpt.status}</span>
                      <button 
                        onClick={() => {
                          setEditingReport(rpt);
                          setLatInput(rpt.latitude || 12.9229);
                          setLngInput(rpt.longitude || 80.1275);
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Edit Lat/Lng
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
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
