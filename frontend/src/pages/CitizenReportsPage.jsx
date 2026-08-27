import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { DisasterReportCard } from '../components/DisasterReportCard';
import {
  ShieldAlert,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  PhoneCall,
  MapPin,
  Users,
  Package,
  Cpu,
  Search,
  Filter,
  ExternalLink,
  LifeBuoy,
  FileText,
  UserCheck
} from 'lucide-react';

export const CitizenReportsPage = ({ setActiveTab }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReports = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.getDisasterReports(
        statusFilter !== 'All' ? statusFilter : null,
        severityFilter !== 'All' ? severityFilter : null
      );
      // Filter reports coming from Citizen Portal or show all emergency reports
      const data = res.data || [];
      setReports(data);
    } catch (err) {
      console.error('Error fetching citizen reports:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(true);
    const interval = setInterval(() => {
      fetchReports(false);
    }, 3000);

    // WebSocket real-time listener for zero-refresh updates
    let ws = null;
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname || 'localhost';
      const wsUrl = `${wsProtocol}//${wsHost}:8000/ws`;

      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'NEW_CITIZEN_REPORT' || msg.event === 'NEW_REPORT') {
            fetchReports(false);
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      clearInterval(interval);
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, [statusFilter, severityFilter]);

  const handleVerifyReport = async (id) => {
    try {
      await api.verifyDisasterReport(id);
      fetchReports();
    } catch (err) {
      alert('Verification error: ' + err.message);
    }
  };

  const handleRejectReport = async (id) => {
    try {
      await api.updateDisasterReportStatus(id, { status: 'Rejected' });
      fetchReports();
    } catch (err) {
      alert('Rejection error: ' + err.message);
    }
  };

  const handleUpdateStatus = async (id, data) => {
    try {
      await api.updateDisasterReportStatus(id, data);
      fetchReports();
    } catch (err) {
      alert('Update error: ' + err.message);
    }
  };

  // Filter Citizen Reports specifically or prioritize Citizen Portal reports
  const citizenReports = reports.filter((r) => r.source === 'Citizen Portal' || r.reporter_name || r.image_url);

  // Search filter
  const filteredReports = citizenReports.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.location && r.location.toLowerCase().includes(q)) ||
      (r.disaster_type && r.disaster_type.toLowerCase().includes(q)) ||
      (r.reporter_name && r.reporter_name.toLowerCase().includes(q)) ||
      (r.reporter_phone && r.reporter_phone.includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.original_message && r.original_message.toLowerCase().includes(q))
    );
  });

  const totalCount = citizenReports.length;
  const criticalCount = citizenReports.filter((r) => r.severity === 'Critical' || r.priority_score >= 81).length;
  const pendingCount = citizenReports.filter((r) => r.status === 'Pending').length;
  const assignedCount = citizenReports.filter((r) => r.status === 'In Progress' || r.assigned_team).length;

  return (
    <div className="space-y-4 pb-8">
      {/* HERO BANNER */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30 flex-shrink-0">
            <ShieldAlert className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white">Citizen Emergency Reports Hub</h2>
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                Live Ingestion Stream
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Real-time feed of emergency disaster reports submitted directly by affected citizens via the ResQ Citizen Portal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href="/citizen"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-accent px-4 py-2.5 text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" /> Open Public Citizen Portal
          </a>
          <button
            onClick={() => fetchReports(true)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Refresh Citizen Feed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Citizen Reports</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{totalCount}</h3>
            <span className="text-[10px] text-blue-600 font-bold">Public Submissions</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <LifeBuoy className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critical Incidents</span>
            <h3 className="text-xl font-black text-rose-600 mt-0.5">{criticalCount}</h3>
            <span className="text-[10px] text-rose-600 font-bold">Priority Score &ge; 81</span>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Review</span>
            <h3 className="text-xl font-black text-amber-600 mt-0.5">{pendingCount}</h3>
            <span className="text-[10px] text-amber-600 font-bold">Action Needed</span>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Squads Dispatched</span>
            <h3 className="text-xl font-black text-emerald-600 mt-0.5">{assignedCount}</h3>
            <span className="text-[10px] text-emerald-600 font-bold">Rescue In Progress</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search citizen name, location, disaster..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cmd-input pl-9 py-1.5 text-xs bg-slate-50 border-slate-200"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs font-bold text-slate-800"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending Verification</option>
              <option value="Verified">Verified</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="text-[11px] text-slate-500">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs font-bold text-slate-800"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* CITIZEN REPORTS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">🚨 Live Citizen Emergency Feed</h3>
          </div>
          <span className="text-xs font-bold text-slate-500">{filteredReports.length} Reports</span>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredReports.map((report) => (
            <motion.div
              key={report.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
            >
              <DisasterReportCard
                report={report}
                onVerify={handleVerifyReport}
                onReject={handleRejectReport}
                onUpdateStatus={handleUpdateStatus}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredReports.length === 0 && (
          <div className="cmd-card p-12 text-center text-slate-500 space-y-3">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No matching citizen emergency reports found</h4>
            <p className="text-xs text-slate-400">Open the Citizen Portal to submit a new test report.</p>
            <a
              href="/citizen"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent text-xs font-bold inline-flex items-center gap-1.5 mt-2"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Submit Test Citizen Report
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenReportsPage;
