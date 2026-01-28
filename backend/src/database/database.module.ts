import { Module, Global, Logger } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import postgres from 'postgres';
import * as schema from './schema';

export const DRIZZLE_TOKEN = 'DRIZZLE_DB';

const logger = new Logger('Database');

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_TOKEN,
      useFactory: async () => {
        const databaseUrl = process.env.DATABASE_URL || 
          'postgres://market_user:market_pass@localhost:5432/market_data';
				
				const client = postgres(databaseUrl);
				const db = drizzle(client, { schema });

				// Automatically apply SQL migrations on startup to avoid
				// "relation \"market_data\" does not exist" on first run.
				const rawRun = (process.env.DB_RUN_MIGRATIONS ??
					(process.env.NODE_ENV === 'test' ? 'false' : 'true'))
					.toLowerCase()
					.trim();
				const runMigrations = !['false', '0', 'no', 'off'].includes(rawRun);

				if (runMigrations) {
					const cwd = process.cwd();
					const migrationsCandidates = [
						resolve(cwd, 'drizzle'),
						resolve(cwd, 'backend', 'drizzle'),
					];
					const migrationsFolder = migrationsCandidates.find((p) => existsSync(p));
					if (!migrationsFolder) {
						logger.warn(
							`DB_RUN_MIGRATIONS enabled but migrations folder not found at: ${migrationsCandidates.join(
								', ',
							)}; skipping migrations.`,
						);
					} else {
						logger.log(`Running database migrations from ${migrationsFolder}`);
						await migrate(db, { migrationsFolder });
						logger.log('Database migrations complete');
					}
				} else {
					logger.log('DB_RUN_MIGRATIONS disabled; skipping database migrations');
				}

				return db;
      },
    },
  ],
  exports: [DRIZZLE_TOKEN],
})
export class DatabaseModule {}
