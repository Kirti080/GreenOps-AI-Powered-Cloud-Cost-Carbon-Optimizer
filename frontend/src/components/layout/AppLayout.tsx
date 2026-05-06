import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useStore } from '@/store/useStore';
import { fetchAlerts, fetchServers } from '@/api/client';
import { Bell, Clock } from 'lucide-react';

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  '/dashboard':                { title: 'Live Monitoring',  sub: 'Real-time server metrics & health' },
  '/dashboard/forecast':       { title: 'AI Forecast',      sub: 'LSTM-powered traffic prediction for next 12h' },
  '/dashboard/sustainability': { title: 'Green Score',       sub: 'Carbon footprint & environmental impact' },
  '/dashboard/optimization':   { title: 'Optimization',     sub: 'Cost savings & server efficiency actions' },
};

function LiveClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-IN', { hour12: false }));
  useEffect(() => {
    const id = setInterval(
      () => setTime(new Date().toLocaleTimeString('en-IN', { hour12: false })),
      1000,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: 'var(--text-3)' }}>
      {time}
    </span>
  );
}

export default function AppLayout() {
  useWebSocket(); // initiate persistent WS connection
  const { setAlerts, setServers, alerts } = useStore();
  const location = useLocation();
  const pageInfo = PAGE_TITLES[location.pathname] ?? { title: 'GreenOps', sub: 'Cloud Sustainability Dashboard' };
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  useEffect(() => {
    fetchAlerts().then(setAlerts).catch(console.warn);
    fetchServers().then(setServers).catch(console.warn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-shell">
      <div className="bg-mesh" />
      <Sidebar />
      <div className="main-content">
        {/* Header */}
        <header className="main-header">
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>
              {pageInfo.title}
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
              {pageInfo.sub}
            </p>
          </div>

          {/* Header right: time + alert count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)' }}>
              <Clock size={13} />
              <LiveClock />
            </div>

            {criticalCount > 0 && (
              <div className="badge badge-red" style={{ gap: 5 }}>
                <Bell size={10} />
                {criticalCount} Critical
              </div>
            )}

            <div style={{
              width: 36, height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.85rem', color: 'white',
              cursor: 'pointer',
            }}>
              K
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
