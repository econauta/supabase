/*
  # Tags e Grupos de Projetos

  ## Resumo
  Adiciona suporte a tags/grupos de projetos. Cada usuario pode criar suas proprias tags
  e associa-las a projetos para facilitar organizacao e filtragem.

  ## Novas Tabelas
  - `project_tags`: Armazena as tags criadas por cada usuario
    - `id` (uuid, primary key)
    - `user_id` (uuid, referencia auth.users)
    - `name` (text, nome da tag)
    - `color` (text, cor hexadecimal da tag)
    - `created_at` (timestamptz)

  ## Modificacoes
  - `projects`: Adicionada coluna `tags` (text[], array de nomes de tags)

  ## Seguranca
  - RLS habilitado na tabela `project_tags`
  - Usuarios so podem ver, criar, atualizar e deletar suas proprias tags
*/

-- Adiciona coluna tags na tabela projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'tags'
  ) THEN
    ALTER TABLE projects ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Cria tabela de tags do usuario
CREATE TABLE IF NOT EXISTS project_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#32CF8B',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags"
  ON project_tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON project_tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON project_tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON project_tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_project_tags_user_id ON project_tags(user_id);
