import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { StaggerContainer, StaggerItem } from '../components/PageContainer';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { BarChart3, TrendingUp, Users, CheckCircle, ShieldCheck } from 'lucide-react';

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.getAnalytics();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const summary = data?.summary || {
    coverage_rate: '87%',
    people_served: '41,200',
    requests_resolved_pct: '93%'
  };

  const charts = data?.charts || {};
  const COLORS = ['#dc2626', '#ea580c', '#d97706', '#16a34a'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Disaster Response Analytics & Telemetry</h2>
        <p className="text-xs text-slate-500">Real-time performance evaluation, allocation coverage rates, and resource distribution metrics</p>
      </motion.div>

      {/* KPI HIGHLIGHT CARDS WITH ANIMATED NUMBER COUNTERS */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" delay={0.1}>
        <StaggerItem>
          <div className="cmd-card border-l-4 border-l-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Overall Resource Coverage</p>
                <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">
                  <AnimatedNumber value={summary.coverage_rate} suffix="%" />
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Target benchmark: &gt; 80% coverage rate</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="cmd-card border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Estimated People Served</p>
                <h3 className="text-3xl font-extrabold text-blue-600 mt-1">
                  <AnimatedNumber value={summary.people_served} />
                </h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Across all 10 affected sectors</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="cmd-card border-l-4 border-l-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">Requests Resolution Rate</p>
                <h3 className="text-3xl font-extrabold text-purple-600 mt-1">
                  <AnimatedNumber value={summary.requests_resolved_pct} suffix="%" />
                </h3>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Approved & dispatched field requests</p>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* CHARTS GRID WITH VISUAL ANIMATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Demand vs Supply Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="cmd-card"
        >
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Resource Demand vs Allocated Supply</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.resource_breakdown || []}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Demanded" fill="#cbd5e1" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1000} />
                <Bar dataKey="Allocated" fill="#1e293b" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Severity Distribution Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="cmd-card"
        >
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Affected Areas Severity Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.severity_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  isAnimationActive={true}
                  animationDuration={1000}
                >
                  {(charts.severity_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* SYSTEM FORMULA EXPLANATION CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="cmd-card bg-slate-900 text-white border-slate-800"
      >
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Linear Programming Optimization Model Formula</h3>
        <p className="text-xs text-slate-300 mb-3">
          The Python PuLP Integer Linear Programming (ILP) solver maximizes survival relief coverage using the objective function:
        </p>
        <div className="bg-slate-950 p-4 rounded border border-slate-800 font-mono text-xs text-blue-300 overflow-x-auto">
          {"Max Sum( (PriorityScore_i)^2 * (Allocated_i,r / Demanded_i,r) ) subject to Inventory Limit Sum(Allocated_i,r) <= Total_r"}
        </div>
      </motion.div>
    </div>
  );
};
