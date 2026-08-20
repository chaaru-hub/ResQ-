const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Disasters
  getDisasters: () => request('/api/disasters'),
  createDisaster: (data) => request('/api/disasters', { method: 'POST', body: JSON.stringify(data) }),
  updateDisaster: (id, data) => request(`/api/disasters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDisaster: (id) => request(`/api/disasters/${id}`, { method: 'DELETE' }),

  // Affected Areas
  getAreas: () => request('/api/areas'),
  createArea: (data) => request('/api/areas', { method: 'POST', body: JSON.stringify(data) }),
  updateArea: (id, data) => request(`/api/areas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteArea: (id) => request(`/api/areas/${id}`, { method: 'DELETE' }),

  // Resources
  getResources: () => request('/api/resources'),
  createResource: (data) => request('/api/resources', { method: 'POST', body: JSON.stringify(data) }),
  updateResource: (id, data) => request(`/api/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Requests
  getRequests: () => request('/api/requests'),
  createRequest: (data) => request('/api/requests', { method: 'POST', body: JSON.stringify(data) }),
  updateRequestStatus: (id, status) => request(`/api/requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Optimization & Allocations
  runOptimization: (weights = null) => request('/api/optimize', { method: 'POST', body: JSON.stringify(weights || {}) }),
  confirmAllocation: (run_id, allocations) => request('/api/allocate', { method: 'POST', body: JSON.stringify({ run_id, allocations }) }),
  getAllocations: () => request('/api/allocations'),

  // Teams & Vehicles
  getRescueTeams: () => request('/api/teams'),
  createRescueTeam: (data) => request('/api/teams', { method: 'POST', body: JSON.stringify(data) }),
  updateRescueTeam: (id, data) => request(`/api/teams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getVehicles: () => request('/api/vehicles'),
  createVehicle: (data) => request('/api/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id, data) => request(`/api/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Analytics & Alerts
  getAnalytics: () => request('/api/analytics'),
  getAlerts: () => request('/api/alerts'),
  createAlert: (data) => request('/api/alerts', { method: 'POST', body: JSON.stringify(data) }),
  dismissAlert: (id) => request(`/api/alerts/${id}`, { method: 'PUT' }),

  // WhatsApp Disaster Reports
  getDisasterReports: (status = null, severity = null) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/disaster-reports${query}`);
  },
  getDisasterReportById: (id) => request(`/api/disaster-reports/${id}`),
  updateDisasterReportStatus: (id, data) => request(`/api/disaster-reports/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  verifyDisasterReport: (id) => request(`/api/disaster-reports/${id}/verify`, { method: 'POST' }),
  assignTeamToReport: (id, data) => request(`/api/disaster-reports/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  completeDisasterReport: (id) => request(`/api/disaster-reports/${id}/complete`, { method: 'POST' }),
  simulateWhatsAppReport: (data) => request('/api/disaster-reports/simulate', { method: 'POST', body: JSON.stringify(data) }),
};

