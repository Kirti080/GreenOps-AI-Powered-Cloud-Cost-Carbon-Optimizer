import { useEffect, useState } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { Brain, TrendingUp, AlertTriangle, Clock, Zap, Server } from 'lucide-react';
import { fetchForecast, fetchHistory } from '@/api/client';
import type { ForecastPoint, HistoryPoint } from '@/store/useStore';

/* ── Custom tooltip ────────────────────────────────────────────────────────── */
function ForecastTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const ts = new Date(label).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const entries = payload.filter((p: any) => p.value != null && p.name !== 'bandBase');
  return (
    <div style={{
      background: 'rgba(10,15,30,0.96)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 12, padding: '0.85rem 1.1rem', backdropFilter: 'blur(20px)', minWidth: 180,
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: 8, fontWeight: 600 }}>{ts}</div>
      {entries.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: '0.8rem', marginBottom: 4 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
            {Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Prediction Event Card ─────────────────────────────────────────────────── */
function EventCard({ time, title, detail, severity, icon: Icon, color, bg }: {
  time: string; title: string; detail: string;
  severity: string; icon: any; color: string; bg: string;
}) {
  return (
    <div className="card anim-fade-up" style={{ padding: '1rem 1.25rem', display: 'flex', gap: 12, borderLeft: `3px solid ${color}` }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{title}</span>
          <span className={`badge badge-${severity === 'critical' ? 'red' : severity === 'warning' ? 'amber' : 'cyan'}`} style={{ fontSize: '0.68rem' }}>{severity}</span>
        </div>
        <div style={{ fontSize: '0.77rem', color: 'var(--text-3)' }}>{detail}</div>
        <div style={{ fontSize: '0.72rem', color, fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock size={11} /> {time}
        </div>
      </div>
    </div>
  );
}

/* ── MAIN PAGE ─────────────────────────────────────────────────────────────── */
export default function AIForecast() {
  const [forecast, setForecast] = useState<{ accuracy: number; model: string; points: ForecastPoint[] } | null>(null);
  const [history,  setHistory]  = useState<HistoryPoint[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([fetchForecast(), fetchHistory(6)])
      .then(([f, h]) => { setForecast(f); setHistory(h); })
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  // Build unified chart data
  // Confidence band via stacked Areas: bandBase (invisible) + bandTop (visible gap)
  const historicalForChart = history.slice(-36).map(h => ({
    ts: h.ts,
    actual: h.rps,
    predicted: null as number | null,
    bandBase: null as number | null,
    bandTop:  null as number | null,
  }));

  const forecastForChart = (forecast?.points ?? []).map(f => ({
    ts: f.ts,
    actual: null as number | null,
    predicted: f.predicted_rps,
    bandBase: f.confidence_low,                                 // bottom of confidence zone
    bandTop:  f.confidence_high - f.confidence_low,            // height of zone (stacked)
  }));

  const chartData = [...historicalForChart, ...forecastForChart];
  const spikePoint = forecast?.points.find(p => p.predicted_rps > 1200);
  const spikeTime  = spikePoint
    ? new Date(spikePoint.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '21:00';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Model info strip ─────────────────────────────────────────────── */}
      <div className="card card-accent" style={{ padding: '1.25rem 1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(16,185,129,0.15)', border: '1px solid var(--border-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={22} color="var(--green)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>AI Forecast Engine</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                Powered by LSTM-v2 · Trained on 90 days of traffic data
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Model Accuracy',  value: `${forecast?.accuracy ?? '94.2'}%`, color: 'var(--green-l)' },
              { label: 'Forecast Window', value: '12 hours',                         color: 'var(--cyan)' },
              { label: 'Update Interval', value: 'Every 1 hr',                       color: 'var(--purple)' },
              { label: 'Confidence Band', value: '±15%',                             color: 'var(--amber)' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</div>
                <div style={{ fontWeight: 700, color: item.color, fontSize: '1rem', marginTop: 2 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Forecast chart ───────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div className="section-header">
          <div>
            <div className="section-title" style={{ fontSize: '1.15rem' }}>Traffic Forecast — Next 12 Hours</div>
            <div className="section-sub">Purple band = ±15% confidence interval · Dashed line = AI prediction</div>
          </div>
          <div className="badge badge-green"><TrendingUp size={10} /> Live Model</div>
        </div>

        {loading ? (
          <div className="shimmer" style={{ height: 300 }} />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -5, bottom: 0 }}>
              <defs>
                <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="ts"
                tickFormatter={v => new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                tickLine={false} axisLine={false}
                interval={Math.floor(chartData.length / 8)}
              />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ForecastTooltip />} />
              <Legend
                iconType="circle" iconSize={8}
                wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-3)', paddingTop: 12 }}
                formatter={(value) => value === 'bandBase' || value === 'Confidence Band (base)' ? 'Confidence Band' : value}
              />

              {/* Stacked confidence band: base (invisible) + top (colored) */}
              <Area
                type="monotone"
                dataKey="bandBase"
                name="Confidence Band (base)"
                stackId="band"
                stroke="none"
                fill="rgba(0,0,0,0)"
                dot={false}
                connectNulls={false}
                legendType="none"
              />
              <Area
                type="monotone"
                dataKey="bandTop"
                name="Confidence Band"
                stackId="band"
                stroke="none"
                fill="rgba(139,92,246,0.18)"
                dot={false}
                connectNulls={false}
              />

              {/* Historical actual */}
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual RPS"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#gActual)"
                dot={false}
                connectNulls={false}
              />

              {/* AI predicted line */}
              <Line
                type="monotone"
                dataKey="predicted"
                name="Predicted RPS"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="7 4"
                dot={false}
                connectNulls={false}
              />

              {spikePoint && (
                <ReferenceLine
                  x={spikePoint.ts}
                  stroke="#ef4444"
                  strokeDasharray="4 3"
                  label={{ value: '⚡ Spike', position: 'top', fill: '#f87171', fontSize: 11 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Predicted events + Hourly breakdown ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Event predictions */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-header">
            <div className="section-title">Predicted Events</div>
            <div className="section-sub">Next 24 hours</div>
          </div>
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <EventCard
              time={`Today ${spikeTime} IST`}
              title="Traffic Spike Incoming"
              detail={`Predicted ${spikePoint?.predicted_rps.toLocaleString() ?? '1,800'} RPS — pre-warm ${spikePoint?.recommended_servers ?? 3} extra servers now`}
              severity="critical"
              icon={TrendingUp}
              color="#f87171"
              bg="rgba(239,68,68,0.12)"
            />
            <EventCard
              time="Tonight 23:00 IST"
              title="Low-Traffic Window"
              detail="Scale down to 2 servers. Est. saving: ₹1,500 / night"
              severity="info"
              icon={Server}
              color="var(--cyan)"
              bg="rgba(6,182,212,0.12)"
            />
            <EventCard
              time="Tomorrow 10:00 IST"
              title="Morning Rush Predicted"
              detail="Gradual ramp to 750 RPS. Pre-warm servers by 09:30"
              severity="warning"
              icon={AlertTriangle}
              color="var(--amber)"
              bg="rgba(245,158,11,0.12)"
            />
            <EventCard
              time="Tomorrow 03:00 IST"
              title="Optimal Maintenance Window"
              detail="Traffic at minimum (~120 RPS). Safe to deploy updates."
              severity="info"
              icon={Zap}
              color="var(--purple)"
              bg="rgba(139,92,246,0.12)"
            />
          </div>
        </div>

        {/* Hourly forecast table */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-header">
            <div className="section-title">12-Hour Forecast</div>
            <div className="section-sub">Hour-by-hour breakdown</div>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 340 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Predicted RPS</th>
                  <th>Servers</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {(forecast?.points ?? []).map((p, i) => {
                  const risk   = p.predicted_rps > 1200 ? 'critical' : p.predicted_rps > 800 ? 'warning' : 'low';
                  const rClass = risk === 'critical' ? 'badge-red' : risk === 'warning' ? 'badge-amber' : 'badge-green';
                  return (
                    <tr key={i}>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                        {new Date(p.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontWeight: 600, color: risk === 'critical' ? '#f87171' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                        {p.predicted_rps.toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--cyan)' }}>{p.recommended_servers}</td>
                      <td><span className={`badge ${rClass}`}>{risk}</span></td>
                    </tr>
                  );
                })}
                {(forecast?.points ?? []).length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                    Loading forecast…
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
