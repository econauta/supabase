/*
  # Otimização adicional para queries de saúde
  
  1. Novos Índices Compostos
    - Adiciona índice para project_incidents com filtro de resolved_at NULL
    - Otimiza query que busca incidentes ativos por projeto
    
  2. Análise de Performance
    - Força atualização das estatísticas de todas as tabelas de métricas
    - Permite que o Postgres escolha melhores planos de execução
*/

-- Índice composto para incidentes ativos por projeto
CREATE INDEX IF NOT EXISTS idx_incidents_project_resolved 
ON project_incidents (project_id, resolved_at) 
WHERE resolved_at IS NULL;

-- Atualiza estatísticas para otimizar queries
ANALYZE project_health_metrics;
ANALYZE project_incidents;
ANALYZE wake_logs;
