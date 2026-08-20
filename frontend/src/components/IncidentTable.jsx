import React, { useState } from 'react';
import { PriorityBadge } from './PriorityBadge';
import { api } from '../services/api';
import { 
  Users, 
  MapPin, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Navigation, 
  X, 
  Send,
  Cpu,
  ShieldCheck,
  Check
} from 'lucide-react';

const AVAILABLE_TEAMS = [
  { id: "t1", team_name: "Alpha Medical ResQ-1", specialization: "Medical", location: "Coastal Sector 1" },
  { id: "t2", team_name: "Bravo NDRF Battalion 4", specialization: "Search & Rescue", location: "Riverbed Township" },
  { id: "t3", team_name: "Charlie Coast Guard Squad", specialization: "Evacuation", location: "Fisherman Island" },
  { id: "t4", team_name: "Delta Hazmat Response", specialization: "Hazmat", location: "Central Depot" },
  { id: "t5", team_name: "Echo General Relief Contingent", specialization: "General Relief", location: "North Harbor" }
];

export const IncidentTable = ({ reports = [], onRefresh }) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(AVAILABLE_TEAMS[0].id);
  const [loading, setLoading] = useState(false);

  const handleOpenAssignModal = (report) => {
    setSelectedReport(report);
    setAssignModalOpen(true);
  };

  const handleOpenRouteModal = (report) => {
    setSelectedReport(report);
    setRouteModalOpen(true);
  };

  const handleAssignTeamSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setLoading(true);

    const team = AVAILABLE_TEAMS.find(t => t.id === selectedTeamId) || AVAILABLE_TEAMS[0];

    try {
      await api.assignTeamToReport(selectedReport.id, {
        team_id: team.id,
        team_name: team.team_name
      });
      setAssignModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Assign team error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOperation = async (reportId) => {
    if (!window.confirm('Mark this incident as Completed and notify reporter via WhatsApp?')) return;
    setLoading(true);
    try {
      await api.completeDisasterReport(reportId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Completion error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Resolved':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed</span>;
      case 'In Progress':
      case 'Assigned':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><Truck className="w-3 h-3 text-purple-600 animate-pulse" /> Assigned & En Route</span>;
      case 'Verified':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-blue-600" /> Verified</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><Clock className="w-3 h-3 text-amber-600" /> Pending</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Emergency Incident Registry Table</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage WhatsApp disaster reports, assign response teams, run Dijkstra routing & dispatch automated status updates.
          </p>
        </div>
        <span className="text-xs font-bold font-mono bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md">
          Total Incidents: {reports.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Incident ID</th>
              <th className="py-3 px-4">Disaster Type</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Assigned Team</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                  No registered emergency incidents found.
                </td>
              </tr>
            ) : (
              reports.map((rpt) => {
                const incId = rpt.incident_id || rpt.id || `inc_${Math.random().toString(36).substr(2, 6)}`;
                const priorityLabel = (rpt.priority || rpt.priority_level || rpt.severity || 'HIGH').toUpperCase();
                const teamName = rpt.assigned_team || rpt.assigned_team_name || 'Unassigned';

                return (
                  <tr key={incId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{incId.toString().substring(0, 10)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {rpt.disaster_type || 'Disaster'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500" /> {rpt.location || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge level={priorityLabel} />
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(rpt.status)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {teamName !== 'Unassigned' ? (
                        <span className="flex items-center gap-1 text-blue-700">
                          <Users className="w-3.5 h-3.5 text-blue-600" /> {teamName}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal italic">None Assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rpt.status !== 'Completed' && rpt.status !== 'Resolved' && (
                          <button
                            onClick={() => handleOpenAssignModal(rpt)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            title="Assign Rescue Team & Trigger WhatsApp Notification"
                          >
                            <Users className="w-3 h-3" /> Assign Team
                          </button>
                        )}

                        {(rpt.status === 'In Progress' || rpt.status === 'Assigned') && (
                          <button
                            onClick={() => handleCompleteOperation(rpt.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            title="Mark Operation Completed & Send WhatsApp Notification"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Complete
                          </button>
                        )}

                        {rpt.dijkstra_route && (
                          <button
                            onClick={() => handleOpenRouteModal(rpt)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-extrabold text-[11px] px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            title="View Dijkstra Shortest Route Telemetry"
                          >
                            <Navigation className="w-3 h-3 text-purple-600" /> Route
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ASSIGN RESCUE TEAM MODAL */}
      {assignModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-700">
                <Users className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Assign Rescue Team to Incident</h3>
              </div>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs space-y-1 text-blue-900">
              <p className="font-extrabold text-blue-900">Target Incident:</p>
              <p>{selectedReport.disaster_type} at <strong>{selectedReport.location}</strong></p>
              <p className="text-[11px] text-blue-700">Reporter: {selectedReport.reporter_phone}</p>
            </div>

            <form onSubmit={handleAssignTeamSubmit} className="space-y-4 text-xs">
              <div>
                <label className="cmd-label font-bold text-slate-700">Select Available Response Team:</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="cmd-input font-bold"
                >
                  {AVAILABLE_TEAMS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.team_name} ({t.specialization} • {t.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  <Send className="w-3 h-3 text-emerald-600" /> Automated Dispatch Actions:
                </p>
                <p>1. Status updated to <strong>In Progress</strong>.</p>
                <p>2. <strong>Dijkstra algorithm</strong> computes shortest dispatch route from Central Depot.</p>
                <p>3. Automatic Twilio WhatsApp notification sent to <strong>{selectedReport.reporter_phone}</strong>.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{loading ? 'Assigning & Notifying...' : 'Assign Team & Send WhatsApp Update'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIJKSTRA ROUTE TELEMETRY MODAL */}
      {routeModalOpen && selectedReport && selectedReport.dijkstra_route && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-purple-700">
                <Navigation className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Dijkstra Shortest Path Telemetry</h3>
              </div>
              <button onClick={() => setRouteModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-purple-600 uppercase">Algorithm</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedReport.dijkstra_route.algorithm}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-purple-600 uppercase">Estimated Distance</span>
                <p className="font-extrabold text-purple-700 text-sm mt-0.5">{selectedReport.dijkstra_route.total_distance_km} km</p>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs space-y-2">
              <p className="font-bold text-emerald-400 text-xs">Path Execution Graph Nodes:</p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded font-bold">{selectedReport.dijkstra_route.start_node}</span>
                <span>➔</span>
                <span className="bg-blue-800 text-blue-100 px-2 py-0.5 rounded font-bold">{selectedReport.dijkstra_route.end_node}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Estimated Response ETA: <strong>~{selectedReport.dijkstra_route.estimated_duration_mins} minutes</strong>
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRouteModalOpen(false)}
                className="btn-secondary text-xs cursor-pointer"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
