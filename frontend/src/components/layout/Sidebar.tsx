import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Brain, Leaf, Zap,
  Globe, Activity, Bell, Settings,
} from 'lucide-react';
import { useStore } from '@/store/useStore';

const NAV = [
  { to: '/dashboard',                icon: LayoutDashboard, label: 'Live Monitoring',  end: true },
  { to: '/dashboard/forecast',       icon: Brain,           label: 'AI Forecast'              },
  { to: '/dashboard/sustainability', icon: Leaf,            label: 'Green Score'              },
  { to: '/dashboard/optimization',   icon: Zap,             label: 'Optimization'             },
];

export default function Sidebar() {
  const { wsConnected, metrics, alerts } = useStore();
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16,185,129,0.4)',
            flexShrink: 0,
          }}>
            <Globe size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>
              Green<span style={{ color: 'var(--green)' }}>Ops</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontWeight: 500 }}>
              Cloud Sustainability
            </div>
          </div>
        </div>
      </div>

      {/* WS Status */}
      <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            className="pulse-dot"
            style={{ background: wsConnected ? 'var(--green)' : '#ef4444' }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
            {wsConnected ? 'Live Connected' : 'Reconnecting…'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.75rem 0' }}>
        <div style={{ padding: '0 0.75rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          &nbsp;&nbsp;Dashboard
        </div>
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={17} style={{ flexShrink: 0 }} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom stats */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Active alerts */}
        {criticalCount > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0.5rem 0.75rem',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
          }}>
            <Bell size={13} color="#f87171" />
            <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>
              {criticalCount} Critical Alert{criticalCount > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Quick metric */}
        {metrics && (
          <div style={{
            padding: '0.6rem 0.75rem',
            background: 'var(--green-glow)',
            border: '1px solid var(--border-accent)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Activity size={13} color="var(--green)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Requests/sec</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--green-l)', fontVariantNumeric: 'tabular-nums' }}>
                {metrics.rps.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Settings placeholder */}
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8rem' }}>
          <Settings size={14} />
          Settings
        </button>
      </div>
    </aside>
  );
}
