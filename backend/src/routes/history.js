import { Router } from 'express';
import { generateHistoricalData } from '../services/metricsGenerator.js';

const router = Router();

// Generate fresh historical data from current time (not stale stored JSON)
router.get('/', (req, res) => {
  const hours = parseInt(req.query.hours) || 24;
  res.json(generateHistoricalData(hours));
});

export default router;
