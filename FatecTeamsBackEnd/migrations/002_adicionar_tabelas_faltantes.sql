-- ============================================
-- MIGRATION: Adicionar tabelas e colunas faltantes
-- Data: 2025-09-06
-- Descrição: Adiciona apenas as tabelas e colunas que realmente não existem na migration 001
-- ============================================

-- ============================================
-- TABELAS REALMENTE NOVAS
-- ============================================

-- Tabela de participantes de eventos (NOVA)
CREATE TABLE IF NOT EXISTS eventos_participantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL REFERENCES eventos_calendario(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'recusado')),
    data_resposta TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(evento_id, usuario_id)
);

-- Tabela de configurações de notificação por usuário (NOVA)
CREATE TABLE IF NOT EXISTS configuracoes_notificacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE,
    notificacoes_email BOOLEAN DEFAULT TRUE,
    notificacoes_push BOOLEAN DEFAULT TRUE,
    tipos_ativados JSONB DEFAULT '{
        "mensagem": true,
        "tarefa": true,
        "convite": true,
        "sistema": true,
        "deadline": true,
        "mencao": true
    }',
    horario_silencioso JSONB DEFAULT '{
        "ativado": false,
        "inicio": "22:00",
        "fim": "07:00"
    }',
    frequencia_email VARCHAR(20) DEFAULT 'instantaneo' CHECK (frequencia_email IN ('instantaneo', 'diario', 'semanal', 'nunca')),
    data_criacao TIMESTAMP DEFAULT NOW(),
    data_atualizacao TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ADICIONAR COLUNAS FALTANTES EM TABELAS EXISTENTES
-- ============================================

-- Adicionar colunas faltantes na tabela eventos_calendario
DO $$
BEGIN
    -- Adicionar coluna status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'eventos_calendario' AND column_name = 'status') THEN
        ALTER TABLE eventos_calendario 
        ADD COLUMN status VARCHAR(20) DEFAULT 'agendado' 
        CHECK (status IN ('agendado', 'em_andamento', 'concluido', 'cancelado'));
    END IF;
    
    -- Adicionar coluna link_virtual se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'eventos_calendario' AND column_name = 'link_virtual') THEN
        ALTER TABLE eventos_calendario 
        ADD COLUMN link_virtual VARCHAR(500);
    END IF;
    
    -- Adicionar coluna recorrencia se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'eventos_calendario' AND column_name = 'recorrencia') THEN
        ALTER TABLE eventos_calendario 
        ADD COLUMN recorrencia JSONB;
    END IF;
    
    -- Adicionar coluna configuracoes se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'eventos_calendario' AND column_name = 'configuracoes') THEN
        ALTER TABLE eventos_calendario 
        ADD COLUMN configuracoes JSONB DEFAULT '{}';
    END IF;
    
    -- Adicionar coluna data_atualizacao se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'eventos_calendario' AND column_name = 'data_atualizacao') THEN
        ALTER TABLE eventos_calendario 
        ADD COLUMN data_atualizacao TIMESTAMP DEFAULT NOW();
    END IF;
END
$$;

-- Adicionar colunas faltantes na tabela convites_grupo se necessário
DO $$
BEGIN
    -- Verificar se precisa adicionar mensagem_personalizada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'convites_grupo' AND column_name = 'mensagem_personalizada') THEN
        ALTER TABLE convites_grupo 
        ADD COLUMN mensagem_personalizada TEXT;
    END IF;
    
    -- Verificar se precisa adicionar usuario_convidado_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'convites_grupo' AND column_name = 'usuario_convidado_id') THEN
        ALTER TABLE convites_grupo 
        ADD COLUMN usuario_convidado_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Adicionar colunas faltantes na tabela notificacoes
DO $$
BEGIN
    -- Adicionar colunas que podem estar faltando na tabela notificacoes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notificacoes' AND column_name = 'origem_tipo') THEN
        ALTER TABLE notificacoes 
        ADD COLUMN origem_tipo VARCHAR(20) CHECK (origem_tipo IN ('grupo', 'tarefa', 'mensagem', 'sistema', 'evento'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notificacoes' AND column_name = 'origem_id') THEN
        ALTER TABLE notificacoes 
        ADD COLUMN origem_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notificacoes' AND column_name = 'referencia_id') THEN
        ALTER TABLE notificacoes 
        ADD COLUMN referencia_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notificacoes' AND column_name = 'importante') THEN
        ALTER TABLE notificacoes 
        ADD COLUMN importante BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notificacoes' AND column_name = 'metadados') THEN
        ALTER TABLE notificacoes 
        ADD COLUMN metadados JSONB DEFAULT '{}';
    END IF;
END
$$;

-- ============================================
-- NOVOS ÍNDICES
-- ============================================

-- Índices para eventos_participantes
CREATE INDEX IF NOT EXISTS idx_eventos_participantes_evento ON eventos_participantes(evento_id);
CREATE INDEX IF NOT EXISTS idx_eventos_participantes_usuario ON eventos_participantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_eventos_participantes_status ON eventos_participantes(status);

-- Índices adicionais para eventos_calendario
CREATE INDEX IF NOT EXISTS idx_eventos_status ON eventos_calendario(status);
CREATE INDEX IF NOT EXISTS idx_eventos_link_virtual ON eventos_calendario(link_virtual) WHERE link_virtual IS NOT NULL;

-- Índices adicionais para notificacoes
CREATE INDEX IF NOT EXISTS idx_notificacoes_origem ON notificacoes(origem_tipo, origem_id) WHERE origem_tipo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notificacoes_importante ON notificacoes(importante) WHERE importante = TRUE;

-- Índices adicionais para convites_grupo
CREATE INDEX IF NOT EXISTS idx_convites_usuario_convidado ON convites_grupo(usuario_convidado_id) WHERE usuario_convidado_id IS NOT NULL;

-- Índices para configuracoes_notificacao
CREATE INDEX IF NOT EXISTS idx_configuracoes_notificacao_usuario ON configuracoes_notificacao(usuario_id);

-- ============================================
-- FUNCTIONS E TRIGGERS ADICIONAIS
-- ============================================

-- Função para atualizar timestamp automaticamente (criar se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar data_atualizacao em configuracoes_notificacao
DROP TRIGGER IF EXISTS update_configuracoes_notificacao_data_atualizacao ON configuracoes_notificacao;
CREATE TRIGGER update_configuracoes_notificacao_data_atualizacao 
    BEFORE UPDATE ON configuracoes_notificacao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar data_atualizacao em eventos_calendario (se a coluna foi adicionada)
DO $$
BEGIN
    -- Só criar o trigger se a coluna existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'eventos_calendario' AND column_name = 'data_atualizacao') THEN
        
        -- Remover trigger existente se houver
        DROP TRIGGER IF EXISTS update_eventos_data_atualizacao ON eventos_calendario;
        
        -- Criar novo trigger
        CREATE TRIGGER update_eventos_data_atualizacao 
            BEFORE UPDATE ON eventos_calendario
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;
