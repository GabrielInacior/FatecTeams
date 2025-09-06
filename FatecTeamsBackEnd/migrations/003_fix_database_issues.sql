-- ============================================
-- MIGRATION 003: Corrigir Problemas do Banco
-- Data: 2025-09-05
-- Descrição: Criar tabela leituras_mensagem e corrigir estrutura dos grupos
-- ============================================

-- Criar tabela de leituras de mensagem (para controle de mensagens lidas)
CREATE TABLE IF NOT EXISTS leituras_mensagem (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mensagem_id UUID NOT NULL REFERENCES mensagens(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_leitura TIMESTAMP DEFAULT NOW(),
    
    -- Um usuário só pode marcar uma mensagem como lida uma vez
    UNIQUE(mensagem_id, usuario_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_leituras_mensagem_mensagem_id ON leituras_mensagem(mensagem_id);
CREATE INDEX IF NOT EXISTS idx_leituras_mensagem_usuario_id ON leituras_mensagem(usuario_id);
CREATE INDEX IF NOT EXISTS idx_leituras_mensagem_data ON leituras_mensagem(data_leitura);

-- Corrigir/Adicionar colunas faltantes na tabela grupos (se não existirem)
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP DEFAULT NOW();
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMP DEFAULT NOW();
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS deletado_em TIMESTAMP;

-- Adicionar colunas faltantes na tabela notificacoes (se não existirem)
ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'sistema';
ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS mensagem TEXT NOT NULL DEFAULT '';
ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS lida BOOLEAN DEFAULT FALSE;
ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP DEFAULT NOW();
ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE;

-- Adicionar colunas faltantes na tabela historico_atividades (se não existirem)
ALTER TABLE historico_atividades ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE historico_atividades ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE;
ALTER TABLE historico_atividades ADD COLUMN IF NOT EXISTS acao VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE historico_atividades ADD COLUMN IF NOT EXISTS detalhes JSONB;
ALTER TABLE historico_atividades ADD COLUMN IF NOT EXISTS data_acao TIMESTAMP DEFAULT NOW();

-- Atualizar trigger para grupos (se não existir)
CREATE OR REPLACE FUNCTION atualizar_data_atualizacao_grupos()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_data_atualizacao_grupos ON grupos;
CREATE TRIGGER trigger_atualizar_data_atualizacao_grupos
    BEFORE UPDATE ON grupos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_atualizacao_grupos();

COMMIT;
