/**
 * CoinGecko API Response Types
 * @see https://docs.coingecko.com/reference/simple-price
 */

/**
 * Response from GET /api/v3/simple/price
 * Contains price data with optional 24h change and volume
 */
export interface CoinGeckoSimplePrice {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
    usd_24h_vol?: number;
  };
}

/**
 * Normalized ticker data used internally
 * Abstraction layer to support multiple API providers
 */
export interface NormalizedTicker {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  volume: string;
}
