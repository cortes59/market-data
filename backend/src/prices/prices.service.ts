import { Injectable, Inject, Logger } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_TOKEN } from '../database/database.module';
import * as schema from '../database/schema';
import type { PriceUpdate } from '@market-data/shared';

type DrizzleDB = PostgresJsDatabase<typeof schema>;

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);

  constructor(@Inject(DRIZZLE_TOKEN) private readonly db: DrizzleDB) {}

  /**
   * Get the latest price for each symbol
   * Uses a subquery to find the most recent entry per symbol
   */
  async getLatestPrices(): Promise<PriceUpdate[]> {
    try {
      // Get the latest entry for each symbol using DISTINCT ON (PostgreSQL)
      const results = await this.db.execute(sql`
        SELECT DISTINCT ON (symbol)
          symbol,
          price,
          timestamp
        FROM market_data
        ORDER BY symbol, timestamp DESC
      `);

      // We need to calculate change from the previous price
      const prices: PriceUpdate[] = [];
      
      for (const row of results) {
        const symbol = row.symbol as string;
        const currentPrice = parseFloat(row.price as string);
        const timestamp = row.timestamp as Date;

        // Get the previous price for calculating change
        const previousResult = await this.db.execute(sql`
          SELECT price
          FROM market_data
          WHERE symbol = ${symbol}
          ORDER BY timestamp DESC
          OFFSET 1
          LIMIT 1
        `);

        let change = 0;
        let changePercent = 0;

        if (previousResult.length > 0) {
          const previousPrice = parseFloat(previousResult[0].price as string);
          change = currentPrice - previousPrice;
          changePercent = previousPrice > 0 
            ? (change / previousPrice) * 100 
            : 0;
        }

        prices.push({
          symbol,
          price: currentPrice,
          change,
          changePercent,
          timestamp: timestamp.toISOString(),
        });
      }

      this.logger.log(`Fetched latest prices for ${prices.length} symbols`);
      return prices;
    } catch (error) {
      this.logger.error('Failed to fetch latest prices', error);
      throw error;
    }
  }

  /**
   * Get the latest price for a specific symbol
   */
  async getLatestPrice(symbol: string): Promise<PriceUpdate | null> {
    try {
      const results = await this.db
        .select()
        .from(schema.marketData)
        .where(eq(schema.marketData.symbol, symbol))
        .orderBy(desc(schema.marketData.timestamp))
        .limit(2);

      if (results.length === 0) {
        return null;
      }

      const latest = results[0];
      const currentPrice = parseFloat(latest.price);
      
      let change = 0;
      let changePercent = 0;

      if (results.length > 1) {
        const previousPrice = parseFloat(results[1].price);
        change = currentPrice - previousPrice;
        changePercent = previousPrice > 0 
          ? (change / previousPrice) * 100 
          : 0;
      }

      return {
        symbol: latest.symbol,
        price: currentPrice,
        change,
        changePercent,
        timestamp: latest.timestamp.toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch price for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Get historical prices for sparkline (last N data points per symbol)
   */
  async getHistoricalPrices(
    symbol: string,
    limit: number = 20,
  ): Promise<PriceUpdate[]> {
    try {
      const results = await this.db
        .select()
        .from(schema.marketData)
        .where(eq(schema.marketData.symbol, symbol))
        .orderBy(desc(schema.marketData.timestamp))
        .limit(limit);

      if (results.length === 0) {
        return [];
      }

      // Reverse to get chronological order (oldest first)
      const chronological = results.reverse();

      return chronological.map((row, index) => {
        const price = parseFloat(row.price);
        let change = 0;
        let changePercent = 0;

        if (index > 0) {
          const previousPrice = parseFloat(chronological[index - 1].price);
          change = price - previousPrice;
          changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
        }

        return {
          symbol: row.symbol,
          price,
          change,
          changePercent,
          timestamp: row.timestamp.toISOString(),
        };
      });
    } catch (error) {
      this.logger.error(`Failed to fetch history for ${symbol}`, error);
      throw error;
    }
  }

  /**
   * Get all prices with their history (for initial page load)
   */
  async getPricesWithHistory(
    historyLimit: number = 20,
  ): Promise<{ prices: PriceUpdate[]; history: Record<string, PriceUpdate[]> }> {
    const prices = await this.getLatestPrices();
    const history: Record<string, PriceUpdate[]> = {};

    // Fetch history for each symbol in parallel
    await Promise.all(
      prices.map(async (price) => {
        history[price.symbol] = await this.getHistoricalPrices(
          price.symbol,
          historyLimit,
        );
      }),
    );

    return { prices, history };
  }
}

