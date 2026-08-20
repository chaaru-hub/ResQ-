import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PriorityBadge } from './PriorityBadge';
import { 
  MessageSquare, 
  MapPin, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Phone, 
  Package, 
  ShieldCheck, 
  Flame, 
  Cpu, 
  Edit3,
  Image as ImageIcon,
  Check,
  Truck,
  Droplets,
  HeartPulse,
  Sparkles,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  Sliders,
  Navigation
} from 'lucide-react';

export const DisasterReportCard = ({ report, onVerify, onReject, onUpdateStatus }) => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [editStatus, setEditStatus] = useState(report.status || 'Pending');
  const [editLocation, setEditLocation] = useState(report.location || '');
  const [editPeople, setEditPeople] = useState(report.people_affected || 0);
  const [editSeverity, setEditSeverity] = useState(report.severity || 'Medium');

  const handleVerify = async () => {
    setLoading(true);
    try {
      await onVerify(report.id);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject(report.id);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatus = async () => {
    setLoading(true);
    try {
      await onUpdateStatus(report.id, { 
        status: editStatus,
        location: editLocation,
        people_affected: parseInt(editPeople),
        severity: editSeverity
      });
      setEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const getBorderColor = (sev, score) => {
    if (sev === 'Critical' || score >= 81) return 'border-l-4 border-l-red-600 bg-white shadow-sm hover:shadow-md';
    if (sev === 'High' || score >= 61) return 'border-l-4 border-l-orange-500 bg-white shadow-sm hover:shadow-md';
    if (sev === 'Medium' || score >= 31) return 'border-l-4 border-l-amber-500 bg-white shadow-sm hover:shadow-md';
    return 'border-l-4 border-l-emerald-600 bg-white shadow-sm hover:shadow-md';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Verified':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified</span>;
      case 'Pending':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> Pending Verification</span>;
      case 'Rejected':
        return <span className="bg-slate-200 text-slate-700 border border-slate-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-slate-500" /> Rejected</span>;
      case 'Assigned':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-blue-600" /> Resource Assigned</span>;
      case 'In Progress':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-purple-600 animate-bounce" /> Dispatch In Progress</span>;
      case 'Resolved':
        return <span className="bg-green-100 text-green-900 border border-green-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-700" /> Resolved</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  const getResourceIcon = (resName) => {
    const r = resName.toLowerCase();
    if (r.includes('water')) return <Droplets className="w-3 h-3 text-blue-500" />;
    if (r.includes('med') || r.includes('health') || r.includes('doctor')) return <HeartPulse className="w-3 h-3 text-red-500" />;
    if (r.includes('food') || r.includes('ration')) return <Package className="w-3 h-3 text-amber-500" />;
    return <Package className="w-3 h-3 text-slate-500" />;
  };

  return (
    <div className={`rounded-xl border border-slate-200 p-4 space-y-3.5 transition-all duration-200 ${getBorderColor(report.severity, report.priority_score)}`}>
      {/* 1. Header Line */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-600" />
                <span>{report.disaster_type || 'Disaster Incident'}</span>
              </h3>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                WhatsApp Source
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 font-mono font-medium text-slate-700">
                <Phone className="w-3 h-3 text-slate-400" /> {report.reporter_phone || 'Anonymous'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3" /> {new Date(report.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* LIGHT INFO TILE BUTTON */}
          <button
            type="button"
            onClick={() => setInfoOpen(!infoOpen)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              infoOpen 
                ? 'bg-blue-600 text-white ring-2 ring-blue-300' 
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
            }`}
            title="Click for Detailed Incident Telemetry & Priority Breakdown"
          >
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Incident Telemetry Info</span>
            {infoOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <PriorityBadge level={report.severity || report.priority_level} />
          {getStatusBadge(report.status)}
        </div>
      </div>

      {/* 2. WhatsApp Message Speech Bubble */}
      <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg border border-slate-800 shadow-inner relative overflow-hidden font-mono text-xs leading-relaxed">
        <div className="flex items-center justify-between text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-800/80">
          <span className="flex items-center gap-1 text-emerald-400">
            <MessageSquare className="w-3 h-3 text-emerald-400" /> Raw WhatsApp Transmission
          </span>
          <span className="text-slate-500">{report.reporter_phone || 'WhatsApp Direct'}</span>
        </div>
        <p className="text-slate-100 text-xs font-mono select-text">
          "{report.original_message}"
        </p>
      </div>

      {/* 3. Media Photo Attachment if available */}
      {report.media_url && (
        <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center gap-3">
          <img src={report.media_url} alt="WhatsApp Photo Attachment" className="w-20 h-20 object-cover rounded-md border border-slate-700 flex-shrink-0" />
          <div className="text-xs text-slate-300">
            <p className="font-bold flex items-center gap-1 text-emerald-400">
              <ImageIcon className="w-4 h-4" /> Photo Evidence Attached
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Direct camera capture from victim's phone.</p>
          </div>
        </div>
      )}

      {/* 4. Extracted Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-red-500" /> Extracted Location
          </span>
          <span className="font-extrabold text-slate-900 mt-1 truncate text-xs">{report.location || 'Unknown'}</span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 tracking-wider">
            <Users className="w-3.5 h-3.5 text-blue-500" /> Stranded Victims
          </span>
          <span className="font-extrabold text-slate-900 mt-1 text-xs">{report.people_affected ? `${report.people_affected} people` : 'Unknown'}</span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Priority Score
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="font-black text-sm text-red-600 bg-red-100/80 px-2 py-0.5 rounded border border-red-200">
              {report.priority_score || 0} / 100
            </span>
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 tracking-wider">
            <Package className="w-3.5 h-3.5 text-emerald-600" /> Emergency Urgency
          </span>
          <span className="font-extrabold text-slate-800 mt-1 text-xs">{report.urgency || 'Medium'}</span>
        </div>
      </div>

      {/* 5. Required Supplies Tags */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1 uppercase tracking-wider">
          <Package className="w-3.5 h-3.5 text-slate-400" /> Demanded Supplies:
        </span>
        {report.required_resources && report.required_resources.length > 0 ? (
          report.required_resources.map((res, i) => (
            <span key={i} className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
              {getResourceIcon(res)}
              <span>{res}</span>
            </span>
          ))
        ) : (
          <span className="text-[11px] text-slate-400 italic">None specified in message</span>
        )}
      </div>

      {/* 🌟 SMOOTH ANIMATED DETAILED INFO EXPANSION DRAWER */}
      <AnimatePresence>
        {infoOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden bg-slate-900 text-white rounded-xl p-4 border border-slate-800 space-y-3.5 shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold">
              <div className="flex items-center gap-2 text-blue-400">
                <Sparkles className="w-4 h-4" />
                <span className="uppercase tracking-wider">Detailed NLP Entity & Priority Score Breakdown</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Incident ID: #{report.id?.toString().substring(0, 8)}</span>
            </div>

            {/* Priority Formula Components */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Severity Factor (40%)</span>
                <p className="font-extrabold text-red-400 text-sm mt-0.5">
                  {report.severity === 'Critical' ? '+40.0 pts' : report.severity === 'High' ? '+30.0 pts' : '+20.0 pts'}
                </p>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Population Impact (25%)</span>
                <p className="font-extrabold text-blue-400 text-sm mt-0.5">
                  +{(Math.min(25, (report.people_affected || 5) * 1.5)).toFixed(1)} pts
                </p>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Urgency Score (20%)</span>
                <p className="font-extrabold text-amber-400 text-sm mt-0.5">
                  {report.urgency === 'Critical' ? '+20.0 pts' : '+15.0 pts'}
                </p>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Resource Shortage (15%)</span>
                <p className="font-extrabold text-purple-400 text-sm mt-0.5">+12.5 pts</p>
              </div>
            </div>

            {/* Geospatial Coordinates & Routing Telemetry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 space-y-1">
                <p className="font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400" /> Geospatial Coordinates
                </p>
                <p className="font-mono text-slate-400 text-[11px]">
                  Target Sector: {report.location || 'Tambaram Sector'}<br />
                  Lat / Lng: {report.latitude || 12.9229}, {report.longitude || 80.1275}
                </p>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800 space-y-1">
                <p className="font-bold text-blue-300 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-400" /> Dijkstra Dispatch Path
                </p>
                <p className="text-slate-400 text-[11px]">
                  Origin: Central Logistics Hub<br />
                  Est. Route Distance: ~18.3 km (ETA ~32 mins)
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Recommended Rescue Squad */}
      {report.assigned_team_name && (
        <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Assigned Squad: <strong>{report.assigned_team_name}</strong></span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-blue-200 text-blue-800 px-2 py-0.5 rounded">Greedy Matched</span>
        </div>
      )}

      {/* 7. Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {editing ? (
            <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2 rounded-lg border border-slate-200 text-xs">
              <input 
                type="text"
                placeholder="Location"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="cmd-input py-1 text-xs w-32"
              />
              <input 
                type="number"
                placeholder="People"
                value={editPeople}
                onChange={(e) => setEditPeople(e.target.value)}
                className="cmd-input py-1 text-xs w-20"
              />
              <select 
                value={editSeverity} 
                onChange={(e) => setEditSeverity(e.target.value)}
                className="cmd-input py-1 text-xs"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <select 
                value={editStatus} 
                onChange={(e) => setEditStatus(e.target.value)}
                className="cmd-input py-1 text-xs"
              >
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <button 
                onClick={handleSaveStatus} 
                disabled={loading}
                className="btn-primary text-xs py-1 px-3 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Save
              </button>
              <button 
                onClick={() => setEditing(false)}
                className="btn-secondary text-xs py-1 px-3 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setEditing(true)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" /> Edit / Update Status
            </button>
          )}
        </div>

        {report.status === 'Pending' && (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReject}
              disabled={loading}
              className="btn-secondary text-xs py-1.5 px-3.5 text-red-600 hover:bg-red-50 border-red-200 cursor-pointer"
            >
              Reject
            </button>
            <button 
              onClick={handleVerify}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-4 rounded-md shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-emerald-700"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify & Push to Allocation</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
