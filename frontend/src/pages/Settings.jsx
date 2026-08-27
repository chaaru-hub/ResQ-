import React, { useState } from 'react';
import { Settings, Save, Sliders, ShieldCheck, Database, ToggleLeft, ToggleRight, Server, User } from 'lucide-react';

export const SettingsPage = ({ setActiveTab }) => {
  const [weights, setWeights] = useState({
    severity_max: 40,
    population_max: 25,
    urgency_max: 20,
    resource_shortage_max: 15
  });

  const [demoMode, setDemoMode] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">System Settings & Admin Preferences</h2>
        <p className="text-xs text-slate-500">Configure factor weights for priority scoring and system preferences</p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-md text-xs font-bold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          System Settings & Algorithm Weights saved successfully.
        </div>
      )}

      {/* Admin Profile Overview */}
      <div className="cmd-card">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
          <User className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Administrator Command Profile</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Officer Name</span>
            <p className="font-extrabold text-slate-900 mt-0.5">Admin Control Officer</p>
          </div>
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Official Email</span>
            <p className="font-bold text-slate-800 mt-0.5">admin.resq@gov.emergency</p>
          </div>
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Security Clearance</span>
            <p className="font-bold text-emerald-700 mt-0.5">Level 5 Master Command</p>
          </div>
        </div>
      </div>

      {/* Priority Scoring Factor Weights */}
      <div className="cmd-card">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Priority Scoring Algorithm Weights (Total = 100%)</h3>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>Severity Weight Coefficient (40%):</span>
              <span className="text-blue-600">{weights.severity_max}%</span>
            </div>
            <input 
              type="range" min="20" max="60" value={weights.severity_max} 
              onChange={(e) => setWeights({...weights, severity_max: parseInt(e.target.value)})}
              className="w-full accent-slate-800 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>Population Impact Weight Coefficient (25%):</span>
              <span className="text-blue-600">{weights.population_max}%</span>
            </div>
            <input 
              type="range" min="10" max="40" value={weights.population_max} 
              onChange={(e) => setWeights({...weights, population_max: parseInt(e.target.value)})}
              className="w-full accent-slate-800 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>Medical Urgency Weight Coefficient (20%):</span>
              <span className="text-blue-600">{weights.urgency_max}%</span>
            </div>
            <input 
              type="range" min="10" max="40" value={weights.urgency_max} 
              onChange={(e) => setWeights({...weights, urgency_max: parseInt(e.target.value)})}
              className="w-full accent-slate-800 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-700 mb-1">
              <span>Resource Shortage Weight Coefficient (15%):</span>
              <span className="text-blue-600">{weights.resource_shortage_max}%</span>
            </div>
            <input 
              type="range" min="5" max="30" value={weights.resource_shortage_max} 
              onChange={(e) => setWeights({...weights, resource_shortage_max: parseInt(e.target.value)})}
              className="w-full accent-slate-800 cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button type="submit" className="btn-primary">
              <Save className="w-4 h-4" /> Save Weights & Preferences
            </button>
          </div>
        </form>
      </div>

      {/* Map Tile & API Key Configuration Card */}
      <div className="cmd-card space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <Settings className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Geospatial Map Tile Provider & API Key</h3>
        </div>

        <div className="text-xs space-y-3">
          <p className="text-slate-500">
            Configure high-resolution Mapbox, LocationIQ, or custom map tile server credentials for the <strong>Disaster Map</strong> dashboard.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Active Map Provider</span>
              <p className="font-extrabold text-slate-900 capitalize">
                {localStorage.getItem('resq_map_provider') ? localStorage.getItem('resq_map_provider').replace('_', ' ') : 'CARTO Light (Default)'}
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">API Key Status</span>
              <p className="font-bold text-emerald-700">
                {localStorage.getItem('resq_map_api_key') ? 'Custom API Key Saved' : 'Free Open Maps Active'}
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button 
              type="button" 
              onClick={() => setActiveTab('map')} 
              className="btn-secondary text-xs"
            >
              Open Interactive Map Key Manager →
            </button>
          </div>
        </div>
      </div>

      {/* System Connection Status (No raw secrets displayed) */}
      <div className="cmd-card space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <Server className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">System Integration Status</h3>
        </div>
        
        <div className="text-xs space-y-2 text-slate-600">
          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded border border-slate-200">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">Supabase PostgreSQL Database:</span>
            </div>
            <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[11px]">RLS Protected / Connected</span>
          </div>

          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded border border-slate-200">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-600" />
              <span className="font-semibold">FastAPI Engine (Python 3.11):</span>
            </div>
            <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded text-[11px]">http://localhost:8000</span>
          </div>

          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded border border-slate-200">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-600" />
              <span className="font-semibold">OpenWeatherMap API v2.5:</span>
            </div>
            <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px]">Live & Simulated Fallback Active</span>
          </div>

          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded border border-slate-200">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-600" />
              <span className="font-semibold">Disaster Map Tiles API Key:</span>
            </div>
            <span className="font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded text-[11px]">Mapbox / LocationIQ Supported</span>
          </div>
        </div>
      </div>
    </div>
  );
};
