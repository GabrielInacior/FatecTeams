-- ============================================
-- MIGRATION 005: Corrigir todas as tabelas e colunas faltantes
-- Data: 2025-09-05
-- Descrição: Adicionar todas as tabelas e colunas usadas pelos repositories
-- ============================================

-- Criar tabela de reações de mensagens
CREATE TABLE IF NOT EXISTS reacoes_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mensagem_id UUID NOT NULL REFERENCES mensagens(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    data_criacao TIMESTAMP DEFAULT NOW(),
    
    -- Um usuário pode ter apenas uma reação por emoji por mensagem
    UNIQUE(mensagem_id, usuario_id, emoji)
);

-- Criar índices para reações
CREATE INDEX IF NOT EXISTS idx_reacoes_mensagens_mensagem ON reacoes_mensagens(mensagem_id);
CREATE INDEX IF NOT EXISTS idx_reacoes_mensagens_usuario ON reacoes_mensagens(usuario_id);

-- Adicionar colunas faltantes na tabela tarefas
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS assignado_para UUID REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS etiquetas JSONB DEFAULT '[]';
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS estimativa_horas INTEGER;
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS horas_trabalhadas INTEGER DEFAULT 0;
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS anexos JSONB DEFAULT '[]';
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMP;

-- Criar índices para as novas colunas de tarefas
CREATE INDEX IF NOT EXISTS idx_tarefas_assignado_para ON tarefas(assignado_para);
CREATE INDEX IF NOT EXISTS idx_tarefas_deletado_em ON tarefas(deletado_em);

-- Adicionar colunas faltantes na tabela mensagens
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS editado BOOLEAN DEFAULT FALSE;
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMP;
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS mencionados JSONB DEFAULT '[]';

-- Criar índices para mensagens
CREATE INDEX IF NOT EXISTS idx_mensagens_editado ON mensagens(editado);
CREATE INDEX IF NOT EXISTS idx_mensagens_deletado_em ON mensagens(deletado_em);

-- Adicionar colunas faltantes na tabela eventos_calendario (da migration 002)
ALTER TABLE eventos_calendario ADD COLUMN IF NOT EXISTS link_virtual VARCHAR(500);
ALTER TABLE eventos_calendario ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'agendado' CHECK (status IN ('agendado', 'em_andamento', 'concluido', 'cancelado'));
ALTER TABLE eventos_calendario ADD COLUMN IF NOT EXISTS recorrencia JSONB;
ALTER TABLE eventos_calendario ADD COLUMN IF NOT EXISTS configuracoes JSONB DEFAULT '{}';
ALTER TABLE eventos_calendario ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMP DEFAULT NOW();

-- Adicionar colunas faltantes na tabela grupos
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS configuracoes JSONB DEFAULT '{}';
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMP;

-- Criar índices para grupos
CREATE INDEX IF NOT EXISTS idx_grupos_deletado_em ON grupos(deletado_em);

-- Adicionar colunas faltantes na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMP;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMP;

-- Criar índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_ultimo_acesso ON usuarios(ultimo_acesso);
CREATE INDEX IF NOT EXISTS idx_usuarios_deletado_em ON usuarios(deletado_em);

-- Criar tabela de comentários de tarefas
CREATE TABLE IF NOT EXISTS comentarios_tarefas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarefa_id UUID NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    data_criacao TIMESTAMP DEFAULT NOW(),
    data_atualizacao TIMESTAMP DEFAULT NOW(),
    deletado_em TIMESTAMP,
    
    CONSTRAINT chk_conteudo_comentario_nao_vazio CHECK (LENGTH(TRIM(conteudo)) > 0)
);

-- Criar índices para comentários de tarefas
CREATE INDEX IF NOT EXISTS idx_comentarios_tarefas_tarefa ON comentarios_tarefas(tarefa_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_tarefas_usuario ON comentarios_tarefas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_tarefas_data ON comentarios_tarefas(data_criacao);

-- Adicionar suporte a prioridade 'urgente' no enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'urgente' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_prioridade_tarefa')
    ) THEN
        ALTER TYPE enum_prioridade_tarefa ADD VALUE 'urgente';
    END IF;
END
$$;

-- Adicionar novos tipos de evento no enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'aula' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_tipo_evento')
    ) THEN
        ALTER TYPE enum_tipo_evento ADD VALUE 'aula';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'deadline' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_tipo_evento')
    ) THEN
        ALTER TYPE enum_tipo_evento ADD VALUE 'deadline';
    END IF;
END
$$;

-- Adicionar novos tipos de notificação no enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'deadline' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_tipo_notificacao')
    ) THEN
        ALTER TYPE enum_tipo_notificacao ADD VALUE 'deadline';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'mencao' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_tipo_notificacao')
    ) THEN
        ALTER TYPE enum_tipo_notificacao ADD VALUE 'mencao';
    END IF;
END
$$;

-- Corrigir função de atualização de data para eventos
CREATE OR REPLACE FUNCTION atualizar_data_atualizacao_eventos()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar data_atualizacao em eventos
DROP TRIGGER IF EXISTS trigger_atualizar_data_atualizacao_eventos ON eventos_calendario;
CREATE TRIGGER trigger_atualizar_data_atualizacao_eventos
    BEFORE UPDATE ON eventos_calendario
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_atualizacao_eventos();

-- Criar função para gerar código de acesso se não existir
CREATE OR REPLACE FUNCTION gerar_codigo_acesso_grupos()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo_acesso IS NULL OR NEW.codigo_acesso = '' THEN
        LOOP
            NEW.codigo_acesso := upper(substr(md5(random()::text), 1, 8));
            EXIT WHEN NOT EXISTS (SELECT 1 FROM grupos WHERE codigo_acesso = NEW.codigo_acesso);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código automático se não fornecido
DROP TRIGGER IF EXISTS trigger_gerar_codigo_acesso_grupos ON grupos;
CREATE TRIGGER trigger_gerar_codigo_acesso_grupos
    BEFORE INSERT ON grupos
    FOR EACH ROW
    EXECUTE FUNCTION gerar_codigo_acesso_grupos();

COMMIT;
