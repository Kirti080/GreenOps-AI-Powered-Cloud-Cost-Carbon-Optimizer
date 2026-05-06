// ─────────────────────────────────────────────────────────────────────────────
// Data Store — JSON File-based persistence with realistic production data
// ─────────────────────────────────────────────────────────────────────────────
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateHistoricalData } from './metricsGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

const FILES = {
  servers:  path.join(DATA_DIR, 'servers.json'),
  history:  path.join(DATA_DIR, 'history.json'),
  alerts:   path.join(DATA_DIR, 'alerts.json'),
  forecast: path.join(DATA_DIR, 'forecast.json'),
  sustainability: path.join(DATA_DIR, 'sustainability.json'),
};

// ── Realistic Production Server Fleet ────────────────────────────────────────
const defaultServers = [
  {
    id: 's1',
    name: 'prod-api-us-east-01',
    region: 'us-east-1',
    zone: 'us-east-1a',
    type: 'c6i.2xlarge',
    provider: 'AWS',
    status: 'running',
    cpu: 72,
    memory: 68,
    cost_hr: 0.272,
    carbon_hr: 0.048,
    ip: '10.0.12.34',
    public_ip: '54.210.147.83',
    launch_time: new Date(Date.now() - 42 * 86400000).toISOString(), // 42 days ago
    uptime_hours: +(42 * 24).toFixed(0),
    os: 'Amazon Linux 2023',
    arch: 'x86_64',
    tags: ['production', 'api', 'auto-scaling-group', 'tier-1'],
    vcpus: 8,
    memory_gb: 16,
  },
  {
    id: 's2',
    name: 'prod-api-us-east-02',
    region: 'us-east-1',
    zone: 'us-east-1b',
    type: 'c6i.2xlarge',
    provider: 'AWS',
    status: 'running',
    cpu: 45,
    memory: 52,
    cost_hr: 0.272,
    carbon_hr: 0.048,
    ip: '10.0.12.87',
    public_ip: '54.210.152.19',
    launch_time: new Date(Date.now() - 42 * 86400000).toISOString(),
    uptime_hours: +(42 * 24).toFixed(0),
    os: 'Amazon Linux 2023',
    arch: 'x86_64',
    tags: ['production', 'api', 'auto-scaling-group', 'tier-1'],
    vcpus: 8,
    memory_gb: 16,
  },
  {
    id: 's3',
    name: 'prod-worker-us-west-01',
    region: 'us-west-2',
    zone: 'us-west-2a',
    type: 'c5.xlarge',
    provider: 'AWS',
    status: 'running',
    cpu: 88,
    memory: 79,
    cost_hr: 0.170,
    carbon_hr: 0.024,
    ip: '10.1.5.112',
    public_ip: '35.167.42.198',
    launch_time: new Date(Date.now() - 18 * 86400000).toISOString(),
    uptime_hours: +(18 * 24).toFixed(0),
    os: 'Ubuntu 22.04 LTS',
    arch: 'x86_64',
    tags: ['production', 'worker', 'background-jobs', 'high-load'],
    vcpus: 4,
    memory_gb: 8,
  },
  {
    id: 's4',
    name: 'analytics-eu-west-01',
    region: 'eu-west-1',
    zone: 'eu-west-1c',
    type: 'r6i.xlarge',
    provider: 'AWS',
    status: 'running',
    cpu: 31,
    memory: 63,
    cost_hr: 0.252,
    carbon_hr: 0.029,
    ip: '10.2.8.45',
    public_ip: '52.213.78.156',
    launch_time: new Date(Date.now() - 91 * 86400000).toISOString(),
    uptime_hours: +(91 * 24).toFixed(0),
    os: 'Debian 12 Bookworm',
    arch: 'x86_64',
    tags: ['production', 'analytics', 'elasticsearch', 'data-pipeline'],
    vcpus: 4,
    memory_gb: 32,
  },
  {
    id: 's5',
    name: 'ml-training-gpu-01',
    region: 'us-east-2',
    zone: 'us-east-2b',
    type: 'p3.2xlarge',
    provider: 'AWS',
    status: 'idle',
    cpu: 3,
    memory: 12,
    cost_hr: 3.06,
    carbon_hr: 0.76,
    ip: '10.3.14.22',
    public_ip: '18.191.203.67',
    launch_time: new Date(Date.now() - 5 * 86400000).toISOString(),
    uptime_hours: +(5 * 24).toFixed(0),
    os: 'Ubuntu 22.04 LTS + CUDA 12.2',
    arch: 'x86_64',
    tags: ['ml', 'gpu', 'training', 'idle-candidate'],
    vcpus: 8,
    memory_gb: 61,
  },
  {
    id: 's6',
    name: 'staging-api-01',
    region: 'us-east-1',
    zone: 'us-east-1a',
    type: 't3.medium',
    provider: 'AWS',
    status: 'idle',
    cpu: 4,
    memory: 18,
    cost_hr: 0.0416,
    carbon_hr: 0.011,
    ip: '10.0.30.5',
    public_ip: '54.82.191.44',
    launch_time: new Date(Date.now() - 14 * 86400000).toISOString(),
    uptime_hours: +(14 * 24).toFixed(0),
    os: 'Amazon Linux 2023',
    arch: 'x86_64',
    tags: ['staging', 'dev', 'non-production', 'idle-candidate'],
    vcpus: 2,
    memory_gb: 4,
  },
  {
    id: 's7',
    name: 'cache-redis-cluster-01',
    region: 'us-east-1',
    zone: 'us-east-1a',
    type: 'r6g.large',
    provider: 'AWS',
    status: 'running',
    cpu: 22,
    memory: 71,
    cost_hr: 0.1008,
    carbon_hr: 0.016,
    ip: '10.0.50.10',
    public_ip: 'N/A (private)',
    launch_time: new Date(Date.now() - 120 * 86400000).toISOString(),
    uptime_hours: +(120 * 24).toFixed(0),
    os: 'Amazon Linux 2023',
    arch: 'arm64',
    tags: ['production', 'cache', 'redis', 'graviton'],
    vcpus: 2,
    memory_gb: 16,
  },
  {
    id: 's8',
    name: 'cdn-edge-ap-south-01',
    region: 'ap-south-1',
    zone: 'ap-south-1a',
    type: 'c6g.medium',
    provider: 'AWS',
    status: 'running',
    cpu: 38,
    memory: 44,
    cost_hr: 0.0340,
    carbon_hr: 0.052,
    ip: '10.4.2.88',
    public_ip: '13.233.177.92',
    launch_time: new Date(Date.now() - 60 * 86400000).toISOString(),
    uptime_hours: +(60 * 24).toFixed(0),
    os: 'Amazon Linux 2023',
    arch: 'arm64',
    tags: ['production', 'cdn', 'edge', 'india', 'graviton'],
    vcpus: 1,
    memory_gb: 2,
  },
];

// ── Dynamic Alerts (timestamps relative to current time) ─────────────────────
function generateAlerts() {
  const now = Date.now();
  return [
    {
      id: 'a1',
      severity: 'critical',
      title: 'High CPU on prod-worker-us-west-01',
      message: 'CPU usage sustained above 85% for 15+ minutes. Consider scaling horizontally or investigating runaway processes.',
      server: 'prod-worker-us-west-01',
      ts: now - 180000,    // 3 min ago
    },
    {
      id: 'a2',
      severity: 'critical',
      title: 'Traffic Spike Predicted — 21:00 IST',
      message: 'AI forecast model (LSTM-v2) predicts 3.2× traffic surge at 21:00 IST. Pre-warm 3 additional instances by 20:30.',
      server: 'prod-api-us-east-01',
      ts: now - 60000,     // 1 min ago
    },
    {
      id: 'a3',
      severity: 'warning',
      title: 'GPU Instance Idle — ml-training-gpu-01',
      message: 'p3.2xlarge running at 3% CPU for 18+ hours. Estimated waste: $55.08/day ($1,652/mo). Recommend termination.',
      server: 'ml-training-gpu-01',
      ts: now - 600000,    // 10 min ago
    },
    {
      id: 'a4',
      severity: 'warning',
      title: 'Staging Server Idle — staging-api-01',
      message: 't3.medium idle at 4% CPU for 6 hours outside business hours. Consider scheduled stop policy.',
      server: 'staging-api-01',
      ts: now - 1800000,   // 30 min ago
    },
    {
      id: 'a5',
      severity: 'success',
      title: 'Auto-scale Completed Successfully',
      message: 'prod-api-us-east-02 added to load balancer rotation. Health check passed in 12s. Traffic balanced.',
      server: 'prod-api-us-east-02',
      ts: now - 3600000,   // 1 hr ago
    },
    {
      id: 'a6',
      severity: 'info',
      title: 'Carbon Intensity Drop — EU-West Region',
      message: 'UK National Grid carbon intensity fell to "low" (78 gCO₂/kWh). Consider migrating batch jobs to eu-west-1 for lower emissions.',
      server: 'analytics-eu-west-01',
      ts: now - 5400000,   // 1.5 hr ago
    },
    {
      id: 'a7',
      severity: 'info',
      title: 'Redis Memory Pressure Normal',
      message: 'Cache hit ratio at 94.7%. Memory at 71% — well within thresholds. Eviction rate: 0 keys/sec.',
      server: 'cache-redis-cluster-01',
      ts: now - 7200000,   // 2 hr ago
    },
    {
      id: 'a8',
      severity: 'warning',
      title: 'Latency Spike — AP-South Edge',
      message: 'P99 latency to ap-south-1 increased to 340ms (baseline: 180ms). ISP peering issue suspected.',
      server: 'cdn-edge-ap-south-01',
      ts: now - 900000,    // 15 min ago
    },
  ];
}

const defaultSustainability = {
  green_score: 67,
  carbon_saved_kg: 142.8,
  trees_equivalent: 6.5,
  energy_kwh: 2847,
  renewable_percent: 34,
  monthly_trend: [
    { month: 'Nov', score: 52, carbon_kg: 280 },
    { month: 'Dec', score: 55, carbon_kg: 265 },
    { month: 'Jan', score: 58, carbon_kg: 248 },
    { month: 'Feb', score: 61, carbon_kg: 231 },
    { month: 'Mar', score: 64, carbon_kg: 198 },
    { month: 'Apr', score: 67, carbon_kg: 174 },
  ],
  heatmap: generateCarbonHeatmap(),
  breakdown: [
    { category: 'Compute',  carbon_kg: 89.4, percent: 62.6 },
    { category: 'Storage',  carbon_kg: 28.1, percent: 19.7 },
    { category: 'Network',  carbon_kg: 17.6, percent: 12.3 },
    { category: 'Other',    carbon_kg: 7.7,  percent: 5.4 },
  ],
};

function generateCarbonHeatmap() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const hours = Array.from({length: 24}, (_, i) => i);
  return days.flatMap(day =>
    hours.map(hour => ({
      day,
      hour,
      value: Math.round(20 + Math.random() * 80 + (hour >= 9 && hour <= 18 ? 30 : 0) + (day === 'Sat' || day === 'Sun' ? -15 : 0))
    }))
  );
}

// ── Read / Write helpers ──────────────────────────────────────────────────────
export async function readStore(key) {
  const raw = await readFile(FILES[key], 'utf-8');
  return JSON.parse(raw);
}

export async function writeStore(key, data) {
  await writeFile(FILES[key], JSON.stringify(data, null, 2));
}

// ── Initialize data store ─────────────────────────────────────────────────────

function hasValidData(filepath) {
  if (!existsSync(filepath)) return false;
  try {
    const raw = readFileSync(filepath, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0;
  } catch {
    return false;
  }
}

export async function initDataStore() {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });

  // Always regenerate alerts (timestamps must be fresh) and servers (realistic data)
  const writes = [
    writeStore('alerts',  generateAlerts()),
    writeStore('servers', defaultServers),
  ];

  if (!hasValidData(FILES.sustainability)) writes.push(writeStore('sustainability', defaultSustainability));
  if (!hasValidData(FILES.history))        writes.push(writeStore('history',        generateHistoricalData(72)));
  if (!hasValidData(FILES.forecast))       writes.push(writeStore('forecast',       generateForecastData()));

  await Promise.all(writes);
  console.log('[DataStore] Initialized ✓ (8 servers, 8 alerts)');
}

function generateForecastData() {
  const now = Date.now();
  const points = [];
  for (let i = 0; i < 24; i++) {
    const t = now + i * 3600000;
    const hour = new Date(t).getHours();
    const base = 500 + Math.sin((hour - 6) * Math.PI / 12) * 300;
    const spike = hour === 21 ? 800 : 0;
    const predicted = Math.round(base + spike + Math.random() * 50);
    points.push({
      ts: t,
      predicted_rps: predicted,
      confidence_low:  Math.round(predicted * 0.85),
      confidence_high: Math.round(predicted * 1.15),
      recommended_servers: Math.ceil(predicted / 200),
    });
  }
  return { generated_at: now, accuracy: 94.2, model: 'LSTM-v2', points };
}
