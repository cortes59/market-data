import type { Config } from 'drizzle-kit';

export default {
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 
      'postgres://market_user:market_pass@localhost:5432/market_data',
  },
} satisfies Config;
