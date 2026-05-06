// ─────────────────────────────────────────────────────────────────────────────
// GreenOps Backend — Main Entry Point
// Node.js + Express + WebSocket + OAuth
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import passport from './services/passport.js';
import metricsRouter from './routes/metrics.js';
import forecastRouter from './routes/forecast.js';
import sustainabilityRouter from './routes/sustainability.js';
import historyRouter from './routes/history.js';
import alertsRouter from './routes/alerts.js';
import serversRouter from './routes/servers.js';
import realServersRouter from './routes/realServers.js';
import authRouter from './routes/auth.js';
import { generateLiveMetrics } from './services/metricsGenerator.js';
import { getCpuUsage, getMemoryUsage, getRealCarbonIntensity, buildLocalServer } from './services/realSystemMonitor.js';
import { initDataStore, readStore } from './services/dataStore.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ── Initialize JSON data store ───────────────────────────────────────────────
await initDataStore();

// ── Express App ──────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true 
}));
app.use(express.json());

// ── Session Middleware ───────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'greenops-dev-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// ── Passport Middleware ───────────────────────────────────────────────────────
// Only initialize if real OAuth credentials are provided
if (process.env.GITHUB_CLIENT_ID && process.env.GOOGLE_CLIENT_ID) {
  app.use(passport.initialize());
  app.use(passport.session());
}

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/auth',                  authRouter);
app.use('/api/metrics',           metricsRouter);
app.use('/api/forecast',          forecastRouter);
app.use('/api/sustainability',    sustainabilityRouter);
app.use('/api/history',           historyRouter);
app.use('/api/alerts',            alertsRouter);
app.use('/api/servers',           serversRouter);
app.use('/api/real',              realServersRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── HTTP Server ───────────────────────────────────────────────────────────────
const server = createServer(app);

// ── Carbon intensity — refreshed every 30 min, used in WS broadcasts ─────────
let cachedCarbonFactor = 0.233; // default: ~UK avg in kg CO₂/kWh
getRealCarbonIntensity()
  .then(c => { if (c?.actual) cachedCarbonFactor = c.actual / 1000; })
  .catch(() => {});
setInterval(() => {
  getRealCarbonIntensity()
    .then(c => { if (c?.actual) cachedCarbonFactor = c.actual / 1000; })
    .catch(() => {});
}, 30 * 60 * 1000);

// ── WebSocket Server ─────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected. Total: ${clients.size}`);

  // Send immediate snapshot on connect so UI doesn't wait for first interval
  const snapshot = generateLiveMetrics();
  const initCpu = getCpuUsage();
  const initMem = getMemoryUsage();
  const initPayload = {
    ...snapshot,
    cpu_avg:         initCpu,
    memory_avg:      initMem.percent,
    real_memory_gb:  initMem.used_gb,
    total_memory_gb: initMem.total_gb,
    carbon_rate:     +(initCpu / 100 * 0.2 * snapshot.active_servers * 1.2 * cachedCarbonFactor).toFixed(4),
    is_real: true,
  };
  ws.send(JSON.stringify({ type: 'METRICS_UPDATE', payload: initPayload }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Total: ${clients.size}`);
  });

  ws.on('error', () => clients.delete(ws));
});

function broadcast(msg) {
  const data = JSON.stringify(msg);
  for (const client of clients) {
    if (client.readyState === 1) client.send(data);
  }
}

// Broadcast live metrics (with REAL CPU/memory + real carbon factor) every 2 seconds
setInterval(() => {
  if (clients.size === 0) return;
  const simulated = generateLiveMetrics();
  const realCpu   = getCpuUsage();
  const realMem   = getMemoryUsage();

  // Carbon rate using real grid intensity, PUE 1.2, active servers
  const power_kw    = (realCpu / 100) * 0.2 * simulated.active_servers * 1.2;
  const carbon_rate = +(power_kw * cachedCarbonFactor).toFixed(4);

  const payload = {
    ...simulated,
    cpu_avg:         realCpu,
    memory_avg:      realMem.percent,
    real_memory_gb:  realMem.used_gb,
    total_memory_gb: realMem.total_gb,
    carbon_rate,
    is_real: true,
  };
  broadcast({ type: 'METRICS_UPDATE', payload });
}, 2000);

// Broadcast server fleet data every 10 seconds for real-time server table updates
setInterval(async () => {
  if (clients.size === 0) return;
  try {
    const servers = await readStore('servers');
    const live = servers.map(s => {
      if (s.status === 'terminated') return { ...s, is_real: false };
      const t = Date.now() / 1000;
      const seed = [...s.id].reduce((sum, c) => sum + c.charCodeAt(0), 0);
      const sine = Math.sin(t * 0.08 + seed) * 0.7 + Math.sin(t * 0.21 + seed * 1.3) * 0.3;
      const cpu = Math.max(1, Math.min(99, +(s.cpu + sine * (s.status === 'idle' ? 4 : 12) + (Math.random() - 0.5) * 3).toFixed(1)));
      const mem = Math.max(1, Math.min(99, +(s.memory + sine * (s.status === 'idle' ? 5 : 8) + (Math.random() - 0.5) * 2).toFixed(1)));
      return {
        ...s,
        cpu: s.status === 'idle' ? Math.min(cpu, 15) : cpu,
        memory: s.status === 'idle' ? Math.min(mem, 22) : mem,
        carbon_hr: +(cpu / 100 * 0.25 * 0.233 * 1.2).toFixed(4),
        uptime_hours: s.launch_time ? +((Date.now() - new Date(s.launch_time).getTime()) / 3600000).toFixed(1) : s.uptime_hours,
        is_real: false,
      };
    });
    live.unshift(buildLocalServer());
    broadcast({ type: 'SERVERS_UPDATE', payload: live });
  } catch (e) {
    // silent — don't crash the interval
  }
}, 10000);

// ── Start Server ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  const USE_MOCK_AUTH = !process.env.GITHUB_CLIENT_ID || !process.env.GOOGLE_CLIENT_ID;
  const authStatus = USE_MOCK_AUTH ? '🧪 MOCK auth (dev mode)' : '🔐 Real OAuth enabled';
  
  console.log(`\n🌿 GreenOps Backend running at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket ready at ws://localhost:${PORT}`);
  console.log(`${authStatus}`);
  console.log(`📊 API endpoints: /api/metrics | /api/forecast | /api/sustainability`);
  console.log(`🖥️  Real monitoring: /api/real/snapshot | /api/real/ping | /api/real/carbon\n`);
});
