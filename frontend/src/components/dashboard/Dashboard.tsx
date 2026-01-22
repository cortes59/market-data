import { useState } from 'react';
import { usePriceStream } from '../../hooks/usePriceStream';
import { DashboardHeader } from './DashboardHeader';
import { LivePriceCard } from '../prices/LivePriceCard';
import { WatchlistPanel } from '../watchlist/WatchlistPanel';

// Default symbols to watch
const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];

export function Dashboard() {
  const { connectionStatus, reconnect } = usePriceStream();
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');

  return (
    <div className="w-full">
      <DashboardHeader
        connectionStatus={connectionStatus}
        onReconnect={reconnect}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Watchlist Panel */}
        <WatchlistPanel
          symbols={DEFAULT_SYMBOLS}
          selectedSymbol={selectedSymbol}
          onSelect={setSelectedSymbol}
        />

        {/* Main Content */}
        <div className="flex flex-col gap-6">
          {/* Featured Price Card */}
          <LivePriceCard symbol={selectedSymbol} />

          {/* Price Grid for other symbols */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {DEFAULT_SYMBOLS.filter((s) => s !== selectedSymbol).map(
              (symbol) => (
                <LivePriceCard key={symbol} symbol={symbol} />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
