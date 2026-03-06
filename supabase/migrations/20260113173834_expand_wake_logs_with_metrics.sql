/*
  # Expand wake_logs table with monitoring metrics

  1. Changes to `wake_logs` table
    - `response_time_ms` (integer) - Response latency in milliseconds
    - `status_code` (integer) - HTTP status code returned
    - `error_type` (text) - Type of error: timeout, network, auth, server, unknown
    - `attempted_at` (timestamptz) - When the ping was initiated
    - `completed_at` (timestamptz) - When the response was received

  2. Indexes
    - Index on response_time_ms for latency queries
    - Index on status_code for filtering by response type

  3. Notes
    - These fields enable detailed latency tracking and error categorization
    - existing rows will have NULL for new fields (backwards compatible)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wake_logs' AND column_name = 'response_time_ms'
  ) THEN
    ALTER TABLE wake_logs ADD COLUMN response_time_ms integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wake_logs' AND column_name = 'status_code'
  ) THEN
    ALTER TABLE wake_logs ADD COLUMN status_code integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wake_logs' AND column_name = 'error_type'
  ) THEN
    ALTER TABLE wake_logs ADD COLUMN error_type text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wake_logs' AND column_name = 'attempted_at'
  ) THEN
    ALTER TABLE wake_logs ADD COLUMN attempted_at timestamptz DEFAULT now();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wake_logs' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE wake_logs ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wake_logs_response_time ON wake_logs(response_time_ms);
CREATE INDEX IF NOT EXISTS idx_wake_logs_status_code ON wake_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_wake_logs_attempted_at ON wake_logs(attempted_at DESC);