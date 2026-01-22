/**
 * Market Data Domain Types
 */

export interface MarketData {
  id: string;
  symbol: string;
  price: number;
  volume: number;
  timestamp: Date;
}

export interface Stock {
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export interface MarketSnapshot {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

export type MarketEvent = 
  | { type: 'PRICE_UPDATE'; data: PriceUpdate }
  | { type: 'MARKET_OPEN'; data: { timestamp: string } }
  | { type: 'MARKET_CLOSE'; data: { timestamp: string } };
