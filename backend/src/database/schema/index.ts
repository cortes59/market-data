import { pgTable, uuid, varchar, decimal, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * Stocks Table
 * Stores information about different stock symbols
 */
export const stocks = pgTable('stocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  symbol: varchar('symbol', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  exchange: varchar('exchange', { length: 50 }).notNull(),
  sector: varchar('sector', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Market Data Table
 * Stores historical market data points
 * Note: Using precision 18, scale 8 for crypto prices (e.g., BTC at $97,234.12345678)
 * Volume uses precision 24, scale 2 to handle large USD volumes (billions)
 */
export const marketData = pgTable(
  'market_data',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    symbol: varchar('symbol', { length: 10 }).notNull(),
    price: decimal('price', { precision: 18, scale: 8 }).notNull(),
    volume: decimal('volume', { precision: 24, scale: 2 }).notNull(),
    timestamp: timestamp('timestamp').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    // Composite index for efficient queries by symbol and time range
    // DESC on timestamp for optimal "latest prices" queries
    symbolTimestampIdx: index('market_data_symbol_timestamp_idx').on(
      table.symbol,
      table.timestamp,
    ),
  }),
);

/**
 * Price Updates Table
 * Stores real-time price updates
 * Note: Using precision 18, scale 8 for crypto prices
 */
export const priceUpdates = pgTable('price_updates', {
  id: uuid('id').defaultRandom().primaryKey(),
  symbol: varchar('symbol', { length: 10 }).notNull(),
  price: decimal('price', { precision: 18, scale: 8 }).notNull(),
  change: decimal('change', { precision: 18, scale: 8 }).notNull(),
  changePercent: decimal('change_percent', { precision: 10, scale: 4 }).notNull(),
  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
