import React, { useState, useEffect } from 'react';
import { PriorityBadge } from '../components/PriorityBadge';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { Plus, Edit2, Trash2, Eye, MapPin, Calculator } from 'lucide-react';

export const AreasPage = () => {
  const [areas, setAreas] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);

  const [formData, setFormData] = useState({
    area_name: '',
    disaster_id: '',
    population: 5000,
    severity: 'Critical',
    medical_cases: 150,
    vulnerable_population: 800,
    latitude: 13.0827,
    longitude: 80.2707,
    food_required: 1500,
    water_required: 2500,
    medicine_required: 300
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [areasRes, disastersRes] = await Promise.all([
        api.getAreas(),
        api.getDisasters()
      ]);
      setAreas(areasRes.data || []);
      setDisasters(disastersRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      area_name: '',
      disaster_id: disasters[0]?.id || '',
      population: 5000,
      severity: 'Critical',
      medical_cases: 150,
      vulnerable_population: 800,
      latitude: 13.0827,
      longitude: 80.2707,
      food_required: 1500,
      water_required: 2500,
      medicine_required: 300
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (a) => {
    setEditingItem(a);
    setFormData({
      area_name: a.area_name,
      disaster_id: a.disaster_id || disasters[0]?.id || '',
      population: a.population,
      severity: a.severity,
      medical_cases: a.medical_cases,
      vulnerable_population: a.vulnerable_population,
      latitude: a.latitude,
      longitude: a.longitude,
      food_required: a.food_required,
      water_required: a.water_required,
      medicine_required: a.medicine_required
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateArea(editingItem.id, formData);
      } else {
        await api.createArea(formData);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error saving area: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this affected area record?')) {
      try {
        await api.deleteArea(id);
        fetchData();
      } catch (err) {
        alert('Error deleting area: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Affected Locations & Demand Matrix</h2>
          <p className="text-xs text-slate-500">Real-time population assessment, resource requirements, and dynamic priority scores</p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Affected Location
        </button>
      </div>

      {/* Main Table matching prompt requirements exactly */}
      <div className="cmd-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cmd-table">
            <thead>
              <tr>
                <th>Area</th>
                <th>Disaster</th>
                <th>Population Affected</th>
                <th>Severity</th>
                <th>Medical Cases</th>
                <th>Food Required</th>
                <th>Water Required</th>
                <th>Medicine Required</th>
                <th>Priority Score</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => {
                const disasterObj = disasters.find(d => d.id === a.disaster_id);
                return (
                  <tr key={a.id}>
                    <td className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      {a.area_name}
                    </td>
                    <td className="font-medium text-slate-600">{disasterObj?.name || 'Cyclone Event'}</td>
                    <td>{a.population?.toLocaleString()}</td>
                    <td>
                      <PriorityBadge level={a.severity} showIcon={false} />
                    </td>
                    <td className="text-red-600 font-bold">{a.medical_cases}</td>
                    <td className="font-semibold">{a.food_required?.toLocaleString()}</td>
                    <td className="font-semibold">{a.water_required?.toLocaleString()}</td>
                    <td className="font-semibold text-blue-600">{a.medicine_required}</td>
                    <td>
                      <span className="font-black text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {a.priority_score}
                      </span>
                    </td>
                    <td>
                      <PriorityBadge level={a.status || a.severity} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setViewingItem(a); setViewModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenEdit(a)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(a.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? "Edit Affected Area" : "Register Affected Location"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cmd-label">Area Name</label>
              <input required type="text" value={formData.area_name} onChange={(e) => setFormData({...formData, area_name: e.target.value})} placeholder="e.g. Area A - Coastal Sector 1" className="cmd-input" />
            </div>
            <div>
              <label className="cmd-label">Associated Disaster</label>
              <select value={formData.disaster_id} onChange={(e) => setFormData({...formData, disaster_id: e.target.value})} className="cmd-input">
                {disasters.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="cmd-label">Population Affected</label>
              <input required type="number" min="1" value={formData.population} onChange={(e) => setFormData({...formData, population: parseInt(e.target.value)})} className="cmd-input" />
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
            <div>
              <label className="cmd-label">Medical Cases</label>
              <input required type="number" min="0" value={formData.medical_cases} onChange={(e) => setFormData({...formData, medical_cases: parseInt(e.target.value)})} className="cmd-input" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="cmd-label">Food Required (Packs)</label>
              <input required type="number" min="0" value={formData.food_required} onChange={(e) => setFormData({...formData, food_required: parseInt(e.target.value)})} className="cmd-input" />
            </div>
            <div>
              <label className="cmd-label">Water Required (Cans)</label>
              <input required type="number" min="0" value={formData.water_required} onChange={(e) => setFormData({...formData, water_required: parseInt(e.target.value)})} className="cmd-input" />
            </div>
            <div>
              <label className="cmd-label">Medicine Required (Kits)</label>
              <input required type="number" min="0" value={formData.medicine_required} onChange={(e) => setFormData({...formData, medicine_required: parseInt(e.target.value)})} className="cmd-input" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="cmd-label">Vulnerable Pop (Elderly/Children)</label>
              <input required type="number" min="0" value={formData.vulnerable_population} onChange={(e) => setFormData({...formData, vulnerable_population: parseInt(e.target.value)})} className="cmd-input" />
            </div>
            <div>
              <label className="cmd-label">Latitude Coordinate</label>
              <input required type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})} className="cmd-input" />
            </div>
            <div>
              <label className="cmd-label">Longitude Coordinate</label>
              <input required type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})} className="cmd-input" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Area & Compute Score</button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Area Breakdown & Priority Calculation">
        {viewingItem && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-900 text-white rounded-md flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">{viewingItem.area_name}</h3>
                <p className="text-slate-400">Coordinates: {viewingItem.latitude}, {viewingItem.longitude}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-400">Computed Score</span>
                <p className="text-2xl font-black text-blue-400">{viewingItem.priority_score}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border rounded-md">
              <div>
                <span className="font-semibold text-slate-500">Affected Population:</span>
                <p className="font-bold text-slate-800">{viewingItem.population?.toLocaleString()}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Medical Emergency Cases:</span>
                <p className="font-bold text-red-600">{viewingItem.medical_cases}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Vulnerable Population:</span>
                <p className="font-bold text-slate-800">{viewingItem.vulnerable_population}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Severity Rating:</span>
                <div><PriorityBadge level={viewingItem.severity} /></div>
              </div>
            </div>

            <div className="p-4 border rounded-md">
              <h4 className="font-bold text-slate-800 uppercase mb-2">Resource Requirements:</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-100 p-2 rounded text-center">
                  <span className="text-slate-500">Food</span>
                  <p className="font-bold text-sm text-slate-900">{viewingItem.food_required}</p>
                </div>
                <div className="bg-slate-100 p-2 rounded text-center">
                  <span className="text-slate-500">Water</span>
                  <p className="font-bold text-sm text-slate-900">{viewingItem.water_required}</p>
                </div>
                <div className="bg-slate-100 p-2 rounded text-center">
                  <span className="text-slate-500">Medicine</span>
                  <p className="font-bold text-sm text-slate-900">{viewingItem.medicine_required}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
