import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ProjectHealthMetrics, ProjectIncident, WakeLog, ProjectHealthSummary } from '../types';

export function useProjectHealth(projectId: string | null) {
  const [health, setHealth] = useState<ProjectHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    if (!projectId) {
      setHealth(null);
      setLoading(false);
      return;
    }

    console.log('[useProjectHealth] Fetching health for project:', projectId);
    setLoading(true);
    setError(null);

    const timeoutDuration = 20000;
    let timeoutId: NodeJS.Timeout;

    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Timeout: A requisição demorou mais de 20 segundos'));
        }, timeoutDuration);
      });

      const dataPromise = Promise.all([
        supabase
          .from('project_health_metrics')
          .select('*')
          .eq('project_id', projectId)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false }),

        supabase
          .from('project_incidents')
          .select('*')
          .eq('project_id', projectId)
          .order('started_at', { ascending: false })
          .limit(10),

        supabase
          .from('wake_logs')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(50),

        supabase
          .from('project_incidents')
          .select('*')
          .eq('project_id', projectId)
          .is('resolved_at', null),
      ]);

      const [metricsResult, incidentsResult, logsResult, activeIncidentsResult] = await Promise.race([
        dataPromise,
        timeoutPromise
      ]);

      clearTimeout(timeoutId!);

      if (metricsResult.error) throw metricsResult.error;
      if (incidentsResult.error) throw incidentsResult.error;
      if (logsResult.error) throw logsResult.error;
      if (activeIncidentsResult.error) throw activeIncidentsResult.error;

      const dailyMetrics = (metricsResult.data || []) as ProjectHealthMetrics[];
      const recentIncidents = (incidentsResult.data || []) as ProjectIncident[];
      const recentLogs = (logsResult.data || []) as WakeLog[];
      const activeIncidents = (activeIncidentsResult.data || []) as ProjectIncident[];

      const logs24h = recentLogs.filter(l => new Date(l.created_at) >= oneDayAgo);

      const uptime24h = calculateUptimeFromMetrics(dailyMetrics, 1);
      const uptime7d = calculateUptimeFromMetrics(dailyMetrics, 7);
      const uptime30d = calculateUptimeFromMetrics(dailyMetrics, 30);

      const avgLatency24h = calculateAvgLatency(logs24h);
      const avgLatency7d = calculateAvgLatencyFromMetrics(dailyMetrics, 7);

      const lastLog = recentLogs[0];
      const lastResponseTimeMs = lastLog?.response_time_ms ?? null;

      const totalPings = dailyMetrics.reduce((sum, m) => sum + m.total_pings, 0);
      const successfulPings = dailyMetrics.reduce((sum, m) => sum + m.successful_pings, 0);
      const failedPings = dailyMetrics.reduce((sum, m) => sum + m.failed_pings, 0);

      console.log('[useProjectHealth] Data fetched:', {
        totalPings,
        successfulPings,
        failedPings,
        dailyMetricsCount: dailyMetrics.length,
        recentLogsCount: recentLogs.length,
        activeIncidentsCount: activeIncidents.length,
      });

      const activeIncidentType = activeIncidents.length > 0
        ? (activeIncidents[0].incident_type as 'downtime' | 'slow_response' | 'intermittent')
        : null;

      setHealth({
        uptime24h,
        uptime7d,
        uptime30d,
        avgLatency24h,
        avgLatency7d,
        lastResponseTimeMs,
        totalPings,
        successfulPings,
        failedPings,
        activeIncidents: activeIncidents.length,
        activeIncidentType,
        recentIncidents,
        dailyMetrics,
        recentLogs,
      });
    } catch (err) {
      clearTimeout(timeoutId!);
      console.error('[useProjectHealth] Failed to fetch health data:', err);
      let errorMessage = 'Falha ao buscar dados de saúde do projeto.';

      if (err instanceof Error) {
        if (err.message.includes('Timeout')) {
          errorMessage = 'A consulta está demorando muito. Isso pode indicar um problema com o banco de dados ou muitos registros.';
        } else if (err.message.includes('JWT')) {
          errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
        } else if (err.message.includes('Network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet.';
        } else if (err.message.includes('permission') || err.message.includes('policy')) {
          errorMessage = 'Erro de permissão no banco de dados. Verifique as políticas RLS.';
        } else {
          errorMessage = `Erro: ${err.message}`;
        }
      }

      setError(errorMessage);
      console.error('[useProjectHealth] Error:', errorMessage);
    } finally {
      setLoading(false);
      console.log('[useProjectHealth] Fetch complete for project:', projectId);
    }
  }, [projectId]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { health, loading, error, refresh: fetchHealth };
}

function calculateUptime(logs: WakeLog[]): number {
  if (logs.length === 0) return 100;
  const successful = logs.filter(l => l.success).length;
  return Math.round((successful / logs.length) * 100 * 100) / 100;
}

function calculateUptimeFromMetrics(metrics: ProjectHealthMetrics[], days: number): number {
  const relevantMetrics = metrics.slice(0, days);
  if (relevantMetrics.length === 0) return 100;

  const totalPings = relevantMetrics.reduce((sum, m) => sum + m.total_pings, 0);
  const successfulPings = relevantMetrics.reduce((sum, m) => sum + m.successful_pings, 0);

  if (totalPings === 0) return 100;
  return Math.round((successfulPings / totalPings) * 100 * 100) / 100;
}

function calculateAvgLatency(logs: WakeLog[]): number | null {
  const logsWithLatency = logs.filter(l => l.response_time_ms !== null);
  if (logsWithLatency.length === 0) return null;

  const sum = logsWithLatency.reduce((acc, l) => acc + (l.response_time_ms || 0), 0);
  return Math.round(sum / logsWithLatency.length);
}

function calculateAvgLatencyFromMetrics(metrics: ProjectHealthMetrics[], days: number): number | null {
  const relevantMetrics = metrics.slice(0, days).filter(m => m.avg_response_time_ms !== null);
  if (relevantMetrics.length === 0) return null;

  const sum = relevantMetrics.reduce((acc, m) => acc + (m.avg_response_time_ms || 0), 0);
  return Math.round(sum / relevantMetrics.length);
}

export function useAllProjectsHealth(projectIds: string[]) {
  const [healthMap, setHealthMap] = useState<Record<string, ProjectHealthSummary>>({});
  const [loading, setLoading] = useState(true);
  const projectIdsRef = useRef<string[]>(projectIds);
  const initialFetchDone = useRef(false);

  projectIdsRef.current = projectIds;

  const fetchAllHealth = useCallback(async () => {
    const ids = projectIdsRef.current;

    if (ids.length === 0) {
      setHealthMap({});
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [metricsResult, logsResult, incidentsResult] = await Promise.all([
        supabase
          .from('project_health_metrics')
          .select('*')
          .in('project_id', ids)
          .gte('date', sevenDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false }),

        supabase
          .from('wake_logs')
          .select('*')
          .in('project_id', ids)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false }),

        supabase
          .from('project_incidents')
          .select('*')
          .in('project_id', ids)
          .is('resolved_at', null),
      ]);

      const allMetrics = (metricsResult.data || []) as ProjectHealthMetrics[];
      const allLogs = (logsResult.data || []) as WakeLog[];
      const activeIncidents = (incidentsResult.data || []) as ProjectIncident[];

      const newHealthMap: Record<string, ProjectHealthSummary> = {};

      for (const projectId of ids) {
        const projectMetrics = allMetrics.filter(m => m.project_id === projectId);
        const projectLogs = allLogs.filter(l => l.project_id === projectId);
        const projectIncidents = activeIncidents.filter(i => i.project_id === projectId);

        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const logs24h = projectLogs.filter(l => new Date(l.created_at) >= oneDayAgo);

        const uptime24h = calculateUptimeFromMetrics(projectMetrics, 1);
        const uptime7d = calculateUptimeFromMetrics(projectMetrics, 7);
        const avgLatency24h = calculateAvgLatency(logs24h);

        const lastLog = projectLogs[0];
        const activeIncidentType = projectIncidents.length > 0
          ? (projectIncidents[0].incident_type as 'downtime' | 'slow_response' | 'intermittent')
          : null;

        newHealthMap[projectId] = {
          uptime24h,
          uptime7d,
          uptime30d: uptime7d,
          avgLatency24h,
          avgLatency7d: calculateAvgLatencyFromMetrics(projectMetrics, 7),
          lastResponseTimeMs: lastLog?.response_time_ms ?? null,
          totalPings: projectMetrics.reduce((sum, m) => sum + m.total_pings, 0),
          successfulPings: projectMetrics.reduce((sum, m) => sum + m.successful_pings, 0),
          failedPings: projectMetrics.reduce((sum, m) => sum + m.failed_pings, 0),
          activeIncidents: projectIncidents.length,
          activeIncidentType,
          recentIncidents: [],
          dailyMetrics: projectMetrics,
          recentLogs: projectLogs.slice(0, 10),
        };
      }

      setHealthMap(newHealthMap);
    } catch (err) {
      console.error('Failed to fetch health data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialFetchDone.current && projectIds.length > 0) {
      initialFetchDone.current = true;
      fetchAllHealth();
    }
  }, [projectIds, fetchAllHealth]);

  return { healthMap, loading, refresh: fetchAllHealth };
}
