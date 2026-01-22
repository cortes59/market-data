import { useEffect, useRef, useCallback } from 'react';
import { usePriceStore } from '../stores/priceStore';
import type { MarketEvent } from '@market-data/shared';

interface SSEOptions {
  onMessage?: (event: MarketEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  maxRetries?: number;
}

export function useSSE(url: string, options: SSEOptions = {}) {
  const { maxRetries = 10 } = options;
  const setConnectionStatus = usePriceStore((s) => s.setConnectionStatus);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const reconnectTimeoutRef = useRef<number>();

  // Store callbacks in refs to avoid recreating connect function
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    // Cleanup previous connection
    eventSourceRef.current?.close();
    clearTimeout(reconnectTimeoutRef.current);

    setConnectionStatus('connecting');
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      retriesRef.current = 0; // Reset on successful connection
      setConnectionStatus('connected');
      optionsRef.current.onConnect?.();
    };

    es.onerror = () => {
      es.close();
      setConnectionStatus('disconnected');
      optionsRef.current.onDisconnect?.();

      // Exponential backoff: 1s, 2s, 4s, 8s... max 30s
      if (retriesRef.current < maxRetries) {
        const delay = Math.min(1000 * 2 ** retriesRef.current, 30000);
        retriesRef.current++;
        reconnectTimeoutRef.current = window.setTimeout(connect, delay);
      }
    };

    es.addEventListener('connection', (e) => {
      // Handle initial connection event from backend
      console.log('SSE connected:', JSON.parse(e.data));
    });

    es.addEventListener('price_update', (e) => {
      const event = JSON.parse(e.data) as MarketEvent;
      optionsRef.current.onMessage?.(event);
    });
  }, [url, setConnectionStatus, maxRetries]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return {
    reconnect: connect,
  };
}
