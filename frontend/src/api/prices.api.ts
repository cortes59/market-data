/**
 * Prices API Client
 * Fetches price data from REST endpoints
 */

import type { PriceUpdate, PriceResponse, PricesWithHistoryResponse } from '@market-data/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch latest prices with history for all symbols (for initial page load)
 * Returns prices + sparkline history data
 */
export async function fetchPricesWithHistory(
  historyLimit: number = 20,
): Promise<{ prices: PriceUpdate[]; history: Record<string, PriceUpdate[]> }> {
  const response = await apiFetch<PricesWithHistoryResponse>(
    `/api/prices?historyLimit=${historyLimit}`,
  );
  return response.data;
}

/**
 * Fetch latest price for a specific symbol
 */
export async function fetchLatestPrice(symbol: string): Promise<PriceUpdate> {
  const response = await apiFetch<PriceResponse>(`/api/prices/${symbol}`);
  return response.data;
}

