/*
  # Create project_health_metrics table

  1. New Tables
    - `project_health_metrics`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `date` (date, the day these metrics are for)
      - `total_pings` (integer, total ping attempts)
      - `successful_pings` (integer, successful pings)
      - `failed_pings` (integer, failed pings)
      - `avg_response_time_ms` (integer, average latency)
      - `min_response_time_ms` (integer, minimum latency)
      - `max_response_time_ms` (integer, maximum latency)
      - `uptime_percentage` (numeric, calculated uptime %)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on table
    - Users can only view metrics for their own projects

  3. Indexes
    - Composite index on project_id and date for efficient queries
    - Unique constraint on project_id + date (one record per day per project)
*/

CREATE TABLE IF NOT EXISTS project_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_pings integer NOT NULL DEFAULT 0,
  successful_pings integer NOT NULL DEFAULT 0,
  failed_pings integer NOT NULL DEFAULT 0,
  avg_response_time_ms integer,
  min_response_time_ms integer,
  max_response_time_ms integer,
  uptime_percentage numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, date)
);

ALTER TABLE project_health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metrics for own projects"
  ON project_health_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_health_metrics.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert metrics for own projects"
  ON project_health_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_health_metrics.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update metrics for own projects"
  ON project_health_metrics
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_health_metrics.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_health_metrics.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_health_metrics_project_date ON project_health_metrics(project_id, date DESC);