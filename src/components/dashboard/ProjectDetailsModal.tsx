import { X, Activity, Clock, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Project, ProjectIncident } from '../../types';
import { useProjectHealth } from '../../hooks/useProjectHealth';
import Modal from '../ui/Modal';
import UptimeGrid from './UptimeGrid';
import LatencyChart from './LatencyChart';
import HealthIndicator from './HealthIndicator';
import Button from '../ui/Button';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export default function ProjectDetailsModal({ isOpen, onClose, project }: ProjectDetailsModalProps) {
  const { t } = useTranslation();
  const { health, loading, error, refresh } = useProjectHealth(project?.id || null);

  if (!project) return null;

  const hasData = health && health.totalPings > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project.name} size="lg">
      <div className="space-y-4 font-mono text-xs">
        {error && (
          <div className="p-3 bg-dark-900 border border-red-500/40">
            <div className="flex items-start gap-2">
              <span className="text-red-400 font-bold shrink-0">[ERR]</span>
              <div className="flex-1">
                <div className="text-red-400 mb-2">{error}</div>
                <Button size="sm" variant="secondary" onClick={refresh}>
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                  {t('projectDetails.tryAgain')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 py-10 justify-center text-gray-600">
            <div className="w-3 h-3 border border-accent border-t-transparent animate-spin" />
            <span>loading data</span>
            <span className="animate-blink text-accent">_</span>
          </div>
        )}

        {!loading && !error && !hasData && (
          <div className="p-6 text-center bg-dark-900 border border-dark-700 space-y-1">
            <div className="text-gray-600"># {t('projectDetails.noDataYet')}</div>
            <div className="text-gray-500">{t('projectDetails.noDataDescription')}</div>
          </div>
        )}

        {!loading && !error && hasData && (
          <>
            <div className="p-3 bg-dark-900 border border-dark-700">
              <HealthIndicator health={health} loading={false} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatCard
                label={t('projectDetails.uptime24h')}
                value={`${health.uptime24h.toFixed(2)}%`}
                trend={getTrend(health.uptime24h, health.uptime7d)}
                color={getUptimeColor(health.uptime24h)}
              />
              <StatCard
                label={t('projectDetails.uptime7d')}
                value={`${health.uptime7d.toFixed(2)}%`}
                color={getUptimeColor(health.uptime7d)}
              />
              <StatCard
                label={t('projectDetails.avgLatency')}
                value={health.avgLatency24h !== null ? `${health.avgLatency24h}ms` : t('projectDetails.notAvailable')}
                trend={health.avgLatency7d !== null && health.avgLatency24h !== null
                  ? getLatencyTrend(health.avgLatency24h, health.avgLatency7d)
                  : undefined}
                color={getLatencyColor(health.avgLatency24h)}
              />
              <StatCard
                label={t('projectDetails.activeIncidents')}
                value={health.activeIncidents.toString()}
                color={health.activeIncidents > 0 ? 'text-red-400' : 'text-accent'}
              />
            </div>

            <div className="space-y-1">
              <div className="text-gray-600">
                <span className="text-accent">#</span> {t('projectDetails.uptimeHistory')}
              </div>
              <UptimeGrid metrics={health.dailyMetrics} days={30} />
            </div>

            <div className="space-y-1">
              <div className="text-gray-600">
                <span className="text-accent">#</span> {t('projectDetails.responseTime')}
              </div>
              <LatencyChart logs={health.recentLogs} height={120} />
            </div>

            <div className="grid grid-cols-3 gap-2 bg-dark-900 border border-dark-700 p-3">
              <div className="text-center">
                <div className="text-xl font-bold text-light-100">{health.totalPings}</div>
                <div className="text-gray-600">{t('projectDetails.totalPings')}</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-accent">{health.successfulPings}</div>
                <div className="text-gray-600">{t('projectDetails.successful')}</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-400">{health.failedPings}</div>
                <div className="text-gray-600">{t('projectDetails.failed')}</div>
              </div>
            </div>

            {health.recentIncidents.length > 0 && (
              <div className="space-y-1">
                <div className="text-gray-600">
                  <span className="text-accent">#</span> {t('projectDetails.recentIncidents')}
                </div>
                <div className="space-y-1">
                  {health.recentIncidents.slice(0, 5).map(incident => (
                    <IncidentRow key={incident.id} incident={incident} t={t} />
                  ))}
                </div>
              </div>
            )}

            {health.recentLogs.length > 0 && (
              <div className="space-y-1">
                <div className="text-gray-600">
                  <span className="text-accent">#</span> {t('projectDetails.recentActivity')}
                </div>
                <div className="space-y-px">
                  {health.recentLogs.slice(0, 5).map(log => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between py-1 px-2 bg-dark-900/80 border-b border-dark-700/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${log.success ? 'text-accent' : 'text-red-400'}`}>
                          {log.success ? '[OK]' : '[ERR]'}
                        </span>
                        <span className="text-gray-600">{formatDateTime(log.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {log.response_time_ms !== null && (
                          <span className={getLatencyColor(log.response_time_ms)}>
                            {log.response_time_ms}ms
                          </span>
                        )}
                        {log.status_code && (
                          <span className={log.status_code === 200 ? 'text-gray-600' : 'text-yellow-400'}>
                            {log.status_code}
                          </span>
                        )}
                        {log.error_type && (
                          <span className="text-red-400">{log.error_type}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  color: string;
}

function StatCard({ label, value, trend, color }: StatCardProps) {
  return (
    <div className="p-2.5 bg-dark-900 border border-dark-700 font-mono text-xs">
      <div className="text-gray-600 uppercase text-[10px] tracking-wider mb-1">{label}</div>
      <div className="flex items-center gap-1.5">
        <span className={`text-base font-bold ${color}`}>{value}</span>
        {trend === 'up' && <TrendingUp className="w-3 h-3 text-accent" />}
        {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
      </div>
    </div>
  );
}

interface IncidentRowProps {
  incident: ProjectIncident;
  t: (key: string) => string;
}

function IncidentRow({ incident, t }: IncidentRowProps) {
  const isResolved = incident.resolved_at !== null;

  return (
    <div className="flex items-center justify-between p-2 bg-dark-900 border border-dark-700 font-mono text-xs">
      <div className="flex items-center gap-2">
        <span className={`font-bold ${isResolved ? 'text-gray-600' : 'text-red-400'}`}>
          {isResolved ? '[RES]' : '[ACT]'}
        </span>
        <div>
          <div className="text-gray-400 capitalize">{incident.incident_type.replace('_', ' ')}</div>
          <div className="text-gray-600">
            {formatDateTime(incident.started_at)}
            {isResolved && ` - ${formatDateTime(incident.resolved_at!)}`}
          </div>
        </div>
      </div>
      <div className="text-right text-gray-600">
        <div>{incident.error_count} {incident.error_count > 1 ? t('projectDetails.errors') : t('projectDetails.error')}</div>
        {incident.duration_minutes !== null && (
          <div>{formatDuration(incident.duration_minutes)}</div>
        )}
      </div>
    </div>
  );
}

function getTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const diff = current - previous;
  if (Math.abs(diff) < 0.5) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

function getLatencyTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const diff = current - previous;
  if (Math.abs(diff) < 50) return 'stable';
  return diff < 0 ? 'up' : 'down';
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

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
