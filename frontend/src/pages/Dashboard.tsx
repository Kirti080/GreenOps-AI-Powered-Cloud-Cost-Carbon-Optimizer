import { useEffect, useState, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Cpu, MemoryStick, Activity, Leaf, Server, AlertTriangle, CheckCircle, Info, XCircle, Wifi } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { fetchHistory, fetchServers, fetchAlerts } from '@/api/client';
import type { HistoryPoint, Server as SrvType, Alert } from '@/store/useStore';
import GlobeScene from '@/components/3d/GlobeScene';

/* ── Custom tooltip ────────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const ts = new Date(label).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return (
    <div style={{
      background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '0.65rem 1rem', backdropFilter: 'blur(20px)',
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: 6 }}>{ts}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: 'var(--text-2)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Animated counter ──────────────────────────────────────────────────────── */
function AnimCounter({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [displayed, setDisplayed] = useState(value);
  const prevRef = useRef(value);
  useEffect(() => {
    const start = prevRef.current;
    const end   = value;
    const diff  = end - start;
    const dur   = 400;
    const t0    = Date.now();
    const step  = () => {
      const prog = Math.min((Date.now() - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      setDisplayed(+(start + diff * ease).toFixed(decimals));
      if (prog < 1) requestAnimationFrame(step);
      else prevRef.current = end;
    };
    requestAnimationFrame(step);
  }, [value, decimals]);
  return <span className="stat-number">{displayed.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}

/* ── KPI Card ──────────────────────────────────────────────────────────────── */
function KPICard({
  icon: Icon, label, value, unit, delta, color, bg,
}: {
  icon: any; label: string; value: number; unit: string;
  delta?: string; color: string; bg: string;
}) {
  return (
    <div className="card card-glow kpi-card anim-fade-up" style={{ '--color': color } as any}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="kpi-icon" style={{ background: bg }}>
            <Icon size={18} color={color} />
          </div>
          <div className="kpi-label">{label}</div>
        </div>
        {delta && (
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: delta.startsWith('+') ? 'var(--green-l)' : '#f87171' }}>
            {delta}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <div className="kpi-value" style={{ color }}>
          <AnimCounter value={value} decimals={unit === 'kg/hr' ? 4 : 0} />
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 500 }}>{unit}</div>
      </div>
      {/* Mini sparkline bar */}
      <div className="progress">
        <div className="progress-fill" style={{ width: `${Math.min(value / (unit === '%' ? 100 : unit === 'rps' ? 2000 : 1) * 100, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

/* ── Server Status Row ─────────────────────────────────────────────────────── */
function ServerRow({ s }: { s: SrvType }) {
  const statusColor = s.status === 'running' ? 'var(--green)' : s.status === 'idle' ? 'var(--amber)' : 'var(--text-3)';
  const cpuColor    = s.cpu > 80 ? '#ef4444' : s.cpu > 60 ? '#f59e0b' : 'var(--green)';
  return (
    <tr style={s.is_real ? { background: 'rgba(16,185,129,0.04)', borderLeft: '2px solid var(--green)' } : undefined}>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="pulse-dot" style={{ background: statusColor }} />
          <div>
            <span style={{ color: 'var(--text)', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', display: 'block' }}>{s.name}</span>
            {s.type && <span style={{ fontSize: '0.66rem', color: 'var(--text-3)' }}>{s.type}</span>}
          </div>
          {s.is_real && (
            <span className="badge badge-green" style={{ fontSize: '0.55rem', padding: '1px 6px', letterSpacing: '0.05em' }}>
              REAL
            </span>
          )}
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="badge badge-grey" style={{ fontSize: '0.7rem' }}>{s.region}</span>
          {s.zone && <span style={{ fontSize: '0.6rem', color: 'var(--text-3)' }}>{s.zone}</span>}
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 80 }}>
          <span style={{ fontSize: '0.8rem', color: cpuColor, fontWeight: 600 }}>{s.cpu.toFixed(1)}%</span>
          <div className="progress" style={{ height: 4 }}>
            <div className="progress-fill" style={{ width: `${s.cpu}%`, background: cpuColor }} />
          </div>
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 80 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--cyan)', fontWeight: 600 }}>{s.memory.toFixed(1)}%</span>
          <div className="progress" style={{ height: 4 }}>
            <div className="progress-fill" style={{ width: `${s.memory}%`, background: 'var(--cyan)' }} />
          </div>
        </div>
      </td>
      <td><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--amber)' }}>{s.is_real ? 'local' : `$${s.cost_hr}/hr`}</span></td>
      <td>
        <span className={`badge ${s.status === 'running' ? 'badge-green' : s.status === 'idle' ? 'badge-amber' : 'badge-grey'}`}>
          {s.status}
        </span>
      </td>
    </tr>
  );
}

/* ── Alert Item ────────────────────────────────────────────────────────────── */
const ALERT_ICON: Record<string, any> = {
  critical: XCircle, warning: AlertTriangle, info: Info, success: CheckCircle,
};
const ALERT_COLOR: Record<string, string> = {
  critical: '#f87171', warning: '#fbbf24', info: '#22d3ee', success: 'var(--green-l)',
};

function AlertItem({ a }: { a: Alert }) {
  const Icon = ALERT_ICON[a.severity] ?? Info;
  const color = ALERT_COLOR[a.severity] ?? 'var(--text-2)';
  const ago = Math.round((Date.now() - a.ts) / 60000);
  return (
    <div className={`alert-item alert-${a.severity}`}>
      <Icon size={16} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>{a.title}</div>
        <div style={{ fontSize: '0.77rem', color: 'var(--text-3)', marginTop: 2 }}>{a.message}</div>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', flexShrink: 0 }}>
        {ago < 1 ? 'just now' : ago < 60 ? `${ago}m ago` : `${Math.round(ago / 60)}h ago`}
      </div>
    </div>
  );
}

/* ── MAIN PAGE ─────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { metrics, metricsHistory, servers, alerts, setServers, setAlerts } = useStore();
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([fetchHistory(6), fetchServers(), fetchAlerts()])
      .then(([h, s, a]) => {
        if (!mounted) return;
        setHistory(h); setServers(s); setAlerts(a);
      })
      .catch(console.warn)
      .finally(() => setLoading(false));

    // Refresh server list every 15s as backup (WS pushes every 10s)
    const serverTimer = setInterval(() => {
      fetchServers()
        .then(s => { if (mounted) setServers(s); })
        .catch(() => {});
    }, 15000);

    return () => { mounted = false; clearInterval(serverTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Merge live ticks into chart data
  const chartData = [...history.slice(-72), ...metricsHistory].map(p => ({
    ts:  p.ts,
    rps: p.rps,
    cpu: p.cpu_avg,
    mem: p.memory_avg,
  }));

  const m = metrics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Hero: Globe + KPI cards ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', minHeight: 340 }}>

        {/* Globe */}
        <div className="card card-glow" style={{ position: 'relative', overflow: 'hidden', minHeight: 320 }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <GlobeScene />
          </div>
          <div style={{
            position: 'absolute', bottom: 20, left: 24, right: 24,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Global Infrastructure
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 2 }}>
                {m?.active_servers ?? '—'} active · {m?.total_servers ?? '—'} total servers across 4 regions
              </div>
            </div>
            <div className="badge badge-green" style={{ fontSize: '0.75rem' }}>
              <div className="pulse-dot" style={{ width: 6, height: 6, background: 'var(--green-l)' }} />
              Live
            </div>
          </div>
        </div>

        {/* KPI stack */}
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <KPICard icon={Activity}   label="Requests / sec" value={m?.rps ?? 0}         unit="rps"   color="var(--green-l)"  bg="rgba(16,185,129,0.12)"  delta="+12%" />
          <KPICard icon={Cpu}        label="Avg CPU Usage"  value={m?.cpu_avg ?? 0}      unit="%"     color="var(--cyan)"     bg="rgba(6,182,212,0.12)"   delta={m && m.cpu_avg > 75 ? '+high' : undefined} />
          <KPICard icon={MemoryStick} label="Memory Usage"  value={m?.memory_avg ?? 0}  unit="%"     color="var(--purple)"   bg="rgba(139,92,246,0.12)"  />
          <KPICard icon={Leaf}       label="Carbon Rate"    value={m?.carbon_rate ?? 0}  unit="kg/hr" color="var(--amber)"    bg="rgba(245,158,11,0.12)"  />
        </div>
      </div>

      {/* ── Traffic chart + Server table ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Traffic Area Chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-header">
            <div>
              <div className="section-title">Traffic & CPU</div>
              <div className="section-sub">Last 6 hours · Updates every 2s</div>
            </div>
            <div className="badge badge-green">
              <Wifi size={10} />
              Live
            </div>
          </div>
          {loading ? (
            <div className="shimmer" style={{ height: 200 }} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="ts" tickFormatter={v => new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 5)} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-3)' }} />
                <Area type="monotone" dataKey="rps" name="RPS" stroke="#10b981" strokeWidth={2} fill="url(#gRps)" dot={false} />
                <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#06b6d4" strokeWidth={1.5} fill="url(#gCpu)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Live stats mini grid */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-header">
            <div>
              <div className="section-title">System Health</div>
              <div className="section-sub">Current snapshot</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            {[
              { label: 'Network I/O',    value: `${m?.network_mbps ?? '—'} Mbps`, color: 'var(--cyan)' },
              { label: 'Latency P99',    value: `${m?.latency_p99 ?? '—'} ms`,    color: m && m.latency_p99 > 200 ? '#f87171' : 'var(--green-l)' },
              { label: 'Error Rate',     value: `${m?.error_rate ?? '—'}%`,        color: m && m.error_rate > 0.5 ? '#fbbf24' : 'var(--green-l)' },
              { label: 'Cost / Hour',    value: `$${m?.cost_per_hr ?? '—'}`,       color: 'var(--amber)' },
              { label: 'Active Servers', value: `${m?.active_servers ?? '—'} / ${m?.total_servers ?? '—'}`, color: 'var(--purple)' },
              { label: 'Carbon / Hour',  value: `${m?.carbon_rate ?? '—'} kg`,     color: 'var(--amber)' },
            ].map(item => (
              <div key={item.label} style={{
                padding: '0.875rem 1rem',
                background: 'rgba(255,255,255,0.025)',
                borderRadius: 10,
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: item.color, fontVariantNumeric: 'tabular-nums' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Server Table ───────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="section-header">
          <div>
            <div className="section-title">Server Fleet</div>
            <div className="section-sub">{servers.length} servers across all regions</div>
          </div>
          <span className="badge badge-cyan">
            <Server size={10} />
            {servers.filter(s => s.status === 'running').length} Running
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Server</th>
                <th>Region</th>
                <th>CPU</th>
                <th>Memory</th>
                <th>Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {servers.length === 0
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j}><div className="shimmer" style={{ height: 16, width: j === 0 ? 120 : 70 }} /></td>
                      ))}
                    </tr>
                  ))
                : servers.map(s => <ServerRow key={s.id} s={s} />)
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Alerts ─────────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="section-header">
          <div className="section-title">Active Alerts</div>
          <span className="badge badge-red">{alerts.filter(a => a.severity === 'critical').length} Critical</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.length === 0
            ? <div className="shimmer" style={{ height: 60 }} />
            : alerts.map(a => <AlertItem key={a.id} a={a} />)
          }
        </div>
      </div>

    </div>
  );
}
