import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { Users2, Plus, UserCheck, Navigation, MapPin, Truck, CheckCircle2, Clock } from 'lucide-react';

export const RescueTeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    team_name: '',
    leader: '',
    members: 8,
    specialization: 'Medical',
    location: 'Central Depot',
    status: 'Available',
    assigned_area_name: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamsRes, rptRes] = await Promise.all([
        api.getRescueTeams(),
        api.getDisasterReports()
      ]);
      setTeams(teamsRes.data || []);
      setReports(rptRes.data || []);
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
      team_name: '',
      leader: '',
      members: 8,
      specialization: 'Medical',
      location: 'Central Depot',
      status: 'Available',
      assigned_area_name: ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.createRescueTeam(formData);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error creating rescue team: ' + err.message);
    }
  };

  const handleUpdateStatus = async (teamId, newStatus, assignedIncident = null) => {
    try {
      await api.updateRescueTeam(teamId, {
        status: newStatus,
        assigned_area_name: newStatus === 'Available' ? '' : (assignedIncident !== null ? assignedIncident : undefined)
      });
      fetchData();
    } catch (err) {
      alert('Status update error: ' + err.message);
    }
  };

  const statusOptions = ['Available', 'Assigned', 'On Mission', 'Offline'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Rescue Teams & Operational Squads</h2>
          <p className="text-xs text-slate-500">Manage rescue squads, personnel availability, and real-time dispatch status</p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary cursor-pointer">
          <Plus className="w-4 h-4" /> Add Rescue Squad
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((t) => (
          <div key={t.id} className="cmd-card flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.specialization} Squad</span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{t.team_name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Leader: {t.leader} ({t.members} Members)
                </p>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                t.status === 'Available' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                t.status === 'En Route' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                t.status === 'On Mission' || t.status === 'Rescuing' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                t.status === 'Assigned' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                'bg-slate-100 text-slate-600 border border-slate-300'
              }`}>
                {t.status}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Base Staging Location:</span>
                <span className="font-bold text-slate-800">{t.location}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assigned Incident:</span>
                <span className="font-bold text-blue-600 truncate max-w-[170px]">
                  {t.assigned_area_name || 'Unassigned / Standby'}
                </span>
              </div>
            </div>

            {/* Availability Option Buttons */}
            <div className="pt-2.5 border-t border-slate-200/80 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Set Availability Status:</span>
              <div className="flex flex-wrap gap-1.5">
                {statusOptions.map((statusOpt) => {
                  const isCurrent = t.status === statusOpt;
                  let btnStyle = "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200";
                  if (isCurrent) {
                    if (statusOpt === 'Available') btnStyle = "bg-emerald-600 text-white font-bold shadow-xs border-emerald-700 ring-2 ring-emerald-300";
                    else if (statusOpt === 'Assigned') btnStyle = "bg-blue-600 text-white font-bold shadow-xs border-blue-700 ring-2 ring-blue-300";
                    else if (statusOpt === 'On Mission') btnStyle = "bg-amber-600 text-white font-bold shadow-xs border-amber-700 ring-2 ring-amber-300";
                    else btnStyle = "bg-slate-800 text-white font-bold shadow-xs border-slate-900 ring-2 ring-slate-400";
                  }

                  return (
                    <button
                      key={statusOpt}
                      type="button"
                      onClick={() => handleUpdateStatus(t.id, statusOpt)}
                      className={`text-[11px] px-2.5 py-1 rounded font-semibold border transition-all cursor-pointer ${btnStyle}`}
                    >
                      {statusOpt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD TEAM MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Rescue Squad">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="cmd-label">Squad / Team Name</label>
            <input required type="text" value={formData.team_name} onChange={(e) => setFormData({...formData, team_name: e.target.value})} placeholder="e.g. Squad Alpha Rescue" className="cmd-input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cmd-label">Team Commander / Leader</label>
              <input required type="text" value={formData.leader} onChange={(e) => setFormData({...formData, leader: e.target.value})} placeholder="e.g. Capt. R. Sharma" className="cmd-input" />
            </div>
            <div>
              <label className="cmd-label">Total Active Personnel</label>
              <input required type="number" min="1" value={formData.members} onChange={(e) => setFormData({...formData, members: parseInt(e.target.value)})} className="cmd-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="cmd-label">Specialization</label>
              <select value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})} className="cmd-input">
                <option value="Medical">Medical</option>
                <option value="Search & Rescue">Search & Rescue</option>
                <option value="Evacuation">Evacuation</option>
                <option value="Hazmat">Hazmat</option>
                <option value="General Relief">General Relief</option>
              </select>
            </div>
            <div>
              <label className="cmd-label">Initial Status</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="cmd-input">
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="On Mission">On Mission</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </div>

          <div>
            <label className="cmd-label">Base Staging Location</label>
            <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Central Depot Hub" className="cmd-input" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Register Rescue Team</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
