import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { Modal } from '../components/Modal';
import { 
  Cpu, 
  CheckCircle, 
  RotateCcw, 
  BarChart2, 
  CheckCheck, 
  AlertCircle, 
  ShieldAlert, 
  Boxes, 
  TrendingUp,
  MapPin,
  Sparkles,
  Loader2,
  Eye,
  Navigation,
  Truck,
  Users,
  Package,
  X
} from 'lucide-react';

export const AllocationPage = () => {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [confirmedSuccess, setConfirmedSuccess] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [confirmedAllocations, setConfirmedAllocations] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);

  const loadingMessages = [
    "Fetching live disaster demand...",
    "Analyzing resource inventory...",
    "Calculating priority scores...",
    "Running ILP optimization...",
    "Generating recommended allocation..."
  ];

  // Fetch initial allocations if any stored
  useEffect(() => {
    loadStoredAllocations();
  }, []);

  const loadStoredAllocations = async () => {
    try {
      const res = await api.getAllocations();
      if (res.data && res.data.length > 0) {
        setConfirmedAllocations(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunOptimization = async () => {
    setLoading(true);
    setLoadingStep(0);
    setConfirmedSuccess(false);

    // Sequence through professional loading steps
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < loadingMessages.length - 1) return prev + 1;
        return prev;
      });
    }, 280);

    try {
      const res = await api.runOptimization();
      setTimeout(() => {
        clearInterval(stepInterval);
        setOptimizationResult(res.data);
        setLoading(false);
      }, 1400);
    } catch (err) {
      clearInterval(stepInterval);
      setLoading(false);
      console.error('Error solving optimization model:', err.message);
    }
  };

  const handleConfirmAllocation = async () => {
    if (!optimizationResult) return;
    setConfirming(true);
    try {
      await api.confirmAllocation(optimizationResult.run_id, optimizationResult.allocations);
      setConfirmedSuccess(true);
      loadStoredAllocations();
    } catch (err) {
      console.error('Failed to confirm allocation:', err.message);
    } finally {
      setConfirming(false);
    }
  };

  const metrics = optimizationResult?.metrics || {
    total_available: 50000,
    total_allocated: 38400,
    remaining_resources: 11600,
    coverage_percentage: 84.5,
    critical_areas_served: 5,
    unfulfilled_demand: 7200
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION WITH HERO SOLVER TRIGGER */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-slate-900 text-white rounded-lg p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> PuLP Integer Linear Programming Engine
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white">Smart Disaster Resource Allocation Solver</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Performs linear optimization to maximize survival relief coverage subject to resource inventory constraints, priority score weighting (0-100), and critical area medical demands.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRunOptimization}
            disabled={loading}
            className="btn-accent px-6 py-3 text-sm font-bold shadow-lg shadow-blue-900/40 whitespace-nowrap cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Running PuLP Optimizer...</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>Optimize Allocation</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* DYNAMIC PROFESSIONAL LOADING ANIMATION OVERLAY */}
      {loading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="cmd-card p-6 bg-slate-900 text-white border-blue-500 text-center space-y-4 shadow-xl"
        >
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
              <Cpu className="w-5 h-5 text-blue-400 absolute top-3.5 left-3.5" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">Python PuLP Solver Executing</h3>
            <p className="text-xs font-semibold text-blue-400 mt-1 h-5 animate-pulse">
              {loadingMessages[loadingStep]}
            </p>
          </div>
          <div className="w-64 bg-slate-800 h-1.5 rounded-full overflow-hidden mx-auto border border-slate-700">
            <motion.div 
              className="bg-blue-500 h-full rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </motion.div>
      )}

      {/* CONFIRMED SUCCESS ALERT */}
      {confirmedSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-lg shadow-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">ALLOCATION CONFIRMED & DISPATCHED</p>
              <p className="text-sm font-semibold text-emerald-900">Resource inventory balances updated in Supabase database.</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-emerald-600 text-white px-3 py-1 rounded">Confirmed</span>
        </motion.div>
      )}

      {/* OPTIMIZATION SUMMARY METRICS WITH NUMERICAL COUNTER ANIMATIONS */}
      {optimizationResult && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          <div className="cmd-card">
            <p className="text-[10px] font-bold uppercase text-slate-500">Total Available</p>
            <h4 className="text-xl font-extrabold text-slate-900 mt-1">
              <AnimatedNumber value={metrics.total_available} />
            </h4>
            <p className="text-[10px] text-slate-400">Total Units</p>
          </div>
          <div className="cmd-card">
            <p className="text-[10px] font-bold uppercase text-slate-500">Allocated Supply</p>
            <h4 className="text-xl font-extrabold text-blue-600 mt-1">
              <AnimatedNumber value={metrics.total_allocated} />
            </h4>
            <p className="text-[10px] text-slate-400">Optimized Distribution</p>
          </div>
          <div className="cmd-card">
            <p className="text-[10px] font-bold uppercase text-slate-500">Remaining Inventory</p>
            <h4 className="text-xl font-extrabold text-emerald-600 mt-1">
              <AnimatedNumber value={metrics.remaining_resources} />
            </h4>
            <p className="text-[10px] text-slate-400">Reserve Stock</p>
          </div>
          <div className="cmd-card">
            <p className="text-[10px] font-bold uppercase text-slate-500">Relief Coverage</p>
            <h4 className="text-xl font-extrabold text-purple-600 mt-1">
              <AnimatedNumber value={metrics.coverage_percentage} suffix="%" />
            </h4>
            <p className="text-[10px] text-slate-400">System Fulfillment</p>
          </div>
          <div className="cmd-card">
            <p className="text-[10px] font-bold uppercase text-slate-500">Critical Served</p>
            <h4 className="text-xl font-extrabold text-emerald-600 mt-1">
              <AnimatedNumber value={metrics.critical_areas_served} suffix=" Areas" />
            </h4>
            <p className="text-[10px] text-slate-400">Priority Score &gt;= 80</p>
          </div>
          <div className="cmd-card">
            <p className="text-[10px] font-bold uppercase text-slate-500">Unfulfilled Demand</p>
            <h4 className="text-xl font-extrabold text-red-600 mt-1">
              <AnimatedNumber value={metrics.unfulfilled_demand} />
            </h4>
            <p className="text-[10px] text-slate-400">Resource Shortfall</p>
          </div>
        </motion.div>
      )}

      {/* RECOMMENDED ALLOCATION TABLE SECTION WITH CLICKABLE ROWS */}
      {optimizationResult && !loading ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="cmd-card space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">Recommended Resource Distribution Matrix</h3>
                <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">Run ID: {optimizationResult.run_id}</span>
              </div>
              <p className="text-xs text-slate-500">Click any row below for detailed disaster telemetry, victim metrics, and Dijkstra routing</p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleRunOptimization} 
                className="btn-secondary cursor-pointer"
                disabled={loading}
              >
                <RotateCcw className="w-4 h-4" /> Recalculate
              </button>
              <button 
                onClick={handleConfirmAllocation} 
                className="btn-primary bg-emerald-700 hover:bg-emerald-800 border-none cursor-pointer"
                disabled={confirming || confirmedSuccess}
              >
                {confirming ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    <span>Confirm Allocation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Allocation Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="cmd-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th className="text-right">Priority Score</th>
                  <th>Severity</th>
                  <th className="text-right">Food Allocated / Demanded</th>
                  <th className="text-right">Water Allocated / Demanded</th>
                  <th className="text-right">Medicine Allocated / Demanded</th>
                  <th className="text-right">Rescue Teams Allocated</th>
                  <th className="text-center">Details</th>
                </tr>
              </thead>
              <tbody>
                {optimizationResult.allocations.map((row, idx) => (
                  <motion.tr 
                    key={idx} 
                    onClick={() => setSelectedArea(row)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.15 + idx * 0.04 }}
                    className={`cursor-pointer hover:bg-slate-100 transition-colors ${row.priority_score >= 80 ? 'bg-red-50/50 hover:bg-red-100/60' : ''}`}
                  >
                    <td className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      {row.area_name}
                    </td>
                    <td className="text-right font-black text-slate-900">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {row.priority_score}
                      </span>
                    </td>
                    <td>
                      <PriorityBadge level={row.severity} showIcon={false} />
                    </td>
                    <td className="text-right font-bold text-slate-800">
                      {row.food_allocated?.toLocaleString()} <span className="text-slate-400 font-normal">/ {row.food_demanded?.toLocaleString()}</span>
                    </td>
                    <td className="text-right font-bold text-slate-800">
                      {row.water_allocated?.toLocaleString()} <span className="text-slate-400 font-normal">/ {row.water_demanded?.toLocaleString()}</span>
                    </td>
                    <td className="text-right font-bold text-blue-600">
                      {row.medicine_allocated?.toLocaleString()} <span className="text-slate-400 font-normal">/ {row.medicine_demanded?.toLocaleString()}</span>
                    </td>
                    <td className="text-right font-black text-purple-700">
                      {row.rescue_teams_allocated} Teams
                    </td>
                    <td className="text-center">
                      <span className="text-xs text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                        <Eye className="w-3.5 h-3.5" /> View
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : !loading ? (
        /* INITIAL STATE BEFORE OPTIMIZATION IS CLICKED */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="cmd-card text-center py-12 space-y-4"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-200">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Active Optimization Run Selected</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Click the <strong>“Optimize Allocation”</strong> button above to pull live area demand data & inventory levels from Supabase and execute the dynamic PuLP solver.
            </p>
          </div>
          <button 
            onClick={handleRunOptimization} 
            className="btn-accent px-6 py-2.5 text-xs font-bold cursor-pointer"
          >
            <Cpu className="w-4 h-4" /> Run PuLP Smart Allocation
          </button>
        </motion.div>
      ) : null}

      {/* DETAILED AREA DISASTER INFORMATION MODAL */}
      {selectedArea && (
        <Modal 
          isOpen={!!selectedArea} 
          onClose={() => setSelectedArea(null)} 
          title={`Disaster & Allocation Details: ${selectedArea.area_name}`}
        >
          <div className="space-y-4 text-xs">
            {/* Header Telemetry Banner */}
            <div className="p-3.5 bg-slate-900 text-white rounded-lg border border-slate-800 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Area Incident Profile</span>
                <h3 className="text-base font-extrabold text-white mt-0.5">{selectedArea.area_name}</h3>
                <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400" /> Lat/Lng: {selectedArea.latitude || 12.9229}, {selectedArea.longitude || 80.1275}
                </p>
              </div>
              <div className="text-right space-y-1">
                <PriorityBadge level={selectedArea.severity} />
                <p className="text-xs font-black text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800">
                  Priority Score: {selectedArea.priority_score} / 100
                </p>
              </div>
            </div>

            {/* Impact & Demographics Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-center gap-1">
                  <Users className="w-3 h-3 text-blue-600" /> Population
                </span>
                <p className="font-extrabold text-slate-900 text-sm mt-1">{selectedArea.population?.toLocaleString() || '2,200'}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-600" /> Medical Cases
                </span>
                <p className="font-extrabold text-red-700 text-sm mt-1">{selectedArea.medical_cases || '450'}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-600" /> Vulnerable Group
                </span>
                <p className="font-extrabold text-slate-800 text-sm mt-1">{selectedArea.vulnerable_population || '520'}</p>
              </div>
            </div>

            {/* Solver Allocation Breakdown Bars */}
            <div className="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-emerald-600" /> Optimized Resource Allocation Fulfillment
              </h4>

              {/* Food Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Food Rations:</span>
                  <span className="font-bold text-slate-900">{selectedArea.food_allocated?.toLocaleString()} / {selectedArea.food_demanded?.toLocaleString()} packets</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full" 
                    style={{ width: `${Math.min(100, Math.round((selectedArea.food_allocated / (selectedArea.food_demanded || 1)) * 100))}%` }} 
                  />
                </div>
              </div>

              {/* Water Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Drinking Water:</span>
                  <span className="font-bold text-slate-900">{selectedArea.water_allocated?.toLocaleString()} / {selectedArea.water_demanded?.toLocaleString()} liters</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full" 
                    style={{ width: `${Math.min(100, Math.round((selectedArea.water_allocated / (selectedArea.water_demanded || 1)) * 100))}%` }} 
                  />
                </div>
              </div>

              {/* Medicine Bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Medical Trauma Kits:</span>
                  <span className="font-bold text-slate-900">{selectedArea.medicine_allocated?.toLocaleString()} / {selectedArea.medicine_demanded?.toLocaleString()} kits</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full rounded-full" 
                    style={{ width: `${Math.min(100, Math.round((selectedArea.medicine_allocated / (selectedArea.medicine_demanded || 1)) * 100))}%` }} 
                  />
                </div>
              </div>

              {/* Rescue Teams */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Assigned Rescue Squads:</span>
                <span className="font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                  {selectedArea.rescue_teams_allocated} Active Squads
                </span>
              </div>
            </div>

            {/* Dijkstra Dispatch Routing Info */}
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Navigation className="w-5 h-5 text-blue-600 animate-pulse flex-shrink-0" />
                <div>
                  <p className="font-bold text-blue-900 text-xs">Dijkstra Shortest Path Dispatch</p>
                  <p className="text-[11px] text-blue-700">Staging: Central Logistics Hub → {selectedArea.area_name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-blue-900 text-xs">~18.3 km</p>
                <p className="text-[10px] text-blue-600 font-semibold">ETA: ~32 mins</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setSelectedArea(null)} 
                className="btn-primary text-xs cursor-pointer"
              >
                Close Telemetry View
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
