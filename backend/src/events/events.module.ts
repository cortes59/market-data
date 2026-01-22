import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

/**
 * Global Events Module
 * Provides EventEmitter2 for internal event-driven communication
 */
@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Use wildcards for flexible event matching
      wildcard: true,
      // Delimiter for namespaced events (e.g., 'market.price_update')
      delimiter: '.',
      // Throw errors if no listeners
      newListener: false,
      removeListener: false,
      // Max listeners per event (increased for SSE connections)
      maxListeners: 100,
      // Show warnings in console
      verboseMemoryLeak: true,
      // Ignore errors from listeners
      ignoreErrors: false,
    }),
  ],
  exports: [EventEmitterModule],
})
export class EventsModule {}
