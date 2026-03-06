/*
  # Create project_incidents table

  1. New Tables
    - `project_incidents`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `started_at` (timestamptz, when incident began)
      - `resolved_at` (timestamptz, when incident was resolved, null if ongoing)
      - `duration_minutes` (integer, calculated duration)
      - `incident_type` (text, type: downtime, slow_response, intermittent)
      - `error_count` (integer, number of errors during incident)
      - `avg_response_time_ms` (integer, avg latency during incident)
      - `description` (text, auto-generated description)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on table
    - Users can only view/manage incidents for their own projects

  3. Indexes
    - Index on project_id and started_at for efficient queries
    - Index on resolved_at to find ongoing incidents
*/

CREATE TABLE IF NOT EXISTS project_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  duration_minutes integer,
  incident_type text NOT NULL DEFAULT 'downtime',
  error_count integer NOT NULL DEFAULT 1,
  avg_response_time_ms integer,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view incidents for own projects"
  ON project_incidents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_incidents.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert incidents for own projects"
  ON project_incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_incidents.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update incidents for own projects"
  ON project_incidents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_incidents.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_incidents.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete incidents for own projects"
  ON project_incidents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_incidents.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_incidents_project_started ON project_incidents(project_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_resolved ON project_incidents(resolved_at) WHERE resolved_at IS NULL;