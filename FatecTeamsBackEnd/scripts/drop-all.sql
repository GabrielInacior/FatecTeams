-- Script para limpar completamente o banco de dados
-- Use com cuidado - isso remove TUDO!

-- Dropar todas as tabelas em ordem (respeitando foreign keys)
DROP TABLE IF EXISTS migrations CASCADE;
DROP TABLE IF EXISTS configuracoes_notificacao CASCADE;
DROP TABLE IF EXISTS eventos_participantes CASCADE;
DROP TABLE IF EXISTS historico_atividades CASCADE;
DROP TABLE IF EXISTS notificacoes CASCADE;
DROP TABLE IF EXISTS convites_grupo CASCADE;
DROP TABLE IF EXISTS eventos_calendario CASCADE;
DROP TABLE IF EXISTS atribuicoes_tarefa CASCADE;
DROP TABLE IF EXISTS tarefas CASCADE;
DROP TABLE IF EXISTS mensagens CASCADE;
DROP TABLE IF EXISTS arquivos CASCADE;
DROP TABLE IF EXISTS membros_grupo CASCADE;
DROP TABLE IF EXISTS grupos CASCADE;
DROP TABLE IF EXISTS provedores_oauth CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Dropar todos os tipos ENUM
DROP TYPE IF EXISTS enum_status_convite CASCADE;
DROP TYPE IF EXISTS enum_tipo_notificacao CASCADE;
DROP TYPE IF EXISTS enum_tipo_evento CASCADE;
DROP TYPE IF EXISTS enum_prioridade_tarefa CASCADE;
DROP TYPE IF EXISTS enum_status_tarefa CASCADE;
DROP TYPE IF EXISTS enum_tipo_mensagem CASCADE;
DROP TYPE IF EXISTS enum_nivel_permissao CASCADE;
DROP TYPE IF EXISTS enum_tipo_grupo CASCADE;
DROP TYPE IF EXISTS enum_provedor_oauth CASCADE;

-- Dropar funções
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Dropar extensões (se necessário recriar)
-- DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
