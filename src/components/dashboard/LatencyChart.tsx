import { useTranslation } from 'react-i18next';
import { WakeLog } from '../../types';

interface LatencyChartProps {
  logs: WakeLog[];
  height?: number;
}

const SPARKLINE_CHARS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

export default function LatencyChart({ logs, height = 120 }: LatencyChartProps) {
  const { t } = useTranslation();
  const logsWithLatency = logs
    .filter(l => l.response_time_ms !== null)
    .slice(0, 40)
    .reverse();

  if (logsWithLatency.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-gray-600 bg-dark-900 border border-dark-700 font-mono"
        style={{ height }}
      >
        {t('latencyChart.noData')}
      </div>
    );
  }

  const latencies = logsWithLatency.map(l => l.response_time_ms!);
  const maxLatency = Math.max(...latencies);
  const minLatency = Math.min(...latencies);
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);

  const sparkline = latencies.map(l => {
    const normalized = maxLatency > minLatency
      ? (l - minLatency) / (maxLatency - minLatency)
      : 0.5;
    const idx = Math.round(normalized * (SPARKLINE_CHARS.length - 1));
    return SPARKLINE_CHARS[idx];
  }).join('');

  const chartHeight = height - 40;

  return (
    <div className="space-y-2 font-mono text-xs">
      <div className="flex items-center justify-between text-gray-600">
        <span>{t('latencyChart.title', { count: logsWithLatency.length })}</span>
        <div className="flex gap-3 text-gray-600">
          <span>min:<span className="text-accent ml-1">{minLatency}ms</span></span>
          <span>avg:<span className="text-gray-400 ml-1">{avgLatency}ms</span></span>
          <span>max:<span className={`ml-1 ${maxLatency > 2000 ? 'text-red-400' : maxLatency > 1000 ? 'text-yellow-400' : 'text-gray-400'}`}>{maxLatency}ms</span></span>
        </div>
      </div>

      <div
        className="bg-dark-900 border border-dark-700 overflow-hidden flex flex-col justify-end"
        style={{ height: chartHeight }}
      >
        <div className="flex items-end justify-around px-1 h-full pt-2">
          {logsWithLatency.map((log, index) => {
            const normalizedHeight = maxLatency > 0
              ? (log.response_time_ms! / maxLatency) * 100
              : 0;
            const color = getLatencyBarColor(log.response_time_ms!, log.success);

            return (
              <div
                key={log.id}
                className={`${color} transition-all cursor-pointer hover:opacity-80 w-1.5 min-w-0`}
                style={{
                  height: `${Math.max(4, normalizedHeight)}%`,
                }}
                title={`${log.response_time_ms}ms - ${formatTime(log.created_at)}${!log.success ? ` ${t('latencyChart.failed')}` : ''}`}
              />
            );
          })}
        </div>
      </div>

      <div className="bg-dark-900/50 border border-dark-700/50 px-2 py-1">
        <div className="text-gray-600 text-[10px] mb-0.5">sparkline</div>
        <div className="text-accent text-sm leading-none tracking-[0.05em] overflow-hidden">{sparkline}</div>
      </div>
    </div>
  );
}

function getLatencyBarColor(latency: number, success: boolean): string {
  if (!success) return 'bg-red-500/60';
  if (latency < 500) return 'bg-accent/80';
  if (latency < 1000) return 'bg-accent/50';
  if (latency < 2000) return 'bg-yellow-500/60';
  return 'bg-red-500/50';
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
