import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { ShieldCheck, UserCheck, Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginPage = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin.resq@gov.emergency');
  const [password, setPassword] = useState('••••••••••••');
  const [role, setRole] = useState('admin');

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password, role);
    if (onLoginSuccess) onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header Banner */}
        <div className="bg-slate-950 text-white p-6 text-center border-b border-slate-800 relative flex flex-col items-center">
          <div className="mb-3">
            <Logo size="lg" />
          </div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-300">Government Emergency Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Smart Disaster Resource Allocation System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="cmd-label">Select Command Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setRole('admin'); setEmail('admin.resq@gov.emergency'); }}
                className={`p-3 rounded-md border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  role === 'admin' 
                    ? 'bg-slate-800 text-white border-slate-900 ring-2 ring-blue-500' 
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Administrator</span>
              </button>

              <button
                type="button"
                onClick={() => { setRole('relief_coordinator'); setEmail('p.sharma@relief.gov.in'); }}
                className={`p-3 rounded-md border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  role === 'relief_coordinator' 
                    ? 'bg-slate-800 text-white border-slate-900 ring-2 ring-blue-500' 
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Relief Coordinator</span>
              </button>
            </div>
          </div>

          <div>
            <label className="cmd-label">Official Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input 
                required 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="cmd-input pl-9"
              />
            </div>
          </div>

          <div>
            <label className="cmd-label">Security Access Passcode</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input 
                required 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="cmd-input pl-9"
              />
            </div>
          </div>

          <button type="submit" className="w-full btn-primary py-3 font-bold text-sm">
            <span>Authenticate & Enter Command System</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Supabase Auth & Row Level Security (RLS) Protected Portal
        </div>
      </div>
    </div>
  );
};
