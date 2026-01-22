import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { isAxiosError } from 'axios';
import Decimal from 'decimal.js';
import { CoinGeckoSimplePrice, NormalizedTicker } from './types/coingecko.types';
import { RateLimitException } from './exceptions/rate-limit.exception';

/**
 * HTTP Client for CoinGecko REST API
 * No API key required, no geo-restrictions
 * @see https://docs.coingecko.com/reference/simple-price
 */
@Injectable()
export class CoinGeckoClient {
  private readonly logger = new Logger(CoinGeckoClient.name);
  private readonly baseUrl: string;

  // Map internal symbols to CoinGecko coin IDs
  private readonly symbolToCoinId: Record<string, string> = {
    BTCUSDT: 'bitcoin',
    ETHUSDT: 'ethereum',
    BNBUSDT: 'binancecoin',
    SOLUSDT: 'solana',
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'COINGECKO_API_URL',
      'https://api.coingecko.com/api/v3',
    );
  }

  /**
   * Get all supported symbols
   */
  getSupportedSymbols(): string[] {
    return Object.keys(this.symbolToCoinId);
  }

  /**
   * Fetch price data for multiple symbols in a single API call
   * @param symbols Array of trading pair symbols (e.g., ['BTCUSDT', 'ETHUSDT'])
   * @returns Array of normalized ticker data
   * @throws RateLimitException when API returns 429
   * @throws Error for other API failures
   */
  async getTickers(symbols: string[]): Promise<NormalizedTicker[]> {
    // Map symbols to coin IDs
    const coinIds = symbols.map((symbol) => {
      const coinId = this.symbolToCoinId[symbol];
      if (!coinId) {
        throw new Error(`Unknown symbol: ${symbol}`);
      }
      return coinId;
    });

    const url = `${this.baseUrl}/simple/price`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<CoinGeckoSimplePrice>(url, {
          params: {
            ids: coinIds.join(','), // Batch all coins in one request
            vs_currencies: 'usd',
            include_24hr_change: 'true',
            include_24hr_vol: 'true',
          },
          timeout: 10000,
        }),
      );

      // Transform response for each symbol
      const tickers: NormalizedTicker[] = [];

      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        const coinId = coinIds[i];
        const data = response.data[coinId];

        if (!data) {
          this.logger.warn(`No data returned for ${coinId} (${symbol})`);
          continue;
        }

        // Use decimal.js for all financial calculations
        const currentPrice = new Decimal(data.usd);
        const changePercent24h = new Decimal(data.usd_24h_change || 0);
        const volume24h = new Decimal(data.usd_24h_vol || 0);

        // Calculate absolute 24h change from percentage
        const changePercentDecimal = changePercent24h.dividedBy(100);
        const previousPrice = currentPrice.dividedBy(
          new Decimal(1).plus(changePercentDecimal),
        );
        const change24h = currentPrice.minus(previousPrice);

        tickers.push({
          symbol,
          lastPrice: currentPrice.toString(),
          priceChange: change24h.toString(),
          priceChangePercent: changePercent24h.toString(),
          volume: volume24h.toString(),
        });
      }

      return tickers;
    } catch (error) {
      this.handleError(error, symbols.join(','));
      throw error;
    }
  }

  /**
   * Fetch price data for a single symbol (legacy method)
   * @deprecated Use getTickers() for batch requests
   */
  async getTicker(symbol: string): Promise<NormalizedTicker> {
    const tickers = await this.getTickers([symbol]);
    if (tickers.length === 0) {
      throw new Error(`No data returned for ${symbol}`);
    }
    return tickers[0];
  }

  /**
   * Handle and categorize API errors
   * @throws RateLimitException for 429 responses
   */
  private handleError(error: unknown, symbol: string): void {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const retryAfter = error.response?.headers?.['retry-after'];

      if (status === 429) {
        this.logger.warn(`Rate limited by CoinGecko API for ${symbol}`);
        throw new RateLimitException(
          'CoinGecko',
          retryAfter ? parseInt(retryAfter, 10) : undefined,
        );
      } else if (status && status >= 500) {
        this.logger.warn(`CoinGecko server error for ${symbol}: ${status}`);
      } else if (error.code === 'ECONNABORTED') {
        this.logger.warn(`Request timeout for ${symbol}`);
      } else {
        this.logger.error(
          `CoinGecko API error for ${symbol}: ${status} - ${error.message}`,
        );
      }
    } else if (error instanceof Error) {
      this.logger.error(`Error fetching ${symbol}: ${error.message}`);
    } else {
      this.logger.error(`Unknown error fetching ${symbol}:`, error);
    }
  }
}
