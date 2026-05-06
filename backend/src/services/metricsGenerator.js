// ─────────────────────────────────────────────────────────────────────────────
// Metrics Generator — Simulates realistic server metrics with time-of-day patterns
// Uses correlated signals: high RPS → high CPU → high latency → high cost
// ─────────────────────────────────────────────────────────────────────────────

let tickCount = 0;
let currentRps = 650;
let currentCpu = 58;
let currentError = 0.12;

// Track running/idle state for realistic active_servers count
const SERVER_FLEET_SIZE = 8; // matches the 8 simulated servers in dataStore

/**
 * Generate a single live metrics snapshot (called every 2s for WebSocket)
 */
export function generateLiveMetrics() {
  tickCount++;
  const now = Date.now();
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();

  // Time-of-day traffic pattern (peaks at 10am and 9pm IST)
  const timeMultiplier = 1 + 0.4 * Math.sin((hour - 6) * Math.PI / 12) + (hour === 21 ? 0.6 : 0) + (hour === 10 ? 0.25 : 0);

  // Smooth random walk with mean reversion
  currentRps    = clamp(currentRps  + (Math.random() - 0.48) * 25, 100, 2200);
  currentCpu    = clamp(currentCpu  + (Math.random() - 0.48) * 3,  8,   96);
  currentError  = clamp(currentError + (Math.random() - 0.5) * 0.05, 0, 2.5);

  // Memory correlates with load but moves more slowly (sticky allocations)
  const mem = clamp(50 + Math.sin(tickCount * 0.03) * 12 + (currentCpu / 100) * 20 + Math.random() * 5, 25, 94);

  // Network bandwidth correlates with RPS
  const net = clamp(currentRps * 0.12 + Math.random() * 10, 5, 300);

  // Active servers: scale up when CPU > 70, scale down when CPU < 30
  const activeServers = currentCpu > 75 ? 7 : currentCpu > 50 ? 6 : currentCpu > 30 ? 5 : 4;

  // Carbon: real formula based on PUE-adjusted power draw
  // PUE 1.2 × avg server power ~200W × active servers × grid intensity ~233 gCO₂/kWh
  const pue = 1.2;
  const power_kw = (currentCpu / 100) * 0.2 * activeServers * pue;
  const carbon_rate = +(power_kw * 0.233).toFixed(4); // kg CO₂/hr

  // Cost tracks with server count and instance types (mix of c6i + r6i + t3)
  const baseCostPerHr = 0.272 * 2 + 0.170 + 0.252 + 0.1008 + 0.034 + 0.0416; // sum of running servers
  const loadPremium = currentCpu > 80 ? 0.15 : 0;

  // Latency increases non-linearly with CPU load
  const latency = Math.round(45 + currentCpu * 1.8 + (currentCpu > 80 ? currentCpu * 0.8 : 0) + Math.random() * 20);

  return {
    ts:             now,
    rps:            Math.round(currentRps * timeMultiplier),
    cpu_avg:        +currentCpu.toFixed(1),
    memory_avg:     +mem.toFixed(1),
    network_mbps:   +net.toFixed(1),
    carbon_rate,
    active_servers: activeServers,
    total_servers:  SERVER_FLEET_SIZE,
    error_rate:     +currentError.toFixed(2),
    latency_p99:    latency,
    cost_per_hr:    +(baseCostPerHr + loadPremium).toFixed(3),
  };
}

/**
 * Generate historical time-series data for the last N hours
 */
export function generateHistoricalData(hours = 72) {
  const now = Date.now();
  const data = [];
  for (let i = hours * 6; i >= 0; i--) {
    const ts    = now - i * 600000; // 10-min intervals
    const hour  = new Date(ts).getHours();
    const base  = 500 + Math.sin((hour - 6) * Math.PI / 12) * 300;
    const spike = (hour === 21 ? 700 : 0) + (hour === 10 ? 300 : 0);
    const rps   = Math.round(base + spike + (Math.random() - 0.5) * 80);
    const cpu   = clamp(30 + (rps / 2200) * 60 + (Math.random() - 0.5) * 10, 5, 98);
    const mem   = clamp(40 + (rps / 2200) * 40 + (Math.random() - 0.5) * 8,  20, 95);
    const activeS = cpu > 75 ? 7 : cpu > 50 ? 6 : cpu > 30 ? 5 : 4;
    data.push({
      ts,
      rps:          Math.max(0, rps),
      cpu_avg:      +cpu.toFixed(1),
      memory_avg:   +mem.toFixed(1),
      network_mbps: +(rps * 0.1 + Math.random() * 5).toFixed(1),
      carbon_rate:  +(cpu / 100 * 0.2 * activeS * 1.2 * 0.233).toFixed(4),
      latency_p99:  Math.round(45 + cpu * 1.8 + Math.random() * 20),
    });
  }
  return data;
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}
