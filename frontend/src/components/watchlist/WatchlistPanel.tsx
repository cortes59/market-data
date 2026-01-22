import { cn } from '../../lib/utils';
import { WatchlistItem } from './WatchlistItem';

interface WatchlistPanelProps {
  symbols: string[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
  className?: string;
}

export function WatchlistPanel({
  symbols,
  selectedSymbol,
  onSelect,
  className,
}: WatchlistPanelProps) {
  return (
    <aside
      className={cn(
        'rounded-2xl p-4',
        'bg-zinc-900/30 border border-zinc-800/50',
        'backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Watchlist
        </h2>
        <span className="text-xs text-zinc-500">{symbols.length} assets</span>
      </div>

      <div className="flex flex-col gap-2">
        {symbols.map((symbol) => (
          <WatchlistItem
            key={symbol}
            symbol={symbol}
            isSelected={symbol === selectedSymbol}
            onSelect={() => onSelect(symbol)}
          />
        ))}
      </div>

      {/* Future: Add Symbol Button */}
      <button
        className={cn(
          'w-full mt-4 py-2.5 rounded-xl',
          'text-sm font-medium text-zinc-400',
          'bg-zinc-800/30 border border-dashed border-zinc-700/50',
          'hover:bg-zinc-800/50 hover:text-zinc-300 hover:border-zinc-600',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500/50'
        )}
      >
        + Add Symbol
      </button>
    </aside>
  );
}
