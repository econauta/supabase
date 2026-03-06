import { useTranslation } from 'react-i18next';
import { ProjectHealthSummary } from '../../types';

interface HealthIndicatorProps {
  health: ProjectHealthSummary | null;
  loading?: boolean;
  compact?: boolean;
  lastWake?: string;
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

type HealthStatus = 'healthy' | 'degraded' | 'down';

function getHealthStatus(health: ProjectHealthSummary): HealthStatus {
  if (health.activeIncidents > 0) {
    if (health.activeIncidentType === 'slow_response' || health.activeIncidentType === 'intermittent') {
      return 'degraded';
    }
    return 'down';
  }
  if (health.uptime24h < 90) return 'down';
  if (health.uptime24h < 99 || (health.avgLatency24h && health.avgLatency24h > 2000)) return 'degraded';
  return 'healthy';
}

function getStatusSymbol(status: HealthStatus): string {
  switch (status) {
    case 'healthy': return '▮';
    case 'degraded': return '▲';
    case 'down': return '▯';
  }
}

function getStatusColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy': return 'text-accent';
    case 'degraded': return 'text-yellow-400';
    case 'down': return 'text-red-400';
  }
}

function getUptimeColor(uptime: number): string {
  if (uptime >= 99) return 'text-accent';
  if (uptime >= 95) return 'text-yellow-400';
  return 'text-red-400';
}

function getLatencyColor(latency: number | null): string {
  if (latency === null) return 'text-gray-600';
  if (latency < 500) return 'text-accent';
  if (latency < 1000) return 'text-light-100';
  if (latency < 2000) return 'text-yellow-400';
  return 'text-red-400';
}

export default function HealthIndicator({ health, loading, compact = false, lastWake }: HealthIndicatorProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-xs text-gray-600">
        <span className="animate-blink">_</span>
        <span>loading...</span>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="flex items-center gap-3 text-xs text-gray-600">
        <span>▯</span>
        <span>{t('healthIndicator.noData')}</span>
      </div>
    );
  }

  const status = getHealthStatus(health);
  const symbol = getStatusSymbol(status);
  const color = getStatusColor(status);

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-1">
          <span className={`${color} font-bold`}>{symbol}</span>
          <span className={`font-bold ${color}`}>{health.uptime24h.toFixed(1)}%</span>
        </div>
        {health.lastResponseTimeMs !== null && (
          <div className="flex items-center gap-1 text-gray-600">
            <span>lat:</span>
            <span className={getLatencyColor(health.lastResponseTimeMs)}>{formatLatency(health.lastResponseTimeMs)}</span>
          </div>
        )}
        {health.activeIncidents > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-yellow-400">!{health.activeIncidents}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-base font-bold ${color}`}>{symbol}</span>
          <span className={`font-bold uppercase ${color}`}>
            {status === 'healthy' ? t('healthIndicator.healthy') : status === 'degraded' ? t('healthIndicator.degraded') : t('healthIndicator.down')}
          </span>
        </div>
        {health.activeIncidents > 0 && (
          <span className={`${health.activeIncidentType === 'downtime' ? 'text-red-400' : 'text-yellow-400'}`}>
            [{health.activeIncidents} {health.activeIncidents === 1 ? t('healthIndicator.activeIncident', { count: health.activeIncidents }) : t('healthIndicator.activeIncidents', { count: health.activeIncidents })}]
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 bg-dark-900/50 p-2 border border-dark-700/50">
        <div>
          <div className="text-gray-600 uppercase text-[10px] tracking-wider mb-0.5">uptime_24h</div>
          <div className={`font-bold ${getUptimeColor(health.uptime24h)}`}>{health.uptime24h.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-gray-600 uppercase text-[10px] tracking-wider mb-0.5">latency</div>
          <div className={`font-bold ${getLatencyColor(health.lastResponseTimeMs)}`}>
            {health.lastResponseTimeMs !== null ? formatLatency(health.lastResponseTimeMs) : t('healthIndicator.notAvailable')}
          </div>
        </div>
        <div>
          <div className="text-gray-600 uppercase text-[10px] tracking-wider mb-0.5">avg_7d</div>
          <div className={`font-bold ${getLatencyColor(health.avgLatency7d)}`}>
            {health.avgLatency7d !== null ? formatLatency(health.avgLatency7d) : t('healthIndicator.notAvailable')}
          </div>
        </div>
      </div>
    </div>
  );
}
