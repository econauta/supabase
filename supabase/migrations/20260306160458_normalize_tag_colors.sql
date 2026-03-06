/*
  # Normalizar cores das tags

  1. Alteracoes
    - Atualiza todas as tags existentes para a cor padrao #adb5bd
    - Altera o DEFAULT da coluna `color` na tabela `project_tags` para #adb5bd
*/

UPDATE project_tags SET color = '#adb5bd';

ALTER TABLE project_tags ALTER COLUMN color SET DEFAULT '#adb5bd';
