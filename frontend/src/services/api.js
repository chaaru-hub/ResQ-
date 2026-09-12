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

// Local Storage Helpers for Citizen Reports & Areas Persistence Fallback
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
  getDisasters: () => request('/api/disasters').catch(() => ({ status: 'success', data: [] })),
  createDisaster: (data) => request('/api/disasters', { method: 'POST', body: JSON.stringify(data) }),
  updateDisaster: (id, data) => request(`/api/disasters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDisaster: (id) => request(`/api/disasters/${id}`, { method: 'DELETE' }),

  // Affected Areas
  getAreas: async () => {
    let serverAreas = [];
    try {
      const res = await request('/api/areas');
      serverAreas = res.data || [];
    } catch (e) {
      // Backend offline fallback
    }
    const localAreas = getStoredCitizenAreas();
    const map = new Map();
    [...localAreas, ...serverAreas].forEach(a => {
      if (a && a.id && !map.has(a.id)) {
        map.set(a.id, a);
      }
    });
    return { status: 'success', data: Array.from(map.values()) };
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
  getResources: () => request('/api/resources').catch(() => ({ status: 'success', data: [] })),
  createResource: (data) => request('/api/resources', { method: 'POST', body: JSON.stringify(data) }),
  updateResource: (id, data) => request(`/api/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Requests
  getRequests: () => request('/api/requests').catch(() => ({ status: 'success', data: [] })),
  createRequest: (data) => request('/api/requests', { method: 'POST', body: JSON.stringify(data) }),
  updateRequestStatus: (id, status) => request(`/api/requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Optimization & Allocations
  runOptimization: (weights = null) => request('/api/optimize', { method: 'POST', body: JSON.stringify(weights || {}) }),
  confirmAllocation: (run_id, allocations) => request('/api/allocate', { method: 'POST', body: JSON.stringify({ run_id, allocations }) }),
  getAllocations: () => request('/api/allocations').catch(() => ({ status: 'success', data: [] })),

  // Teams & Vehicles
  getRescueTeams: () => request('/api/teams').catch(() => ({ status: 'success', data: [] })),
  createRescueTeam: (data) => request('/api/teams', { method: 'POST', body: JSON.stringify(data) }),
  updateRescueTeam: (id, data) => request(`/api/teams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getVehicles: () => request('/api/vehicles').catch(() => ({ status: 'success', data: [] })),
  createVehicle: (data) => request('/api/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id, data) => request(`/api/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Analytics & Alerts
  getAnalytics: () => request('/api/analytics').catch(() => ({ summary: {} })),
  getAlerts: () => request('/api/alerts').catch(() => ({ status: 'success', data: [] })),
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
    } catch (e) {
      // Backend offline fallback
    }

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

    // Update local storage entry if present
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

    // Local Fallback Report Creation
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

    // Create local area entry
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
    return request(`/api/safe-locations${query}`).catch(() => ({ status: 'success', data: [] }));
  }
};

