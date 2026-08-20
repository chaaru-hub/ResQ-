import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { Boxes, Plus, AlertTriangle, ShieldCheck, Truck, Users2, Package } from 'lucide-react';

export const InventoryPage = () => {
  const [resources, setResources] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    resource_name: '',
    resource_type: 'Food',
    category: 'Supplies',
    quantity_available: 1000,
    quantity_allocated: 0,
    unit: 'packets',
    location: 'Central Logistics Hub',
    minimum_threshold: 100
  });

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resData, vehData, teamData] = await Promise.all([
        api.getResources(),
        api.getVehicles(),
        api.getRescueTeams()
      ]);
      setResources(resData.data || []);
      setVehicles(vehData.data || []);
      setTeams(teamData.data || []);
    } catch (err) {
      console.error('Error loading resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.createResource(formData);
      setModalOpen(false);
      loadAllData();
    } catch (err) {
      alert('Failed to add resource: ' + err.message);
    }
  };

  // Category filtering logic
  const isMatchTab = (item, tab) => {
    if (tab === 'All') return true;
    const cat = (item.category || '').toLowerCase();
    const type = (item.resource_type || item.type || '').toLowerCase();
    const name = (item.resource_name || '').toLowerCase();

    if (tab === 'Personnel') {
      return cat.includes('personnel') || cat.includes('human') || type.includes('team') || type.includes('worker') || name.includes('doctor') || name.includes('squad') || name.includes('personnel');
    }
    if (tab === 'Vehicles') {
      return cat.includes('vehicle') || type.includes('ambulance') || type.includes('truck') || type.includes('boat') || type.includes('van');
    }
    if (tab === 'Supplies') {
      return cat.includes('supplies') || cat.includes('equipment') || type.includes('food') || type.includes('water') || type.includes('kit') || type.includes('shelter');
    }
    return true;
  };

  const filteredResources = resources.filter(r => isMatchTab(r, activeTab));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">National Emergency Resource Management</h2>
          <p className="text-xs text-slate-500">Unified tracking for Personnel, Fleet Vehicles, and Relief Supplies (Available, Allocated, Remaining)</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Register Resource Item
        </button>
      </div>

      {/* Internal Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2.5">
        {[
          { id: 'All', label: 'All Resources', icon: Boxes },
          { id: 'Personnel', label: '👨🚒 Personnel (Teams, Doctors, Workers)', icon: Users2 },
          { id: 'Vehicles', label: '🚑 Vehicles (Ambulance, Trucks, Boats)', icon: Truck },
          { id: 'Supplies', label: '📦 Supplies (Food, Water, Kits, Tents)', icon: Package }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 cursor-pointer ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Vehicle Fleet Cards Section if Vehicles Tab is selected */}
      {(activeTab === 'All' || activeTab === 'Vehicles') && vehicles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Emergency Fleet Vehicles</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {vehicles.map((v) => (
              <div key={v.id} className="cmd-card p-3 flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{v.type}</span>
                    <h4 className="font-extrabold text-slate-900 text-sm">{v.vehicle_id}</h4>
                    <p className="text-[11px] text-slate-500">Driver: {v.driver} • {v.location}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    v.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {v.status}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded text-xs flex justify-between">
                  <span className="text-slate-500 font-semibold">Capacity:</span>
                  <span className="font-bold text-slate-900">{v.capacity} persons / units</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resource Inventory Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Supplies & Equipment Inventory</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((item) => {
            const avail = item.quantity_available || 0;
            const alloc = item.quantity_allocated || 0;
            const remaining = Math.max(0, avail - alloc);
            const percentRemaining = avail > 0 ? Math.round((remaining / avail) * 100) : 0;
            const isLow = remaining <= (item.minimum_threshold || 100);

            return (
              <div key={item.id} className={`cmd-card relative overflow-hidden ${isLow ? 'border-l-4 border-l-red-600 bg-red-50/20' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.category}</span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{item.resource_name}</h3>
                    <p className="text-xs text-slate-500">{item.location}</p>
                  </div>
                  {isLow ? (
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Low Stock
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Adequate
                    </span>
                  )}
                </div>

                {/* Numerical Metrics */}
                <div className="grid grid-cols-3 gap-2 my-4 pt-3 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Available</span>
                    <p className="text-sm font-bold text-slate-800">{avail.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Allocated</span>
                    <p className="text-sm font-bold text-blue-600">{alloc.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Remaining</span>
                    <p className={`text-sm font-bold ${isLow ? 'text-red-600' : 'text-emerald-700'}`}>{remaining.toLocaleString()}</p>
                  </div>
                </div>

                {/* Stock Level Progress */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500">Stock Availability Level</span>
                    <span className={isLow ? 'text-red-600 font-extrabold' : 'text-slate-700'}>{percentRemaining}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isLow ? 'bg-red-600' : percentRemaining < 40 ? 'bg-amber-500' : 'bg-emerald-600'}`} 
                      style={{ width: `${percentRemaining}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD RESOURCE MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Resource Record">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="cmd-label">Resource Item Name</label>
            <input required type="text" value={formData.resource_name} onChange={(e) => setFormData({...formData, resource_name: e.target.value})} placeholder="e.g. Inflatable Rescue Boats / Water Cans" className="cmd-input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cmd-label">Category</label>
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="cmd-input">
                <option value="Supplies">Supplies (Food, Water, Kits)</option>
                <option value="Vehicles">Vehicles (Ambulance, Boats, Vans)</option>
                <option value="Personnel">Personnel (Teams, Doctors, Workers)</option>
              </select>
            </div>
            <div>
              <label className="cmd-label">Standard Unit</label>
              <input type="text" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} placeholder="e.g. packets, units, squads" className="cmd-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cmd-label">Total Quantity Available</label>
              <input required type="number" min="1" value={formData.quantity_available} onChange={(e) => setFormData({...formData, quantity_available: parseInt(e.target.value)})} className="cmd-input" />
            </div>
            <div>
              <label className="cmd-label">Minimum Safety Threshold</label>
              <input required type="number" min="1" value={formData.minimum_threshold} onChange={(e) => setFormData({...formData, minimum_threshold: parseInt(e.target.value)})} className="cmd-input" />
            </div>
          </div>

          <div>
            <label className="cmd-label">Storage Location / Depot</label>
            <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Central Supply Depot" className="cmd-input" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Resource Record</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
