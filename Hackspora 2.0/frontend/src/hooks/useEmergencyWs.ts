import { useEffect, useState, useRef, useCallback } from 'react';
import { Emergency } from '../types';

export function useEmergencyWs(userId: string = 'default-user') {
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    const wsUrl = (import.meta.env.VITE_WS_URL || (import.meta.env.PROD ? 'wss://observa-backend.onrender.com' : `ws://${window.location.hostname}:8000`)) + `/ws/emergency/${userId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('[WS] Connected to Emergency alert stream');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event && msg.data) {
          setLastEvent(msg.event);
          setActiveEmergency(msg.data);
        }
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      setIsConnected(false);
      ws.close();
    };
  }, [userId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return {
    activeEmergency,
    setActiveEmergency,
    isConnected,
    lastEvent
  };
}
