-- ============================================
-- MIGRATION 007: Melhorias para WebSocket e Tempo Real
-- Data: 2025-09-06
-- Descrição: Adicionar colunas e tabelas necessárias para funcionalidades WebSocket
-- ============================================

-- Adicionar colunas na tabela usuarios para suporte ao WebSocket
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS status_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS socket_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS ultimo_ping TIMESTAMP,
ADD COLUMN IF NOT EXISTS configuracoes_notificacao JSONB DEFAULT '{
    "email": true,
    "push": true,
    "som": true,
    "tipos": {
        "mensagem": true,
        "tarefa": true,
        "convite": true,
        "sistema": true,
        "mencao": true
    },
    "horario_silencioso": {
        "ativo": false,
        "inicio": "22:00",
        "fim": "08:00"
    }
}'::jsonb;

-- Criar tabela para gerenciar sessões WebSocket
CREATE TABLE IF NOT EXISTS sessoes_websocket (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    socket_id VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    data_conexao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT true,
    grupos_conectados TEXT[], -- Array de IDs dos grupos que o usuário está "ouvindo"
    
    CONSTRAINT fk_sessao_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Criar tabela para histórico de status online/offline
CREATE TABLE IF NOT EXISTS historico_status_online (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL CHECK (status IN ('online', 'offline', 'away')),
    timestamp_mudanca TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duracao_sessao INTERVAL, -- Preenchido quando for 'offline'
    ip_address INET,
    
    CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Melhorar tabela de mensagens para suporte ao WebSocket
ALTER TABLE mensagens 
ADD COLUMN IF NOT EXISTS lida_por JSONB DEFAULT '[]'::jsonb, -- Array de {usuario_id, timestamp}
ADD COLUMN IF NOT EXISTS entregue_para JSONB DEFAULT '[]'::jsonb, -- Array de {usuario_id, timestamp}
ADD COLUMN IF NOT EXISTS mencoes UUID[] DEFAULT '{}'; -- Array de IDs de usuários mencionados

-- Criar tabela para gerenciar digitação em tempo real
CREATE TABLE IF NOT EXISTS status_digitacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    digitando BOOLEAN DEFAULT true,
    timestamp_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    timestamp_fim TIMESTAMP,
    
    -- Índice composto para busca rápida
    UNIQUE(usuario_id, grupo_id),
    
    CONSTRAINT fk_digitacao_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_digitacao_grupo FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE
);

-- Criar tabela para filas de notificações push
CREATE TABLE IF NOT EXISTS fila_notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo enum_tipo_notificacao NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    dados_extras JSONB DEFAULT '{}'::jsonb,
    prioridade INTEGER DEFAULT 1 CHECK (prioridade BETWEEN 1 AND 5), -- 1=baixa, 5=alta
    enviado BOOLEAN DEFAULT false,
    tentativas INTEGER DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_processamento TIMESTAMP,
    erro_envio TEXT,
    
    CONSTRAINT fk_fila_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_status_online ON usuarios(status_online, ultimo_acesso);
CREATE INDEX IF NOT EXISTS idx_usuarios_socket_id ON usuarios(socket_id) WHERE socket_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes_websocket(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_ativo ON sessoes_websocket(ativo, ultimo_ping);
CREATE INDEX IF NOT EXISTS idx_sessoes_socket_id ON sessoes_websocket(socket_id);

CREATE INDEX IF NOT EXISTS idx_historico_usuario_timestamp ON historico_status_online(usuario_id, timestamp_mudanca DESC);

CREATE INDEX IF NOT EXISTS idx_mensagens_lida_por ON mensagens USING GIN(lida_por);
CREATE INDEX IF NOT EXISTS idx_mensagens_mencoes ON mensagens USING GIN(mencoes);

CREATE INDEX IF NOT EXISTS idx_digitacao_grupo_ativo ON status_digitacao(grupo_id) WHERE digitando = true;

CREATE INDEX IF NOT EXISTS idx_fila_nao_enviado ON fila_notificacoes(enviado, prioridade DESC, data_criacao) WHERE enviado = false;

-- Criar função para limpar sessões WebSocket antigas (mais de 1 hora sem ping)
CREATE OR REPLACE FUNCTION limpar_sessoes_websocket_antigas()
RETURNS INTEGER AS $$
DECLARE
    sessoes_removidas INTEGER;
BEGIN
    -- Marcar usuários como offline se suas sessões expiraram
    UPDATE usuarios 
    SET status_online = false, socket_id = NULL
    WHERE id IN (
        SELECT DISTINCT usuario_id 
        FROM sessoes_websocket 
        WHERE ultimo_ping < NOW() - INTERVAL '1 hour'
    );

    -- Remover sessões antigas
    DELETE FROM sessoes_websocket 
    WHERE ultimo_ping < NOW() - INTERVAL '1 hour'
    OR ativo = false;
    
    GET DIAGNOSTICS sessoes_removidas = ROW_COUNT;
    
    -- Limpar status de digitação antigos (mais de 5 minutos)
    DELETE FROM status_digitacao 
    WHERE timestamp_inicio < NOW() - INTERVAL '5 minutes';
    
    -- Limpar histórico muito antigo (mais de 30 dias)
    DELETE FROM historico_status_online 
    WHERE timestamp_mudanca < NOW() - INTERVAL '30 days';
    
    RETURN sessoes_removidas;
END;
$$ LANGUAGE plpgsql;

-- Criar função para atualizar último ping do usuário
CREATE OR REPLACE FUNCTION atualizar_ping_usuario(p_socket_id VARCHAR(255))
RETURNS BOOLEAN AS $$
DECLARE
    usuario_encontrado BOOLEAN := false;
BEGIN
    -- Atualizar sessão WebSocket
    UPDATE sessoes_websocket 
    SET ultimo_ping = CURRENT_TIMESTAMP
    WHERE socket_id = p_socket_id AND ativo = true;
    
    -- Usar FOUND diretamente
    usuario_encontrado := FOUND;
    
    -- Atualizar último acesso do usuário
    IF usuario_encontrado THEN
        UPDATE usuarios 
        SET ultimo_acesso = CURRENT_TIMESTAMP
        WHERE socket_id = p_socket_id;
    END IF;
    
    RETURN usuario_encontrado;
END;
$$ LANGUAGE plpgsql;


-- Criar função para gerenciar status de digitação
CREATE OR REPLACE FUNCTION definir_status_digitacao(
    p_usuario_id UUID, 
    p_grupo_id UUID, 
    p_digitando BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    IF p_digitando THEN
        -- Inserir ou atualizar status de digitação
        INSERT INTO status_digitacao (usuario_id, grupo_id, digitando, timestamp_inicio)
        VALUES (p_usuario_id, p_grupo_id, true, CURRENT_TIMESTAMP)
        ON CONFLICT (usuario_id, grupo_id)
        DO UPDATE SET 
            digitando = true,
            timestamp_inicio = CURRENT_TIMESTAMP,
            timestamp_fim = NULL;
    ELSE
        -- Finalizar digitação
        UPDATE status_digitacao 
        SET digitando = false, timestamp_fim = CURRENT_TIMESTAMP
        WHERE usuario_id = p_usuario_id AND grupo_id = p_grupo_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Criar função para obter usuários online em um grupo
CREATE OR REPLACE FUNCTION obter_usuarios_online_grupo(p_grupo_id UUID)
RETURNS TABLE (
    usuario_id UUID,
    nome VARCHAR(100),
    ultimo_ping TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as usuario_id,
        u.nome,
        s.ultimo_ping
    FROM usuarios u
    JOIN sessoes_websocket s ON u.id = s.usuario_id
    JOIN membros_grupo mg ON u.id = mg.usuario_id
    WHERE mg.grupo_id = p_grupo_id
    AND s.ativo = true
    AND s.ultimo_ping > NOW() - INTERVAL '5 minutes'
    AND u.status_online = true
    ORDER BY s.ultimo_ping DESC;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE sessoes_websocket IS 'Tabela para gerenciar conexões WebSocket ativas dos usuários';
COMMENT ON TABLE historico_status_online IS 'Histórico de mudanças de status online/offline dos usuários';
COMMENT ON TABLE status_digitacao IS 'Status de digitação em tempo real nos grupos';
COMMENT ON TABLE fila_notificacoes IS 'Fila de notificações push para usuários';

COMMENT ON COLUMN usuarios.status_online IS 'Indica se o usuário está atualmente online';
COMMENT ON COLUMN usuarios.socket_id IS 'ID da sessão WebSocket ativa do usuário';
COMMENT ON COLUMN usuarios.ultimo_ping IS 'Timestamp do último ping recebido via WebSocket';
COMMENT ON COLUMN usuarios.configuracoes_notificacao IS 'Configurações personalizadas de notificações do usuário';

COMMENT ON COLUMN mensagens.lida_por IS 'Array JSON com usuários que leram a mensagem e timestamps';
COMMENT ON COLUMN mensagens.entregue_para IS 'Array JSON com usuários que receberam a mensagem via WebSocket';
COMMENT ON COLUMN mensagens.mencoes IS 'Array de IDs de usuários mencionados na mensagem';

COMMENT ON FUNCTION limpar_sessoes_websocket_antigas() IS 'Remove sessões WebSocket inativas e atualiza status dos usuários';
COMMENT ON FUNCTION atualizar_ping_usuario(VARCHAR) IS 'Atualiza o timestamp do último ping para uma sessão WebSocket';
COMMENT ON FUNCTION definir_status_digitacao(UUID, UUID, BOOLEAN) IS 'Define o status de digitação de um usuário em um grupo';
COMMENT ON FUNCTION obter_usuarios_online_grupo(UUID) IS 'Retorna lista de usuários online em um grupo específico';

-- Log da migration
DO $$
BEGIN
    RAISE NOTICE 'Migration 007 aplicada com sucesso: Melhorias para WebSocket e Tempo Real';
    RAISE NOTICE 'Adicionadas colunas: status_online, socket_id, ultimo_ping, configuracoes_notificacao';
    RAISE NOTICE 'Criadas tabelas: sessoes_websocket, historico_status_online, status_digitacao, fila_notificacoes';
    RAISE NOTICE 'Criadas funções: limpar_sessoes_websocket_antigas, atualizar_ping_usuario, definir_status_digitacao, obter_usuarios_online_grupo';
END $$;
