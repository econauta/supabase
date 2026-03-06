import { createDynamicClient } from './supabase';
import { supabase } from './supabase';
import { Project } from '../types';
import i18n from '../i18n/config';

export interface WakeResult {
  success: boolean;
  message: string;
  responseTimeMs?: number;
  statusCode?: number;
  errorType?: string;
  attemptedAt: string;
  completedAt?: string;
}

export type ErrorType = 'timeout' | 'network' | 'auth' | 'server' | 'not_found' | 'rls_policy' | 'unknown';

function categorizeError(error: Error | { code?: string; message?: string }): ErrorType {
  const message = error.message?.toLowerCase() || '';
  const code = 'code' in error ? error.code : '';

  if (code === '42501' || message.includes('row-level security') || message.includes('row level security') || message.includes('violates row-level security policy')) {
    return 'rls_policy';
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout';
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network';
  }
  if (message.includes('unauthorized') || message.includes('401') || message.includes('jwt') || message.includes('apikey')) {
    return 'auth';
  }
  if (code === '42P01' || message.includes('does not exist')) {
    return 'not_found';
  }
  if (message.includes('500') || message.includes('server')) {
    return 'server';
  }
  return 'unknown';
}

function getStatusCodeFromError(error: Error | { code?: string; message?: string; status?: number }): number | undefined {
  if ('status' in error && typeof error.status === 'number') {
    return error.status;
  }
  const message = error.message || '';
  const match = message.match(/\b(4\d{2}|5\d{2})\b/);
  return match ? parseInt(match[1], 10) : undefined;
}

export async function wakeProject(project: Project): Promise<WakeResult> {
  const attemptedAt = new Date().toISOString();
  const startTime = performance.now();

  try {
    const client = createDynamicClient(project.supabase_url, project.anon_key);
    const timestamp = new Date().toISOString();

    const { error: insertError } = await client
      .from('_heartbeat')
      .insert({ pinged_at: timestamp });

    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);
    const completedAt = new Date().toISOString();

    if (insertError) {
      const errorType = categorizeError(insertError);
      const statusCode = getStatusCodeFromError(insertError);

      if (insertError.message.includes('does not exist') || insertError.code === '42P01') {
        return {
          success: false,
          message: 'Tabela _heartbeat não encontrada. Por favor, crie-a em seu projeto de destino.',
          responseTimeMs,
          statusCode: statusCode || 404,
          errorType: 'not_found',
          attemptedAt,
          completedAt,
        };
      }

      if (errorType === 'rls_policy') {
        return {
          success: false,
          message: 'Erro de política RLS: A tabela _heartbeat existe, mas as políticas de segurança estão bloqueando a inserção. Verifique a seção de Troubleshooting para corrigir as políticas RLS.',
          responseTimeMs,
          statusCode: statusCode || 403,
          errorType: 'rls_policy',
          attemptedAt,
          completedAt,
        };
      }

      return {
        success: false,
        message: insertError.message,
        responseTimeMs,
        statusCode,
        errorType,
        attemptedAt,
        completedAt,
      };
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await client
      .from('_heartbeat')
      .delete()
      .lt('pinged_at', sevenDaysAgo.toISOString());

    return {
      success: true,
      message: 'Projeto acordado com sucesso!',
      responseTimeMs,
      statusCode: 200,
      attemptedAt,
      completedAt,
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);
    const completedAt = new Date().toISOString();
    const err = error instanceof Error ? error : { message: 'Erro desconhecido ocorreu' };
    const errorType = categorizeError(err);
    const statusCode = getStatusCodeFromError(err as Error);

    return {
      success: false,
      message: err.message || 'Erro desconhecido ocorreu',
      responseTimeMs,
      statusCode,
      errorType,
      attemptedAt,
      completedAt,
    };
  }
}

export async function testConnection(url: string, anonKey: string): Promise<WakeResult> {
  const attemptedAt = new Date().toISOString();
  const startTime = performance.now();

  try {
    const client = createDynamicClient(url, anonKey);

    const { error: selectError } = await client
      .from('_heartbeat')
      .select('id')
      .limit(1);

    if (selectError) {
      const endTime = performance.now();
      const responseTimeMs = Math.round(endTime - startTime);
      const completedAt = new Date().toISOString();
      const errorType = categorizeError(selectError);
      const statusCode = getStatusCodeFromError(selectError);

      if (selectError.message.includes('does not exist') || selectError.code === '42P01') {
        return {
          success: false,
          message: 'Conectado, mas tabela _heartbeat não encontrada. Por favor, crie-a primeiro.',
          responseTimeMs,
          statusCode: statusCode || 404,
          errorType: 'not_found',
          attemptedAt,
          completedAt,
        };
      }
      return {
        success: false,
        message: selectError.message,
        responseTimeMs,
        statusCode,
        errorType,
        attemptedAt,
        completedAt,
      };
    }

    const testTimestamp = new Date().toISOString();
    const { error: insertError } = await client
      .from('_heartbeat')
      .insert({ pinged_at: testTimestamp });

    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);
    const completedAt = new Date().toISOString();

    if (insertError) {
      const errorType = categorizeError(insertError);
      const statusCode = getStatusCodeFromError(insertError);

      if (errorType === 'rls_policy') {
        return {
          success: false,
          message: 'Conectado e tabela encontrada, mas as políticas RLS estão bloqueando inserções. Verifique a seção de Troubleshooting.',
          responseTimeMs,
          statusCode: statusCode || 403,
          errorType: 'rls_policy',
          attemptedAt,
          completedAt,
        };
      }

      return {
        success: false,
        message: `Tabela encontrada mas falha ao testar inserção: ${insertError.message}`,
        responseTimeMs,
        statusCode,
        errorType,
        attemptedAt,
        completedAt,
      };
    }

    await client
      .from('_heartbeat')
      .delete()
      .eq('pinged_at', testTimestamp);

    return {
      success: true,
      message: 'Conexão bem-sucedida! Tabela e políticas RLS configuradas corretamente.',
      responseTimeMs,
      statusCode: 200,
      attemptedAt,
      completedAt,
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTimeMs = Math.round(endTime - startTime);
    const completedAt = new Date().toISOString();
    const err = error instanceof Error ? error : { message: 'Falha ao conectar' };
    const errorType = categorizeError(err);
    const statusCode = getStatusCodeFromError(err as Error);

    return {
      success: false,
      message: err.message || 'Falha ao conectar',
      responseTimeMs,
      statusCode,
      errorType,
      attemptedAt,
      completedAt,
    };
  }
}

export async function logWakeAttempt(
  projectId: string,
  result: WakeResult
): Promise<void> {
  await supabase.from('wake_logs').insert({
    project_id: projectId,
    success: result.success,
    error_message: result.success ? null : result.message,
    response_time_ms: result.responseTimeMs,
    status_code: result.statusCode,
    error_type: result.errorType,
    attempted_at: result.attemptedAt,
    completed_at: result.completedAt,
  });

  if (result.success) {
    await supabase
      .from('projects')
      .update({ last_wake_at: new Date().toISOString() })
      .eq('id', projectId);
  }

  await updateDailyMetrics(projectId, result);
  await manageIncident(projectId, result);
}

async function updateDailyMetrics(projectId: string, result: WakeResult): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('project_health_metrics')
    .select('*')
    .eq('project_id', projectId)
    .eq('date', today)
    .maybeSingle();

  if (existing) {
    const totalPings = existing.total_pings + 1;
    const successfulPings = existing.successful_pings + (result.success ? 1 : 0);
    const failedPings = existing.failed_pings + (result.success ? 0 : 1);
    const uptimePercentage = (successfulPings / totalPings) * 100;

    let avgResponseTime = existing.avg_response_time_ms;
    let minResponseTime = existing.min_response_time_ms;
    let maxResponseTime = existing.max_response_time_ms;

    if (result.responseTimeMs !== undefined) {
      const prevTotal = existing.avg_response_time_ms
        ? existing.avg_response_time_ms * existing.total_pings
        : 0;
      avgResponseTime = Math.round((prevTotal + result.responseTimeMs) / totalPings);
      minResponseTime = Math.min(minResponseTime || result.responseTimeMs, result.responseTimeMs);
      maxResponseTime = Math.max(maxResponseTime || result.responseTimeMs, result.responseTimeMs);
    }

    await supabase
      .from('project_health_metrics')
      .update({
        total_pings: totalPings,
        successful_pings: successfulPings,
        failed_pings: failedPings,
        uptime_percentage: uptimePercentage,
        avg_response_time_ms: avgResponseTime,
        min_response_time_ms: minResponseTime,
        max_response_time_ms: maxResponseTime,
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('project_health_metrics').insert({
      project_id: projectId,
      date: today,
      total_pings: 1,
      successful_pings: result.success ? 1 : 0,
      failed_pings: result.success ? 0 : 1,
      uptime_percentage: result.success ? 100 : 0,
      avg_response_time_ms: result.responseTimeMs,
      min_response_time_ms: result.responseTimeMs,
      max_response_time_ms: result.responseTimeMs,
    });
  }
}

async function manageIncident(projectId: string, result: WakeResult): Promise<void> {
  const { data: openIncidents } = await supabase
    .from('project_incidents')
    .select('*')
    .eq('project_id', projectId)
    .is('resolved_at', null)
    .order('started_at', { ascending: false });

  if (!result.success) {
    const mostRecentIncident = openIncidents?.[0];

    if (mostRecentIncident) {
      const prevCount = mostRecentIncident.error_count;
      const newCount = prevCount + 1;
      const avgResponseTime =
        mostRecentIncident.avg_response_time_ms !== null && result.responseTimeMs !== undefined
          ? Math.round((mostRecentIncident.avg_response_time_ms * prevCount + result.responseTimeMs) / newCount)
          : result.responseTimeMs ?? mostRecentIncident.avg_response_time_ms;

      await supabase
        .from('project_incidents')
        .update({
          error_count: newCount,
          avg_response_time_ms: avgResponseTime,
        })
        .eq('id', mostRecentIncident.id);
    } else {
      const isTimeout = result.errorType === 'timeout';
      const isSlowResponse =
        !isTimeout &&
        result.responseTimeMs !== undefined &&
        result.responseTimeMs > 5000 &&
        result.statusCode !== undefined &&
        result.statusCode < 500;
      const incidentType: 'downtime' | 'slow_response' = isSlowResponse ? 'slow_response' : 'downtime';

      await supabase.from('project_incidents').insert({
        project_id: projectId,
        started_at: new Date().toISOString(),
        incident_type: incidentType,
        error_count: 1,
        avg_response_time_ms: result.responseTimeMs,
        description: `${incidentType === 'downtime' ? 'Serviço indisponível' : 'Resposta lenta detectada'}: ${result.message}`,
      });
    }
  } else if (openIncidents && openIncidents.length > 0) {
    const resolvedAt = new Date();

    for (const incident of openIncidents) {
      const startedAt = new Date(incident.started_at);
      const durationMinutes = Math.round((resolvedAt.getTime() - startedAt.getTime()) / (1000 * 60));

      await supabase
        .from('project_incidents')
        .update({
          resolved_at: resolvedAt.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('id', incident.id);
    }
  }
}

export function getNextWakeTime(project: Project): Date | null {
  if (!project.is_active) return null;

  const lastWake = project.last_wake_at ? new Date(project.last_wake_at) : new Date(project.created_at);
  const nextWake = new Date(lastWake.getTime() + project.interval_hours * 60 * 60 * 1000);

  return nextWake;
}

export function shouldWakeNow(project: Project): boolean {
  if (!project.is_active) return false;

  const nextWake = getNextWakeTime(project);
  if (!nextWake) return false;

  return new Date() >= nextWake;
}

export function formatTimeUntilWake(project: Project): string {
  const nextWake = getNextWakeTime(project);
  if (!nextWake) return i18n.t('wakeService.inactive');

  const now = new Date();
  const diff = nextWake.getTime() - now.getTime();

  if (diff <= 0) return i18n.t('wakeService.dueNow');

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
