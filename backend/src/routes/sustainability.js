import { Router } from 'express';
import { readStore } from '../services/dataStore.js';
import { getRealCarbonIntensity } from '../services/realSystemMonitor.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const [data, carbon] = await Promise.all([
      readStore('sustainability'),
      getRealCarbonIntensity(),
    ]);
    // Blend real UK grid carbon intensity into the response
    res.json({ ...data, real_carbon_intensity: carbon });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
