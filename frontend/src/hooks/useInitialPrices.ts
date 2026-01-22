import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchPricesWithHistory } from '../api/prices.api';
import { usePriceStore } from '../stores/priceStore';
import type { PriceUpdate } from '@market-data/shared';

interface PricesWithHistory {
  prices: PriceUpdate[];
  history: Record<string, PriceUpdate[]>;
}

/**
 * Fetches initial prices WITH history from the database and hydrates Zustand store.
 * This ensures data is available immediately on page load,
 * before any SSE events arrive.
 *
 * Includes sparkline history data for graphs.
 */
export function useInitialPrices() {
  // Get the hydrate action from store (no subscription needed for actions)
  const { hydratePricesWithHistory } = usePriceStore.getState();

  const query = useQuery<PricesWithHistory, Error>({
    queryKey: ['prices', 'initial'],
    queryFn: () => fetchPricesWithHistory(20), // Last 20 points for sparkline
    staleTime: 30_000, // 30 seconds - SSE will keep it fresh
    gcTime: 5 * 60_000, // 5 minutes
    refetchOnWindowFocus: false, // SSE handles updates
    retry: 2,
  });

  // Hydrate Zustand store when data arrives
  useEffect(() => {
    if (query.data) {
      hydratePricesWithHistory(query.data.prices, query.data.history);
    }
  }, [query.data, hydratePricesWithHistory]);

  return query;
}

