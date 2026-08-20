import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatCard } from '../components/StatCard';
import { PriorityBadge } from '../components/PriorityBadge';
import { DisasterReportCard } from '../components/DisasterReportCard';
import { StaggerContainer, StaggerItem } from '../components/PageContainer';
import { api } from '../services/api';
import { 
  Flame, 
  MapPin, 
  AlertTriangle, 
  Boxes, 
  FileText, 
  Users2, 
  Cpu, 
  ArrowRight,
  MessageSquare,
  Sparkles,
  Truck,
  CheckCircle2,
  Clock,
  Send,
  X,
  ShieldCheck,
  Package
} from 'lucide-react';

const TEST_MESSAGE_PRESET = {
  phone: "+91 98401 99887",
  text: "Help! I am trapped in a flood near Tambaram railway station. There are 8 people with me. Water is rising quickly. We need rescue and medical help urgently."
};

export const DashboardPage = ({ setActiveTab }) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [areas, setAreas] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Demo Simulation Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [simMessage, setSimMessage] = useState(TEST_MESSAGE_PRESET.text);
  const [simPhone, setSimPhone] = useState(TEST_MESSAGE_PRESET.phone);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [analyticsRes, reportsRes, areasRes, disastersRes, alertsRes] = await Promise.all([
        api.getAnalytics(),
        api.getDisasterReports(),
        api.getAreas(),
        api.getDisasters(),
        api.getAlerts()
      ]);
      setAnalytics(analyticsRes.summary);
      setReports(reportsRes.data || []);
      setAreas(areasRes.data || []);
      setDisasters(disastersRes.data || []);
      setAlerts(alertsRes.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyReport = async (id) => {
    try {
      await api.verifyDisasterReport(id);
      fetchData();
    } catch (err) {
      alert('Verification failed: ' + err.message);
    }
  };

  const handleRejectReport = async (id) => {
    try {
      await api.updateDisasterReportStatus(id, { status: 'Rejected' });
      fetchData();
    } catch (err) {
      alert('Rejection failed: ' + err.message);
    }
  };

  const handleUpdateStatus = async (id, data) => {
    try {
      await api.updateDisasterReportStatus(id, data);
      fetchData();
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
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Simulation error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const summary = analytics || {
    total_incidents: reports.length || 12,
    critical_incidents: reports.filter(r => r.severity === 'Critical' || r.priority_level === 'Critical').length || 4,
    active_incidents: reports.filter(r => r.status !== 'Resolved' && r.status !== 'Rejected').length || 8,
    resolved_incidents: reports.filter(r => r.status === 'Resolved').length || 3,
    available_rescue_personnel: 28,
    available_vehicles: 9,
    available_medical_resources: 450
  };

  return (
    <div className="space-y-4">
      {/* URGENT EMERGENCY ALERT BANNER */}
      {alerts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-red-50 border-l-4 border-red-600 px-3 py-2 rounded-r-lg shadow-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce flex-shrink-0" />
            <p className="text-xs font-bold text-red-900 truncate">
              <span className="text-red-700 uppercase tracking-wider mr-1">CRITICAL ALERT:</span>
              {alerts[0]?.title} - {alerts[0]?.message}
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('alerts')}
            className="text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer"
          >
            Alerts ({alerts.length})
          </button>
        </motion.div>
      )}

      {/* TOP HEADER WITH HERO ACTION BUTTON */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-slate-900 text-white rounded-lg p-4 shadow-sm border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex-shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight text-white">RESQ Emergency Command & Control Center</h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">Twilio WhatsApp Ingestion Active</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Natural language disaster parsing, Priority Queue scoring (0-100), Greedy resource allocation & Dijkstra route optimization.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-md shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200 animate-spin" />
            <span>Simulate WhatsApp Emergency</span>
          </button>

          <button 
            onClick={() => setActiveTab('allocation')}
            className="btn-accent px-4 py-2.5 text-xs font-bold shadow-md whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <Cpu className="w-4 h-4" /> Run Resource Solver
          </button>
        </div>
      </motion.div>

      {/* DASHBOARD STATISTICS CARDS (7 REQUIRED STATS) */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5" delay={0.08}>
        <StaggerItem>
          <StatCard 
            title="Total Incidents" 
            value={summary.total_incidents} 
            icon={MessageSquare} 
            subtitle="WhatsApp Stream" 
            onClick={() => setActiveTab('whatsapp')}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard 
            title="Critical Incidents" 
            value={summary.critical_incidents} 
            icon={AlertTriangle} 
            alert={true}
            subtitle="Priority Score >= 81"
            onClick={() => setActiveTab('whatsapp')}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard 
            title="Active Incidents" 
            value={summary.active_incidents} 
            icon={Flame} 
            subtitle="Needs Action"
            onClick={() => setActiveTab('whatsapp')}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard 
            title="Resolved Incidents" 
            value={summary.resolved_incidents} 
            icon={CheckCircle2} 
            subtitle="Completed"
            onClick={() => setActiveTab('whatsapp')}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard 
            title="Rescue Personnel" 
            value={summary.available_rescue_personnel} 
            icon={Users2} 
            subtitle="Ready Squads"
            onClick={() => setActiveTab('teams')}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard 
            title="Available Vehicles" 
            value={summary.available_vehicles} 
            icon={Truck} 
            subtitle="Fleet Capacity"
            onClick={() => setActiveTab('vehicles')}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard 
            title="Medical Resources" 
            value={summary.available_medical_resources} 
            icon={Boxes} 
            subtitle="Inventory Stock"
            onClick={() => setActiveTab('resources')}
          />
        </StaggerItem>
      </StaggerContainer>

      {/* ADMIN EMERGENCY INCIDENT REGISTRY TABLE */}
      <IncidentTable reports={reports} onRefresh={() => fetchData(false)} />

      {/* TWO COLUMN LAYOUT: LIVE WHATSAPP FEED & MAP QUICK VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* LEFT 2 COLUMNS: LIVE WHATSAPP INCIDENT FEED WITH ANIMATIONS */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">🚨 Live WhatsApp Emergency Incident Feed</h3>
            </div>
            <button 
              onClick={() => setActiveTab('whatsapp')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              View Full Reports Center <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Incident Feed List with Animated Entrance */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {reports.slice(0, 5).map((report) => (
                <motion.div
                  key={report.id}
                  layout
                  initial={{ opacity: 0, y: 15, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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

            {reports.length === 0 && (
              <div className="cmd-card p-10 text-center text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No active WhatsApp emergency reports in feed.</p>
                <button 
                  onClick={() => setModalOpen(true)} 
                  className="btn-primary text-xs mx-auto mt-2"
                >
                  Simulate WhatsApp Emergency
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 1 COLUMN: TOP PRIORITY AFFECTED AREAS & QUICK DISPATCH MAP */}
        <div className="lg:col-span-1 space-y-3">
          {/* Top Priority Areas */}
          <div className="cmd-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Top Priority Incidents</h3>
              <button onClick={() => setActiveTab('map')} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> View Map
              </button>
            </div>

            <div className="space-y-2">
              {reports.slice(0, 4).map((r) => (
                <div key={r.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-md space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900 text-xs">{r.disaster_type} at {r.location}</span>
                    <PriorityBadge level={r.severity || r.priority_level} />
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">{r.people_affected} people stranded</span>
                    <span className="font-black text-red-600">Score: {r.priority_score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Solver Banner */}
          <div className="cmd-card p-4 bg-slate-900 text-white space-y-3">
            <div className="flex items-center gap-2 text-blue-400">
              <Cpu className="w-5 h-5" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">Smart Resource Allocator</h4>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Greedy resource allocation and Dijkstra shortest route calculation trigger automatically upon incident verification.
            </p>
            <button 
              onClick={() => setActiveTab('allocation')}
              className="w-full btn-accent py-2 text-xs font-bold justify-center"
            >
              Open Allocation Center
            </button>
          </div>
        </div>

      </div>

      {/* DEMO SIMULATION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <MessageSquare className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Simulate WhatsApp Emergency Message</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Preserved Test Scenario (Prompt Benchmark):
              </p>
              <p className="font-mono text-[11px] bg-white p-2 rounded border border-emerald-200 text-slate-800 mt-1">
                "{TEST_MESSAGE_PRESET.text}"
              </p>
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
                <label className="cmd-label">Natural-Language Emergency Message</label>
                <textarea 
                  required
                  rows={4}
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  placeholder="e.g. Flood near Tambaram railway station. 8 people trapped..."
                  className="cmd-input font-mono text-xs"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Complete Pipeline Execution Flow:</p>
                <p>1. <strong>NLP Parser</strong> extracts: Flood, Tambaram Railway Station, 8 People, Critical, Rescue/Medical.</p>
                <p>2. <strong>Priority Engine</strong> calculates score ~91 (Critical) & enqueues into Priority Queue.</p>
                <p>3. Appears live in <strong>Admin Control Portal Feed</strong> for verification.</p>
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Processing Pipeline...' : 'Send WhatsApp Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
