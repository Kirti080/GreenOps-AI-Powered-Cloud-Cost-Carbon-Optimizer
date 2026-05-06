import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { DollarSign, TrendingDown, Server, Power, ChevronDown, ChevronUp, Loader2, CheckCircle } from 'lucide-react';
import { fetchServers, scaleServer } from '@/api/client';
import { useStore } from '@/store/useStore';
import type { Server as SrvType } from '@/store/useStore';

/* ── Savings KPI ────────────────────────────────────────────────────────────── */
function SavingsCard({ label, value, unit, sub, color, bg, icon: Icon }: {
  label: string; value: string; unit: string; sub: string;
  color: string; bg: string; icon: any;
}) {
  return (
    <div className="card card-glow anim-fade-up" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color, letterSpacing: '-0.03em' }}>
            {value}<span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: 4 }}>{unit}</span>
          </div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '0.77rem', color: 'var(--text-3)' }}>{sub}</div>
    </div>
  );
}

/* ── Action Button with loading ─────────────────────────────────────────────── */
function ActionBtn({
  serverId, action, label, className, onDone,
}: {
  serverId: string; action: 'up' | 'down' | 'terminate'; label: string; className: string;
  onDone: (id: string, patch: Partial<SrvType>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const r = await scaleServer(serverId, action);
      onDone(serverId, r.server);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <button className={`btn btn-sm ${className}`} onClick={handleClick} disabled={loading || done}>
      {loading ? <Loader2 size={12} style={{ animation: 'spinSlow 1s linear infinite' }} /> : done ? <CheckCircle size={12} /> : null}
      {done ? 'Done' : label}
    </button>
  );
}

/* ── Server Recommendation Row ──────────────────────────────────────────────── */
function RecommendRow({ s, onDone }: { s: SrvType; onDone: (id: string, patch: Partial<SrvType>) => void }) {
  const [expanded, setExpanded] = useState(false);

  const isIdle       = s.status === 'idle' || s.cpu < 15;
  const isOverloaded = s.cpu > 80;
  const riskLevel    = s.is_real ? (s.cpu > 80 ? 'high-load' : 'monitored') : isOverloaded ? 'critical' : isIdle ? 'warning' : 'low';
  const riskClass    = riskLevel === 'critical' || riskLevel === 'high-load' ? 'badge-red' : riskLevel === 'warning' ? 'badge-amber' : 'badge-green';

  const suggestion = s.is_real
    ? `Real Server — ${s.os || 'Local Machine'} · ${s.cpu.toFixed(1)}% CPU`
    : isOverloaded
    ? 'Scale Up — Add capacity to handle load'
    : isIdle
    ? 'Terminate — Idle server wasting $' + (s.cost_hr * 24).toFixed(2) + '/day'
    : 'Optimal — No action needed';

  const monthlySaving = !s.is_real && isIdle ? +(s.cost_hr * 24 * 30).toFixed(0) : 0;
  const carbonSaving  = !s.is_real && isIdle ? +(s.carbon_hr * 24 * 30).toFixed(1) : 0;

  return (
    <>
      <tr
        style={{
          cursor: 'pointer', userSelect: 'none',
          ...(s.is_real ? { background: 'rgba(16,185,129,0.04)', borderLeft: '2px solid var(--green)' } : {}),
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="pulse-dot" style={{ background: s.is_real ? 'var(--green)' : isOverloaded ? '#ef4444' : isIdle ? '#f59e0b' : 'var(--green)' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{s.name}</span>
            {s.is_real && (
              <span className="badge badge-green" style={{ fontSize: '0.55rem', padding: '1px 6px', letterSpacing: '0.05em' }}>REAL</span>
            )}
          </div>
        </td>
        <td><span className="badge badge-grey" style={{ fontSize: '0.7rem' }}>{s.is_real ? String(s.type || 'Local').substring(0, 22) : s.type}</span></td>
        <td>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: '0.8rem', color: isOverloaded ? '#f87171' : 'var(--text-2)', fontWeight: isOverloaded ? 700 : 400 }}>{s.cpu.toFixed(1)}%</span>
            <div className="progress" style={{ height: 3, width: 60 }}>
              <div className="progress-fill" style={{ width: `${Math.min(s.cpu, 100)}%`, background: isOverloaded ? '#ef4444' : 'var(--green)' }} />
            </div>
          </div>
        </td>
        <td style={{ color: 'var(--amber)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
          {s.is_real ? 'N/A' : `$${(s.cost_hr * 24 * 30).toFixed(0)}/mo`}
        </td>
        <td><span className={`badge ${riskClass}`}>{riskLevel}</span></td>
        <td style={{ fontSize: '0.8rem', color: 'var(--text-2)', maxWidth: 200 }}>{suggestion}</td>
        <td>
          <div style={{ display: 'flex', gap: 6 }}>
            {s.is_real ? (
              <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>📡 Live</span>
            ) : (
              <>
                {isOverloaded && <ActionBtn serverId={s.id} action="up" label="Scale Up" className="btn-primary" onDone={onDone} />}
                {isIdle && <ActionBtn serverId={s.id} action="terminate" label="Terminate" className="btn-danger" onDone={onDone} />}
                {!isIdle && !isOverloaded && <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>✓ Optimal</span>}
              </>
            )}
          </div>
        </td>
        <td>
          {expanded ? <ChevronUp size={14} color="var(--text-3)" /> : <ChevronDown size={14} color="var(--text-3)" />}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} style={{ padding: 0 }}>
            <div style={{
              padding: '1rem 1.5rem',
              background: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid var(--border)',
              display: 'flex', gap: '2rem', flexWrap: 'wrap',
            }}>
              {[
                { label: 'Region',    value: s.region },
                { label: 'Zone',      value: s.zone || 'N/A' },
                { label: 'Memory',    value: `${s.memory.toFixed(1)}%` },
                { label: 'Carbon/hr', value: `${s.carbon_hr} kg` },
                ...(s.is_real ? [
                  { label: 'IP Address',   value: s.ip || 'N/A' },
                  { label: 'OS',           value: s.os || 'N/A' },
                  { label: 'Architecture', value: s.arch || 'N/A' },
                  { label: 'Uptime',       value: `${s.uptime_hours?.toFixed(1) || 'N/A'} hrs` },
                  { label: 'Tags',         value: s.tags?.join(', ') || 'N/A' },
                ] : [
                  { label: 'Provider',     value: s.provider || 'AWS' },
                  { label: 'Private IP',   value: s.ip || 'N/A' },
                  { label: 'Public IP',    value: s.public_ip || 'N/A' },
                  { label: 'vCPUs',        value: `${s.vcpus || '—'}` },
                  { label: 'Instance RAM', value: `${s.memory_gb || '—'} GB` },
                  { label: 'OS',           value: s.os || 'Amazon Linux 2023' },
                  { label: 'Launched',     value: s.launch_time ? new Date(s.launch_time).toLocaleDateString() : 'N/A' },
                  { label: 'Uptime',       value: `${s.uptime_hours?.toFixed(0) || '—'} hrs` },
                  { label: 'Monthly Cost', value: `$${(s.cost_hr * 720).toFixed(0)}` },
                  { label: 'Monthly CO₂',  value: `${(s.carbon_hr * 720).toFixed(1)} kg` },
                  ...(monthlySaving > 0 ? [{ label: '💰 Potential Saving', value: `$${monthlySaving}/mo` }] : []),
                  ...(carbonSaving  > 0 ? [{ label: '🌱 Carbon Saving',    value: `${carbonSaving} kg CO₂` }] : []),
                  { label: 'Tags',         value: s.tags?.join(', ') || 'N/A' },
                ]),
              ].map(i => (
                <div key={i.label}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{i.label}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)', marginTop: 2 }}>{i.value}</div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── MAIN PAGE ─────────────────────────────────────────────────────────────── */
export default function Optimization() {
  const { servers: storeServers, updateServer } = useStore();
  const [localServers, setLocalServers] = useState<SrvType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServers()
      .then(setLocalServers)
      .catch(console.warn)
      .finally(() => setLoading(false));

    // Refresh every 15s as backup to WebSocket
    const timer = setInterval(() => {
      fetchServers()
        .then(setLocalServers)
        .catch(() => {});
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  // Prefer WS-pushed store data, fall back to local fetch
  const list = storeServers.length > 0 ? storeServers : localServers.length > 0 ? localServers : [];

  const handleDone = (id: string, patch: Partial<SrvType>) => {
    setLocalServers(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    updateServer(id, patch);
  };

  // Exclude real server from cost calculations
  const simulated       = list.filter(s => !s.is_real);
  const idleServers     = simulated.filter(s => s.status === 'idle' || s.cpu < 15);
  const overloadServers = simulated.filter(s => s.cpu > 80);
  const monthlyCostNow  = simulated.reduce((a, s) => a + s.cost_hr * 720, 0);
  const monthlyCarbon   = simulated.reduce((a, s) => a + s.carbon_hr * 720, 0);
  const potentialSaving = idleServers.reduce((a, s) => a + s.cost_hr * 720, 0);
  const carbonSaving    = idleServers.reduce((a, s) => a + s.carbon_hr * 720, 0);

  // Cost comparison chart
  const costChart = [
    { name: 'Current',   cost: +monthlyCostNow.toFixed(0) },
    { name: 'Optimized', cost: +(monthlyCostNow - potentialSaving).toFixed(0) },
  ];

  const realCount = list.filter(s => s.is_real).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Savings overview ─────────────────────────────────────────────── */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <SavingsCard
          label="Monthly Spend"
          value={`$${monthlyCostNow.toFixed(0)}`}
          unit=""
          sub={`${simulated.length} cloud servers + ${realCount} real`}
          color="var(--amber)"
          bg="rgba(245,158,11,0.12)"
          icon={DollarSign}
        />
        <SavingsCard
          label="Potential Saving"
          value={`$${potentialSaving.toFixed(0)}`}
          unit="/mo"
          sub={`By terminating ${idleServers.length} idle server${idleServers.length !== 1 ? 's' : ''}`}
          color="var(--green-l)"
          bg="rgba(16,185,129,0.12)"
          icon={TrendingDown}
        />
        <SavingsCard
          label="Monthly Carbon"
          value={monthlyCarbon.toFixed(0)}
          unit="kg CO₂"
          sub="Across all infrastructure"
          color="var(--cyan)"
          bg="rgba(6,182,212,0.12)"
          icon={Server}
        />
        <SavingsCard
          label="Carbon Reducible"
          value={carbonSaving.toFixed(0)}
          unit="kg CO₂"
          sub="By shutting idle servers"
          color="var(--purple)"
          bg="rgba(139,92,246,0.12)"
          icon={Power}
        />
      </div>

      {/* ── Before/After chart + Quick stats ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem' }}>

        {/* Cost comparison bar chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-header">
            <div className="section-title">Cost Comparison</div>
            <div className="section-sub">Current vs. optimized monthly spend</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={costChart} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-2)', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: '0.8rem' }}
                formatter={(v: any) => [`$${v.toLocaleString()}`, 'Monthly Cost']}
              />
              <Bar dataKey="cost" radius={[6,6,0,0]} maxBarSize={80}>
                <Cell fill="#ef4444" />
                <Cell fill="#10b981" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alert summary */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="section-title">Action Summary</div>
          {[
            { label: 'Real Servers',       count: realCount,               color: 'var(--green-l)', bg: 'rgba(16,185,129,0.15)', action: '📡 Live' },
            { label: 'Overloaded Servers', count: overloadServers.length,  color: '#f87171',        bg: 'rgba(239,68,68,0.1)',   action: 'Scale Up' },
            { label: 'Idle Servers',       count: idleServers.length,      color: '#fbbf24',        bg: 'rgba(245,158,11,0.1)',  action: 'Terminate' },
            { label: 'Optimal Servers',    count: simulated.filter(s => s.cpu >= 15 && s.cpu <= 80 && s.status !== 'terminated').length, color: 'var(--green-l)', bg: 'rgba(16,185,129,0.1)', action: '✓ OK' },
          ].map(item => (
            <div key={item.label} style={{
              padding: '0.875rem 1rem',
              background: item.bg,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{item.label}</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: item.color }}>{item.count}</div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: item.color }}>{item.action}</span>
            </div>
          ))}
          <div style={{
            padding: '0.75rem',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid var(--border-accent)',
            borderRadius: 10,
            fontSize: '0.77rem',
            color: 'var(--text-2)',
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            💡 Implement all recommendations to save{' '}
            <strong style={{ color: 'var(--green-l)' }}>${potentialSaving.toFixed(0)}/mo</strong>
          </div>
        </div>
      </div>

      {/* ── Server Recommendation Table ───────────────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="section-header">
          <div>
            <div className="section-title">Server Recommendations</div>
            <div className="section-sub">Click a row to expand details · Actions apply immediately</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {realCount > 0 && <div className="badge badge-green">{realCount} Real</div>}
            <div className="badge badge-purple">{list.length} Servers Analyzed</div>
          </div>
        </div>

        {loading ? (
          <div className="shimmer" style={{ height: 200 }} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Server</th>
                  <th>Type</th>
                  <th>CPU</th>
                  <th>Monthly Cost</th>
                  <th>Risk</th>
                  <th>Recommendation</th>
                  <th>Action</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map(s => (
                  <RecommendRow key={s.id} s={s} onDone={handleDone} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
