import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { Modal } from '../components/Modal';
import { Plus, FileText, CheckCircle2, XCircle, Clock, Send, ShieldCheck } from 'lucide-react';

export const RequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    area_id: '',
    resource_type: 'Medicine',
    quantity: 100,
    urgency: 'Critical',
    description: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, areaRes] = await Promise.all([
        api.getRequests(),
        api.getAreas()
      ]);
      setRequests(reqRes.data || []);
      setAreas(areaRes.data || []);
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
      area_id: areas[0]?.id || '',
      resource_type: 'Medicine',
      quantity: 100,
      urgency: 'Critical',
      description: ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.createRequest(formData);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to log emergency request: ' + err.message);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.updateRequestStatus(id, newStatus);
      fetchData();
    } catch (err) {
      alert('Failed to update request: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Emergency Resource Request Stream</h2>
          <p className="text-xs text-slate-500">Incoming requests logged directly from disaster relief personnel in affected sectors</p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> Submit Emergency Request
        </button>
      </div>

      {/* Requests Table */}
      <div className="cmd-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cmd-table">
            <thead>
              <tr>
                <th>Area Name</th>
                <th>Resource Requested</th>
                <th>Quantity</th>
                <th>Urgency</th>
                <th>Description & Notes</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th className="text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="font-bold text-slate-900">{r.area_name}</td>
                  <td className="font-semibold text-slate-800">{r.resource_type}</td>
                  <td className="font-bold text-blue-600">{r.quantity?.toLocaleString()}</td>
                  <td>
                    <PriorityBadge level={r.urgency} />
                  </td>
                  <td className="max-w-xs text-xs text-slate-600 truncate">{r.description || 'N/A'}</td>
                  <td className="text-slate-500 text-[11px]">{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      r.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                      r.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                      r.status === 'Fulfilled' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {r.status === 'Pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(r.id, 'Approved')} 
                            className="px-2 py-1 bg-blue-600 text-white rounded text-[11px] font-bold hover:bg-blue-700"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(r.id, 'Rejected')} 
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[11px] font-bold hover:bg-slate-300"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {r.status === 'Approved' && (
                        <button 
                          onClick={() => handleUpdateStatus(r.id, 'Fulfilled')} 
                          className="px-2 py-1 bg-emerald-700 text-white rounded text-[11px] font-bold hover:bg-emerald-800 flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3 h-3" /> Mark Fulfilled
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUBMIT REQUEST MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Submit Field Emergency Request">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="cmd-label">Select Affected Location</label>
            <select value={formData.area_id} onChange={(e) => setFormData({...formData, area_id: e.target.value})} className="cmd-input">
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.area_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cmd-label">Resource Type Needed</label>
              <select value={formData.resource_type} onChange={(e) => setFormData({...formData, resource_type: e.target.value})} className="cmd-input">
                <option value="Medicine">Medicine</option>
                <option value="Food">Food Rations</option>
                <option value="Drinking Water">Drinking Water</option>
                <option value="Rescue Teams">Rescue Teams</option>
                <option value="Ambulance">Ambulance</option>
                <option value="Generators">Generators</option>
                <option value="Oxygen Cylinders">Oxygen Cylinders</option>
                <option value="Blankets">Blankets</option>
              </select>
            </div>
            <div>
              <label className="cmd-label">Required Quantity</label>
              <input required type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} className="cmd-input" />
            </div>
          </div>

          <div>
            <label className="cmd-label">Urgency Rating</label>
            <select value={formData.urgency} onChange={(e) => setFormData({...formData, urgency: e.target.value})} className="cmd-input">
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="cmd-label">Situation Description & Field Justification</label>
            <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Specify reason for request..." className="cmd-input" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Submit Emergency Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
