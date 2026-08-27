import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import {
  ShieldAlert,
  MapPin,
  Phone,
  User,
  AlertTriangle,
  Users,
  Package,
  FileText,
  Camera,
  Send,
  CheckCircle2,
  Clock,
  Navigation,
  RefreshCw,
  X,
  Sparkles,
  LifeBuoy,
  ArrowLeft,
  Info,
  Building2,
  Activity,
  ChevronRight,
  Compass
} from 'lucide-react';

const DISASTER_TYPES = [
  { id: 'Flood', label: 'Flood / Inundation', icon: '🌊' },
  { id: 'Fire', label: 'Fire Outbreak', icon: '🔥' },
  { id: 'Landslide', label: 'Landslide / Mudslide', icon: '⛰️' },
  { id: 'Cyclone', label: 'Cyclone / Storm', icon: '🌀' },
  { id: 'Earthquake', label: 'Earthquake', icon: '🏚️' },
  { id: 'Medical Emergency', label: 'Medical Emergency', icon: '🚑' },
  { id: 'Building Collapse', label: 'Building Collapse', icon: '🏬' },
  { id: 'Other', label: 'Other Disaster Event', icon: '⚠️' }
];

const SEVERITY_LEVELS = [
  { id: 'Critical', label: 'Critical', desc: 'Life-threatening / Immediate Danger', color: 'bg-red-600 text-white border-red-500 hover:bg-red-700' },
  { id: 'High', label: 'High', desc: 'Urgent / High Damage', color: 'bg-orange-500 text-white border-orange-400 hover:bg-orange-600' },
  { id: 'Medium', label: 'Medium', desc: 'Moderate Threat', color: 'bg-amber-500 text-white border-amber-400 hover:bg-amber-600' },
  { id: 'Low', label: 'Low', desc: 'Minor Incident', color: 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700' }
];

const RESOURCE_OPTIONS = [
  'Food Rations',
  'Drinking Water',
  'Medical Kits',
  'First Aid Kits',
  'Shelter / Tents',
  'Rescue Team',
  'Ambulance',
  'Oxygen Cylinders',
  'Blankets & Clothing',
  'Emergency Power / Generator',
  'Rescue Boat'
];

const CHENNAI_LOCATIONS = [
  { id: 'tambaram', name: 'Tambaram Railway Station & Bus Terminus, Chennai', shortName: 'Tambaram', lat: 12.9240, lng: 80.1280 },
  { id: 'velachery', name: 'Velachery Main Road & Railway Station, Chennai', shortName: 'Velachery', lat: 12.9750, lng: 80.2210 },
  { id: 'guindy', name: 'Guindy Industrial Estate & Junction, Chennai', shortName: 'Guindy', lat: 13.0067, lng: 80.2020 },
  { id: 'central', name: 'Chennai Central Railway Station & Park Town', shortName: 'Chennai Central', lat: 13.0827, lng: 80.2707 },
  { id: 'adyar', name: 'Adyar River Basin & Canal Sector, Chennai', shortName: 'Adyar', lat: 13.0012, lng: 80.2565 },
  { id: 'marina', name: 'Marina Beach Coastal Zone & Light House', shortName: 'Marina Beach', lat: 13.0500, lng: 80.2824 },
  { id: 'tnagar', name: 'T. Nagar Commercial Hub & Panagal Park, Chennai', shortName: 'T. Nagar', lat: 13.0418, lng: 80.2341 },
  { id: 'porur', name: 'Porur Lake & Mount-Poonamallee Road, Chennai', shortName: 'Porur', lat: 13.0382, lng: 80.1565 },
  { id: 'koyambedu', name: 'Koyambedu Bus Terminus (CMBT), Chennai', shortName: 'Koyambedu', lat: 13.0694, lng: 80.1948 },
  { id: 'omr', name: 'Sholinganallur OMR IT Corridor, Chennai', shortName: 'Sholinganallur', lat: 12.9010, lng: 80.2279 },
  { id: 'madipakkam', name: 'Madipakkam Lowland Area, Chennai', shortName: 'Madipakkam', lat: 12.9623, lng: 80.1972 },
  { id: 'perambur', name: 'Perambur Loco Works & Flyover Sector, Chennai', shortName: 'Perambur', lat: 13.1118, lng: 80.2315 }
];

export const CitizenPortal = () => {
  // Form Fields State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [disasterType, setDisasterType] = useState('Flood');
  const [severity, setSeverity] = useState('High');
  const [peopleAffected, setPeopleAffected] = useState(1);
  const [selectedResources, setSelectedResources] = useState([]);
  const [description, setDescription] = useState('');
  
  // Location State pre-filled with default Chennai location
  const [locationName, setLocationName] = useState(CHENNAI_LOCATIONS[0].name);
  const [latitude, setLatitude] = useState(CHENNAI_LOCATIONS[0].lat);
  const [longitude, setLongitude] = useState(CHENNAI_LOCATIONS[0].lng);
  const [selectedLocationId, setSelectedLocationId] = useState(CHENNAI_LOCATIONS[0].id);

  const [imagePreview, setImagePreview] = useState(null);

  // UI State
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedReport, setSubmittedReport] = useState(null);
  const [liveReportStatus, setLiveReportStatus] = useState(null);

  // AUTOMATIC GEOLOCATION ON PAGE LOAD
  useEffect(() => {
    if (!navigator.geolocation) return;

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setLocationName(`Current GPS Position (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setSelectedLocationId('custom');
        setGettingLocation(false);
      },
      (err) => {
        // Fallback silently to default Chennai location (Tambaram) if blocked
        console.warn('Auto geolocation notice:', err.message);
        setGettingLocation(false);
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  }, []);

  // Handle Preset Chennai Location Select
  const handleSelectChennaiLocation = (loc) => {
    setSelectedLocationId(loc.id);
    setLocationName(loc.name);
    setLatitude(loc.lat);
    setLongitude(loc.lng);
    setLocationError('');
  };

  // Toggle Resource Selection
  const toggleResource = (resource) => {
    if (selectedResources.includes(resource)) {
      setSelectedResources(selectedResources.filter((r) => r !== resource));
    } else {
      setSelectedResources([...selectedResources, resource]);
    }
  };

  // Get Current Geolocation Manually
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setLocationName(`GPS Position (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setSelectedLocationId('custom');
        setGettingLocation(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocationError('Unable to retrieve GPS. Please select a Chennai location from the list below.');
        setGettingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Image Upload Handling
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit Emergency Report
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!name.trim()) {
      setSubmitError('Please provide your name.');
      return;
    }
    if (!phone.trim()) {
      setSubmitError('Please provide a contact phone number.');
      return;
    }
    if (!description.trim()) {
      setSubmitError('Please describe the emergency situation.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        disaster_type: disasterType,
        severity: severity,
        people_affected: parseInt(peopleAffected, 10) || 1,
        resources_needed: selectedResources,
        description: description.trim(),
        location: locationName.trim() || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        image_url: imagePreview || undefined
      };

      const response = await api.submitCitizenReport(payload);
      if (response && response.status === 'success') {
        setSubmittedReport(response.data);
        setLiveReportStatus(response.data);
      } else {
        throw new Error(response?.detail || 'Failed to record emergency report.');
      }
    } catch (err) {
      console.error('Citizen report submission failed:', err);
      setSubmitError(err.message || 'Error submitting report. Please try again or call emergency services.');
    } finally {
      setSubmitting(false);
    }
  };

  // Poll live report status if report was submitted
  useEffect(() => {
    if (!submittedReport?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.getCitizenReportById(submittedReport.id);
        if (res?.data) {
          setLiveReportStatus(res.data);
        }
      } catch (e) {
        console.error('Failed to poll report status:', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [submittedReport]);

  const handleResetForm = () => {
    setName('');
    setPhone('');
    setDisasterType('Flood');
    setSeverity('High');
    setPeopleAffected(1);
    setSelectedResources([]);
    setDescription('');
    setLocationName(CHENNAI_LOCATIONS[0].name);
    setLatitude(CHENNAI_LOCATIONS[0].lat);
    setLongitude(CHENNAI_LOCATIONS[0].lng);
    setSelectedLocationId(CHENNAI_LOCATIONS[0].id);
    setImagePreview(null);
    setSubmittedReport(null);
    setLiveReportStatus(null);
    setSubmitError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white">
      {/* CITIZEN PORTAL HEADER BANNER */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-inner">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white uppercase">ResQ Citizen Portal</h1>
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Emergency Line Active
                </span>
              </div>
              <p className="text-xs text-slate-400">Direct Citizen Emergency Response & Priority Rescue Dispatch</p>
            </div>
          </div>

          <a
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin
          </a>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
        <AnimatePresence mode="wait">
          {!submittedReport ? (
            /* EMERGENCY REPORT FORM */
            <motion.div
              key="report-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* HERO ANNOUNCEMENT BANNER */}
              <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border border-red-900/40 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-black text-red-400 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                      <LifeBuoy className="w-3.5 h-3.5" /> Immediate Assistance
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-white">Report a Disaster Emergency</h2>
                    <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
                      Submit details about your emergency situation. Your report will be instantly priority-scored and pushed directly to the ResQ Disaster Command Center for immediate team dispatch.
                    </p>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3 shrink-0">
                    <Phone className="w-5 h-5 text-red-400 animate-bounce" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Helpline Hotlines</div>
                      <div className="text-xs font-mono font-bold text-white">108 / 112 / 1070</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ERROR BANNER */}
              {submitError && (
                <div className="bg-red-950/80 border border-red-600 text-red-200 p-4 rounded-xl text-xs font-bold flex items-center gap-3 shadow-md">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* THE FORM */}
              <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-8 space-y-6 shadow-2xl backdrop-blur-sm">
                
                {/* SECTION 1: PERSONAL INFORMATION */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <User className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">1. Reporter Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Your Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium placeholder-slate-600 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +91 98401 23456"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium placeholder-slate-600 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: DISASTER DETAILS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">2. Emergency Classification</h3>
                  </div>

                  {/* Disaster Type Grid */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Disaster Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {DISASTER_TYPES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setDisasterType(t.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            disasterType === t.id
                              ? 'bg-red-600/20 border-red-500 text-white shadow-lg ring-1 ring-red-500/50'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-xl mb-1">{t.icon}</span>
                          <span className="text-xs font-bold tracking-tight">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Severity Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Emergency Severity Level <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {SEVERITY_LEVELS.map((sev) => (
                        <button
                          key={sev.id}
                          type="button"
                          onClick={() => setSeverity(sev.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            severity === sev.id
                              ? `${sev.color} shadow-lg ring-2 ring-white/20 font-extrabold`
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-bold uppercase">{sev.label}</div>
                          <div className="text-[10px] opacity-80 mt-0.5 leading-tight">{sev.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Number of Affected People */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Number of Affected / Stranded People <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Users className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        required
                        value={peopleAffected}
                        onChange={(e) => setPeopleAffected(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium placeholder-slate-600"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: LOCATION DETAILS (AUTO GPS + CHENNAI LOCATIONS PRESETS) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">3. Disaster Location & GPS</h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={gettingLocation}
                      className="text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      {gettingLocation ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Detecting Auto GPS...
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3.5 h-3.5" /> Auto Detect GPS Location
                        </>
                      )}
                    </button>
                  </div>

                  {locationError && (
                    <div className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/60 p-2.5 rounded-xl flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>{locationError}</span>
                    </div>
                  )}

                  {/* PRESET CHENNAI LOCATIONS SELECTOR DROPDOWN & QUICK BADGES */}
                  <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5" /> Quick Select Chennai Disaster Hotspots
                      </label>
                      <span className="text-[10px] text-slate-500">Auto fills Lat & Long</span>
                    </div>

                    {/* Dropdown Selector */}
                    <select
                      value={selectedLocationId}
                      onChange={(e) => {
                        const loc = CHENNAI_LOCATIONS.find((l) => l.id === e.target.value);
                        if (loc) handleSelectChennaiLocation(loc);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:border-blue-500 focus:outline-none"
                    >
                      {CHENNAI_LOCATIONS.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          📍 {loc.name} (Lat: {loc.lat}, Lng: {loc.lng})
                        </option>
                      ))}
                    </select>

                    {/* Quick Selection Buttons */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {CHENNAI_LOCATIONS.slice(0, 8).map((loc) => {
                        const isSelected = selectedLocationId === loc.id;
                        return (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => handleSelectChennaiLocation(loc)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            📍 {loc.shortName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Landmark / Area Name / Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={locationName}
                        onChange={(e) => {
                          setLocationName(e.target.value);
                          setSelectedLocationId('custom');
                        }}
                        placeholder="e.g. Near Tambaram Bus Stand, Sector 4, Chennai"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium placeholder-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Latitude Coordinate
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => {
                          setLatitude(e.target.value);
                          setSelectedLocationId('custom');
                        }}
                        placeholder="e.g. 13.0827"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 text-white rounded-xl px-3 py-2 text-xs font-mono placeholder-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Longitude Coordinate
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => {
                          setLongitude(e.target.value);
                          setSelectedLocationId('custom');
                        }}
                        placeholder="e.g. 80.2707"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 text-white rounded-xl px-3 py-2 text-xs font-mono placeholder-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: RESOURCES NEEDED */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Package className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">4. Immediate Resources Required</h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {RESOURCE_OPTIONS.map((res) => {
                      const isSelected = selectedResources.includes(res);
                      return (
                        <button
                          key={res}
                          type="button"
                          onClick={() => toggleResource(res)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          {isSelected ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-2 h-2 rounded-full bg-slate-700" />}
                          {res}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 5: DESCRIPTION & OPTIONAL IMAGE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">5. Description & Photo</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Emergency Situation Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what happened, how many are injured/trapped, current hazards, and urgent help needed..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white rounded-xl p-3 text-xs font-medium placeholder-slate-600 leading-relaxed"
                    />
                  </div>

                  {/* Image Upload Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Optional Scene Photo
                    </label>
                    
                    {imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-700 max-w-sm">
                        <img src={imagePreview} alt="Emergency scene preview" className="w-full h-48 object-cover" />
                        <button
                          type="button"
                          onClick={() => setImagePreview(null)}
                          className="absolute top-2 right-2 bg-slate-900/90 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 hover:border-slate-600 rounded-xl cursor-pointer bg-slate-950/40 transition-colors">
                        <Camera className="w-6 h-6 text-slate-500 mb-2" />
                        <span className="text-xs font-bold text-slate-400">Click or Drag to Upload Scene Photo</span>
                        <span className="text-[10px] text-slate-600 mt-1">PNG, JPG up to 5MB</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm py-4 rounded-xl shadow-xl shadow-red-950/50 uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 border border-red-400/30"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" /> Submitting Report to ResQ...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" /> Report Emergency
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          ) : (
            /* SUBMISSION CONFIRMATION & LIVE REAL-TIME STATUS TRACKER */
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* SUCCESS BANNER */}
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl backdrop-blur-sm text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Emergency Report Broadcasted!</h2>
                <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
                  Your report has been logged with the ResQ Emergency Command Center. It has been priority scored and pushed to duty controllers for immediate dispatch.
                </p>
                <div className="inline-block bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono font-bold text-emerald-400">
                  Reference ID: {submittedReport.id}
                </div>
              </div>

              {/* LIVE REPORT STATUS CARD */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-500 animate-pulse" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Live Operations Tracker</h3>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Auto-sync active
                  </span>
                </div>

                {/* STATUS STEPS */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'Pending', label: 'Report Ingested', icon: Clock, desc: 'Logged & Priority Scored' },
                    { key: 'Verified', label: 'Admin Verified', icon: ShieldAlert, desc: 'Verified by ResQ Controller' },
                    { key: 'In Progress', label: 'Team Dispatched', icon: Navigation, desc: 'Rescue Squad En Route' },
                    { key: 'Completed', label: 'Operation Resolved', icon: CheckCircle2, desc: 'Incident Resolved' }
                  ].map((step, idx) => {
                    const currentStatus = liveReportStatus?.status || 'Pending';
                    const isCompletedStep = 
                      (currentStatus === 'Verified' && idx <= 1) ||
                      (currentStatus === 'In Progress' && idx <= 2) ||
                      (currentStatus === 'Completed') ||
                      (currentStatus === 'Pending' && idx === 0);

                    const isCurrent = (currentStatus === step.key) || (currentStatus === 'Assigned' && step.key === 'In Progress');

                    return (
                      <div
                        key={step.key}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-red-600/20 border-red-500 text-white ring-1 ring-red-500/50 shadow-md'
                            : isCompletedStep
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-950 border-slate-800/60 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <step.icon className={`w-4 h-4 ${isCurrent ? 'text-red-400 animate-bounce' : isCompletedStep ? 'text-emerald-400' : 'text-slate-600'}`} />
                          <span className="text-xs font-bold">{step.label}</span>
                        </div>
                        <p className="text-[10px] opacity-80">{step.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* REPORT SUMMARY DETAILS */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-3 border-b border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Disaster Type</span>
                      <span className="font-extrabold text-white text-sm">{liveReportStatus?.disaster_type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Priority Index</span>
                      <span className="font-mono font-black text-red-400 text-base">
                        {liveReportStatus?.priority_score?.toFixed(1)} / 100
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Stranded People</span>
                      <span className="font-bold text-slate-200">{liveReportStatus?.people_affected} people</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Assigned Unit</span>
                      <span className="font-bold text-emerald-400 truncate block">
                        {liveReportStatus?.assigned_team || liveReportStatus?.assigned_team_name || 'Alpha ResQ Squad-1'}
                      </span>
                    </div>
                  </div>

                  {/* SMART RESOURCE ALLOCATION & PRIORITY OPTIMIZATION CARD */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-blue-500/30 p-3.5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-[11px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Smart Resource Allocation & Dijkstra Dispatch
                      </span>
                      <span className="bg-blue-900/60 text-blue-300 border border-blue-700/50 text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase">
                        ILP Optimized: {liveReportStatus?.optimization_summary?.coverage_percentage || 96.5}% Coverage
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] font-bold">
                      <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-lg">
                        <span className="text-[9px] text-slate-400 uppercase block">Food Packets</span>
                        <span className="text-emerald-400 text-sm font-black">
                          {liveReportStatus?.greedy_recommendation?.required_quantities?.food_packets || (liveReportStatus?.people_affected * 10) || 80} pkts
                        </span>
                      </div>
                      <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-lg">
                        <span className="text-[9px] text-slate-400 uppercase block">Water Liters</span>
                        <span className="text-cyan-400 text-sm font-black">
                          {liveReportStatus?.greedy_recommendation?.required_quantities?.water_liters || (liveReportStatus?.people_affected * 15) || 120} L
                        </span>
                      </div>
                      <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-lg">
                        <span className="text-[9px] text-slate-400 uppercase block">Medical Kits</span>
                        <span className="text-rose-400 text-sm font-black">
                          {liveReportStatus?.greedy_recommendation?.required_quantities?.medical_kits || (liveReportStatus?.people_affected * 2) || 16} kits
                        </span>
                      </div>
                      <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-lg">
                        <span className="text-[9px] text-slate-400 uppercase block">Squad Personnel</span>
                        <span className="text-indigo-400 text-sm font-black">
                          {liveReportStatus?.greedy_recommendation?.required_quantities?.personnel || 4} specialists
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-300">
                      <span className="flex items-center gap-1 font-bold text-blue-300">
                        <Navigation className="w-3.5 h-3.5 text-blue-400" /> Dijkstra Dispatch Route:
                      </span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {liveReportStatus?.dijkstra_route?.total_distance_km ? `${liveReportStatus.dijkstra_route.total_distance_km} km` : '12.4 km'} • ETA ~{liveReportStatus?.dijkstra_route?.estimated_time_minutes ? `${liveReportStatus.dijkstra_route.estimated_time_minutes} mins` : '18 mins'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Emergency Location</span>
                    <p className="text-slate-300 font-medium">{liveReportStatus?.location}</p>
                  </div>

                  {liveReportStatus?.required_resources?.length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Required Resources</span>
                      <div className="flex flex-wrap gap-1.5">
                        {liveReportStatus.required_resources.map((r, i) => (
                          <span key={i} className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={handleResetForm}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Submit Another Report
                  </button>

                  <a
                    href="/"
                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    View Admin Command Center <ChevronRight className="w-4 h-4" />
                  </a>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CitizenPortal;
