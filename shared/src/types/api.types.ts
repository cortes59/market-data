/**
 * API Response and Request Types
 */

import type { PriceUpdate } from './market.types';

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Price API Response Types
 */
export interface PriceResponse {
  data: PriceUpdate;
}

export interface PricesWithHistoryResponse {
  data: {
    prices: PriceUpdate[];
    history: Record<string, PriceUpdate[]>;
  };
}
