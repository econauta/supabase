export interface Profile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  supabase_url: string;
  anon_key: string;
  interval_hours: number;
  is_active: boolean;
  last_wake_at: string | null;
  display_order: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface WakeLog {
  id: string;
  project_id: string;
  success: boolean;
  error_message: string | null;
  response_time_ms: number | null;
  status_code: number | null;
  error_type: string | null;
  attempted_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface ProjectHealthMetrics {
  id: string;
  project_id: string;
  date: string;
  total_pings: number;
  successful_pings: number;
  failed_pings: number;
  avg_response_time_ms: number | null;
  min_response_time_ms: number | null;
  max_response_time_ms: number | null;
  uptime_percentage: number;
  created_at: string;
}

export interface ProjectIncident {
  id: string;
  project_id: string;
  started_at: string;
  resolved_at: string | null;
  duration_minutes: number | null;
  incident_type: 'downtime' | 'slow_response' | 'intermittent';
  error_count: number;
  avg_response_time_ms: number | null;
  description: string | null;
  created_at: string;
}

export interface ProjectWithLogs extends Project {
  wake_logs?: WakeLog[];
}

export interface ProjectHealthSummary {
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  avgLatency24h: number | null;
  avgLatency7d: number | null;
  lastResponseTimeMs: number | null;
  totalPings: number;
  successfulPings: number;
  failedPings: number;
  activeIncidents: number;
  activeIncidentType: 'downtime' | 'slow_response' | 'intermittent' | null;
  recentIncidents: ProjectIncident[];
  dailyMetrics: ProjectHealthMetrics[];
  recentLogs: WakeLog[];
}
