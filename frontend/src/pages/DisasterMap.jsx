import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import { PriorityBadge } from '../components/PriorityBadge';
import { MessageSquare, MapPin, Edit3, X, Navigation, Cpu, Truck, CheckCircle2 } from 'lucide-react';

export const DisasterMapPage = () => {
  const [areas, setAreas] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual Coordinate Editing Modal State
  const [editingReport, setEditingReport] = useState(null);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [submittingCoord, setSubmittingCoord] = useState(false);

  const defaultCenter = [13.0827, 80.2707]; // Central Bay of Bengal / Chennai coordinates

  // Default Central Hub Depot Location
  const centralDepotCoords = [13.0827, 80.2707];

  const loadMapData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [areasRes, vehRes, rptRes] = await Promise.all([
        api.getAreas(),
        api.getVehicles(),
        api.getDisasterReports()
      ]);
      setAreas(areasRes.data || []);
      setVehicles(vehRes.data || []);
      setReports(rptRes.data || []);
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
      alert('Error updating location coordinates: ' + err.message);
    } finally {
      setSubmittingCoord(false);
    }
  };

  const getMarkerColor = (severity, score) => {
    if (severity === 'Critical' || score >= 81) return '#dc2626'; // Red - Critical
    if (severity === 'High' || score >= 61) return '#ea580c';     // Orange - High
    if (severity === 'Medium' || score >= 31) return '#d97706';   // Yellow - Medium
    return '#16a34a';                                            // Green - Low
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Interactive Tactical Disaster Map</h2>
          <p className="text-xs text-slate-500">Geospatial emergency incident mapping, Priority markers, and Dijkstra dispatch route overlays</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs shadow-xs">
          <span className="font-bold text-slate-700 text-[11px] uppercase">Priority Legend:</span>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span><span className="text-slate-600 font-semibold">Critical (81-100)</span></div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span><span className="text-slate-600 font-semibold">High (61-80)</span></div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span><span className="text-slate-600 font-semibold">Medium (31-60)</span></div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span><span className="text-slate-600 font-semibold">Low (0-30)</span></div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 text-blue-600 font-bold"><Navigation className="w-3.5 h-3.5" /> Dijkstra Route</div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="cmd-card p-2 h-[620px] relative overflow-hidden">
        <MapContainer 
          center={defaultCenter} 
          zoom={11} 
          scrollWheelZoom={true} 
          className="w-full h-full rounded-md z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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

          {/* Render Dijkstra Route Polylines for Verified/Assigned Reports */}
          {reports.map((rpt) => {
            if (!rpt.latitude || !rpt.longitude) return null;
            const rptCoords = [rpt.latitude, rpt.longitude];

            // Generated Dijkstra path coordinates
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

          {/* Area Circle Markers */}
          {areas.map((area) => {
            const color = getMarkerColor(area.severity, area.priority_score);
            return (
              <CircleMarker
                key={area.id}
                center={[area.latitude || 13.0827, area.longitude || 80.2707]}
                radius={area.priority_score >= 81 ? 16 : 12}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.8,
                  color: '#ffffff',
                  weight: 2
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-2 space-y-2 max-w-xs text-xs text-slate-900">
                    <div className="flex justify-between items-start border-b pb-1.5">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{area.area_name}</h4>
                        <p className="text-[11px] text-slate-500">Population: {area.population?.toLocaleString()}</p>
                      </div>
                      <PriorityBadge level={area.severity} />
                    </div>

                    <div className="bg-slate-50 p-2 rounded flex justify-between items-center">
                      <span className="font-semibold text-slate-600">Priority Score:</span>
                      <span className="font-black text-sm text-red-600">{area.priority_score} / 100</span>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 text-[11px] uppercase">Demanded Resources:</p>
                      <div className="grid grid-cols-3 gap-1 text-center font-bold">
                        <div className="bg-slate-100 p-1 rounded">Food: {area.food_required}</div>
                        <div className="bg-slate-100 p-1 rounded">Water: {area.water_required}</div>
                        <div className="bg-slate-100 p-1 rounded text-blue-600">Med: {area.medicine_required}</div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* WHATSAPP REPORTED EMERGENCY MARKERS */}
          {reports.map((rpt) => {
            const lat = rpt.latitude || 12.9229;
            const lng = rpt.longitude || 80.1275;
            const color = getMarkerColor(rpt.severity, rpt.priority_score);

            return (
              <CircleMarker
                key={rpt.id}
                center={[lat, lng]}
                radius={15}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.9,
                  color: '#059669', // Emerald border indicating WhatsApp report
                  weight: 3.5
                }}
              >
                <Popup>
                  <div className="p-2.5 space-y-2 max-w-xs text-xs text-slate-900">
                    <div className="flex justify-between items-start border-b pb-1.5">
                      <div>
                        <div className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Incident
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
                  {submittingCoord ? 'Saving...' : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
