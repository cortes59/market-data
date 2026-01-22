import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PricesService } from './prices.service';
import type { PriceUpdate, PricesWithHistoryResponse } from '@market-data/shared';

@Controller('api/prices')
export class PricesController {
  private readonly logger = new Logger(PricesController.name);

  constructor(private readonly pricesService: PricesService) {}

  /**
   * GET /api/prices
   * Returns the latest prices with history for sparklines
   * Query params:
   *   - includeHistory: boolean (default: true)
   *   - historyLimit: number (default: 20)
   */
  @Get()
  async getLatestPrices(
    @Query('includeHistory') includeHistory?: string,
    @Query('historyLimit') historyLimit?: string,
  ): Promise<{ data: PriceUpdate[] } | PricesWithHistoryResponse> {
    const shouldIncludeHistory = includeHistory !== 'false';
    const limit = historyLimit ? parseInt(historyLimit, 10) : 20;

    if (shouldIncludeHistory) {
      this.logger.log(
        `Fetching prices with history (limit: ${limit}) for all symbols`,
      );
      const result = await this.pricesService.getPricesWithHistory(limit);
      return { data: result };
    }

    this.logger.log('Fetching latest prices for all symbols');
    const prices = await this.pricesService.getLatestPrices();
    return { data: prices };
  }

  /**
   * GET /api/prices/:symbol
   * Returns the latest price for a specific symbol
   */
  @Get(':symbol')
  async getLatestPrice(
    @Param('symbol') symbol: string,
  ): Promise<{ data: PriceUpdate }> {
    this.logger.log(`Fetching latest price for ${symbol}`);
    const price = await this.pricesService.getLatestPrice(symbol.toUpperCase());

    if (!price) {
      throw new NotFoundException(`No price data found for symbol: ${symbol}`);
    }

    return { data: price };
  }
}

