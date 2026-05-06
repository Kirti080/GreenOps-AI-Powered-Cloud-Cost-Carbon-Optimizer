import { Router } from 'express';
import { generateLiveMetrics } from '../services/metricsGenerator.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(generateLiveMetrics());
});

export default router;
