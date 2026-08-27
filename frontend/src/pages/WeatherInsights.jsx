import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudRain, 
  Sun, 
  Wind, 
  Droplets, 
  Gauge, 
  Eye, 
  AlertTriangle, 
  ShieldAlert, 
  RefreshCw, 
  Key, 
  CheckCircle2, 
  Thermometer, 
  CloudLightning, 
  Layers, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export const WeatherInsightsPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [unit, setUnit] = useState('C'); // 'C' or 'F'
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [configuringKey, setConfiguringKey] = useState(false);
  const [configMessage, setConfigMessage] = useState(null);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      const [ovData, stData] = await Promise.all([
        api.getWeatherOverview().catch(() => null),
        api.getWeatherStatus().catch(() => null)
      ]);

      if (ovData) {
        setOverview(ovData);
        if (ovData.areas_weather && ovData.areas_weather.length > 0) {
          const firstArea = ovData.areas_weather[0];
          setSelectedArea(firstArea);
          loadForecast(firstArea.latitude, firstArea.longitude, firstArea.area_name);
        }
      }
      if (stData) {
        setWeatherStatus(stData);
      }
    } catch (err) {
      console.error('Failed to load weather overview', err);
    } finally {
      setLoading(false);
    }
  };

  const loadForecast = async (lat, lon, name) => {
    try {
      const fData = await api.getWeatherForecast(lat, lon, name);
      setForecast(fData);
    } catch (err) {
      console.error('Failed to load forecast', err);
    }
  };

  useEffect(() => {
    loadWeatherData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWeatherData();
    setRefreshing(false);
  };

  const handleSelectArea = (area) => {
    setSelectedArea(area);
    loadForecast(area.latitude, area.longitude, area.area_name);
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setConfiguringKey(true);
    setConfigMessage(null);
    try {
      const res = await api.configureWeatherKey(apiKeyInput);
      if (res.success) {
        setConfigMessage({ type: 'success', text: res.message });
        setApiKeyInput('');
        await loadWeatherData();
      } else {
        setConfigMessage({ type: 'error', text: res.message || 'Verification failed' });
      }
    } catch (err) {
      setConfigMessage({ type: 'error', text: err.message || 'Error connecting to server' });
    } finally {
      setConfiguringKey(false);
    }
  };

  const formatTemp = (tempC) => {
    if (tempC === undefined || tempC === null) return 'N/A';
    if (unit === 'F') {
      return `${Math.round((tempC * 9/5) + 32)}°F`;
    }
    return `${Math.round(tempC)}°C`;
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'Extreme':
        return 'bg-red-600 text-white animate-pulse';
      case 'High':
        return 'bg-amber-600 text-white';
      case 'Moderate':
        return 'bg-yellow-500 text-slate-900 font-bold';
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600/30 rounded-xl border border-blue-500/40 text-blue-400">
            <CloudLightning className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">OpenWeather Emergency Intelligence Center</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                overview?.has_live_api ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              }`}>
                {overview?.has_live_api ? 'Live OpenWeather API' : 'OpenWeather Simulated Engine'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Real-time weather monitoring, hazard risk scores, and 5-day forecasts across active disaster zones</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Unit Selector */}
          <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex text-xs font-bold">
            <button 
              onClick={() => setUnit('C')}
              className={`px-2.5 py-1 rounded transition-colors ${unit === 'C' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              °C
            </button>
            <button 
              onClick={() => setUnit('F')}
              className={`px-2.5 py-1 rounded transition-colors ${unit === 'F' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              °F
            </button>
          </div>

          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* OpenWeather API Key Quick Configuration Drawer / Banner */}
      {!weatherStatus?.has_api_key && (
        <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/30 rounded-xl p-4 text-white shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 mt-0.5">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Connect Live OpenWeather API Key</h4>
                <p className="text-xs text-slate-300">
                  Currently running in high-fidelity simulated weather mode. Enter your OpenWeatherMap API key to fetch live satellite & atmospheric radar feeds.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveApiKey} className="flex items-center gap-2 sm:w-auto w-full">
              <input 
                type="password"
                placeholder="Enter OpenWeather API Key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-64"
              />
              <button
                type="submit"
                disabled={configuringKey || !apiKeyInput.trim()}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
              >
                {configuringKey ? 'Verifying...' : 'Connect Key'}
              </button>
            </form>
          </div>

          {configMessage && (
            <div className={`mt-3 p-2 rounded text-xs font-semibold ${
              configMessage.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-red-950/80 text-red-300 border border-red-500/30'
            }`}>
              {configMessage.text}
            </div>
          )}
        </div>
      )}

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monitored Zones</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{overview?.total_monitored_areas || 0} Areas</h3>
            <span className="text-[10px] text-blue-600 font-bold">100% Geographic Coverage</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Weather Risk Score</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{overview?.average_weather_risk_score || 0} / 100</h3>
            <span className={`text-[10px] font-extrabold ${
              (overview?.average_weather_risk_score || 0) > 50 ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {(overview?.average_weather_risk_score || 0) > 50 ? 'Elevated Environmental Risk' : 'Normal Conditions'}
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Gauge className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Weather Warnings</span>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{overview?.active_hazard_warnings?.length || 0} Alerts</h3>
            <span className="text-[10px] text-slate-500 font-medium">Automatic Emergency Dispatch</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Data Provider</span>
            <h3 className="text-base font-black text-slate-800 mt-1">{overview?.source || 'OpenWeather'}</h3>
            <span className="text-[10px] text-emerald-600 font-bold">API Status: Operational</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Active Hazard Warnings Alert Banner */}
      {overview?.active_hazard_warnings && overview.active_hazard_warnings.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-950">
          <div className="flex items-center gap-2 font-black text-sm text-rose-700 uppercase tracking-wide mb-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
            <span>Active Environmental Hazards & Emergency advisories</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {overview.active_hazard_warnings.map((hazard, i) => (
              <span key={i} className="bg-rose-600 text-white text-xs px-3 py-1 rounded-md font-bold flex items-center gap-1.5 shadow-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                {hazard}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Weather Grid & Detailed View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Disaster Areas Weather */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Disaster Zone Weather
            </h3>
            <span className="text-xs font-bold text-slate-400">{overview?.areas_weather?.length || 0} Areas</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">Loading weather data...</div>
            ) : overview?.areas_weather?.map((area) => {
              const isSelected = selectedArea?.area_id === area.area_id;
              return (
                <div 
                  key={area.area_id}
                  onClick={() => handleSelectArea(area)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all ${
                    isSelected 
                      ? 'bg-blue-50/80 border-blue-500 shadow-sm' 
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{area.area_name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${getRiskBadge(area.risk_level)}`}>
                      {area.risk_level} Risk ({area.weather_risk_score})
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 mt-2">
                    <div className="flex items-center gap-1 font-extrabold text-slate-900 text-sm">
                      <Thermometer className="w-4 h-4 text-rose-500" />
                      {formatTemp(area.weather_temp)}
                    </div>
                    <span className="text-[11px] capitalize font-medium text-slate-600">{area.weather_description}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-blue-500" /> {area.wind_speed_kmh} km/h wind
                    </span>
                    <span className="flex items-center gap-1 justify-end">
                      <CloudRain className="w-3 h-3 text-indigo-500" /> {area.rain_mm_h} mm/h rain
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Area Weather Details & 5-Day Forecast */}
        <div className="lg:col-span-2 space-y-6">
          {selectedArea ? (
            <>
              {/* Selected Area Hero Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                  <Sun className="w-64 h-64 text-blue-400" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-700/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">
                        Sector Coords: ({selectedArea.latitude.toFixed(2)}, {selectedArea.longitude.toFixed(2)})
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white mt-1 tracking-tight">{selectedArea.area_name}</h2>
                    <p className="text-xs text-slate-300 capitalize mt-0.5">
                      Current Condition: <span className="font-bold text-white">{selectedArea.weather_description}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-700">
                    <div className="text-right">
                      <div className="text-3xl font-black text-white tracking-tight">{formatTemp(selectedArea.weather_temp)}</div>
                      <div className="text-[11px] text-slate-300 font-medium">Feels like {formatTemp(selectedArea.weather_feels_like)}</div>
                    </div>
                  </div>
                </div>

                {/* Grid of Weather Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Wind className="w-3 h-3 text-blue-400" /> Wind Velocity
                    </span>
                    <p className="text-lg font-black text-white mt-1">{selectedArea.wind_speed_kmh} <span className="text-xs font-normal">km/h</span></p>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <CloudRain className="w-3 h-3 text-cyan-400" /> Precipitation
                    </span>
                    <p className="text-lg font-black text-white mt-1">{selectedArea.rain_mm_h} <span className="text-xs font-normal">mm/h</span></p>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-indigo-400" /> Air Humidity
                    </span>
                    <p className="text-lg font-black text-white mt-1">{selectedArea.humidity}%</p>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-amber-400" /> Environmental Risk
                    </span>
                    <p className="text-lg font-black text-amber-400 mt-1">{selectedArea.weather_risk_score} / 100</p>
                  </div>
                </div>

                {/* Active Hazard Tags */}
                {selectedArea.active_hazards && selectedArea.active_hazards.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Zone Advisories:</span>
                    {selectedArea.active_hazards.map((h, idx) => (
                      <span key={idx} className="bg-rose-900/60 text-rose-200 border border-rose-700/80 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 5-Day / 3-Hour Forecast Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    5-Day Weather Progression Forecast
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">OpenWeather Multi-Interval Model</span>
                </div>

                {forecast?.list ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
                    {forecast.list.slice(0, 8).map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between text-center hover:shadow-sm transition-all">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{item.dt_txt ? item.dt_txt.split(' ')[1].slice(0, 5) : `+${idx * 3}h`}</span>
                        <div className="my-2">
                          <span className="text-lg font-black text-slate-900">{formatTemp(item.main.temp)}</span>
                          <p className="text-[10px] text-slate-500 font-medium capitalize mt-0.5">
                            {item.weather[0]?.description || 'Clear'}
                          </p>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1 border-t border-slate-200 pt-1.5 mt-1">
                          <Wind className="w-3 h-3 text-blue-400" /> {Math.round(item.wind.speed * 3.6)} km/h
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs font-medium">Loading forecast metrics...</div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm font-medium">
              Select an affected area to view detailed weather diagnostics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
