import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { PriceUpdate } from '@market-data/shared';

interface PriceState {
  prices: Map<string, PriceUpdate>;
  history: Map<string, PriceUpdate[]>; // Last 20 for sparkline
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  isHydrated: boolean; // Whether initial data has been loaded
  updatePrice: (update: PriceUpdate) => void;
  hydratePricesWithHistory: (
    prices: PriceUpdate[],
    history: Record<string, PriceUpdate[]>,
  ) => void;
  setConnectionStatus: (status: PriceState['connectionStatus']) => void;
}

export const usePriceStore = create<PriceState>()(
  subscribeWithSelector((set) => ({
    prices: new Map(),
    history: new Map(),
    connectionStatus: 'connecting',
    isHydrated: false,

    updatePrice: (update) =>
      set((state) => {
        const newPrices = new Map(state.prices);
        newPrices.set(update.symbol, update);

        // Keep last 20 for sparkline (rolling window)
        const newHistory = new Map(state.history);
        const existing = newHistory.get(update.symbol) || [];
        newHistory.set(update.symbol, [...existing.slice(-19), update]);

        return { prices: newPrices, history: newHistory };
      }),

    hydratePricesWithHistory: (
      prices: PriceUpdate[],
      history: Record<string, PriceUpdate[]>,
    ) =>
      set((state) => {
        // Only hydrate if not already hydrated (avoid overwriting SSE updates)
        if (state.isHydrated) return state;

        const newPrices = new Map(state.prices);
        const newHistory = new Map(state.history);

        // Set latest prices
        for (const price of prices) {
          newPrices.set(price.symbol, price);
        }

        // Set historical data for sparklines
        for (const [symbol, priceHistory] of Object.entries(history)) {
          newHistory.set(symbol, priceHistory);
        }

        return { prices: newPrices, history: newHistory, isHydrated: true };
      }),

    setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  }))
);

// Selector helpers for type-safe access
export const selectPrice = (symbol: string) => (state: PriceState) =>
  state.prices.get(symbol);

export const selectHistory = (symbol: string) => (state: PriceState) =>
  state.history.get(symbol) || [];

export const selectConnectionStatus = (state: PriceState) =>
  state.connectionStatus;

export const selectIsHydrated = (state: PriceState) => state.isHydrated;

export const selectAllPrices = (state: PriceState) => state.prices;
