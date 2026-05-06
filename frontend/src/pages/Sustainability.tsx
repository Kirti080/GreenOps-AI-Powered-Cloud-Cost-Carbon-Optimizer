import { useEffect, useState, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, RadialBarChart, RadialBar,
} from 'recharts';
import { Leaf, TreePine, Wind, Zap, TrendingDown, Radio } from 'lucide-react';
import { fetchSustainability } from '@/api/client';

interface RealCarbonIntensity {
  actual: number | null;
  forecast: number | null;
  index: string;
  source: string;
  unit?: string;
}

interface SustainData {
  green_score: number;
  carbon_saved_kg: number;
  trees_equivalent: number;
  energy_kwh: number;
  renewable_percent: number;
  monthly_trend: { month: string; score: number; carbon_kg: number }[];
  heatmap: { day: string; hour: number; value: number }[];
  breakdown: { category: string; carbon_kg: number; percent: number }[];
  real_carbon_intensity?: RealCarbonIntensity;
}

/* ── Animated SVG Gauge ─────────────────────────────────────────────────────── */
function GreenGauge({ score }: { score: number }) {
  const r  = 90;
  const cx = 110;
  const cy = 110;
  const circ = 2 * Math.PI * r;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayed(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const startAngle = -225; // degrees
  const arc = (displayed / 100) * 270; // max 270 deg sweep
  const offset = circ * (1 - arc / 360);

  const color = displayed >= 70 ? '#10b981' : displayed >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <svg width={220} height={200} style={{ overflow: 'visible' }}>
        {/* Background track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={14}
          strokeDasharray={`${circ * 0.75} ${circ}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
        />
        {/* Animated fill */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeDasharray={`${circ * 0.75} ${circ}`}
          strokeDashoffset={circ * 0.75 * (1 - displayed / 100)}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease',
            filter: `drop-shadow(0 0 10px ${color}88)`,
          }}
        />
        {/* Glow outer */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={`${circ * 0.75} ${circ}`}
          strokeDashoffset={circ * 0.75 * (1 - displayed / 100)}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          opacity={0.3}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Center score */}
        <text x={cx} y={cy - 8} textAnchor="middle" fill={color} fontSize={42} fontWeight={800} fontFamily="Inter, sans-serif">
          {displayed}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={12} fontFamily="Inter, sans-serif">
          Green Score
        </text>
        {/* Labels */}
        <text x={17}  y={cy + 65} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize={10}>0</text>
        <text x={203} y={cy + 65} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize={10}>100</text>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
          {displayed >= 70 ? '🌱 Excellent sustainability' : displayed >= 40 ? '⚠️ Needs improvement' : '🔴 High carbon footprint'}
        </div>
      </div>
    </div>
  );
}

/* ── Impact Metric Card ─────────────────────────────────────────────────────── */
function ImpactCard({ icon: Icon, label, value, unit, sub, color, bg }: {
  icon: any; label: string; value: string; unit: string; sub: string; color: string; bg: string;
}) {
  return (
    <div className="card card-glow anim-fade-up" style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: bg, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} color={color} />
      </div>
      <div style={{ fontSize: '2.2rem', fontWeight: 900, color, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
        {value}
        <span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: 4 }}>{unit}</span>
      </div>
      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>{label}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{sub}</div>
    </div>
  );
}

/* ── Carbon Heatmap ─────────────────────────────────────────────────────────── */
function CarbonHeatmap({ data }: { data: SustainData['heatmap'] }) {
  const DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const HOURS = Array.from({length: 24}, (_, i) => i);

  const maxVal = Math.max(...data.map(d => d.value));
  const getColor = (v: number) => {
    const t = v / maxVal;
    if (t < 0.25) return `rgba(16,185,129,${0.2 + t * 0.5})`;
    if (t < 0.5)  return `rgba(245,158,11,${0.3 + t * 0.4})`;
    if (t < 0.75) return `rgba(239,68,68,${0.4 + t * 0.3})`;
    return `rgba(239,68,68,${0.7 + t * 0.3})`;
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Hour labels */}
      <div style={{ display: 'flex', gap: 3, marginLeft: 36, marginBottom: 4 }}>
        {HOURS.filter((_, i) => i % 3 === 0).map(h => (
          <div key={h} style={{ width: 28, fontSize: '0.62rem', color: 'var(--text-3)', textAlign: 'center' }}>
            {h.toString().padStart(2,'0')}
          </div>
        ))}
      </div>
      {DAYS.map(day => {
        const row = data.filter(d => d.day === day);
        return (
          <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3 }}>
            <div style={{ width: 30, fontSize: '0.68rem', color: 'var(--text-3)', textAlign: 'right', paddingRight: 6 }}>{day}</div>
            {HOURS.map(hour => {
              const cell = row.find(d => d.hour === hour);
              return (
                <div
                  key={hour}
                  className="heatmap-cell"
                  title={`${day} ${hour}:00 — ${cell?.value ?? 0} carbon units`}
                  style={{
                    width: 22, height: 22,
                    background: cell ? getColor(cell.value) : 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                />
              );
            })}
          </div>
        );
      })}
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, marginLeft: 36 }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Low</span>
        {['rgba(16,185,129,0.5)','rgba(245,158,11,0.5)','rgba(239,68,68,0.5)','rgba(239,68,68,0.9)'].map((c, i) => (
          <div key={i} style={{ width: 22, height: 22, borderRadius: 4, background: c }} />
        ))}
        <span style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>High</span>
      </div>
    </div>
  );
}

const PIE_COLORS = ['#10b981','#06b6d4','#8b5cf6','#f59e0b'];

/* ── MAIN PAGE ─────────────────────────────────────────────────────────────── */
export default function Sustainability() {
  const [data, setData] = useState<SustainData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = () => {
      fetchSustainability()
        .then(d => { if (mounted) setData(d); })
        .catch(console.warn)
        .finally(() => { if (mounted) setLoading(false); });
    };

    load();

    // Refresh every 60s — carbon intensity data updates from UK National Grid
    const timer = setInterval(load, 60000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {Array.from({length: 4}).map((_, i) => (
          <div key={i} className="shimmer" style={{ height: i === 0 ? 200 : 180, borderRadius: 16 }} />
        ))}
      </div>
    );
  }

  const carbon = data.real_carbon_intensity;
  const carbonColor = !carbon?.actual ? 'var(--text-3)'
    : carbon.index === 'very low' || carbon.index === 'low' ? 'var(--green-l)'
    : carbon.index === 'moderate' ? 'var(--amber)'
    : '#f87171';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Live UK Grid Carbon Intensity banner ───────────────────────────── */}
      <div className="card card-accent" style={{ padding: '1rem 1.75rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(16,185,129,0.15)', border: '1px solid var(--border-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Radio size={18} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live Carbon Intensity</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
              {carbon?.source ?? 'UK National Grid ESO'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Current',  value: carbon?.actual   != null ? `${carbon.actual} gCO₂/kWh`   : 'Fetching…', color: carbonColor },
            { label: 'Forecast', value: carbon?.forecast  != null ? `${carbon.forecast} gCO₂/kWh` : '—',         color: 'var(--cyan)' },
            { label: 'Grid Index', value: carbon?.index ? carbon.index.toUpperCase() : '—',                       color: carbonColor },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</div>
              <div style={{ fontWeight: 700, color: item.color, fontSize: '0.98rem', marginTop: 2 }}>{item.value}</div>
            </div>
          ))}
        </div>

        <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: '0.68rem' }}>
          <div className="pulse-dot" style={{ width: 6, height: 6, background: 'var(--green-l)' }} />
          LIVE DATA
        </span>
      </div>

      {/* ── Hero: Gauge + Impact cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.25rem' }}>

        {/* Gauge */}
        <div className="card card-glow anim-scale-in" style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <GreenGauge score={data.green_score} />
          <div style={{ marginTop: 16, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 6 }}>
              <span>vs last month</span>
              <span style={{ color: 'var(--green-l)', fontWeight: 600 }}>▲ +3 pts</span>
            </div>
            <div className="progress">
              <div className="progress-fill" style={{ width: `${data.green_score}%`, background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
            </div>
          </div>
        </div>

        {/* Impact cards */}
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <ImpactCard
            icon={TreePine}
            label="Trees Equivalent"
            value={data.trees_equivalent.toFixed(1)}
            unit="trees"
            sub="CO₂ absorbed per month"
            color="var(--green-l)"
            bg="rgba(16,185,129,0.12)"
          />
          <ImpactCard
            icon={Wind}
            label="Carbon Avoided"
            value={data.carbon_saved_kg.toFixed(0)}
            unit="kg"
            sub="vs. baseline this month"
            color="var(--cyan)"
            bg="rgba(6,182,212,0.12)"
          />
          <ImpactCard
            icon={Zap}
            label="Energy Used"
            value={data.energy_kwh.toLocaleString()}
            unit="kWh"
            sub={`${data.renewable_percent}% from renewables`}
            color="var(--amber)"
            bg="rgba(245,158,11,0.12)"
          />
        </div>
      </div>

      {/* ── Monthly trend + Carbon breakdown ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem' }}>

        {/* Monthly bar chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-header">
            <div>
              <div className="section-title">Green Score Trend</div>
              <div className="section-sub">6-month sustainability progress</div>
            </div>
            <div className="badge badge-green">
              <TrendingDown size={10} />
              Carbon ↓
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthly_trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="gCarbon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: '0.8rem' }}
                labelStyle={{ color: 'var(--text-3)' }}
                itemStyle={{ color: 'var(--text)' }}
              />
              <Bar dataKey="score"     name="Green Score" fill="url(#gScore)"  radius={[4,4,0,0]} />
              <Bar dataKey="carbon_kg" name="Carbon (kg)"  fill="url(#gCarbon)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Carbon breakdown pie */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-header">
            <div className="section-title">Carbon Breakdown</div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={data.breakdown}
                dataKey="carbon_kg"
                nameKey="category"
                cx="50%" cy="50%"
                innerRadius={45} outerRadius={70}
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.breakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: '0.8rem' }}
                formatter={(v: any) => [`${v} kg CO₂`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.breakdown.map((item, i) => (
              <div key={item.category} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i], flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-2)' }}>{item.category}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Carbon heatmap ─────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="section-header">
          <div>
            <div className="section-title">Carbon Intensity Heatmap</div>
            <div className="section-sub">Hour × day — darker red = higher carbon emissions</div>
          </div>
        </div>
        <CarbonHeatmap data={data.heatmap} />
      </div>

    </div>
  );
}
