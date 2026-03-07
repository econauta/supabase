import { useTranslation } from 'react-i18next';
import { Project, ProjectHealthSummary, ProjectTag } from '../../types';

interface StatsPanelProps {
  projects: Project[];
  activeTagFilters?: string[];
  allTags?: ProjectTag[];
  healthMap: Record<string, ProjectHealthSummary>;
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function pad(str: string, len: number): string {
  return str.padEnd(len, '.');
}

export default function StatsPanel({ projects, healthMap, activeTagFilters = [], allTags = [] }: StatsPanelProps) {
  const { t } = useTranslation();

  const activeProjects = projects.filter((p) => p.is_active);

  const uptimes24h = activeProjects
    .map((p) => healthMap[p.id]?.uptime24h)
    .filter((v): v is number => v !== null && v !== undefined);
  const avgUptime24h = uptimes24h.length > 0
    ? uptimes24h.reduce((a, b) => a + b, 0) / uptimes24h.length
    : null;

  const allProjects7d = activeProjects.filter((p) => healthMap[p.id]);
  const totalPings7d = allProjects7d.reduce((sum, p) => sum + (healthMap[p.id]?.totalPings || 0), 0);
  const successfulPings7d = allProjects7d.reduce((sum, p) => sum + (healthMap[p.id]?.successfulPings || 0), 0);
  const successRate7d = totalPings7d > 0 ? (successfulPings7d / totalPings7d) * 100 : null;

  const mostStableProject = activeProjects
    .filter((p) => healthMap[p.id]?.uptime7d != null)
    .sort((a, b) => (healthMap[b.id]?.uptime7d ?? 0) - (healthMap[a.id]?.uptime7d ?? 0))[0];

  const totalLatency = activeProjects
    .map((p) => healthMap[p.id]?.avgLatency24h)
    .filter((v): v is number => v !== null && v !== undefined)
    .reduce((sum, v) => sum + v, 0);

  const uptimeColor = avgUptime24h !== null
    ? avgUptime24h >= 95 ? 'text-accent' : avgUptime24h >= 90 ? 'text-yellow-400' : 'text-red-400'
    : 'text-gray-600';

  const successColor = successRate7d !== null
    ? successRate7d >= 95 ? 'text-accent' : successRate7d >= 85 ? 'text-yellow-400' : 'text-red-400'
    : 'text-gray-600';

  const latencyColor = totalLatency > 0
    ? totalLatency < 2000 ? 'text-accent' : totalLatency < 5000 ? 'text-yellow-400' : 'text-red-400'
    : 'text-gray-600';

  const rows = [
    {
      key: 'UPTIME_24H',
      value: avgUptime24h !== null ? formatPercentage(avgUptime24h) : 'N/A',
      color: uptimeColor,
      label: t('stats.avgUptime24h'),
    },
    {
      key: 'SUCCESS_7D',
      value: successRate7d !== null ? formatPercentage(successRate7d) : 'N/A',
      color: successColor,
      label: t('stats.successRate7d'),
    },
    {
      key: 'MOST_STABLE',
      value: mostStableProject ? mostStableProject.name.slice(0, 20) : 'N/A',
      color: 'text-accent',
      label: t('stats.mostStableProject'),
    },
    {
      key: 'LATENCY_TOT',
      value: totalLatency > 0 ? formatLatency(totalLatency) : 'N/A',
      color: latencyColor,
      label: t('stats.totalLatency'),
    },
  ];

  const filterLabels = activeTagFilters
    .map((name) => allTags.find((t) => t.name === name))
    .filter(Boolean);

  return (
    <div className="bg-dark-800 border border-dark-700 text-xs font-mono">
      <div className="bg-dark-700 px-3 py-1.5 border-b border-dark-700 flex items-center gap-2">
        <span className="text-accent">#</span>
        <span className="text-gray-500">system-metrics</span>
        {filterLabels.length > 0 && (
          <div className="flex items-center gap-1 ml-2">
            <span className="text-gray-600">filter:</span>
            {filterLabels.map((tag) => tag && (
              <span key={tag.id} className="font-mono" style={{ color: tag.color }}>
                [{tag.name}]
              </span>
            ))}
          </div>
        )}
        <span className="text-gray-600 ml-auto">--live</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-dark-700">
        {rows.map((row) => (
          <div key={row.key} className="p-3 space-y-1">
            <div className="text-gray-600 uppercase tracking-wider text-[10px]">{row.key}</div>
            <div className={`text-lg font-bold ${row.color}`}>{row.value}</div>
            <div className="text-gray-600 text-[10px] truncate">{row.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
