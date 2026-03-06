/*
  # Create wake_logs table

  1. New Tables
    - `wake_logs`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `success` (boolean, whether wake-up succeeded)
      - `error_message` (text, error details if failed)
      - `created_at` (timestamptz, when the wake-up was attempted)

  2. Security
    - Enable RLS on `wake_logs` table
    - Add policies for authenticated users to manage logs for their own projects
*/

CREATE TABLE IF NOT EXISTS wake_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wake_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for own projects"
  ON wake_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = wake_logs.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert logs for own projects"
  ON wake_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = wake_logs.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete logs for own projects"
  ON wake_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = wake_logs.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_wake_logs_project_id ON wake_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_wake_logs_created_at ON wake_logs(created_at DESC);