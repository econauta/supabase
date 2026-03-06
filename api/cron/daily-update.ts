import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface Project {
  id: string;
  name: string;
  supabase_url: string;
  anon_key: string;
  is_active: boolean;
  interval_hours: number;
  last_wake_at: string | null;
  created_at?: string;
}

interface WakeResult {
  success: boolean;
  message: string;
  responseTimeMs?: number;
  statusCode?: number;
  errorType?: string;
  attemptedAt: string;
  completedAt?: string;
}

type ErrorType = 'timeout' | 'network' | 'auth' | 'server' | 'not_found' | 'unknown';

function categorizeError(error: Error | { code?: string; message?: string }): ErrorType {
  const message = error.message?.toLowerCase() || '';
  const code = 'code' in error ? error.code : '';

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

async function wakeProject(project: Project): Promise<WakeResult> {
  const attemptedAt = new Date().toISOString();
  const startTime = Date.now();

  try {
    const client = createClient(project.supabase_url, project.anon_key);
    const timestamp = new Date().toISOString();

    const { error: insertError } = await client
      .from('_heartbeat')
      .insert({ pinged_at: timestamp });

    const endTime = Date.now();
    const responseTimeMs = Math.round(endTime - startTime);
    const completedAt = new Date().toISOString();

    if (insertError) {
      const errorType = categorizeError(insertError);
      const statusCode = getStatusCodeFromError(insertError);

      if (insertError.message.includes('does not exist') || insertError.code === '42P01') {
        return {
          success: false,
          message: '_heartbeat table not found',
          responseTimeMs,
          statusCode: statusCode || 404,
          errorType: 'not_found',
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
      message: 'Project woken successfully',
      responseTimeMs,
      statusCode: 200,
      attemptedAt,
      completedAt,
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTimeMs = Math.round(endTime - startTime);
    const completedAt = new Date().toISOString();
    const err = error instanceof Error ? error : { message: 'Unknown error occurred' };
    const errorType = categorizeError(err);
    const statusCode = getStatusCodeFromError(err as Error);

    return {
      success: false,
      message: err.message || 'Unknown error occurred',
      responseTimeMs,
      statusCode,
      errorType,
      attemptedAt,
      completedAt,
    };
  }
}

async function logWakeAttempt(
  supabaseClient: ReturnType<typeof createClient>,
  projectId: string,
  result: WakeResult
): Promise<void> {
  await supabaseClient.from('wake_logs').insert({
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
    await supabaseClient
      .from('projects')
      .update({ last_wake_at: new Date().toISOString() })
      .eq('id', projectId);
  }

  await updateDailyMetrics(supabaseClient, projectId, result);
  await manageIncident(supabaseClient, projectId, result);
}

async function updateDailyMetrics(
  supabaseClient: ReturnType<typeof createClient>,
  projectId: string,
  result: WakeResult
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabaseClient
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

    await supabaseClient
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
    await supabaseClient.from('project_health_metrics').insert({
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

async function manageIncident(
  supabaseClient: ReturnType<typeof createClient>,
  projectId: string,
  result: WakeResult
): Promise<void> {
  const { data: openIncidents } = await supabaseClient
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

      await supabaseClient
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

      await supabaseClient.from('project_incidents').insert({
        project_id: projectId,
        started_at: new Date().toISOString(),
        incident_type: incidentType,
        error_count: 1,
        avg_response_time_ms: result.responseTimeMs,
        description: `${incidentType === 'downtime' ? 'Service unavailable' : 'Slow response detected'}: ${result.message}`,
      });
    }
  } else if (openIncidents && openIncidents.length > 0) {
    const resolvedAt = new Date();

    for (const incident of openIncidents) {
      const startedAt = new Date(incident.started_at);
      const durationMinutes = Math.round((resolvedAt.getTime() - startedAt.getTime()) / (1000 * 60));

      await supabaseClient
        .from('project_incidents')
        .update({
          resolved_at: resolvedAt.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('id', incident.id);
    }
  }
}

function getNextWakeTime(project: Project): Date | null {
  if (!project.is_active) return null;

  const lastWake = project.last_wake_at ? new Date(project.last_wake_at) : new Date(project.created_at || new Date());
  const nextWake = new Date(lastWake.getTime() + project.interval_hours * 60 * 60 * 1000);

  return nextWake;
}

function shouldWakeNow(project: Project): boolean {
  if (!project.is_active) return false;

  const nextWake = getNextWakeTime(project);
  if (!nextWake) return false;

  return new Date() >= nextWake;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token || token !== process.env.CRON_SECRET_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Missing Supabase configuration' });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const { data: projects, error: fetchError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('is_active', true);

    if (fetchError) {
      return res.status(500).json({ error: 'Failed to fetch projects', details: fetchError.message });
    }

    if (!projects || projects.length === 0) {
      return res.status(200).json({
        message: 'No active projects to wake',
        totalProjects: 0,
        projectsDue: 0,
        results: [],
      });
    }

    // Filter projects that are due for wake based on their interval
    const projectsDueForWake = projects.filter(project => shouldWakeNow(project));

    if (projectsDueForWake.length === 0) {
      return res.status(200).json({
        message: 'No projects due for wake at this time',
        totalProjects: projects.length,
        projectsDue: 0,
        results: [],
      });
    }

    const results = [];

    for (const project of projectsDueForWake) {
      const wakeResult = await wakeProject(project);
      await logWakeAttempt(supabaseClient, project.id, wakeResult);

      results.push({
        projectId: project.id,
        projectName: project.name,
        success: wakeResult.success,
        message: wakeResult.message,
        responseTimeMs: wakeResult.responseTimeMs,
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return res.status(200).json({
      message: 'Health check completed',
      totalProjects: projects.length,
      projectsDue: projectsDueForWake.length,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      },
      results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
