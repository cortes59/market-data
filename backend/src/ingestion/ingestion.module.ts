import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { IngestionService } from './ingestion.service';
import { CoinGeckoClient } from './coingecko.client';

/**
 * Ingestion Module
 * Handles market data polling from CoinGecko API and persistence
 * 
 * Note: Using CoinGecko instead of Binance due to geo-restrictions.
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule.register({
      timeout: 10000, // CoinGecko can be slow
      maxRedirects: 3,
    }),
  ],
  providers: [IngestionService, CoinGeckoClient],
  exports: [IngestionService],
})
export class IngestionModule {}
