import { memo } from 'react';
import { usePriceStore, selectPrice } from '../../stores/priceStore';
import { cn } from '../../lib/utils';
import { formatPrice, formatPercent } from '../../utils/formatters';

interface WatchlistItemProps {
  symbol: string;
  isSelected: boolean;
  onSelect: () => void;
}

function WatchlistItemComponent({
  symbol,
  isSelected,
  onSelect,
}: WatchlistItemProps) {
  const price = usePriceStore(selectPrice(symbol));

  const isPositive = price ? price.change >= 0 : true;
  const displaySymbol = symbol.replace('USDT', '');

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center justify-between p-3 rounded-xl',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
        isSelected
          ? 'bg-zinc-800/80 border border-cyan-500/30 shadow-lg shadow-cyan-500/5'
          : 'bg-zinc-900/30 border border-transparent hover:bg-zinc-800/50 hover:border-zinc-700/50'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Crypto Icon Placeholder */}
        <div
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center',
            'text-sm font-bold',
            isSelected
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'bg-zinc-800 text-zinc-400'
          )}
        >
          {displaySymbol.slice(0, 2)}
        </div>

        <div className="text-left">
          <p className="font-medium text-white">{displaySymbol}</p>
          <p className="text-xs text-zinc-500">USDT</p>
        </div>
      </div>

      <div className="text-right">
        {price ? (
          <>
            <p className="font-medium text-white tabular-nums">
              {formatPrice(price.price)}
            </p>
            <p
              className={cn(
                'text-xs font-medium tabular-nums',
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              )}
            >
              {formatPercent(price.changePercent)}
            </p>
          </>
        ) : (
          <>
            <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse mb-1" />
            <div className="h-3 w-12 bg-zinc-800/50 rounded animate-pulse" />
          </>
        )}
      </div>
    </button>
  );
}

export const WatchlistItem = memo(WatchlistItemComponent);
