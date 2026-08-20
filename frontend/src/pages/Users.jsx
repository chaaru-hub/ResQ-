import React from 'react';
import { useAuth, DEFAULT_ADMIN_USER, DEFAULT_COORDINATOR_USER } from '../context/AuthContext';
import { Users, ShieldCheck, UserCheck, Key, UserPlus } from 'lucide-react';

export const UsersPage = () => {
  const { user, switchRole, isAdmin } = useAuth();

  const userList = [
    DEFAULT_ADMIN_USER,
    DEFAULT_COORDINATOR_USER,
    {
      id: 'usr-coord-03',
      name: 'Dr. Michael Chang',
      email: 'm.chang@medical.resq.org',
      role: 'relief_coordinator',
      agency: 'Apex Medical Staging Unit',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
    },
    {
      id: 'usr-admin-04',
      name: 'Director Sarah Jenkins',
      email: 's.jenkins@ndma.gov.in',
      role: 'admin',
      agency: 'National Crisis Command',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Personnel & Access Control Management</h2>
          <p className="text-xs text-slate-500">Manage administrator roles, relief coordinators, and Supabase RBAC permissions</p>
        </div>
      </div>

      {/* User Table */}
      <div className="cmd-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cmd-table">
            <thead>
              <tr>
                <th>Personnel Name</th>
                <th>Email Address</th>
                <th>Department / Agency</th>
                <th>Role Level</th>
                <th>Status</th>
                <th className="text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody>
              {userList.map((u) => (
                <tr key={u.id}>
                  <td className="font-bold text-slate-900 flex items-center gap-2">
                    <img src={u.avatar} alt="User Avatar" className="w-7 h-7 rounded-full border object-cover" />
                    {u.name}
                  </td>
                  <td>{u.email}</td>
                  <td className="text-slate-600">{u.agency}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {u.role === 'admin' ? 'Administrator' : 'Relief Coordinator'}
                    </span>
                  </td>
                  <td>
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-semibold">Active Session</span>
                  </td>
                  <td className="text-right">
                    <button 
                      onClick={() => switchRole(u.role === 'admin' ? 'relief_coordinator' : 'admin')}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Toggle Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
