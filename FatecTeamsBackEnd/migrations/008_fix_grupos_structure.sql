-- ============================================
-- MIGRATION 008: CORRIGIR ESTRUTURA DA TABELA GRUPOS
-- Data: 2025-09-11
-- Descrição: Ajustar estrutura para suportar tipo e privacidade separadamente
-- ============================================

-- Adicionar novo enum para categoria de grupo
DO $$ BEGIN
    CREATE TYPE enum_categoria_grupo AS ENUM ('projeto', 'estudo', 'trabalho');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar novo enum para privacidade
DO $$ BEGIN
    CREATE TYPE enum_privacidade_grupo AS ENUM ('publico', 'privado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verificar se a coluna categoria não existe e adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'grupos' AND column_name = 'categoria') THEN
        ALTER TABLE grupos ADD COLUMN categoria enum_categoria_grupo DEFAULT 'projeto';
    END IF;
END $$;

-- Verificar se a coluna privacidade não existe e adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'grupos' AND column_name = 'privacidade') THEN
        ALTER TABLE grupos ADD COLUMN privacidade enum_privacidade_grupo DEFAULT 'publico';
    END IF;
END $$;

-- Verificar se a coluna max_membros não existe e adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'grupos' AND column_name = 'max_membros') THEN
        ALTER TABLE grupos ADD COLUMN max_membros INTEGER;
    END IF;
END $$;

-- Verificar se a coluna ativo não existe e adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'grupos' AND column_name = 'ativo') THEN
        ALTER TABLE grupos ADD COLUMN ativo BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Verificar se a coluna configuracoes não existe e adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'grupos' AND column_name = 'configuracoes') THEN
        ALTER TABLE grupos ADD COLUMN configuracoes JSONB DEFAULT '{}';
    END IF;
END $$;

-- Migrar dados existentes do campo tipo_grupo para categoria (se existir tipo_grupo)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'grupos' AND column_name = 'tipo_grupo') THEN
        
        -- Migrar dados baseado no tipo_grupo existente
        UPDATE grupos SET categoria = 'projeto' WHERE tipo_grupo = 'publico';
        UPDATE grupos SET categoria = 'estudo' WHERE tipo_grupo = 'privado';
        UPDATE grupos SET categoria = 'trabalho' WHERE tipo_grupo = 'secreto';
        
        -- Definir privacidade baseado no tipo_grupo
        UPDATE grupos SET privacidade = 'publico' WHERE tipo_grupo = 'publico';
        UPDATE grupos SET privacidade = 'privado' WHERE tipo_grupo IN ('privado', 'secreto');
        
    END IF;
END $$;

-- Remover views/objetos dependentes antes de dropar a coluna
DO $$ 
BEGIN
    -- Dropar view se existir
    DROP VIEW IF EXISTS view_grupos_com_estatisticas CASCADE;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'grupos' AND column_name = 'tipo_grupo') THEN
        ALTER TABLE grupos DROP COLUMN tipo_grupo CASCADE;
    END IF;
END $$;

-- Atualizar função de trigger se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Criar trigger para atualizar data_atualizacao
        DROP TRIGGER IF EXISTS grupos_updated_at ON grupos;
        CREATE TRIGGER grupos_updated_at
            BEFORE UPDATE ON grupos
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_grupos_categoria ON grupos(categoria);
CREATE INDEX IF NOT EXISTS idx_grupos_privacidade ON grupos(privacidade);
CREATE INDEX IF NOT EXISTS idx_grupos_ativo ON grupos(ativo);
CREATE INDEX IF NOT EXISTS idx_grupos_criador_id ON grupos(criador_id);
