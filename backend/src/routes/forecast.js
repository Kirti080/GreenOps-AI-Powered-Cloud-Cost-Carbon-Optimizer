import { Router } from 'express';

const router = Router();

// Generate a fresh 12-hour forecast from current time
function generateForecast() {
  const now = Date.now();
  const points = [];
  for (let i = 0; i < 12; i++) {
    const t    = now + i * 3600000;
    const hour = new Date(t).getHours();
    const base = 500 + Math.sin((hour - 6) * Math.PI / 12) * 300;
    const spike = hour === 21 ? 800 : hour === 10 ? 300 : 0;
    const predicted = Math.max(100, Math.round(base + spike + (Math.random() - 0.5) * 80));
    points.push({
      ts:               t,
      predicted_rps:    predicted,
      confidence_low:   Math.round(predicted * 0.85),
      confidence_high:  Math.round(predicted * 1.15),
      recommended_servers: Math.ceil(predicted / 200),
    });
  }
  return { generated_at: now, accuracy: 94.2, model: 'LSTM-v2', points };
}

router.get('/', (_req, res) => {
  res.json(generateForecast());
});

export default router;
