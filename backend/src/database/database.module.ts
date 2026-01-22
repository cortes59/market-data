import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DRIZZLE_TOKEN = 'DRIZZLE_DB';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_TOKEN,
      useFactory: async () => {
        const databaseUrl = process.env.DATABASE_URL || 
          'postgres://market_user:market_pass@localhost:5432/market_data';
        
        const client = postgres(databaseUrl);
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DRIZZLE_TOKEN],
})
export class DatabaseModule {}
