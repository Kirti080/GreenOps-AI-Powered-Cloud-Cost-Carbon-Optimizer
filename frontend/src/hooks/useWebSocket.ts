import { useEffect, useRef } from 'react';
import { WS_URL } from '@/api/client';
import { useStore } from '@/store/useStore';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>();
  const retriesRef = useRef(0);
  const { setMetrics, setWsConnected, setServers } = useStore();

  const connect = () => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        retriesRef.current = 0; // reset backoff on success
        console.log('[WS] Connected');
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'METRICS_UPDATE') {
            setMetrics(msg.payload);
          } else if (msg.type === 'SERVERS_UPDATE') {
            setServers(msg.payload);
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Exponential backoff: 1s, 2s, 4s, 8s, max 15s
        const delay = Math.min(1000 * Math.pow(2, retriesRef.current), 15000);
        retriesRef.current++;
        console.log(`[WS] Disconnected. Reconnecting in ${(delay / 1000).toFixed(0)}s…`);
        reconnectRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
    } catch (e) {
      console.warn('[WS] Connection failed', e);
      const delay = Math.min(1000 * Math.pow(2, retriesRef.current), 15000);
      retriesRef.current++;
      reconnectRef.current = setTimeout(connect, delay);
    }
  };

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
