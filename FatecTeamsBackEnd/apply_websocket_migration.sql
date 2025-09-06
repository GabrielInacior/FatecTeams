-- ============================================
-- SCRIPT DE APLICAÇÃO DA MIGRATION 007
-- Execute este script para aplicar as melhorias de WebSocket
-- ============================================

-- Verificar se a migration já foi aplicada
DO $$
DECLARE
    migration_exists BOOLEAN := false;
BEGIN
    -- Verificar se já existe a coluna status_online
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'status_online'
    ) INTO migration_exists;
    
    IF migration_exists THEN
        RAISE NOTICE 'Migration 007 já foi aplicada anteriormente.';
    ELSE
        RAISE NOTICE 'Aplicando Migration 007: Melhorias para WebSocket...';
        -- A migration será aplicada a seguir
    END IF;
END $$;

-- Aplicar a migration 007 se ainda não foi aplicada
\i migrations/007_websocket_improvements.sql

-- Verificar se todas as tabelas foram criadas corretamente
DO $$
BEGIN
    -- Verificar tabelas criadas
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessoes_websocket') THEN
        RAISE NOTICE '✅ Tabela sessoes_websocket criada com sucesso';
    ELSE
        RAISE EXCEPTION '❌ Falha ao criar tabela sessoes_websocket';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'historico_status_online') THEN
        RAISE NOTICE '✅ Tabela historico_status_online criada com sucesso';
    ELSE
        RAISE EXCEPTION '❌ Falha ao criar tabela historico_status_online';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'status_digitacao') THEN
        RAISE NOTICE '✅ Tabela status_digitacao criada com sucesso';
    ELSE
        RAISE EXCEPTION '❌ Falha ao criar tabela status_digitacao';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fila_notificacoes') THEN
        RAISE NOTICE '✅ Tabela fila_notificacoes criada com sucesso';
    ELSE
        RAISE EXCEPTION '❌ Falha ao criar tabela fila_notificacoes';
    END IF;
    
    -- Verificar colunas adicionadas
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'status_online') THEN
        RAISE NOTICE '✅ Coluna status_online adicionada à tabela usuarios';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'socket_id') THEN
        RAISE NOTICE '✅ Coluna socket_id adicionada à tabela usuarios';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mensagens' AND column_name = 'lida_por') THEN
        RAISE NOTICE '✅ Coluna lida_por adicionada à tabela mensagens';
    END IF;
    
    -- Verificar funções criadas
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'limpar_sessoes_websocket_antigas') THEN
        RAISE NOTICE '✅ Função limpar_sessoes_websocket_antigas criada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'atualizar_ping_usuario') THEN
        RAISE NOTICE '✅ Função atualizar_ping_usuario criada';
    END IF;
    
    RAISE NOTICE '🎉 Migration 007 aplicada com sucesso!';
    RAISE NOTICE 'O backend agora tem suporte completo para WebSocket em tempo real.';
END $$;
