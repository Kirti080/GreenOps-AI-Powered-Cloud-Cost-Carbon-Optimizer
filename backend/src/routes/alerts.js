import { Router } from 'express';
import { readStore } from '../services/dataStore.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const alerts = await readStore('alerts');
    res.json(alerts.sort((a, b) => b.ts - a.ts));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
