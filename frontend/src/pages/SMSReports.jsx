import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { DisasterReportCard } from '../components/DisasterReportCard';
import { StaggerContainer, StaggerItem } from '../components/PageContainer';
import { 
  MessageSquare, 
  Send, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  PhoneCall, 
  MapPin, 
  Users, 
  Package, 
  Cpu, 
  X, 
  Sparkles,
  Search,
  Filter,
  Check
} from 'lucide-react';

const PRESET_SMS_MESSAGES = [
  {
    label: "Tambaram Flood Emergency",
    phone: "+91 98401 23456",
    text: "Flood near Tambaram bus stand. Around 50 people trapped. Need food and medical help urgently."
  },
  {
    label: "Chennai Fire Accident",
    phone: "+91 94440 98765",
    text: "Fire accident in Chennai. 20 people affected. Need medical kits and rescue team."
  },
  {
    label: "Velachery Inundation",
    phone: "+91 98409 88776",
    text: "Heavy flood waterlogging in Velachery near main road. 15 elderly trapped. Need water, medical kits, and rescue boat immediately."
  }
];

export const SMSReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [priorityRanking, setPriorityRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // SMS Simulator Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [simPhone, setSimPhone] = useState(PRESET_SMS_MESSAGES[0].phone);
  const [simText, setSimText] = useState(PRESET_SMS_MESSAGES[0].text);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [lastAckResult, setLastAckResult] = useState(null);

  const fetchSMSData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [reportsRes, rankingRes] = await Promise.all([
        api.getReports(statusFilter !== 'All' ? statusFilter : null, severityFilter !== 'All' ? severityFilter : null),
        api.getPriorityRanking().catch(() => null)
      ]);
      setReports(reportsRes.data || []);
      setPriorityRanking(rankingRes);
    } catch (err) {
      console.error("Error fetching SMS reports:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSMSData(true);
    const interval = setInterval(() => {
      fetchSMSData(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [statusFilter, severityFilter]);

  const handleSendSMS = async (e) => {
    e.preventDefault();
    if (!simText.trim()) return;
    setSendingSMS(true);
    setLastAckResult(null);

    try {
      const res = await api.sendIncomingSMS({
        message: simText,
        reporter_phone: simPhone
      });
      setLastAckResult(res);
      fetchSMSData(false);
      setTimeout(() => {
        setModalOpen(false);
        setLastAckResult(null);
      }, 2500);
    } catch (err) {
      console.error("Error sending SMS simulation:", err.message);
    } finally {
      setSendingSMS(false);
    }
  };

  const handleVerifyReport = async (id) => {
    try {
      await api.verifyDisasterReport(id);
      fetchSMSData();
    } catch (err) {
      console.error("Verification error:", err.message);
    }
  };

  const handleRejectReport = async (id) => {
    try {
      await api.updateDisasterReportStatus(id, { status: "Rejected" });
      fetchSMSData();
    } catch (err) {
      console.error("Rejection error:", err.message);
    }
  };

  const handleUpdateStatus = async (id, data) => {
    try {
      await api.updateDisasterReportStatus(id, data);
      fetchSMSData();
    } catch (err) {
      console.error("Update error:", err.message);
    }
  };

  // Filtered reports by search query
  const filteredReports = reports.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.location && r.location.toLowerCase().includes(q)) ||
      (r.disaster_type && r.disaster_type.toLowerCase().includes(q)) ||
      (r.reporter_phone && r.reporter_phone.includes(q)) ||
      (r.original_message && r.original_message.toLowerCase().includes(q))
    );
  });

  const totalReports = reports.length;
  const criticalCount = reports.filter(r => r.severity === 'Critical' || r.priority_score >= 81).length;
  const activeCount = reports.filter(r => r.status !== 'Completed' && r.status !== 'Rejected').length;
  const completedCount = reports.filter(r => r.status === 'Completed').length;

  return (
    <div className="space-y-4 pb-8">
      {/* Top Banner & Hero Action Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 flex-shrink-0">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white">SMS Emergency Reporting Hub</h2>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                Twilio Gateway Active
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Receives live SMS emergency text messages via <code className="text-blue-300 font-mono font-bold">POST /sms/incoming</code>, auto-parses parameters, calculates priority scores, sends automated SMS acknowledgements, and feeds PuLP resource allocation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setModalOpen(true)}
            className="btn-accent px-4 py-2.5 text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Simulate Incoming SMS
          </button>
          <button
            onClick={() => fetchSMSData(true)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Refresh SMS Feed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total SMS Reports</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{totalReports}</h3>
            <span className="text-[10px] text-blue-600 font-bold">POST /sms/incoming</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critical Emergencies</span>
            <h3 className="text-xl font-black text-rose-600 mt-0.5">{criticalCount}</h3>
            <span className="text-[10px] text-rose-600 font-bold">Priority Score &ge; 81</span>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Dispatches</span>
            <h3 className="text-xl font-black text-amber-600 mt-0.5">{activeCount}</h3>
            <span className="text-[10px] text-amber-600 font-bold">En Route / In Progress</span>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SMS Replies Sent</span>
            <h3 className="text-xl font-black text-emerald-600 mt-0.5">{totalReports}</h3>
            <span className="text-[10px] text-emerald-600 font-bold">Twilio Auto Reply</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search location, disaster, phone..."
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

      {/* Main Disaster Reports List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">📱 Live SMS Disaster Ingestion Feed</h3>
          </div>
          <span className="text-xs font-bold text-slate-500">{filteredReports.length} Reports Logged</span>
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
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No matching SMS disaster reports found</h4>
            <p className="text-xs text-slate-400">Click "Simulate Incoming SMS" to test sending an emergency message.</p>
          </div>
        )}
      </div>

      {/* SMS SIMULATOR MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Simulate Incoming SMS Webhook</h3>
                  <p className="text-[11px] text-slate-500">Triggers <code className="text-blue-600 font-mono font-bold">POST /sms/incoming</code></p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Preset Selector Buttons */}
            <div className="space-y-1.5">
              <label className="cmd-label">Quick Preset Test Messages:</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SMS_MESSAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSimPhone(preset.phone);
                      setSimText(preset.text);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendSMS} className="space-y-3">
              <div>
                <label className="cmd-label">Sender Phone Number</label>
                <input
                  type="text"
                  required
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="cmd-input font-mono"
                  placeholder="+91 98401 23456"
                />
              </div>

              <div>
                <label className="cmd-label">Emergency SMS Body</label>
                <textarea
                  required
                  rows={4}
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  className="cmd-input font-sans text-xs leading-relaxed"
                  placeholder="e.g. Flood near Tambaram bus stand. Around 50 people trapped. Need food and medical help urgently."
                />
              </div>

              {lastAckResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg space-y-1 animate-fade-in">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>SMS Received & Reply Sent!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Report #{lastAckResult.data?.id} generated with Priority Score {lastAckResult.data?.priority_score}/100.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingSMS}
                  className="btn-accent text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  {sendingSMS ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Processing SMS...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Emergency SMS
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSReportsPage;
