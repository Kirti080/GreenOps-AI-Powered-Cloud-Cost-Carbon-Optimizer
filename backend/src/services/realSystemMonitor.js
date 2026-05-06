// ─────────────────────────────────────────────────────────────────────────────
// Real System Monitor — Monitors actual machine + pings real servers
// Uses Node.js built-in 'os' module for genuine CPU/memory/disk/network data
// ─────────────────────────────────────────────────────────────────────────────
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import http from 'http';
import https from 'https';

const execAsync = promisify(exec);

// ── CPU Usage (averaged over interval) ───────────────────────────────────────
let prevCpuInfo = os.cpus().map(c => ({ ...c.times }));

function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;

  for (let i = 0; i < cpus.length; i++) {
    const curr = cpus[i].times;
    const prev = prevCpuInfo[i] || curr;

    const idleDiff = curr.idle - prev.idle;
    const totalDiff =
      (curr.user - prev.user) +
      (curr.nice - prev.nice) +
      (curr.sys - prev.sys) +
      (curr.irq - prev.irq) +
      (curr.idle - prev.idle);

    totalIdle += idleDiff;
    totalTick += totalDiff;
  }

  prevCpuInfo = cpus.map(c => ({ ...c.times }));
  return totalTick === 0 ? 0 : +((1 - totalIdle / totalTick) * 100).toFixed(1);
}

// ── Memory Usage ─────────────────────────────────────────────────────────────
function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    total_gb: +(total / 1073741824).toFixed(2),
    used_gb: +(used / 1073741824).toFixed(2),
    free_gb: +(free / 1073741824).toFixed(2),
    percent: +((used / total) * 100).toFixed(1),
  };
}

// ── Disk Usage (Windows) ─────────────────────────────────────────────────────
async function getDiskUsage() {
  try {
    const { stdout } = await execAsync(
      'wmic logicaldisk get size,freespace,caption /format:csv',
      { timeout: 5000 }
    );
    const lines = stdout.trim().split('\n').filter(l => l.trim() && !l.startsWith('Node'));
    const disks = [];
    for (const line of lines) {
      const parts = line.trim().split(',');
      if (parts.length >= 4) {
        const caption = parts[1];
        const free = parseInt(parts[2]) || 0;
        const size = parseInt(parts[3]) || 0;
        if (size > 0) {
          disks.push({
            drive: caption,
            total_gb: +(size / 1073741824).toFixed(1),
            free_gb: +(free / 1073741824).toFixed(1),
            used_gb: +((size - free) / 1073741824).toFixed(1),
            percent: +(((size - free) / size) * 100).toFixed(1),
          });
        }
      }
    }
    return disks;
  } catch {
    return [{ drive: 'C:', total_gb: 0, free_gb: 0, used_gb: 0, percent: 0 }];
  }
}

// ── Network Info ─────────────────────────────────────────────────────────────
function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const result = [];
  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      if (!addr.internal && addr.family === 'IPv4') {
        result.push({
          interface: name,
          ip: addr.address,
          mac: addr.mac,
        });
      }
    }
  }
  return result;
}

// ── Ping real websites for latency ───────────────────────────────────────────
const PING_TARGETS = [
  { name: 'Google Cloud',    url: 'https://www.google.com',          region: 'us-central1' },
  { name: 'AWS US-East',     url: 'https://ec2.us-east-1.amazonaws.com', region: 'us-east-1' },
  { name: 'GitHub',          url: 'https://api.github.com',          region: 'us-west-2' },
  { name: 'Azure India',     url: 'https://azure.microsoft.com',    region: 'centralindia' },
  { name: 'Cloudflare',      url: 'https://1.1.1.1',                region: 'global-edge' },
  { name: 'DigitalOcean',    url: 'https://www.digitalocean.com',   region: 'nyc1' },
];

async function pingUrl(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 5000 }, (res) => {
      res.on('data', () => {}); // consume
      res.on('end', () => resolve({ latency: Date.now() - start, status: res.statusCode, alive: true }));
    });
    req.on('error', () => resolve({ latency: -1, status: 0, alive: false }));
    req.on('timeout', () => { req.destroy(); resolve({ latency: -1, status: 0, alive: false }); });
  });
}

async function pingAllTargets() {
  const results = await Promise.all(
    PING_TARGETS.map(async (target) => {
      const ping = await pingUrl(target.url);
      return {
        name: target.name,
        url: target.url,
        region: target.region,
        latency_ms: ping.latency,
        status: ping.alive ? 'reachable' : 'unreachable',
        http_status: ping.status,
        checked_at: Date.now(),
      };
    })
  );
  return results;
}

// ── Real Carbon Intensity (UK National Grid — free, no API key) ──────────────
let cachedCarbon = null;
let carbonFetchedAt = 0;

async function getRealCarbonIntensity() {
  // Cache for 30 minutes
  if (cachedCarbon && Date.now() - carbonFetchedAt < 1800000) return cachedCarbon;

  return new Promise((resolve) => {
    https.get('https://api.carbonintensity.org.uk/intensity', { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const intensity = data.data?.[0]?.intensity;
          cachedCarbon = {
            actual: intensity?.actual ?? null,
            forecast: intensity?.forecast ?? null,
            index: intensity?.index ?? 'unknown', // very low, low, moderate, high, very high
            from: data.data?.[0]?.from,
            to: data.data?.[0]?.to,
            unit: 'gCO2/kWh',
            source: 'UK National Grid ESO',
            fetched_at: Date.now(),
          };
          carbonFetchedAt = Date.now();
          resolve(cachedCarbon);
        } catch {
          resolve({ actual: null, forecast: null, index: 'unknown', source: 'unavailable' });
        }
      });
    }).on('error', () => {
      resolve(cachedCarbon || { actual: null, forecast: null, index: 'unknown', source: 'unavailable' });
    });
  });
}

// ── Process Info ──────────────────────────────────────────────────────────────
function getProcessInfo() {
  const mem = process.memoryUsage();
  return {
    pid: process.pid,
    uptime_seconds: Math.round(process.uptime()),
    node_version: process.version,
    heap_used_mb: +(mem.heapUsed / 1048576).toFixed(1),
    heap_total_mb: +(mem.heapTotal / 1048576).toFixed(1),
    rss_mb: +(mem.rss / 1048576).toFixed(1),
  };
}

// ── System Info (static) ─────────────────────────────────────────────────────
function getSystemInfo() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    os_type: os.type(),
    os_release: os.release(),
    cpus: os.cpus().length,
    cpu_model: os.cpus()[0]?.model || 'Unknown',
    total_memory_gb: +(os.totalmem() / 1073741824).toFixed(2),
    uptime_hours: +(os.uptime() / 3600).toFixed(1),
  };
}

// ── Build real server entries from this machine ──────────────────────────────
function buildLocalServer() {
  const cpu = getCpuUsage();
  const mem = getMemoryUsage();
  const net = getNetworkInfo();
  const sys = getSystemInfo();

  return {
    id: 'local-machine',
    name: sys.hostname,
    region: 'local',
    zone: 'localhost',
    type: `${sys.cpu_model.substring(0, 30)} (${sys.cpus} cores)`,
    status: 'running',
    cpu: cpu,
    memory: mem.percent,
    memory_detail: mem,
    cost_hr: 0,
    carbon_hr: +(cpu / 100 * 0.2 * 0.233).toFixed(4), // estimated
    ip: net[0]?.ip || '127.0.0.1',
    mac: net[0]?.mac || '00:00:00:00:00:00',
    public_ip: 'N/A (local)',
    launch_time: new Date(Date.now() - os.uptime() * 1000).toISOString(),
    uptime_hours: sys.uptime_hours,
    tags: ['local', 'real', 'development', sys.platform],
    os: `${sys.os_type} ${sys.os_release}`,
    arch: sys.arch,
    is_real: true,
  };
}

// ── Full snapshot (combines everything) ──────────────────────────────────────
export async function getFullRealSnapshot() {
  const [pings, carbon, disk] = await Promise.all([
    pingAllTargets(),
    getRealCarbonIntensity(),
    getDiskUsage(),
  ]);

  return {
    timestamp: Date.now(),
    local_server: buildLocalServer(),
    system_info: getSystemInfo(),
    memory: getMemoryUsage(),
    disk,
    network: getNetworkInfo(),
    process: getProcessInfo(),
    external_pings: pings,
    carbon_intensity: carbon,
  };
}

// ── Export individual functions for routes ────────────────────────────────────
export {
  getCpuUsage,
  getMemoryUsage,
  getDiskUsage,
  getNetworkInfo,
  pingAllTargets,
  getRealCarbonIntensity,
  getSystemInfo,
  getProcessInfo,
  buildLocalServer,
};
