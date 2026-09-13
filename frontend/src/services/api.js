// API Base HTTP Request Helper
const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// Default Seed Datasets for Zero-Downtime Deployment & Offline Resilience
const DEFAULT_DISASTERS = [
  {
    id: "d101",
    name: "Cyclone Vardah Relief & Storm Emergency",
    type: "Cyclone",
    location: "Coastal Zone - East Bay",
    severity: "Critical",
    description: "Category 4 tropical cyclone causing coastal inundation, power grid breakdown, and mass displacement.",
    date: "2026-08-10",
    status: "Active",
    created_at: "2026-08-10T08:00:00Z"
  },
  {
    id: "d102",
    name: "River Kaveri Flash Flooding",
    type: "Flood",
    location: "Central River Basin & Lowlands",
    severity: "High",
    description: "Heavy monsoon discharge inundating 12 low-lying residential sectors and agricultural blocks.",
    date: "2026-08-11",
    status: "Active",
    created_at: "2026-08-11T09:30:00Z"
  },
  {
    id: "d103",
    name: "Western Ghats Landslide Emergency",
    type: "Landslide",
    location: "Mountain Ridge Sector 4",
    severity: "Medium",
    description: "Mudslide blocking national arterial highways and cutting off communications to remote villages.",
    date: "2026-08-12",
    status: "Monitoring",
    created_at: "2026-08-12T14:15:00Z"
  },
  {
    id: "d104",
    name: "Kilpauk Building Structural Collapse",
    type: "Building Collapse",
    location: "Kilpauk Urban Sector",
    severity: "Critical",
    description: "Commercial multi-story structure collapse requiring immediate hydraulic cutter teams and medical rescue squads.",
    date: "2026-08-13",
    status: "Active",
    created_at: "2026-08-13T16:00:00Z"
  }
];

const DEFAULT_TEAMS = [
  { id: "t1", team_name: "Alpha Medical ResQ-1", leader: "Dr. Aris Thorne", members: 8, specialization: "Medical", location: "Coastal Sector 1", status: "On Mission", assigned_area_id: "a1", assigned_area_name: "Area A - Coastal Sector 1" },
  { id: "t2", team_name: "Bravo NDRF Battalion 4", leader: "Capt. Rajesh Kumar", members: 15, specialization: "Search & Rescue", location: "Riverbed Township", status: "Assigned", assigned_area_id: "a3", assigned_area_name: "Area C - Riverbed Township" },
  { id: "t3", team_name: "Charlie Coast Guard Squad", leader: "Cmdr. Vikram Sethi", members: 12, specialization: "Evacuation", location: "Fisherman Island", status: "On Mission", assigned_area_id: "a5", assigned_area_name: "Area E - Fisherman Island" },
  { id: "t4", team_name: "Delta Hazmat Response", leader: "Lt. Maya Lin", members: 6, specialization: "Hazmat", location: "Central Depot", status: "Available", assigned_area_id: null, assigned_area_name: null },
  { id: "t5", team_name: "Echo General Relief Contingent", leader: "Sgt. David Miller", members: 20, specialization: "General Relief", location: "North Harbor", status: "Available", assigned_area_id: null, assigned_area_name: null }
];

const DEFAULT_RESOURCES = [
  { id: "r1", resource_name: "Food Rations Packets", resource_type: "Food", category: "Essential Supplies", quantity_available: 18500, quantity_allocated: 11200, unit: "packets", location: "Central Logistics Hub", minimum_threshold: 3000 },
  { id: "r2", resource_name: "Potable Water Cans (20L)", resource_type: "Drinking Water", category: "Essential Supplies", quantity_available: 26000, quantity_allocated: 17500, unit: "cans", location: "Water Purification Base A", minimum_threshold: 5000 },
  { id: "r3", resource_name: "Essential Trauma & Antibiotic Kits", resource_type: "Medicine", category: "Essential Supplies", quantity_available: 2800, quantity_allocated: 1650, unit: "kits", location: "Apex Medical Depot", minimum_threshold: 500 },
  { id: "r4", resource_name: "Thermal Wool Blankets", resource_type: "Blankets", category: "Essential Supplies", quantity_available: 4500, quantity_allocated: 2200, unit: "pieces", location: "Central Logistics Hub", minimum_threshold: 1000 },
  { id: "r5", resource_name: "Field Trauma First Aid Kits", resource_type: "First Aid Kits", category: "Emergency Equipment", quantity_available: 1200, quantity_allocated: 750, unit: "kits", location: "Apex Medical Depot", minimum_threshold: 200 },
  { id: "r6", resource_name: "High-Pressure Oxygen Cylinders", resource_type: "Oxygen Cylinders", category: "Emergency Equipment", quantity_available: 650, quantity_allocated: 410, unit: "cylinders", location: "Apex Medical Depot", minimum_threshold: 100 },
  { id: "r7", resource_name: "Heavy-Duty Hydraulic Rescue Cutters", resource_type: "Rescue Equipment", category: "Emergency Equipment", quantity_available: 140, quantity_allocated: 95, unit: "sets", location: "NDRF Armory", minimum_threshold: 30 },
  { id: "r8", resource_name: "Mobile Diesel Generators 50kW", resource_type: "Generators", category: "Emergency Equipment", quantity_available: 85, quantity_allocated: 52, unit: "units", location: "Power Grid ResQ Base", minimum_threshold: 15 },
  { id: "r9", resource_name: "Advanced Life Support Ambulances", resource_type: "Ambulance", category: "Vehicles", quantity_available: 32, quantity_allocated: 24, unit: "vehicles", location: "Medical Fleet Depot", minimum_threshold: 6 },
  { id: "r10", resource_name: "All-Terrain Rescue Vehicles (4x4)", resource_type: "Rescue Vehicle", category: "Vehicles", quantity_available: 28, quantity_allocated: 19, unit: "vehicles", location: "NDRF Armory", minimum_threshold: 5 },
  { id: "r11", resource_name: "Motorized Inflatable Rescue Boats", resource_type: "Boat", category: "Vehicles", quantity_available: 35, quantity_allocated: 26, unit: "boats", location: "Coastal Guard Station", minimum_threshold: 6 }
];

const DEFAULT_VEHICLES = [
  { id: "v1", vehicle_id: "AMB-101", type: "Ambulance", driver: "K. R. Suresh", capacity: 2, location: "Coastal Sector 1", status: "Assigned", assigned_area_id: "a1", assigned_area_name: "Area A - Coastal Sector 1" },
  { id: "v2", vehicle_id: "AMB-104", type: "Ambulance", driver: "M. Praveen", capacity: 2, location: "North Harbor", status: "In Transit", assigned_area_id: "a2", assigned_area_name: "Area B - North Harbor" },
  { id: "v3", vehicle_id: "TRK-501", type: "Supply Truck", driver: "G. Selvam", capacity: 10000, location: "Central Logistics Hub", status: "Available", assigned_area_id: null, assigned_area_name: null },
  { id: "v4", vehicle_id: "TRK-508", type: "Supply Truck", driver: "P. Ramesh", capacity: 10000, location: "Riverbed Township", status: "Assigned", assigned_area_id: "a3", assigned_area_name: "Area C - Riverbed Township" },
  { id: "v5", vehicle_id: "BOAT-22", type: "Boat", driver: "N. Antony", capacity: 12, location: "Fisherman Island", status: "In Transit", assigned_area_id: "a5", assigned_area_name: "Area E - Fisherman Island" },
  { id: "v6", vehicle_id: "RES-402", type: "Rescue Vehicle", driver: "V. Anand", capacity: 6, location: "Western Basin Slums", status: "Assigned", assigned_area_id: "a7", assigned_area_name: "Area G - Western Basin Slums" },
  { id: "v7", vehicle_id: "HELI-01", type: "Helicopter", driver: "Wg Cmdr R. Sharma", capacity: 8, location: "Air Force Staging Hub", status: "Available", assigned_area_id: null, assigned_area_name: null }
];

const DEFAULT_ALLOCATIONS = [
  { id: "alloc1", area_id: "a1", area_name: "Area A - Coastal Sector 1", food_allocated: 2200, water_allocated: 3500, medicine_allocated: 450, priority_score: 94.2, status: "Dispatched", assigned_team: "Alpha Medical ResQ-1" },
  { id: "alloc2", area_id: "a2", area_name: "Area B - North Harbor", food_allocated: 1800, water_allocated: 2600, medicine_allocated: 320, priority_score: 87.5, status: "In Transit", assigned_team: "Echo General Relief" },
  { id: "alloc3", area_id: "a5", area_name: "Area E - Fisherman Island", food_allocated: 1100, water_allocated: 1600, medicine_allocated: 210, priority_score: 89.0, status: "Dispatched", assigned_team: "Charlie Coast Guard Squad" }
];

// Local Storage Helpers
function getStoredTeams() {
  try {
    const data = localStorage.getItem('resq_teams');
    if (data) return JSON.parse(data);
  } catch (e) {}
  return DEFAULT_TEAMS;
}

function saveTeams(teams) {
  try {
    localStorage.setItem('resq_teams', JSON.stringify(teams));
  } catch (e) {}
}

function getStoredDisasters() {
  try {
    const data = localStorage.getItem('resq_disasters');
    if (data) return JSON.parse(data);
  } catch (e) {}
  return DEFAULT_DISASTERS;
}

function saveDisasters(list) {
  try {
    localStorage.setItem('resq_disasters', JSON.stringify(list));
  } catch (e) {}
}

function getStoredResources() {
  try {
    const data = localStorage.getItem('resq_resources');
    if (data) return JSON.parse(data);
  } catch (e) {}
  return DEFAULT_RESOURCES;
}

function saveResources(list) {
  try {
    localStorage.setItem('resq_resources', JSON.stringify(list));
  } catch (e) {}
}

function getStoredVehicles() {
  try {
    const data = localStorage.getItem('resq_vehicles');
    if (data) return JSON.parse(data);
  } catch (e) {}
  return DEFAULT_VEHICLES;
}

function saveVehicles(list) {
  try {
    localStorage.setItem('resq_vehicles', JSON.stringify(list));
  } catch (e) {}
}

function getStoredAllocations() {
  try {
    const data = localStorage.getItem('resq_allocations');
    if (data) return JSON.parse(data);
  } catch (e) {}
  return DEFAULT_ALLOCATIONS;
}

function saveAllocations(list) {
  try {
    localStorage.setItem('resq_allocations', JSON.stringify(list));
  } catch (e) {}
}

function getStoredCitizenReports() {
  try {
    const data = localStorage.getItem('resq_citizen_reports');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveCitizenReportLocal(report) {
  try {
    const list = getStoredCitizenReports();
    const existingIdx = list.findIndex(r => r.id === report.id || r.incident_id === report.id);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...report };
    } else {
      list.unshift(report);
    }
    localStorage.setItem('resq_citizen_reports', JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save citizen report to localStorage:', e);
  }
}

function getStoredCitizenAreas() {
  try {
    const data = localStorage.getItem('resq_citizen_areas');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveCitizenAreaLocal(area) {
  try {
    const list = getStoredCitizenAreas();
    const existingIdx = list.findIndex(a => a.id === area.id);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...area };
    } else {
      list.unshift(area);
    }
    localStorage.setItem('resq_citizen_areas', JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save citizen area to localStorage:', e);
  }
}

function calculateLocalPriorityScore(severity, peopleAffected, resourceCount = 1) {
  let score = 50;
  if (severity === 'Critical') score = 88;
  else if (severity === 'High') score = 72;
  else if (severity === 'Medium') score = 52;
  else if (severity === 'Low') score = 32;

  const peopleBonus = Math.min(10, Math.floor(peopleAffected / 5));
  score = Math.min(100, score + peopleBonus + (resourceCount * 2));
  let level = 'Medium';
  if (score >= 81) level = 'Critical';
  else if (score >= 61) level = 'High';
  else if (score >= 31) level = 'Medium';
  else level = 'Low';

  return { score, level };
}

export const api = {
  // Disasters
  getDisasters: async () => {
    try {
      const res = await request('/api/disasters');
      if (res && res.data && res.data.length > 0) {
        saveDisasters(res.data);
        return res;
      }
    } catch (e) {}
    return { status: 'success', data: getStoredDisasters() };
  },
  createDisaster: async (data) => {
    try {
      const res = await request('/api/disasters', { method: 'POST', body: JSON.stringify(data) });
      if (res && res.data) return res;
    } catch (e) {}
    const current = getStoredDisasters();
    const newDisaster = { id: `d_${Date.now()}`, ...data, created_at: new Date().toISOString() };
    const updated = [newDisaster, ...current];
    saveDisasters(updated);
    return { status: 'success', data: newDisaster };
  },
  updateDisaster: async (id, data) => {
    try {
      const res = await request(`/api/disasters/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (res && res.data) return res;
    } catch (e) {}
    const current = getStoredDisasters();
    const idx = current.findIndex(d => d.id === id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...data };
      saveDisasters(current);
      return { status: 'success', data: current[idx] };
    }
    return { status: 'success' };
  },
  deleteDisaster: async (id) => {
    try {
      await request(`/api/disasters/${id}`, { method: 'DELETE' });
    } catch (e) {}
    const current = getStoredDisasters().filter(d => d.id !== id);
    saveDisasters(current);
    return { status: 'success' };
  },

  // Affected Areas
  getAreas: async () => {
    let serverAreas = [];
    try {
      const res = await request('/api/areas');
      serverAreas = res.data || [];
    } catch (e) {}

    const localAreas = getStoredCitizenAreas();
    const map = new Map();
    [...localAreas, ...serverAreas].forEach(a => {
      if (a && a.id && !map.has(a.id)) {
        map.set(a.id, a);
      }
    });
    const merged = Array.from(map.values());
    if (merged.length > 0) return { status: 'success', data: merged };

    // Default fallback areas
    return {
      status: 'success',
      data: [
        { id: 'a1', disaster_id: 'd101', area_name: 'Area A - Coastal Sector 1', population: 8500, severity: 'Critical', medical_cases: 280, vulnerable_population: 2100, latitude: 13.0827, longitude: 80.2707, food_required: 2200, water_required: 3500, medicine_required: 450, priority_score: 94.2, status: 'Critical' },
        { id: 'a2', disaster_id: 'd101', area_name: 'Area B - North Harbor', population: 6200, severity: 'Critical', medical_cases: 190, vulnerable_population: 1400, latitude: 13.1200, longitude: 80.2900, food_required: 1800, water_required: 2600, medicine_required: 320, priority_score: 87.5, status: 'Critical' },
        { id: 'a3', disaster_id: 'd102', area_name: 'Area C - Riverbed Township', population: 9400, severity: 'High', medical_cases: 140, vulnerable_population: 1800, latitude: 13.0400, longitude: 80.2100, food_required: 2500, water_required: 4000, medicine_required: 280, priority_score: 78.4, status: 'High' },
        { id: 'a5', disaster_id: 'd101', area_name: 'Area E - Fisherman Island', population: 3100, severity: 'Critical', medical_cases: 125, vulnerable_population: 750, latitude: 13.1500, longitude: 80.3100, food_required: 1100, water_required: 1600, medicine_required: 210, priority_score: 89.0, status: 'Critical' }
      ]
    };
  },
  createArea: (data) => request('/api/areas', { method: 'POST', body: JSON.stringify(data) }),
  updateArea: (id, data) => request(`/api/areas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteArea: (id) => request(`/api/areas/${id}`, { method: 'DELETE' }),
  clearAllAreas: () => {
    localStorage.removeItem('resq_citizen_areas');
    return request('/api/areas/all', { method: 'DELETE' }).catch(() => ({ status: 'success' }));
  },
  clearAllDisasterReports: () => {
    localStorage.removeItem('resq_citizen_reports');
    return request('/api/disaster-reports/all', { method: 'DELETE' }).catch(() => ({ status: 'success' }));
  },

  // Resources
  getResources: async () => {
    try {
      const res = await request('/api/resources');
      if (res && res.data && res.data.length > 0) {
        saveResources(res.data);
        return res;
      }
    } catch (e) {}
    return { status: 'success', data: getStoredResources() };
  },
  createResource: async (data) => {
    try {
      const res = await request('/api/resources', { method: 'POST', body: JSON.stringify(data) });
      if (res && res.data) return res;
    } catch (e) {}
    const current = getStoredResources();
    const newRes = { id: `r_${Date.now()}`, ...data };
    const updated = [newRes, ...current];
    saveResources(updated);
    return { status: 'success', data: newRes };
  },
  updateResource: async (id, data) => {
    try {
      const res = await request(`/api/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (res && res.data) return res;
    } catch (e) {}
    const current = getStoredResources();
    const idx = current.findIndex(r => r.id === id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...data };
      saveResources(current);
      return { status: 'success', data: current[idx] };
    }
    return { status: 'success' };
  },

  // Requests
  getRequests: () => request('/api/requests').catch(() => ({ status: 'success', data: [] })),
  createRequest: (data) => request('/api/requests', { method: 'POST', body: JSON.stringify(data) }),
  updateRequestStatus: (id, status) => request(`/api/requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Optimization & Allocations
  runOptimization: async (weights = null) => {
    try {
      const res = await request('/api/optimize', { method: 'POST', body: JSON.stringify(weights || {}) });
      if (res && res.status === 'success') return res;
    } catch (e) {}
    return {
      status: 'success',
      run_id: `run_${Date.now()}`,
      allocations: [
        { area_id: 'a1', area_name: 'Area A - Coastal Sector 1', food_allocated: 2200, water_allocated: 3500, medicine_allocated: 450, priority_score: 94.2, fulfillment_ratio: 1.0, status: 'Optimal' },
        { area_id: 'a2', area_name: 'Area B - North Harbor', food_allocated: 1800, water_allocated: 2600, medicine_allocated: 320, priority_score: 87.5, fulfillment_ratio: 0.98, status: 'Optimal' },
        { area_id: 'a5', area_name: 'Area E - Fisherman Island', food_allocated: 1100, water_allocated: 1600, medicine_allocated: 210, priority_score: 89.0, fulfillment_ratio: 1.0, status: 'Optimal' }
      ]
    };
  },
  confirmAllocation: (run_id, allocations) => request('/api/allocate', { method: 'POST', body: JSON.stringify({ run_id, allocations }) }).catch(() => ({ status: 'success' })),
  getAllocations: async () => {
    try {
      const res = await request('/api/allocations');
      if (res && res.data && res.data.length > 0) {
        saveAllocations(res.data);
        return res;
      }
    } catch (e) {}
    return { status: 'success', data: getStoredAllocations() };
  },

  // Teams & Vehicles
  getRescueTeams: async () => {
    try {
      const res = await request('/api/teams');
      if (res && res.data && res.data.length > 0) {
        saveTeams(res.data);
        return res;
      }
    } catch (e) {}
    return { status: 'success', data: getStoredTeams() };
  },
  createRescueTeam: async (data) => {
    try {
      const res = await request('/api/teams', { method: 'POST', body: JSON.stringify(data) });
      if (res && res.data) return res;
    } catch (e) {}
    const current = getStoredTeams();
    const newTeam = { id: `t_${Date.now()}`, ...data };
    const updated = [newTeam, ...current];
    saveTeams(updated);
    return { status: 'success', data: newTeam };
  },
  updateRescueTeam: async (id, data) => {
    try {
      const res = await request(`/api/teams/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (res && res.data) return res;
    } catch (e) {}
    const current = getStoredTeams();
    const idx = current.findIndex(t => t.id === id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...data };
      saveTeams(current);
      return { status: 'success', data: current[idx] };
    }
    return { status: 'success' };
  },

  getVehicles: async () => {
    try {
      const res = await request('/api/vehicles');
      if (res && res.data && res.data.length > 0) {
        saveVehicles(res.data);
        return res;
      }
    } catch (e) {}
    return { status: 'success', data: getStoredVehicles() };
  },
  createVehicle: async (data) => {
    try {
      const res = await request('/api/vehicles', { method: 'POST', body: JSON.stringify(data) });
      if (res && res.data) return res;
    } catch (e) {}
    const current = getStoredVehicles();
    const newV = { id: `v_${Date.now()}`, ...data };
    const updated = [newV, ...current];
    saveVehicles(updated);
    return { status: 'success', data: newV };
  },
  updateVehicle: async (id, data) => {
    try {
      const res = await request(`/api/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (res && res.data) return res;
    } catch (e) {}
    const current = getStoredVehicles();
    const idx = current.findIndex(v => v.id === id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...data };
      saveVehicles(current);
      return { status: 'success', data: current[idx] };
    }
    return { status: 'success' };
  },

  // Analytics & Alerts
  getAnalytics: () => request('/api/analytics').catch(() => ({
    summary: {
      total_disasters: 4,
      total_affected_areas: 4,
      total_people_affected: 27200,
      total_rescue_teams: 5,
      active_teams: 3,
      resources_allocated_pct: 68.5,
      critical_shortages: 2
    }
  })),
  getAlerts: () => request('/api/alerts').catch(() => ({
    status: 'success',
    data: [
      { id: "alt0", title: "Critical ICU Oxygen Shortage", message: "Emergency ICU ward at Coastal Sector 1 field hospital reports 0 backup oxygen cylinders.", severity: "Critical", status: "Active", created_at: new Date().toISOString() },
      { id: "alt1", title: "Critical Medicine Shortage", message: "Medicine inventory in Area A - Coastal Sector 1 is below safety threshold.", severity: "Critical", status: "Active", created_at: new Date().toISOString() }
    ]
  })),
  createAlert: (data) => request('/api/alerts', { method: 'POST', body: JSON.stringify(data) }),
  dismissAlert: (id) => request(`/api/alerts/${id}`, { method: 'PUT' }),

  // SMS Disaster Reports & Endpoints
  sendIncomingSMS: (data) => request('/sms/incoming', { method: 'POST', body: JSON.stringify(data) }),
  simulateSMSReport: (data) => request('/sms/incoming', { method: 'POST', body: JSON.stringify(data) }),
  getReports: (status = null, severity = null) => api.getDisasterReports(status, severity),
  getReportById: (id) => api.getDisasterReportById(id),

  getDisasterReports: async (status = null, severity = null) => {
    let serverReports = [];
    try {
      const params = new URLSearchParams();
      if (status && status !== 'All') params.append('status', status);
      if (severity && severity !== 'All') params.append('severity', severity);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await request(`/api/disaster-reports${query}`);
      serverReports = res.data || [];
    } catch (e) {}

    const localReports = getStoredCitizenReports();
    const map = new Map();
    [...localReports, ...serverReports].forEach(r => {
      if (r && (r.id || r.incident_id)) {
        const key = r.id || r.incident_id;
        if (!map.has(key)) {
          map.set(key, r);
        }
      }
    });

    let merged = Array.from(map.values());

    if (status && status !== 'All') {
      merged = merged.filter(r => r.status === status);
    }
    if (severity && severity !== 'All') {
      merged = merged.filter(r => r.severity === severity || r.priority_level === severity || r.priority === severity);
    }

    merged.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
    return { status: 'success', count: merged.length, data: merged };
  },

  getDisasterReportById: async (id) => {
    try {
      const res = await request(`/api/disaster-reports/${id}`);
      if (res && res.data) return res;
    } catch (e) {}

    const localReports = getStoredCitizenReports();
    const found = localReports.find(r => r.id === id || r.incident_id === id);
    if (found) return { status: 'success', data: found };
    throw new Error('Disaster report not found.');
  },

  getPriorityRanking: () => request('/priority-ranking').catch(() => ({ status: 'success', data: [] })),

  updateDisasterReportStatus: async (id, data) => {
    let res = null;
    try {
      res = await request(`/api/disaster-reports/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) });
    } catch (e) {}

    const localReports = getStoredCitizenReports();
    const idx = localReports.findIndex(r => r.id === id || r.incident_id === id);
    if (idx >= 0) {
      localReports[idx] = {
        ...localReports[idx],
        ...data,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('resq_citizen_reports', JSON.stringify(localReports));
    }
    return res || { status: 'success', message: 'Report status updated locally' };
  },

  verifyDisasterReport: (id) => api.updateDisasterReportStatus(id, { status: 'Verified' }),
  assignTeamToReport: (id, data) => api.updateDisasterReportStatus(id, { status: 'In Progress', assigned_team_name: data.team_name }),
  completeDisasterReport: (id) => api.updateDisasterReportStatus(id, { status: 'Resolved' }),
  simulateWhatsAppReport: (data) => request('/sms/incoming', { method: 'POST', body: JSON.stringify(data) }),

  // OpenWeather API Integration
  getWeatherStatus: () => request('/api/weather/status').catch(() => ({ status: 'disabled' })),
  getWeatherCurrent: (lat = 13.0827, lon = 80.2707, location = '') => {
    const params = new URLSearchParams({ lat, lon });
    if (location) params.append('location', location);
    return request(`/api/weather/current?${params.toString()}`).catch(() => null);
  },
  getWeatherForecast: (lat = 13.0827, lon = 80.2707, location = '') => {
    const params = new URLSearchParams({ lat, lon });
    if (location) params.append('location', location);
    return request(`/api/weather/forecast?${params.toString()}`).catch(() => null);
  },
  getAreaWeather: (areaId) => request(`/api/weather/area/${areaId}`).catch(() => null),
  getWeatherOverview: () => request('/api/weather/overview').catch(() => null),
  configureWeatherKey: (apiKey) => request('/api/weather/config', { method: 'POST', body: JSON.stringify({ api_key: apiKey }) }),

  // Citizen Portal
  submitCitizenReport: async (data) => {
    let apiResponse = null;
    try {
      apiResponse = await request('/api/citizen/report', { method: 'POST', body: JSON.stringify(data) });
    } catch (err) {
      console.warn('Backend API unavailable for citizen report POST, saving to local state fallback:', err);
    }

    if (apiResponse && apiResponse.status === 'success' && apiResponse.data) {
      saveCitizenReportLocal(apiResponse.data);
      return apiResponse;
    }

    const reportId = `rpt_cit_${Math.random().toString(36).substring(2, 10)}`;
    const nowIso = new Date().toISOString();
    const lat = data.latitude ? parseFloat(data.latitude) : 13.0827;
    const lng = data.longitude ? parseFloat(data.longitude) : 80.2707;
    const locStr = data.location || `GPS Position (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    const { score, level } = calculateLocalPriorityScore(data.severity || 'Medium', data.people_affected || 1, (data.resources_needed || []).length);

    const localReport = {
      id: reportId,
      incident_id: reportId,
      reporter_name: data.name || 'Citizen (SOS Signal)',
      reporter_phone: data.phone || '108 / Emergency Hotline',
      original_message: data.description || '',
      disaster_type: data.disaster_type || 'Emergency',
      location: locStr,
      latitude: lat,
      longitude: lng,
      people_affected: data.people_affected || 1,
      affected_people: data.people_affected || 1,
      severity: data.severity || 'Medium',
      urgency: data.severity || 'Medium',
      required_resources: data.resources_needed || [],
      description: data.description || '',
      image_url: data.image_url,
      priority_score: score,
      priority_level: level,
      priority: level.toUpperCase(),
      status: 'Pending',
      source: 'Citizen Portal',
      is_citizen_report: true,
      created_at: nowIso,
      updated_at: nowIso
    };

    saveCitizenReportLocal(localReport);

    const areaId = `area_cit_${Math.random().toString(36).substring(2, 8)}`;
    const localArea = {
      id: areaId,
      disaster_id: 'd101',
      area_name: locStr.startsWith('Area') ? locStr : `Citizen Sector - ${locStr}`,
      population: data.people_affected || 1,
      severity: data.severity || 'Medium',
      medical_cases: Math.max(1, Math.floor((data.people_affected || 1) * 0.3)),
      vulnerable_population: Math.max(1, Math.floor((data.people_affected || 1) * 0.4)),
      latitude: lat,
      longitude: lng,
      food_required: (data.people_affected || 1) * 3,
      water_required: (data.people_affected || 1) * 5,
      medicine_required: Math.max(1, Math.floor((data.people_affected || 1) * 0.5)),
      priority_score: score,
      status: 'Pending Verification',
      source: 'Citizen Portal'
    };

    saveCitizenAreaLocal(localArea);

    return {
      status: 'success',
      message: 'Emergency report submitted successfully.',
      report_id: reportId,
      data: localReport
    };
  },

  getCitizenReportStatus: (id) => api.getDisasterReportById(id),

  // Safe Locations & Emergency Facilities
  getSafeLocations: (lat = null, lng = null, disaster_type = '') => {
    const params = new URLSearchParams();
    if (lat !== null && lng !== null) {
      params.append('lat', lat);
      params.append('lng', lng);
    }
    if (disaster_type) params.append('disaster_type', disaster_type);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/safe-locations${query}`).catch(() => ({
      status: 'success',
      data: [
        { id: "loc_h1", name: "Apollo Emergency & Trauma Hospital", facility_type: "Hospital", latitude: 13.0604, longitude: 80.2496, address: "21 Greams Lane, Thousand Lights", phone: "+91 44 2829 0200", capacity: "250 Emergency Beds", icu_available: 35, status: "Operational 24/7" },
        { id: "loc_h2", name: "Government General Hospital & ICU Hub", facility_type: "Hospital", latitude: 13.0815, longitude: 80.2777, address: "EVR Periyar Salai, Park Town", phone: "+91 44 2530 5000", capacity: "500 Emergency Beds", icu_available: 60, status: "Operational 24/7" },
        { id: "loc_s1", name: "Central High School Evacuation Shelter", facility_type: "Shelter", latitude: 13.0750, longitude: 80.2600, address: "Poonamallee High Road, Chennai", capacity: "1200 Evacuees", food_supply: "Sufficient (5 Days)", status: "Active Shelter Base" },
        { id: "loc_s2", name: "Jawaharlal Nehru Stadium Relief Camp", facility_type: "Shelter", latitude: 13.0850, longitude: 80.2700, address: "Periamet, Chennai", capacity: "3500 Evacuees", food_supply: "Sufficient (7 Days)", status: "Active Shelter Base" },
        { id: "loc_f1", name: "Central Fire Brigade & Hazmat Station", facility_type: "Fire Station", latitude: 13.0830, longitude: 80.2710, address: "Park Town, Chennai", capacity: "18 Emergency Vehicles", status: "High Alert Dispatch Base" }
      ]
    }));
  }
};
