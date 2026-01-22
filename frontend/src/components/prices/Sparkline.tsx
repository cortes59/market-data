import { useMemo } from 'react';
import { cn } from '../../lib/utils';
import type { PriceUpdate } from '@market-data/shared';

interface SparklineProps {
  data: PriceUpdate[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  className,
}: SparklineProps) {
  const { path, gradient, isPositive } = useMemo(() => {
    if (data.length < 2) {
      return { path: '', gradient: '', isPositive: true };
    }

    const prices = data.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    // Padding for visual breathing room
    const paddingX = 2;
    const paddingY = 4;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingY * 2;

    // Generate SVG path points
    const points = prices.map((price, i) => {
      const x = paddingX + (i / (prices.length - 1)) * chartWidth;
      const y = paddingY + chartHeight - ((price - min) / range) * chartHeight;
      return `${x},${y}`;
    });

    const linePath = `M ${points.join(' L ')}`;

    // Create area path for gradient fill
    const firstX = paddingX;
    const lastX = paddingX + chartWidth;
    const areaPath = `${linePath} L ${lastX},${height} L ${firstX},${height} Z`;

    const isUp = prices[prices.length - 1] >= prices[0];

    return {
      path: linePath,
      gradient: areaPath,
      isPositive: isUp,
    };
  }, [data, width, height]);

  if (data.length < 2) {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-zinc-600 text-xs',
          className
        )}
        style={{ width, height }}
      >
        Waiting for data...
      </div>
    );
  }

  const strokeColor = isPositive ? '#34d399' : '#fb7185';
  const fillColor = isPositive ? '#34d399' : '#fb7185';

  return (
    <svg
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient
          id={`sparkline-gradient-${isPositive ? 'up' : 'down'}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gradient fill area */}
      <path
        d={gradient}
        fill={`url(#sparkline-gradient-${isPositive ? 'up' : 'down'})`}
      />

      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-sm"
      />

      {/* End point dot */}
      {data.length > 0 && (
        <circle
          cx={width - 2}
          cy={
            4 +
            (height - 8) -
            ((data[data.length - 1].price - Math.min(...data.map((d) => d.price))) /
              (Math.max(...data.map((d) => d.price)) -
                Math.min(...data.map((d) => d.price)) || 1)) *
              (height - 8)
          }
          r="2.5"
          fill={strokeColor}
          className="animate-pulse"
        />
      )}
    </svg>
  );
}
