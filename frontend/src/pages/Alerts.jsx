import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { Bell, AlertTriangle, AlertCircle, CheckCircle, Info, ShieldAlert, Plus, X } from 'lucide-react';

export const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    severity: 'Critical',
    message: ''
  });

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getAlerts();
      setAlerts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleDismiss = async (id) => {
    try {
      await api.dismissAlert(id);
      fetchAlerts();
    } catch (err) {
      alert('Failed to resolve alert: ' + err.message);
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) return;
    setSubmitting(true);
    try {
      await api.createAlert(formData);
      setFormData({ title: '', severity: 'Critical', message: '' });
      setModalOpen(false);
      fetchAlerts();
    } catch (err) {
      alert('Failed to create alert: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">System Emergency Alerts & Warning Center</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Automated inventory notifications, critical medicine shortages, and new high-priority field requests</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-3.5 py-2 rounded-md shadow-sm transition-all text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Broadcast Critical Alert</span>
        </button>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-3">
        {alerts.map((alt) => (
          <div 
            key={alt.id} 
            className={`cmd-card flex items-start justify-between gap-4 dark:bg-slate-800 dark:border-slate-700 ${
              alt.severity === 'Critical' ? 'border-l-4 border-l-red-600 bg-red-50/20 dark:bg-red-950/30' :
              alt.severity === 'Emergency' ? 'border-l-4 border-l-orange-500 bg-orange-50/20 dark:bg-orange-950/30' :
              alt.severity === 'Warning' ? 'border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/30' :
              'border-l-4 border-l-blue-500'
            } ${alt.status === 'Resolved' ? 'opacity-50 grayscale' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-lg mt-0.5 ${
                alt.severity === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300' :
                alt.severity === 'Emergency' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300' :
                'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{alt.title}</h3>
                  <PriorityBadge level={alt.severity} />
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">{new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">{alt.message}</p>
              </div>
            </div>

            <div>
              {alt.status === 'Active' ? (
                <button 
                  onClick={() => handleDismiss(alt.id)}
                  className="btn-secondary text-xs py-1 px-3 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                >
                  Mark Resolved
                </button>
              ) : (
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Resolved
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE ALERT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Broadcast Emergency Alert</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-4 text-xs">
              <div>
                <label className="cmd-label">Alert Header Title</label>
                <input 
                  required 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  placeholder="e.g. Critical Oxygen Supply Exhaustion" 
                  className="cmd-input" 
                />
              </div>

              <div>
                <label className="cmd-label">Severity Level</label>
                <select 
                  value={formData.severity} 
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })} 
                  className="cmd-input"
                >
                  <option value="Critical">Critical (Immediate Action Required)</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Warning">Warning</option>
                  <option value="Info">Info</option>
                </select>
              </div>

              <div>
                <label className="cmd-label">Detailed Alert Message</label>
                <textarea 
                  required 
                  rows={3} 
                  value={formData.message} 
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })} 
                  placeholder="Describe the emergency, area affected, or required action..." 
                  className="cmd-input" 
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)} 
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-md transition-all text-xs"
                >
                  {submitting ? 'Broadcasting...' : 'Broadcast Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
