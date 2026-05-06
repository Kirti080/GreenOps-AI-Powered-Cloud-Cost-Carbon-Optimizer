import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 8000,
});

export const fetchMetrics      = () => api.get('/metrics').then(r => r.data);
export const fetchForecast     = () => api.get('/forecast').then(r => r.data);
export const fetchSustainability = () => api.get('/sustainability').then(r => r.data);
export const fetchHistory      = (hours = 24) => api.get(`/history?hours=${hours}`).then(r => r.data);
export const fetchAlerts       = () => api.get('/alerts').then(r => r.data);
export const fetchServers      = () => api.get('/servers').then(r => r.data);
export const scaleServer       = (id: string, action: 'up'|'down'|'terminate') =>
  api.post(`/servers/${id}/scale`, { action }).then(r => r.data);

// ── Real Server Monitoring APIs ──────────────────────────────────────────────
export const fetchRealSnapshot   = () => api.get('/real/snapshot').then(r => r.data);
export const fetchRealCpu        = () => api.get('/real/cpu').then(r => r.data);
export const fetchRealMemory     = () => api.get('/real/memory').then(r => r.data);
export const fetchRealDisk       = () => api.get('/real/disk').then(r => r.data);
export const fetchRealNetwork    = () => api.get('/real/network').then(r => r.data);
export const fetchRealPing       = () => api.get('/real/ping').then(r => r.data);
export const fetchRealCarbon     = () => api.get('/real/carbon').then(r => r.data);
export const fetchRealSystem     = () => api.get('/real/system').then(r => r.data);

export const WS_URL = BASE.replace(/^http/, 'ws');
