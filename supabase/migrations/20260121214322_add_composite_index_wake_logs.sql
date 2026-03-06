/*
  # Otimização de performance para wake_logs
  
  1. Novo Índice Composto
    - Adiciona índice composto `(project_id, created_at DESC)` na tabela `wake_logs`
    - Otimiza queries que filtram por project_id e ordenam por created_at
    - Resolve problema de lentidão ao abrir relatórios de projetos
    
  2. Motivo
    - Consultas frequentes buscam logs de um projeto específico ordenados por data
    - Índice composto permite Postgres usar um único índice em vez de dois separados
    - Reduz tempo de consulta significativamente
*/

-- Cria índice composto para otimizar queries de relatório
CREATE INDEX IF NOT EXISTS idx_wake_logs_project_created 
ON wake_logs (project_id, created_at DESC);

-- Análise de estatísticas da tabela para otimizar plano de execução
ANALYZE wake_logs;
