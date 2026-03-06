import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectHealthMetrics } from '../../types';

interface UptimeGridProps {
  metrics: ProjectHealthMetrics[];
  days?: number;
}

export default function UptimeGrid({ metrics, days = 30 }: UptimeGridProps) {
  const { t } = useTranslation();
  const [hoveredDay, setHoveredDay] = useState<ProjectHealthMetrics | null>(null);

  const metricsMap = new Map(metrics.map(m => [m.date, m]));
  const gridData = generateGridData(metricsMap, days);

  return (
    <div className="space-y-2 font-mono text-xs">
      <div className="flex items-center justify-between text-gray-600">
        <span>{days === 1 ? t('uptimeGrid.dayAgo', { days }) : t('uptimeGrid.daysAgo', { days })}</span>
        <span>{t('uptimeGrid.today')}</span>
      </div>

      <div className="flex gap-px flex-wrap">
        {gridData.map((day) => (
          <div
            key={day.date}
            className="cursor-pointer transition-opacity hover:opacity-70"
            onMouseEnter={() => setHoveredDay(day.metrics || null)}
            onMouseLeave={() => setHoveredDay(null)}
            title={`${day.date}: ${day.uptime !== null ? `${day.uptime.toFixed(1)}%` : t('uptimeGrid.noData')}`}
          >
            <span className={`text-[10px] leading-none select-none ${getUptimeCharColor(day.uptime)}`}>
              {getUptimeChar(day.uptime)}
            </span>
          </div>
        ))}
      </div>

      {hoveredDay && (
        <div className="mt-1 p-2 bg-dark-900 border border-dark-700 text-[11px]">
          <div className="text-gray-500 mb-1"># {formatDate(hoveredDay.date)}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <div>
              <span className="text-gray-600">uptime: </span>
              <span className={getUptimeTextColor(hoveredDay.uptime_percentage)}>
                {hoveredDay.uptime_percentage.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">pings: </span>
              <span className="text-gray-400">{hoveredDay.successful_pings}/{hoveredDay.total_pings}</span>
            </div>
            {hoveredDay.avg_response_time_ms !== null && (
              <div>
                <span className="text-gray-600">avg_lat: </span>
                <span className="text-gray-400">{hoveredDay.avg_response_time_ms}ms</span>
              </div>
            )}
            {hoveredDay.failed_pings > 0 && (
              <div>
                <span className="text-gray-600">failed: </span>
                <span className="text-red-400">{hoveredDay.failed_pings}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-gray-600">
        <span>{t('uptimeGrid.less')}</span>
        <span className="text-gray-600">░</span>
        <span className="text-red-500/70">▒</span>
        <span className="text-yellow-500/70">▓</span>
        <span className="text-accent/70">█</span>
        <span className="text-accent">█</span>
        <span>{t('uptimeGrid.more')}</span>
      </div>
    </div>
  );
}

interface GridDay {
  date: string;
  uptime: number | null;
  metrics: ProjectHealthMetrics | null;
}

function generateGridData(metricsMap: Map<string, ProjectHealthMetrics>, days: number): GridDay[] {
  const result: GridDay[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const metrics = metricsMap.get(dateStr) || null;

    result.push({
      date: dateStr,
      uptime: metrics?.uptime_percentage ?? null,
      metrics,
    });
  }

  return result;
}

function getUptimeChar(uptime: number | null): string {
  if (uptime === null) return '░';
  if (uptime >= 99.9) return '█';
  if (uptime >= 99) return '█';
  if (uptime >= 95) return '▓';
  if (uptime >= 90) return '▒';
  return '▒';
}

function getUptimeCharColor(uptime: number | null): string {
  if (uptime === null) return 'text-dark-700';
  if (uptime >= 99.9) return 'text-accent';
  if (uptime >= 99) return 'text-accent/70';
  if (uptime >= 95) return 'text-yellow-500/70';
  if (uptime >= 90) return 'text-yellow-600/60';
  return 'text-red-500/70';
}

function getUptimeTextColor(uptime: number): string {
  if (uptime >= 99) return 'text-accent';
  if (uptime >= 95) return 'text-yellow-400';
  return 'text-red-400';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
