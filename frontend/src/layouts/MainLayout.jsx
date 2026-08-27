import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { 
  LayoutDashboard, 
  Flame, 
  MapPin, 
  Boxes, 
  Cpu, 
  FileText, 
  Users2, 
  Truck, 
  Map as MapIcon, 
  BarChart3, 
  Bell, 
  Users, 
  Settings, 
  LogOut, 
  Search, 
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  CloudSun
} from 'lucide-react';

export const MainLayout = ({ activeTab, setActiveTab, children }) => {
  const { user, logout, switchRole, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'citizen-reports', label: 'Citizen Reports', icon: ShieldAlert, highlight: true },
    { id: 'weather', label: 'OpenWeather Insights', icon: CloudSun, highlight: true },
    { id: 'sms', label: 'SMS Disaster Reports', icon: MessageSquare, highlight: true },
    { id: 'disasters', label: 'Disaster Management', icon: Flame },
    { id: 'resources', label: 'Resource Management', icon: Boxes },
    { id: 'allocation', label: 'Allocation Center', icon: Cpu, highlight: true },
    { id: 'teams', label: 'Rescue Teams', icon: Users2 },
    { id: 'map', label: 'Disaster Map', icon: MapIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const pageTitleMap = {
    dashboard: 'Disaster Command Center Dashboard',
    'citizen-reports': 'Citizen Emergency Ingestion & Priority Management',
    weather: 'OpenWeather Emergency Intelligence Center',
    sms: 'SMS Disaster Ingestion & Emergency Reporting Hub',
    disasters: 'Disaster Incident & Event Management',
    resources: 'Emergency Resource & Inventory Management',
    allocation: 'Smart Resource Allocation & Priority Optimization',
    teams: 'Rescue Teams & Search Squad Deployment',
    map: 'Interactive Tactical Disaster Map',
    settings: 'System Configuration & Admin Preferences'
  };


  return (
    <div className="h-screen w-full flex bg-slate-50 text-slate-900 overflow-hidden">
      {/* FIXED SIDEBAR (STAYS STATIONARY WHEN PAGE SCROLLS) */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } h-screen sticky top-0 left-0 bg-slate-900 text-white flex flex-col flex-shrink-0 border-r border-slate-800 z-30 transition-[width] duration-200 ease-in-out will-change-[width] relative select-none`}
      >
        {/* FLOATING EXPAND TAB (Visible when collapsed) */}
        {!sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            title="Open Sidebar Menu"
            className="absolute -right-3.5 top-5 z-50 bg-blue-600 hover:bg-blue-500 text-white p-1 rounded-full shadow-lg border-2 border-slate-900 transition-transform transform hover:scale-110 cursor-pointer flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 font-bold" />
          </button>
        )}

        {/* Brand Header */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between overflow-hidden">
          <Logo size="md" showText={sidebarOpen} />
          {sidebarOpen ? (
            <button 
              onClick={() => setSidebarOpen(false)}
              title="Collapse Sidebar"
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={() => setSidebarOpen(true)}
              title="Open Navigation Menu"
              className="p-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dynamic Allocation Callout Button */}
        <div className="p-2.5 border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('allocation')}
            title="Smart Allocation"
            className={`w-full py-2 px-2.5 rounded-md font-semibold text-xs flex items-center justify-between shadow-sm transition-all whitespace-nowrap overflow-hidden ${
              activeTab === 'allocation' 
                ? 'bg-blue-600 text-white ring-2 ring-blue-400' 
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mx-auto sm:mx-0 truncate">
              <Cpu className="w-4 h-4 text-blue-400 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">Smart Allocation</span>}
            </div>
            {sidebarOpen && <ChevronRight className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />}
          </button>
        </div>

        {/* Navigation Menu (Smooth high-performance rendering) */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap overflow-hidden ${
                  isActive 
                    ? 'bg-slate-800 text-white font-semibold border-l-4 border-blue-500' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 mx-auto sm:mx-0 truncate">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </div>
                {sidebarOpen && item.id === 'alerts' && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold flex-shrink-0">4</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Role Switcher (Permanently Docked at Bottom) */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 mt-auto flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5 overflow-hidden">
            <div className="flex items-center gap-2 truncate">
              <img 
                src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'} 
                alt="Avatar" 
                className="w-7 h-7 rounded-full border border-slate-700 object-cover flex-shrink-0"
              />
              {sidebarOpen && (
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Administrator'}</p>
                  <p className="text-[10px] text-slate-400 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button 
                onClick={logout}
                title="Logout" 
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {sidebarOpen && (
            <div className="flex items-center justify-between text-[11px] bg-slate-900 border border-slate-800 p-1.5 rounded truncate">
              <span className="text-slate-400 text-[10px]">Role:</span>
              <button 
                onClick={() => switchRole(isAdmin ? 'relief_coordinator' : 'admin')}
                className="text-blue-400 hover:underline font-medium text-[10px] flex items-center gap-1 truncate"
              >
                {isAdmin ? <ShieldCheck className="w-3 h-3 flex-shrink-0" /> : <UserCheck className="w-3 h-3 flex-shrink-0" />}
                <span>{isAdmin ? 'Admin' : 'Coordinator'} (Switch)</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP NAVIGATION BAR */}
        <header className="bg-white border-b border-slate-200 h-16 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-20 shadow-xs">
          {/* Sidebar Toggle & Page Title */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`px-3 py-1.5 rounded-md font-extrabold text-xs flex items-center gap-2 transition-all shadow-sm ${
                !sidebarOpen 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-300 animate-pulse' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
              }`}
              title={sidebarOpen ? "Collapse Navigation Sidebar" : "Open Navigation Sidebar"}
            >
              {!sidebarOpen ? (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-white" />
                  <span>OPEN MENU</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 text-slate-300" />
                  <span>COLLAPSE</span>
                </>
              )}
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {pageTitleMap[activeTab] || 'Emergency Response Command Center'}
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block">Government Disaster Management Authority System</p>
            </div>
          </div>

          {/* Center Search & Actions */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-56 hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search disasters, areas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cmd-input pl-9 py-1.5 text-xs bg-slate-50 border-slate-200"
              />
            </div>

            {/* Emergency Live Indicator */}
            <div className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span className="hidden sm:inline">LIVE RESPONSE</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-md shadow-lg py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100 font-bold text-slate-800 flex justify-between">
                    <span>Recent System Notifications</span>
                    <span className="text-blue-600 cursor-pointer font-normal" onClick={() => setActiveTab('alerts')}>View All</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    <div className="p-3 hover:bg-slate-50 cursor-pointer" onClick={() => { setActiveTab('alerts'); setNotificationsOpen(false); }}>
                      <p className="font-semibold text-red-600">Critical Shortage in Area A</p>
                      <p className="text-slate-500 text-[11px]">Medicine inventory below threshold.</p>
                    </div>
                    <div className="p-3 hover:bg-slate-50 cursor-pointer" onClick={() => { setActiveTab('requests'); setNotificationsOpen(false); }}>
                      <p className="font-semibold text-slate-800">New Emergency Request</p>
                      <p className="text-slate-500 text-[11px]">Oxygen cylinders requested for Field Hospital.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile Snippet */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200">
              <img 
                src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-slate-300 object-cover"
              />
              <div className="text-xs">
                <p className="font-bold text-slate-800 leading-none">{user?.name?.split(' ')[1] || 'Vance'}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">{user?.role === 'admin' ? 'Admin' : 'Coordinator'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER WITH SMOOTH PAGE TRANSITIONS */}
        <main className="flex-1 overflow-y-auto p-4 bg-slate-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
