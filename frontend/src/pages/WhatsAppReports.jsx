import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DisasterReportCard } from '../components/DisasterReportCard';
import { IncidentTable } from '../components/IncidentTable';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  X, 
  Sparkles, 
  Send,
  Flame,
  Radio
} from 'lucide-react';

const SAMPLE_MESSAGES = [
  {
    label: "Flood - Velachery",
    phone: "+91 98401 23456",
    text: "Flood in Velachery. Around 200 people are stranded. Water level is increasing. Need food, drinking water and medical assistance."
  },
  {
    label: "Fire - Guindy",
    phone: "+91 94440 98765",
    text: "Fire outbreak near Guindy industrial zone. 45 factory workers trapped. Smoke spreading fast. Send ambulance and fire rescue team immediately!"
  },
  {
    label: "Landslide - Hill Pass",
    phone: "+91 97900 11223",
    text: "Landslide at Hill Pass Ridge Sector 4. National highway blocked. 120 travelers stranded without drinking water and shelter."
  }
];

export const WhatsAppReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Demo Simulation Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [simMessage, setSimMessage] = useState('');
  const [simPhone, setSimPhone] = useState('+91 98401 99887');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.getDisasterReports();
      setReports(res.data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(true);
    const interval = setInterval(() => {
      fetchReports(false);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (id) => {
    try {
      await api.verifyDisasterReport(id);
      fetchReports();
    } catch (err) {
      alert('Verification failed: ' + err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.updateDisasterReportStatus(id, { status: 'Rejected' });
      fetchReports();
    } catch (err) {
      alert('Rejection failed: ' + err.message);
    }
  };

  const handleUpdateStatus = async (id, data) => {
    try {
      await api.updateDisasterReportStatus(id, data);
      fetchReports();
    } catch (err) {
      alert('Status update failed: ' + err.message);
    }
  };

  const handleSimulateSubmit = async (e) => {
    e.preventDefault();
    if (!simMessage.trim()) return;
    setSubmitting(true);
    try {
      await api.simulateWhatsAppReport({
        message: simMessage,
        reporter_phone: simPhone
      });
      setSimMessage('');
      setModalOpen(false);
      fetchReports();
    } catch (err) {
      alert('Simulation error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & Search Logic
  const filteredReports = reports.filter((rpt) => {
    if (activeFilter === 'Critical' && rpt.severity !== 'Critical' && rpt.priority_level !== 'Critical') return false;
    if (activeFilter === 'High' && rpt.severity !== 'High' && rpt.priority_level !== 'High') return false;
    if (activeFilter === 'Medium' && rpt.severity !== 'Medium' && rpt.priority_level !== 'Medium') return false;
    if (activeFilter === 'Low' && rpt.severity !== 'Low' && rpt.priority_level !== 'Low') return false;
    if (activeFilter === 'Pending' && rpt.status !== 'Pending') return false;
    if (activeFilter === 'Verified' && rpt.status !== 'Verified') return false;
    if (activeFilter === 'Resolved' && rpt.status !== 'Resolved') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const loc = (rpt.location || '').toLowerCase();
      const type = (rpt.disaster_type || '').toLowerCase();
      const phone = (rpt.reporter_phone || '').toLowerCase();
      const msg = (rpt.original_message || '').toLowerCase();
      return loc.includes(q) || type.includes(q) || phone.includes(q) || msg.includes(q);
    }
    return true;
  });

  const pendingCount = reports.filter(r => r.status === 'Pending').length;
  const criticalCount = reports.filter(r => r.severity === 'Critical' || r.priority_level === 'Critical').length;
  const verifiedCount = reports.filter(r => r.status === 'Verified' || r.status === 'Assigned').length;

  return (
    <div className="space-y-6">
      {/* Top Hero Command Header */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Twilio WhatsApp Cloud Ingestion (Live Stream)</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white">WhatsApp Emergency Disaster Reporting Center</h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Automated NLP entity parsing, emergency priority scoring (0-100), and verified disaster incident dispatch workflow.
          </p>
        </div>

        <button 
          onClick={() => setModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-3 rounded-lg shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer z-10 border border-emerald-500 whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          <span>Simulate WhatsApp Report (Demo)</span>
        </button>
      </div>

      {/* Modern Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="cmd-card p-4 flex items-center justify-between border-l-4 border-l-slate-800">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Reports Stream</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{reports.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-100 text-slate-700"><MessageSquare className="w-5 h-5" /></div>
        </div>

        <div className="cmd-card p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Verification</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600"><Clock className="w-5 h-5" /></div>
        </div>

        <div className="cmd-card p-4 flex items-center justify-between border-l-4 border-l-red-600">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Critical Priority</p>
            <p className="text-2xl font-black text-red-600 mt-0.5">{criticalCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 text-red-600"><AlertTriangle className="w-5 h-5" /></div>
        </div>

        <div className="cmd-card p-4 flex items-center justify-between border-l-4 border-l-emerald-600">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Verified & Pipelined</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{verifiedCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-5 h-5" /></div>
        </div>
      </div>

      {/* ADMIN EMERGENCY INCIDENT REGISTRY TABLE */}
      <IncidentTable reports={reports} onRefresh={() => fetchReports(false)} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['All', 'Critical', 'High', 'Medium', 'Low', 'Pending', 'Verified', 'Resolved'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === filter 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input 
            type="text"
            placeholder="Search location, disaster, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cmd-input pl-9 py-1.5 text-xs bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Reports Feed */}
      {loading ? (
        <div className="cmd-card p-12 text-center text-slate-500 space-y-3">
          <div className="w-9 h-9 rounded-full border-4 border-emerald-500/30 border-t-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-bold">Loading WhatsApp disaster stream...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="cmd-card p-12 text-center text-slate-500 space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No disaster reports found matching criteria.</p>
          <p className="text-xs text-slate-400">Click "Simulate WhatsApp Report (Demo)" above to test emergency inputs.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <DisasterReportCard 
              key={report.id}
              report={report}
              onVerify={handleVerify}
              onReject={handleReject}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}

      {/* DEMO SIMULATION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <MessageSquare className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-slate-900">Simulate Incoming WhatsApp Message</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quick Demo Presets:</label>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_MESSAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSimMessage(sample.text);
                      setSimPhone(sample.phone);
                    }}
                    className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSimulateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="cmd-label">Reporter WhatsApp Phone</label>
                <input 
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="cmd-input"
                  placeholder="+91 98401 23456"
                />
              </div>

              <div>
                <label className="cmd-label">WhatsApp Text Content</label>
                <textarea 
                  required
                  rows={4}
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  placeholder="e.g. Flood in Velachery. Around 200 people are stranded. Need food, drinking water and medical assistance."
                  className="cmd-input font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Processing...' : 'Send WhatsApp Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
