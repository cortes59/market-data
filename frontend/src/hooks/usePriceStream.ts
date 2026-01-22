import { useSSE } from './useSSE';
import { useInitialPrices } from './useInitialPrices';
import { usePriceStore, selectConnectionStatus } from '../stores/priceStore';
import type { MarketEvent } from '@market-data/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Combined hook for price data:
 * 1. Fetches initial prices from REST API (immediate data on page load)
 * 2. Connects to SSE for real-time updates
 *
 * Flow: Page Load → REST API → Hydrate Store → SSE → Live Updates
 */
export function usePriceStream() {
  // Step 1: Fetch initial prices from database (TanStack Query)
  const { isPending: isLoadingInitial, error: initialError } = useInitialPrices();

  // Use getState() for actions - they're stable and don't need subscriptions
  const { updatePrice } = usePriceStore.getState();

  // Subscribe only to reactive state (connection status)
  const connectionStatus = usePriceStore(selectConnectionStatus);

  // Step 2: Connect to SSE for live updates
  const { reconnect } = useSSE(`${API_URL}/realtime/prices`, {
    onMessage: (event: MarketEvent) => {
      if (event.type === 'PRICE_UPDATE') {
        updatePrice(event.data);
      }
    },
  });

  return {
    connectionStatus,
    reconnect,
    isLoadingInitial,
    initialError,
  };
}
