/*
  # Add display_order to projects table

  1. Changes
    - Add `display_order` column to `projects` table (integer)
    - Set default values for existing projects based on created_at
    - Create index for efficient sorting

  2. Notes
    - Existing projects will be ordered by their creation date
    - New projects will be added to the end (max order + 1)
*/

-- Add display_order column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE projects ADD COLUMN display_order integer;
  END IF;
END $$;

-- Set display_order for existing projects based on created_at
UPDATE projects
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
  FROM projects
  WHERE display_order IS NULL
) as subquery
WHERE projects.id = subquery.id AND projects.display_order IS NULL;

-- Set NOT NULL constraint after populating values
ALTER TABLE projects ALTER COLUMN display_order SET NOT NULL;

-- Set default for new rows
ALTER TABLE projects ALTER COLUMN display_order SET DEFAULT 0;

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_projects_display_order ON projects(user_id, display_order);