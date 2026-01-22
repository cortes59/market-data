import { Injectable, Logger, Inject, OnModuleDestroy } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import Decimal from 'decimal.js';
import { CoinGeckoClient } from './coingecko.client';
import { RateLimitException } from './exceptions/rate-limit.exception';
import { DRIZZLE_TOKEN } from '../database/database.module';
import { marketData } from '../database/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import { MarketEvent } from '@market-data/shared';

type DrizzleDB = PostgresJsDatabase<typeof schema>;

/**
 * Market Data Ingestion Service
 * Polls CoinGecko API for BTCUSDT price data, persists to database,
 * and emits events for real-time updates.
 *
 * Rate Limit Strategy:
 * - Base interval: 30 seconds (CoinGecko free tier: ~10-30 req/min)
 * - On RateLimitException: Exponential backoff (skip 1, 2, 4, 8... intervals)
 * - Circuit breaker: Opens after 5 consecutive failures (excludes rate limits)
 */
@Injectable()
export class IngestionService implements OnModuleDestroy {
  private readonly logger = new Logger(IngestionService.name);
  private readonly symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];

  // Circuit breaker state
  private consecutiveFailures = 0;
  private circuitOpen = false;
  private circuitOpenedAt: number | null = null;

  // Rate limit backoff state
  private rateLimitBackoff = 0;
  private intervalsSkipped = 0;

  // Configuration
  private readonly maxFailures: number;
  private readonly circuitResetMs: number;

  constructor(
    private readonly coinGeckoClient: CoinGeckoClient,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    @Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDB,
  ) {
    this.maxFailures = this.configService.get<number>(
      'CIRCUIT_BREAKER_THRESHOLD',
      5,
    );
    this.circuitResetMs = this.configService.get<number>(
      'CIRCUIT_BREAKER_RESET_MS',
      30000,
    );

    this.logger.log(
      `Ingestion service initialized for ${this.symbols.join(', ')} (interval: 30s, circuit breaker: ${this.maxFailures} failures)`,
    );
  }

  /**
   * Main polling method - runs every 30 seconds
   * CoinGecko free tier allows ~10-30 requests per minute
   * Fetches ALL symbols in a single API call for efficiency
   */
  @Interval(30000)
  async pollMarketData(): Promise<void> {
    // Check if circuit breaker allows request
    if (!this.shouldProceed()) {
      return;
    }

    // Check if we're in rate limit backoff
    if (this.isInBackoff()) {
      return;
    }

    try {
      // Fetch all symbols in a single API call
      const tickers = await this.coinGeckoClient.getTickers(this.symbols);
      const timestamp = new Date();

      // Process each ticker
      for (const ticker of tickers) {
        const price = new Decimal(ticker.lastPrice);
        const change = new Decimal(ticker.priceChange);
        const changePercent = new Decimal(ticker.priceChangePercent);
        const volume = new Decimal(ticker.volume);

        // Persist to database
        await this.persistMarketData(ticker.symbol, price, volume, timestamp);

        // Emit price update event
        this.emitPriceUpdate(ticker.symbol, price, change, changePercent, timestamp);

        this.logger.log(
          `${ticker.symbol}: $${price.toFixed(2)} (${changePercent.toFixed(2)}%)`,
        );
      }

      // Reset counters on success
      this.handleSuccess();
    } catch (error) {
      if (error instanceof RateLimitException) {
        this.handleRateLimit(error);
      } else {
        this.handleFailure(
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
    }
  }

  /**
   * Check if we're in rate limit backoff period
   */
  private isInBackoff(): boolean {
    if (this.rateLimitBackoff === 0) {
      return false;
    }

    this.intervalsSkipped++;
    if (this.intervalsSkipped < this.rateLimitBackoff) {
      this.logger.debug(
        `Rate limit backoff: skipping interval ${this.intervalsSkipped}/${this.rateLimitBackoff}`,
      );
      return true;
    }

    // Backoff complete, reset
    this.logger.log(
      `Rate limit backoff complete after ${this.rateLimitBackoff} intervals`,
    );
    this.rateLimitBackoff = 0;
    this.intervalsSkipped = 0;
    return false;
  }

  /**
   * Persist market data to database
   */
  private async persistMarketData(
    symbol: string,
    price: Decimal,
    volume: Decimal,
    timestamp: Date,
  ): Promise<void> {
    try {
      await this.db.insert(marketData).values({
        symbol,
        price: price.toString(),
        volume: volume.toString(),
        timestamp,
      });
    } catch (error) {
      // Emit failure event for monitoring
      this.eventEmitter.emit('market.db_failure', {
        symbol,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: timestamp.toISOString(),
      });
      throw error;
    }
  }

  /**
   * Emit price update event
   */
  private emitPriceUpdate(
    symbol: string,
    price: Decimal,
    change: Decimal,
    changePercent: Decimal,
    timestamp: Date,
  ): void {
    const event: MarketEvent = {
      type: 'PRICE_UPDATE',
      data: {
        symbol,
        price: price.toNumber(),
        change: change.toNumber(),
        changePercent: changePercent.toNumber(),
        timestamp: timestamp.toISOString(),
      },
    };

    this.eventEmitter.emit('market.price_update', event);
  }

  /**
   * Check if circuit breaker allows the request
   */
  private shouldProceed(): boolean {
    if (!this.circuitOpen) {
      return true;
    }

    // Check if circuit should auto-reset
    const elapsed = Date.now() - (this.circuitOpenedAt || 0);
    if (elapsed >= this.circuitResetMs) {
      this.logger.log('Circuit breaker reset - resuming polling');
      this.circuitOpen = false;
      this.circuitOpenedAt = null;
      this.consecutiveFailures = 0;
      return true;
    }

    return false;
  }

  /**
   * Handle successful request - reset failure counter
   */
  private handleSuccess(): void {
    if (this.consecutiveFailures > 0) {
      this.logger.log('Request succeeded - resetting failure counter');
    }
    this.consecutiveFailures = 0;
  }

  /**
   * Handle rate limit exception - exponential backoff
   */
  private handleRateLimit(error: RateLimitException): void {
    // Exponential backoff: 1, 2, 4, 8 intervals (max 8 = 4 minutes at 30s interval)
    this.rateLimitBackoff = Math.min(
      this.rateLimitBackoff === 0 ? 1 : this.rateLimitBackoff * 2,
      8,
    );
    this.intervalsSkipped = 0;

    const waitTime = this.rateLimitBackoff * 30;
    this.logger.warn(
      `${error.message} - backing off for ${this.rateLimitBackoff} intervals (~${waitTime}s)`,
    );

    // Don't count rate limits toward circuit breaker
  }

  /**
   * Handle failed request - increment failure counter, potentially open circuit
   */
  private handleFailure(reason: string): void {
    this.consecutiveFailures++;
    this.logger.error(`Failed to persist market data: ${reason}`);

    if (this.consecutiveFailures >= this.maxFailures && !this.circuitOpen) {
      this.circuitOpen = true;
      this.circuitOpenedAt = Date.now();
      this.logger.warn(
        `Circuit breaker OPEN after ${this.consecutiveFailures} failures. ` +
          `Pausing for ${this.circuitResetMs}ms`,
      );
    } else {
      this.logger.warn(
        `Failure ${this.consecutiveFailures}/${this.maxFailures}: ${reason}`,
      );
    }
  }

  /**
   * Graceful shutdown
   */
  onModuleDestroy(): void {
    this.logger.log('Ingestion service shutting down');
  }
}
