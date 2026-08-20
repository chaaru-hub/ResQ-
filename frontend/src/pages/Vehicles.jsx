import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { Truck, Plus, Navigation, ShieldCheck } from 'lucide-react';

export const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    vehicle_id: '',
    type: 'Ambulance',
    driver: '',
    capacity: 2,
    location: 'Central Depot',
    status: 'Available',
    assigned_area_id: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vehRes, areasRes] = await Promise.all([
        api.getVehicles(),
        api.getAreas()
      ]);
      setVehicles(vehRes.data || []);
      setAreas(areasRes.data || []);
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
    setFormData({
      vehicle_id: `AMB-${Math.floor(100 + Math.random() * 900)}`,
      type: 'Ambulance',
      driver: '',
      capacity: 2,
      location: 'Central Depot',
      status: 'Available',
      assigned_area_id: ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const areaObj = areas.find(a => a.id === formData.assigned_area_id);
      const payload = {
        ...formData,
        assigned_area_name: areaObj ? areaObj.area_name : null
      };
      await api.createVehicle(payload);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error registering vehicle: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Emergency Vehicle Fleet Management</h2>
          <p className="text-xs text-slate-500">Logistics tracking for Ambulances, Supply Trucks, Boats, Helicopters, and Rescue Vehicles</p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Register Fleet Vehicle
        </button>
      </div>

      {/* Fleet Table */}
      <div className="cmd-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cmd-table">
            <thead>
              <tr>
                <th>Vehicle Call Sign</th>
                <th>Type</th>
                <th>Driver / Operator</th>
                <th>Capacity</th>
                <th>Current Location</th>
                <th>Status</th>
                <th>Assigned Area</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-600" />
                    {v.vehicle_id}
                  </td>
                  <td className="font-semibold text-slate-700">{v.type}</td>
                  <td>{v.driver}</td>
                  <td className="font-bold text-slate-800">{v.capacity?.toLocaleString()}</td>
                  <td>{v.location}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      v.status === 'Available' ? 'bg-emerald-100 text-emerald-700' :
                      v.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                      v.status === 'Assigned' ? 'bg-purple-100 text-purple-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="font-bold text-slate-900">{v.assigned_area_name || 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD VEHICLE MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Fleet Vehicle">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cmd-label">Vehicle Call Sign / ID</label>
              <input required type="text" value={formData.vehicle_id} onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})} placeholder="e.g. AMB-105" className="cmd-input" />
            </div>
            <div>
              <label className="cmd-label">Vehicle Type</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="cmd-input">
                <option value="Ambulance">Ambulance</option>
                <option value="Supply Truck">Supply Truck</option>
                <option value="Rescue Vehicle">Rescue Vehicle</option>
                <option value="Boat">Boat</option>
                <option value="Helicopter">Helicopter</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cmd-label">Assigned Driver / Operator</label>
              <input required type="text" value={formData.driver} onChange={(e) => setFormData({...formData, driver: e.target.value})} placeholder="e.g. K. R. Suresh" className="cmd-input" />
            </div>
            <div>
              <label className="cmd-label">Capacity (Passengers / Weight)</label>
              <input required type="number" min="1" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})} className="cmd-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cmd-label">Current Staging Location</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Logistics Depot A" className="cmd-input" />
            </div>
            <div>
              <label className="cmd-label">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="cmd-input">
                <option value="Available">Available</option>
                <option value="In Transit">In Transit</option>
                <option value="Assigned">Assigned</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Vehicle Record</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
