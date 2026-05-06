import { create } from 'zustand';

export interface LiveMetrics {
  ts: number;
  rps: number;
  cpu_avg: number;
  memory_avg: number;
  network_mbps: number;
  carbon_rate: number;
  active_servers: number;
  total_servers: number;
  error_rate: number;
  latency_p99: number;
  cost_per_hr: number;
  real_memory_gb?: number;
  total_memory_gb?: number;
  is_real?: boolean;
}

export interface HistoryPoint {
  ts: number;
  rps: number;
  cpu_avg: number;
  memory_avg: number;
  network_mbps: number;
  carbon_rate: number;
  latency_p99: number;
}

export interface ForecastPoint {
  ts: number;
  predicted_rps: number;
  confidence_low: number;
  confidence_high: number;
  recommended_servers: number;
}

export interface Server {
  id: string;
  name: string;
  region: string;
  zone?: string;
  type: string;
  provider?: string;
  status: 'running' | 'idle' | 'terminated';
  cpu: number;
  memory: number;
  cost_hr: number;
  carbon_hr: number;
  is_real?: boolean;
  os?: string;
  arch?: string;
  uptime_hours?: number;
  ip?: string;
  public_ip?: string;
  launch_time?: string;
  tags?: string[];
  vcpus?: number;
  memory_gb?: number;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  server: string;
  ts: number;
}

interface GreenOpsStore {
  // Live metrics
  metrics: LiveMetrics | null;
  metricsHistory: LiveMetrics[];
  setMetrics: (m: LiveMetrics) => void;

  // Data
  servers: Server[];
  alerts: Alert[];
  wsConnected: boolean;

  setServers: (s: Server[]) => void;
  setAlerts: (a: Alert[]) => void;
  setWsConnected: (v: boolean) => void;
  updateServer: (id: string, patch: Partial<Server>) => void;
}

export const useStore = create<GreenOpsStore>((set) => ({
  metrics: null,
  metricsHistory: [],
  servers: [],
  alerts: [],
  wsConnected: false,

  setMetrics: (m) =>
    set((s) => ({
      metrics: m,
      metricsHistory: [...s.metricsHistory.slice(-60), m], // keep last 60 ticks (2 min)
    })),

  setServers: (servers) => set({ servers }),
  setAlerts:  (alerts)  => set({ alerts }),
  setWsConnected: (v)   => set({ wsConnected: v }),
  updateServer: (id, patch) =>
    set((s) => ({
      servers: s.servers.map((sv) => (sv.id === id ? { ...sv, ...patch } : sv)),
    })),
}));
