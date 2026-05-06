// ─────────────────────────────────────────────────────────────────────────────
// Real Servers Route — Exposes actual system metrics + real ping data
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import os from 'os';
import {
  getFullRealSnapshot,
  getCpuUsage,
  getMemoryUsage,
  getDiskUsage,
  getNetworkInfo,
  pingAllTargets,
  getRealCarbonIntensity,
  getSystemInfo,
  getProcessInfo,
} from '../services/realSystemMonitor.js';

const router = Router();

// GET /api/real/snapshot — Full real-time system snapshot
router.get('/snapshot', async (_req, res) => {
  try {
    const snapshot = await getFullRealSnapshot();
    res.json(snapshot);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/real/cpu — Real CPU usage
router.get('/cpu', (_req, res) => {
  res.json({
    cpu_percent: getCpuUsage(),
    cores: os.cpus().length,
    model: os.cpus()[0]?.model || 'Unknown',
    timestamp: Date.now(),
  });
});

// GET /api/real/memory — Real memory stats
router.get('/memory', (_req, res) => {
  res.json({ ...getMemoryUsage(), timestamp: Date.now() });
});

// GET /api/real/disk — Real disk usage
router.get('/disk', async (_req, res) => {
  try {
    const disks = await getDiskUsage();
    res.json({ disks, timestamp: Date.now() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/real/network — Network interfaces
router.get('/network', (_req, res) => {
  res.json({ interfaces: getNetworkInfo(), timestamp: Date.now() });
});

// GET /api/real/ping — Ping real external servers
router.get('/ping', async (_req, res) => {
  try {
    const pings = await pingAllTargets();
    res.json({ pings, timestamp: Date.now() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/real/carbon — Real carbon intensity from UK National Grid
router.get('/carbon', async (_req, res) => {
  try {
    const carbon = await getRealCarbonIntensity();
    res.json(carbon);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/real/system — System info (hostname, OS, CPU model, etc.)
router.get('/system', (_req, res) => {
  res.json(getSystemInfo());
});

// GET /api/real/process — Node.js process info
router.get('/process', (_req, res) => {
  res.json(getProcessInfo());
});

export default router;
