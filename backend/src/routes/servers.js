import { Router } from 'express';
import { readStore, writeStore } from '../services/dataStore.js';
import { buildLocalServer } from '../services/realSystemMonitor.js';

const router = Router();

// Smooth sine-wave fluctuation so values drift naturally instead of jumping randomly
// Each server gets a unique phase based on its ID, creating realistic desynchronized patterns
function liveFluctuate(base, amplitude, serverId, metric) {
  const t    = Date.now() / 1000;
  const seed = [...serverId].reduce((sum, c) => sum + c.charCodeAt(0), 0) + (metric === 'cpu' ? 0 : 37);
  const sine = Math.sin(t * 0.08 + seed) * 0.7 + Math.sin(t * 0.21 + seed * 1.3) * 0.3;
  const raw  = base + sine * amplitude + (Math.random() - 0.5) * (amplitude * 0.2);
  return Math.max(1, Math.min(99, +raw.toFixed(1)));
}

// Calculate dynamic carbon rate based on CPU load and region carbon intensity
function computeCarbonRate(cpu, costHr) {
  // Regional grid intensity varies: US ~0.4, EU ~0.23, India ~0.7 (kg CO₂/kWh)
  const powerKw = (cpu / 100) * 0.25; // ~250W peak per server
  return +(powerKw * 0.233 * 1.2).toFixed(4); // PUE 1.2
}

// GET all servers (simulated fleet + real local machine)
router.get('/', async (_req, res) => {
  try {
    const servers = await readStore('servers');

    const live = servers.map(s => {
      // Skip fluctuation for terminated servers
      if (s.status === 'terminated') return { ...s, is_real: false };

      const cpu    = s.status === 'idle'
        ? liveFluctuate(Math.min(s.cpu, 12), 4, s.id, 'cpu')
        : liveFluctuate(s.cpu, 12, s.id, 'cpu');
      const memory = s.status === 'idle'
        ? liveFluctuate(Math.min(s.memory, 20), 5, s.id, 'mem')
        : liveFluctuate(s.memory, 8, s.id, 'mem');

      return {
        ...s,
        cpu,
        memory,
        carbon_hr: computeCarbonRate(cpu, s.cost_hr),
        // Recalculate uptime dynamically from launch_time
        uptime_hours: s.launch_time
          ? +((Date.now() - new Date(s.launch_time).getTime()) / 3600000).toFixed(1)
          : s.uptime_hours,
        is_real: false,
      };
    });

    // Prepend REAL local machine as first server
    live.unshift(buildLocalServer());

    res.json(live);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/servers/:id/scale — simulate scaling action
router.post('/:id/scale', async (req, res) => {
  try {
    const servers = await readStore('servers');
    const server  = servers.find(s => s.id === req.params.id);
    if (!server) return res.status(404).json({ error: 'Server not found' });

    const { action } = req.body; // 'up' | 'down' | 'terminate'
    if (action === 'terminate') {
      server.status = 'terminated';
      server.cpu    = 0;
      server.memory = 0;
    } else if (action === 'up') {
      server.status = 'running';
      server.cpu    = Math.max(15, server.cpu - 20);
    } else if (action === 'down') {
      server.status = 'idle';
      server.cpu    = Math.min(server.cpu, 10);
      server.memory = Math.min(server.memory, 15);
    }

    await writeStore('servers', servers);
    res.json({ success: true, server });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
