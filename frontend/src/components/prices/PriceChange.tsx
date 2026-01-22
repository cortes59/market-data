import { cn } from '../../lib/utils';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface PriceChangeProps {
  change: number;
  changePercent: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceChange({
  change,
  changePercent,
  showValue = true,
  size = 'md',
}: PriceChangeProps) {
  const isPositive = change >= 0;
  const isNeutral = change === 0;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <span
      className={cn(
        'font-medium inline-flex items-center gap-1.5',
        sizeClasses[size],
        isNeutral
          ? 'text-zinc-400'
          : isPositive
            ? 'text-emerald-400'
            : 'text-rose-400'
      )}
    >
      <span className="text-[0.65em]">{isPositive ? '▲' : '▼'}</span>
      {showValue && <span>{formatCurrency(Math.abs(change))}</span>}
      <span
        className={cn(
          'px-1.5 py-0.5 rounded',
          isNeutral
            ? 'bg-zinc-800'
            : isPositive
              ? 'bg-emerald-400/10'
              : 'bg-rose-400/10'
        )}
      >
        {formatPercent(changePercent)}
      </span>
    </span>
  );
}
