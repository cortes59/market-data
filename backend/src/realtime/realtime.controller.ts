import { Controller, Sse, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Observable,
  fromEvent,
  map,
  finalize,
  catchError,
  EMPTY,
  concat,
  of,
} from 'rxjs';
import { MarketEvent } from '@market-data/shared';

interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@Controller('realtime')
export class RealtimeController implements OnModuleDestroy {
  private readonly logger = new Logger(RealtimeController.name);
  private activeConnections = 0;

  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Sse('prices')
  streamPrices(): Observable<MessageEvent> {
    this.activeConnections++;
    this.logger.log(
      `SSE connection opened (active: ${this.activeConnections})`,
    );

    // Initial connection event - client doesn't wait 30s for first data
    const connectionEvent: MessageEvent = {
      data: { status: 'connected', timestamp: new Date().toISOString() },
      type: 'connection',
      id: Date.now().toString(),
    };

    const priceStream$ = fromEvent<MarketEvent>(
      this.eventEmitter,
      'market.price_update',
    ).pipe(
      map((event: MarketEvent) => ({
        data: event,
        type: 'price_update',
        id: Date.now().toString(),
      })),
      catchError((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`SSE stream error: ${message}`);
        return EMPTY;
      }),
      finalize(() => {
        this.activeConnections--;
        this.logger.log(
          `SSE connection closed (active: ${this.activeConnections})`,
        );
      }),
    );

    return concat(of(connectionEvent), priceStream$);
  }

  onModuleDestroy(): void {
    this.logger.log(
      `RealtimeController destroyed (${this.activeConnections} connections remaining)`,
    );
  }
}
