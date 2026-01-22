import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './events/events.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { RealtimeModule } from './realtime/realtime.module';
import { PricesModule } from './prices/prices.module';

@Module({
  imports: [
    // Configuration - loads .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Core modules
    DatabaseModule,
    EventsModule,
    // Feature modules
    IngestionModule,
    RealtimeModule,
    PricesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
