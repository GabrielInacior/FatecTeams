-- ============================================
-- MIGRATION 003: Corrigir colunas da tabela grupos
-- Data: 2025-09-05
-- Descrição: Adicionar colunas que podem estar faltantes e ajustar estrutura
-- ============================================

-- Adicionar coluna configuracoes se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'grupos' AND column_name = 'configuracoes'
    ) THEN
        ALTER TABLE grupos ADD COLUMN configuracoes JSONB DEFAULT '{}';
    END IF;
END
$$;

-- Verificar se a coluna criador_id existe, senão criar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'grupos' AND column_name = 'criador_id'
    ) THEN
        -- Se não existir criador_id mas existir criado_por, renomear
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'grupos' AND column_name = 'criado_por'
        ) THEN
            ALTER TABLE grupos RENAME COLUMN criado_por TO criador_id;
        ELSE
            -- Se não existir nenhuma das duas, criar criador_id
            ALTER TABLE grupos ADD COLUMN criador_id UUID REFERENCES usuarios(id) ON DELETE CASCADE;
        END IF;
    END IF;
END
$$;

-- Verificar se o tipo_grupo está correto
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'grupos' AND column_name = 'tipo_grupo'
    ) THEN
        -- Se existe tipo mas não tipo_grupo, renomear
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'grupos' AND column_name = 'tipo'
        ) THEN
            ALTER TABLE grupos RENAME COLUMN tipo TO tipo_grupo;
        ELSE
            -- Se não existir, criar
            ALTER TABLE grupos ADD COLUMN tipo_grupo enum_tipo_grupo DEFAULT 'privado';
        END IF;
    END IF;
END
$$;

-- Atualizar valores default se necessário
UPDATE grupos SET configuracoes = '{}' WHERE configuracoes IS NULL;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_grupos_criador_id_fixed ON grupos(criador_id);
CREATE INDEX IF NOT EXISTS idx_grupos_tipo_grupo_fixed ON grupos(tipo_grupo);
CREATE INDEX IF NOT EXISTS idx_grupos_codigo_acesso_fixed ON grupos(codigo_acesso);

COMMIT;
