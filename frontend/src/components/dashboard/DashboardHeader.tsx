import { cn } from '../../lib/utils';

interface DashboardHeaderProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  onReconnect?: () => void;
}

const statusConfig = {
  connecting: {
    label: 'Connecting',
    color: 'bg-amber-400',
    textColor: 'text-amber-400',
    animate: true,
  },
  connected: {
    label: 'Live',
    color: 'bg-emerald-400',
    textColor: 'text-emerald-400',
    animate: true,
  },
  disconnected: {
    label: 'Disconnected',
    color: 'bg-rose-400',
    textColor: 'text-rose-400',
    animate: false,
  },
};

export function DashboardHeader({
  connectionStatus,
  onReconnect,
}: DashboardHeaderProps) {
  const config = statusConfig[connectionStatus];

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Market Dashboard
        </h1>
        <p className="text-zinc-500 mt-1">Real-time cryptocurrency prices</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div
          className={cn(
            'flex items-center gap-2.5 px-4 py-2 rounded-full',
            'bg-zinc-900/80 border border-zinc-800/50',
            'backdrop-blur-sm'
          )}
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              config.color,
              config.animate && 'animate-pulse'
            )}
          />
          <span
            className={cn(
              'text-sm font-medium uppercase tracking-wider',
              config.textColor
            )}
          >
            {config.label}
          </span>
        </div>

        {/* Reconnect Button (only when disconnected) */}
        {connectionStatus === 'disconnected' && onReconnect && (
          <button
            onClick={onReconnect}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium',
              'bg-cyan-500 hover:bg-cyan-400 text-zinc-950',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-950'
            )}
          >
            Reconnect
          </button>
        )}
      </div>
    </header>
  );
}
