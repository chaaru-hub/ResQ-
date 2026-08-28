import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PriorityBadge } from '../components/PriorityBadge';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { Plus, Edit2, Trash2, Eye, Flame, MapPin, ShieldCheck, CheckCircle2, Clock, XCircle, Cpu, Users, Package, AlertCircle } from 'lucide-react';

export const DisastersPage = () => {
  const [disasters, setDisasters] = useState([]);
  const [reports, setReports] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Incidents'); // 'Incidents' or 'Affected Areas'

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Flood',
    location: '',
    severity: 'High',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, rRes, aRes] = await Promise.all([
        api.getDisasters(),
        api.getDisasterReports(),
        api.getAreas()
      ]);
      setDisasters(dRes.data || []);
      setReports(rRes.data || []);
      setAreas(aRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyReport = async (id) => {
    try {
      await api.verifyDisasterReport(id);
      loadData();
    } catch (err) {
      console.error('Verification failed:', err.message);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.updateDisasterReportStatus(id, { status: newStatus });
      loadData();
    } catch (err) {
      console.error('Status update failed:', err.message);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      type: 'Flood',
      location: '',
      severity: 'High',
      description: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (d) => {
    setEditingItem(d);
    setFormData({
      name: d.name,
      type: d.type,
      location: d.location,
      severity: d.severity,
      description: d.description || '',
      date: d.date || new Date().toISOString().split('T')[0],
      status: d.status || 'Active'
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateDisaster(editingItem.id, formData);
      } else {
        await api.createDisaster(formData);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save disaster record:', err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteDisaster(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete disaster:', err.message);
    }
  };

  const handleClearAreas = async () => {
    try {
      await api.clearAllAreas();
      loadData();
    } catch (err) {
      console.error('Failed to clear areas:', err.message);
    }
  };

  const handleClearIncidents = async () => {
    try {
      await api.clearAllDisasterReports();
      loadData();
    } catch (err) {
      console.error('Failed to clear incidents:', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Disaster Incident & Event Management</h2>
          <p className="text-xs text-slate-500">Incident workflow, Verification (Pending → Verified → Assigned → Resolved), and Affected Area Telemetry</p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Disaster Incident
        </button>
      </div>

      {/* Sub-Navigation Tabs & Clear Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('Incidents')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'Incidents' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Active Emergency Incidents ({reports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('Affected Areas')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'Affected Areas' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4 text-blue-500" />
            <span>Affected Areas Telemetry ({areas.length})</span>
          </button>
        </div>

        <div>
          {activeTab === 'Incidents' && reports.length > 0 && (
            <button 
              onClick={handleClearIncidents}
              className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Clear all emergency incident records"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Clear All Incidents
            </button>
          )}

          {activeTab === 'Affected Areas' && areas.length > 0 && (
            <button 
              onClick={handleClearAreas}
              className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Clear all affected area telemetry records"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Clear All Telemetry Areas
            </button>
          )}
        </div>
      </div>

      {/* INCIDENTS TABLE VIEW */}
      {activeTab === 'Incidents' && (
        <div className="space-y-4">
          <div className="cmd-card p-0 overflow-hidden">
            <div className="p-3 bg-slate-900 text-white border-b border-slate-800 flex justify-between items-center text-xs font-bold">
              <span>Verified & Incoming Disaster Incident Workflow</span>
              <span className="text-[11px] text-slate-400 font-normal">Only Verified incidents enter Allocation Center</span>
            </div>
            <div className="overflow-x-auto">
              <table className="cmd-table">
                <thead>
                  <tr>
                    <th>Disaster / Incident</th>
                    <th>Location</th>
                    <th>Stranded Count</th>
                    <th>Priority Score</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th className="text-right">Workflow Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, idx) => (
                    <tr key={r.id} className={r.severity === 'Critical' ? 'bg-red-50/40' : ''}>
                      <td className="font-bold text-slate-900 flex items-center gap-2 py-2.5">
                        <Flame className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <div>
                          <p className="font-extrabold">{r.disaster_type || 'Disaster Incident'}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{r.reporter_phone || 'Citizen Source'}</p>
                        </div>
                      </td>
                      <td className="font-semibold text-slate-700">{r.location}</td>
                      <td className="font-bold text-slate-800">{r.people_affected} people</td>
                      <td>
                        <span className="font-black text-xs text-red-600 bg-red-100/80 px-2 py-0.5 rounded">
                          {r.priority_score || 0} / 100
                        </span>
                      </td>
                      <td>
                        <PriorityBadge level={r.severity || r.priority_level} />
                      </td>
                      <td>
                        <select
                          value={r.status}
                          onChange={(e) => handleStatusUpdate(r.id, e.target.value)}
                          className={`text-xs font-extrabold px-2 py-1 rounded border ${
                            r.status === 'Verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            r.status === 'Pending' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            r.status === 'Assigned' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            r.status === 'In Progress' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                            r.status === 'Resolved' ? 'bg-green-100 text-green-900 border-green-300' :
                            'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Verified">Verified</option>
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.status === 'Pending' && (
                            <button
                              onClick={() => handleVerifyReport(r.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> Verify
                            </button>
                          )}
                          <button onClick={() => { setViewingItem(r); setViewModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AFFECTED AREAS TELEMETRY VIEW */}
      {activeTab === 'Affected Areas' && (
        <div className="cmd-card p-0 overflow-hidden">
          <div className="p-3 bg-slate-900 text-white border-b border-slate-800 flex justify-between items-center text-xs font-bold">
            <span>Registered Geographic Affected Areas & Resource Demands</span>
            <span className="text-[11px] text-slate-400 font-normal">Geospatial lat/lng coordinates and vulnerability metrics</span>
          </div>
          <div className="overflow-x-auto">
            <table className="cmd-table">
              <thead>
                <tr>
                  <th>Area Name</th>
                  <th>Population</th>
                  <th>Medical Cases</th>
                  <th>Vulnerable Population</th>
                  <th>Coordinates</th>
                  <th>Demanded (Food / Water / Med)</th>
                  <th>Priority Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((a) => (
                  <tr key={a.id}>
                    <td className="font-extrabold text-slate-900 flex items-center gap-1.5 py-2.5">
                      <MapPin className="w-3.5 h-3.5 text-red-600" />
                      {a.area_name}
                    </td>
                    <td>{a.population?.toLocaleString()}</td>
                    <td className="text-red-700 font-bold">{a.medical_cases}</td>
                    <td>{a.vulnerable_population}</td>
                    <td className="font-mono text-[11px] text-slate-500">{a.latitude}, {a.longitude}</td>
                    <td className="font-semibold text-xs">
                      <span className="text-slate-800">{a.food_required} Food</span> • <span className="text-blue-600">{a.water_required} Water</span> • <span className="text-purple-600">{a.medicine_required} Med</span>
                    </td>
                    <td>
                      <span className="font-black text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {a.priority_score}
                      </span>
                    </td>
                    <td>
                      <PriorityBadge level={a.status || a.severity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD DISASTER EVENT MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? "Edit Disaster Event" : "Register New Disaster Event"}>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="cmd-label">Disaster Event Name</label>
            <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Cyclone Relief Operation" className="cmd-input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cmd-label">Disaster Type</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="cmd-input">
                <option value="Flood">Flood</option>
                <option value="Cyclone">Cyclone</option>
                <option value="Earthquake">Earthquake</option>
                <option value="Landslide">Landslide</option>
                <option value="Tsunami">Tsunami</option>
                <option value="Fire">Fire</option>
                <option value="Accident">Accident</option>
                <option value="Building Collapse">Building Collapse</option>
                <option value="Medical Emergency">Medical Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="cmd-label">Severity Level</label>
              <select value={formData.severity} onChange={(e) => setFormData({...formData, severity: e.target.value})} className="cmd-input">
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cmd-label">Location</label>
              <input required type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Tambaram Sector" className="cmd-input" />
            </div>
            <div>
              <label className="cmd-label">Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="cmd-input" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Event Record</button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Incident Detailed Telemetry">
        {viewingItem && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-100 rounded-md border border-slate-200 flex justify-between items-start">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{viewingItem.disaster_type || viewingItem.name} at {viewingItem.location}</h3>
                <p className="text-slate-500 font-mono">Reporter: {viewingItem.reporter_phone || 'Citizen Direct'}</p>
              </div>
              <PriorityBadge level={viewingItem.severity} />
            </div>
            <div className="bg-slate-50 p-3 border rounded-md font-mono text-slate-800">
              "{viewingItem.original_message || viewingItem.description || 'No raw message'}"
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-2 rounded border">
                <span className="text-[10px] font-bold uppercase text-slate-400">Stranded Victims</span>
                <p className="font-extrabold text-slate-900 text-sm">{viewingItem.people_affected || 0} people</p>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="text-[10px] font-bold uppercase text-slate-400">Calculated Priority Score</span>
                <p className="font-black text-red-600 text-sm">{viewingItem.priority_score || 0} / 100</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
