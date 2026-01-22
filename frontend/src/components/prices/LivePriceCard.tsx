import { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePriceStore, selectPrice, selectHistory } from '../../stores/priceStore';
import { cn } from '../../lib/utils';
import { formatPrice, formatTime } from '../../utils/formatters';
import { PriceChange } from './PriceChange';
import { Sparkline } from './Sparkline';

interface LivePriceCardProps {
  symbol: string;
  className?: string;
}

function LivePriceCardSkeleton(_props: { symbol: string }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-5 w-24 bg-zinc-800 rounded mb-2" />
          <div className="h-4 w-16 bg-zinc-800/50 rounded" />
        </div>
        <div className="h-8 w-32 bg-zinc-800 rounded" />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="h-10 w-40 bg-zinc-800 rounded mb-2" />
          <div className="h-5 w-32 bg-zinc-800/50 rounded" />
        </div>
        <div className="h-8 w-28 bg-zinc-800/50 rounded" />
      </div>
    </div>
  );
}

function LivePriceCardComponent({ symbol, className }: LivePriceCardProps) {
  // Only re-renders when THIS symbol's price changes
  const price = usePriceStore(selectPrice(symbol));

  // For array values, use useShallow to prevent re-renders on shallow equal
  const history = usePriceStore(useShallow(selectHistory(symbol)));

  if (!price) {
    return <LivePriceCardSkeleton symbol={symbol} />;
  }

  const isPositive = price.change >= 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6',
        'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-900/80',
        'border border-zinc-800/50',
        'shadow-xl shadow-black/20',
        className
      )}
    >
      {/* Subtle glow effect based on price direction */}
      <div
        className={cn(
          'absolute inset-0 opacity-[0.03] blur-3xl',
          isPositive ? 'bg-emerald-500' : 'bg-rose-500'
        )}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white tracking-tight">
            {symbol.replace('USDT', '')}
            <span className="text-zinc-500 font-normal">/USDT</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Updated {formatTime(price.timestamp)}
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full animate-pulse',
              isPositive ? 'bg-emerald-400' : 'bg-rose-400'
            )}
          />
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Live
          </span>
        </div>
      </div>

      {/* Price Display */}
      <div className="relative flex items-end justify-between">
        <div>
          <p
            className={cn(
              'text-4xl font-bold tracking-tight',
              'bg-gradient-to-r bg-clip-text text-transparent',
              isPositive
                ? 'from-white to-emerald-200'
                : 'from-white to-rose-200'
            )}
          >
            {formatPrice(price.price)}
          </p>
          <div className="mt-2">
            <PriceChange
              change={price.change}
              changePercent={price.changePercent}
              size="md"
            />
          </div>
        </div>

        {/* Sparkline */}
        <div className="pb-1">
          <Sparkline data={history} width={140} height={48} />
        </div>
      </div>
    </div>
  );
}

export const LivePriceCard = memo(LivePriceCardComponent);
