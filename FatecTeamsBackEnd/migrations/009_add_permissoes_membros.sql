-- Migration 009: Adicionar colunas de permissões à tabela membros_grupo
-- Data: 2025-09-12
-- Descrição: Adiciona colunas para controle de permissões dos membros

-- Adicionar colunas de permissões
ALTER TABLE membros_grupo 
ADD COLUMN IF NOT EXISTS pode_convidar BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pode_remover BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pode_configurar BOOLEAN DEFAULT false;

-- Atualizar permissões existentes baseado no nivel_permissao
UPDATE membros_grupo SET 
    pode_convidar = CASE 
        WHEN nivel_permissao IN ('admin', 'moderador') THEN true 
        ELSE false 
    END,
    pode_remover = CASE 
        WHEN nivel_permissao IN ('admin', 'moderador') THEN true 
        ELSE false 
    END,
    pode_configurar = CASE 
        WHEN nivel_permissao = 'admin' THEN true 
        ELSE false 
    END
WHERE pode_convidar IS NULL OR pode_remover IS NULL OR pode_configurar IS NULL;

-- Criar índice para melhor performance em consultas de permissão
CREATE INDEX IF NOT EXISTS idx_membros_grupo_permissoes 
ON membros_grupo(grupo_id, usuario_id, pode_convidar, pode_remover, pode_configurar);
