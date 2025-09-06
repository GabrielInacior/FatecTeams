-- ============================================
-- MIGRATION 006: Verificação e limpeza final
-- Data: 2025-09-05
-- Descrição: Verificar se todas as tabelas existem corretamente e criar views úteis
-- ============================================

-- Verificar se todas as tabelas principais existem
DO $$
BEGIN
    -- Verificar se todas as tabelas esperadas existem
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
        RAISE EXCEPTION 'Tabela usuarios não encontrada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grupos') THEN
        RAISE EXCEPTION 'Tabela grupos não encontrada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membros_grupo') THEN
        RAISE EXCEPTION 'Tabela membros_grupo não encontrada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mensagens') THEN
        RAISE EXCEPTION 'Tabela mensagens não encontrada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tarefas') THEN
        RAISE EXCEPTION 'Tabela tarefas não encontrada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'eventos_calendario') THEN
        RAISE EXCEPTION 'Tabela eventos_calendario não encontrada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'arquivos') THEN
        RAISE EXCEPTION 'Tabela arquivos não encontrada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'convites_grupo') THEN
        RAISE EXCEPTION 'Tabela convites_grupo não encontrada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notificacoes') THEN
        RAISE EXCEPTION 'Tabela notificacoes não encontrada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'historico_atividades') THEN
        RAISE EXCEPTION 'Tabela historico_atividades não encontrada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reacoes_mensagens') THEN
        RAISE EXCEPTION 'Tabela reacoes_mensagens não encontrada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leituras_mensagem') THEN
        RAISE EXCEPTION 'Tabela leituras_mensagem não encontrada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comentarios_tarefas') THEN
        RAISE EXCEPTION 'Tabela comentarios_tarefas não encontrada';
    END IF;
    
    RAISE NOTICE 'Todas as tabelas foram verificadas com sucesso!';
END
$$;

-- Criar views úteis para consultas frequentes
CREATE OR REPLACE VIEW view_grupos_com_estatisticas AS
SELECT 
    g.*,
    u.nome as criador_nome,
    u.email as criador_email,
    (SELECT COUNT(*) FROM membros_grupo WHERE grupo_id = g.id AND ativo = true) as total_membros,
    (SELECT COUNT(*) FROM mensagens WHERE grupo_id = g.id AND deletado_em IS NULL) as total_mensagens,
    (SELECT COUNT(*) FROM tarefas WHERE grupo_id = g.id AND deletado_em IS NULL) as total_tarefas,
    (SELECT COUNT(*) FROM eventos_calendario WHERE grupo_id = g.id) as total_eventos,
    (SELECT MAX(data_envio) FROM mensagens WHERE grupo_id = g.id AND deletado_em IS NULL) as ultima_mensagem
FROM grupos g
LEFT JOIN usuarios u ON g.criador_id = u.id
WHERE g.deletado_em IS NULL;

-- View para mensagens com informações completas
CREATE OR REPLACE VIEW view_mensagens_completas AS
SELECT 
    m.*,
    u.nome as remetente_nome,
    u.foto_perfil as remetente_foto,
    g.nome as grupo_nome,
    a.nome_original as arquivo_nome,
    a.url_s3 as arquivo_url,
    a.tipo_mime as arquivo_tipo,
    (SELECT COUNT(*) FROM reacoes_mensagens WHERE mensagem_id = m.id) as total_reacoes
FROM mensagens m
LEFT JOIN usuarios u ON m.remetente_id = u.id
LEFT JOIN grupos g ON m.grupo_id = g.id  
LEFT JOIN arquivos a ON m.arquivo_id = a.id
WHERE m.deletado_em IS NULL;

-- View para tarefas com informações completas
CREATE OR REPLACE VIEW view_tarefas_completas AS
SELECT 
    t.*,
    uc.nome as criador_nome,
    uc.foto_perfil as criador_foto,
    ua.nome as assignado_nome,
    ua.foto_perfil as assignado_foto,
    ua.email as assignado_email,
    g.nome as grupo_nome,
    (SELECT COUNT(*) FROM comentarios_tarefas WHERE tarefa_id = t.id AND deletado_em IS NULL) as total_comentarios
FROM tarefas t
LEFT JOIN usuarios uc ON t.criador_id = uc.id
LEFT JOIN usuarios ua ON t.assignado_para = ua.id
LEFT JOIN grupos g ON t.grupo_id = g.id
WHERE t.deletado_em IS NULL;

-- Limpar dados inconsistentes (se houver)
-- Remover membros de grupos que não existem mais
DELETE FROM membros_grupo 
WHERE grupo_id NOT IN (SELECT id FROM grupos WHERE deletado_em IS NULL);

-- Remover mensagens de grupos que não existem mais  
UPDATE mensagens SET deletado_em = NOW() 
WHERE grupo_id NOT IN (SELECT id FROM grupos WHERE deletado_em IS NULL)
  AND deletado_em IS NULL;

-- Remover tarefas de grupos que não existem mais
UPDATE tarefas SET deletado_em = NOW() 
WHERE grupo_id NOT IN (SELECT id FROM grupos WHERE deletado_em IS NULL)
  AND deletado_em IS NULL;

-- Remover eventos de grupos que não existem mais
DELETE FROM eventos_calendario 
WHERE grupo_id NOT IN (SELECT id FROM grupos WHERE deletado_em IS NULL);

-- Atualizar estatísticas
ANALYZE;

COMMIT;
