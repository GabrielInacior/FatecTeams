-- ============================================
-- MIGRATION 001: CRIAR ESTRUTURA INICIAL
-- Data: 2025-09-04
-- Descrição: Criação de todas as tabelas do sistema FatecTeams
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

-- Enum para provedores OAuth
DO $$ BEGIN
    CREATE TYPE enum_provedor_oauth AS ENUM ('google', 'microsoft');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para tipos de grupo
DO $$ BEGIN
    CREATE TYPE enum_tipo_grupo AS ENUM ('publico', 'privado', 'secreto');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para níveis de permissão
DO $$ BEGIN
    CREATE TYPE enum_nivel_permissao AS ENUM ('admin', 'moderador', 'membro', 'visitante');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para tipos de mensagem
DO $$ BEGIN
    CREATE TYPE enum_tipo_mensagem AS ENUM ('texto', 'arquivo', 'imagem', 'sistema');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para status de tarefa
DO $$ BEGIN
    CREATE TYPE enum_status_tarefa AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para prioridade de tarefa
DO $$ BEGIN
    CREATE TYPE enum_prioridade_tarefa AS ENUM ('baixa', 'media', 'alta');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para tipos de evento
DO $$ BEGIN
    CREATE TYPE enum_tipo_evento AS ENUM ('reuniao', 'estudo', 'prova', 'apresentacao', 'outro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para tipos de notificação
DO $$ BEGIN
    CREATE TYPE enum_tipo_notificacao AS ENUM ('mensagem', 'convite', 'tarefa', 'evento', 'sistema');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para status de convite
DO $$ BEGIN
    CREATE TYPE enum_status_convite AS ENUM ('pendente', 'aceito', 'recusado', 'expirado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255),
    foto_perfil VARCHAR(500),
    telefone VARCHAR(20),
    status_ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    CONSTRAINT chk_email_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_nome_nao_vazio CHECK (LENGTH(TRIM(nome)) > 0)
);

-- Tabela de provedores OAuth
CREATE TABLE IF NOT EXISTS provedores_oauth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    provedor enum_provedor_oauth NOT NULL,
    provedor_id VARCHAR(255) NOT NULL,
    email_provedor VARCHAR(150) NOT NULL,
    data_vinculacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Garantir que um usuário não pode ter o mesmo provedor duas vezes
    UNIQUE(usuario_id, provedor),
    -- Garantir que o mesmo provedor_id não pode estar vinculado a usuários diferentes
    UNIQUE(provedor, provedor_id)
);

-- Tabela de grupos
CREATE TABLE IF NOT EXISTS grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    foto_capa VARCHAR(500),
    codigo_acesso VARCHAR(20) NOT NULL UNIQUE,
    tipo_grupo enum_tipo_grupo DEFAULT 'privado',
    criador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_nome_grupo_nao_vazio CHECK (LENGTH(TRIM(nome)) > 0),
    CONSTRAINT chk_codigo_acesso_valido CHECK (LENGTH(TRIM(codigo_acesso)) >= 6)
);

-- Tabela de membros do grupo
CREATE TABLE IF NOT EXISTS membros_grupo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nivel_permissao enum_nivel_permissao DEFAULT 'membro',
    data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT true,
    
    -- Um usuário só pode ser membro de um grupo uma vez
    UNIQUE(grupo_id, usuario_id)
);

-- Tabela de arquivos
CREATE TABLE IF NOT EXISTS arquivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_original VARCHAR(255) NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    url_s3 VARCHAR(500) NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    enviado_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE,
    data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_tamanho_positivo CHECK (tamanho_bytes > 0),
    CONSTRAINT chk_nome_original_nao_vazio CHECK (LENGTH(TRIM(nome_original)) > 0)
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    remetente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conteudo TEXT,
    tipo_mensagem enum_tipo_mensagem DEFAULT 'texto',
    arquivo_id UUID REFERENCES arquivos(id) ON DELETE SET NULL,
    mensagem_pai_id UUID REFERENCES mensagens(id) ON DELETE CASCADE,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_edicao TIMESTAMP,
    
    -- Mensagem deve ter conteúdo OU arquivo
    CONSTRAINT chk_mensagem_tem_conteudo CHECK (
        (conteudo IS NOT NULL AND LENGTH(TRIM(conteudo)) > 0) OR 
        (arquivo_id IS NOT NULL)
    )
);

-- Tabela de tarefas
CREATE TABLE IF NOT EXISTS tarefas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    criador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_vencimento TIMESTAMP,
    status enum_status_tarefa DEFAULT 'pendente',
    prioridade enum_prioridade_tarefa DEFAULT 'media',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_titulo_tarefa_nao_vazio CHECK (LENGTH(TRIM(titulo)) > 0),
    CONSTRAINT chk_data_vencimento_futura CHECK (data_vencimento IS NULL OR data_vencimento > data_criacao)
);

-- Tabela de atribuições de tarefa
CREATE TABLE IF NOT EXISTS atribuicoes_tarefa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tarefa_id UUID NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_atribuicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Um usuário não pode ser atribuído à mesma tarefa duas vezes
    UNIQUE(tarefa_id, usuario_id)
);

-- Tabela de eventos do calendário
CREATE TABLE IF NOT EXISTS eventos_calendario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    criador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    local VARCHAR(255),
    tipo_evento enum_tipo_evento DEFAULT 'outro',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_titulo_evento_nao_vazio CHECK (LENGTH(TRIM(titulo)) > 0),
    CONSTRAINT chk_data_fim_posterior CHECK (data_fim > data_inicio)
);

-- Tabela de convites para grupo
CREATE TABLE IF NOT EXISTS convites_grupo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    convidado_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    email_convidado VARCHAR(150) NOT NULL,
    usuario_convidado_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo_convite VARCHAR(50) NOT NULL UNIQUE,
    status enum_status_convite DEFAULT 'pendente',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_expiracao TIMESTAMP NOT NULL,
    
    CONSTRAINT chk_email_convidado_valido CHECK (email_convidado ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_data_expiracao_futura CHECK (data_expiracao > data_criacao)
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo enum_tipo_notificacao NOT NULL,
    referencia_id UUID,
    lida BOOLEAN DEFAULT false,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_titulo_notificacao_nao_vazio CHECK (LENGTH(TRIM(titulo)) > 0),
    CONSTRAINT chk_mensagem_notificacao_nao_vazia CHECK (LENGTH(TRIM(mensagem)) > 0)
);

-- Tabela de histórico de atividades
CREATE TABLE IF NOT EXISTS historico_atividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE,
    acao VARCHAR(100) NOT NULL,
    detalhes JSONB,
    ip_origem INET,
    data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_acao_nao_vazia CHECK (LENGTH(TRIM(acao)) > 0)
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_status_ativo ON usuarios(status_ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_data_criacao ON usuarios(data_criacao);

-- Índices para provedores_oauth
CREATE INDEX IF NOT EXISTS idx_provedores_oauth_usuario_id ON provedores_oauth(usuario_id);
CREATE INDEX IF NOT EXISTS idx_provedores_oauth_provedor_id ON provedores_oauth(provedor, provedor_id);

-- Índices para grupos
CREATE INDEX IF NOT EXISTS idx_grupos_criador_id ON grupos(criador_id);
CREATE INDEX IF NOT EXISTS idx_grupos_codigo_acesso ON grupos(codigo_acesso);
CREATE INDEX IF NOT EXISTS idx_grupos_tipo ON grupos(tipo_grupo);
CREATE INDEX IF NOT EXISTS idx_grupos_data_criacao ON grupos(data_criacao);

-- Índices para membros_grupo
CREATE INDEX IF NOT EXISTS idx_membros_grupo_grupo_id ON membros_grupo(grupo_id);
CREATE INDEX IF NOT EXISTS idx_membros_grupo_usuario_id ON membros_grupo(usuario_id);
CREATE INDEX IF NOT EXISTS idx_membros_grupo_ativo ON membros_grupo(ativo);
CREATE INDEX IF NOT EXISTS idx_membros_grupo_nivel_permissao ON membros_grupo(nivel_permissao);

-- Índices para mensagens
CREATE INDEX IF NOT EXISTS idx_mensagens_grupo_id ON mensagens(grupo_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_remetente_id ON mensagens(remetente_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_data_envio ON mensagens(data_envio);
CREATE INDEX IF NOT EXISTS idx_mensagens_tipo ON mensagens(tipo_mensagem);
CREATE INDEX IF NOT EXISTS idx_mensagens_arquivo_id ON mensagens(arquivo_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_pai ON mensagens(mensagem_pai_id);

-- Índices para arquivos
CREATE INDEX IF NOT EXISTS idx_arquivos_enviado_por ON arquivos(enviado_por);
CREATE INDEX IF NOT EXISTS idx_arquivos_grupo_id ON arquivos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_data_upload ON arquivos(data_upload);
CREATE INDEX IF NOT EXISTS idx_arquivos_tipo_mime ON arquivos(tipo_mime);

-- Índices para tarefas
CREATE INDEX IF NOT EXISTS idx_tarefas_grupo_id ON tarefas(grupo_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_criador_id ON tarefas(criador_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_prioridade ON tarefas(prioridade);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_vencimento ON tarefas(data_vencimento);

-- Índices para atribuicoes_tarefa
CREATE INDEX IF NOT EXISTS idx_atribuicoes_tarefa_tarefa_id ON atribuicoes_tarefa(tarefa_id);
CREATE INDEX IF NOT EXISTS idx_atribuicoes_tarefa_usuario_id ON atribuicoes_tarefa(usuario_id);

-- Índices para eventos_calendario
CREATE INDEX IF NOT EXISTS idx_eventos_calendario_grupo_id ON eventos_calendario(grupo_id);
CREATE INDEX IF NOT EXISTS idx_eventos_calendario_criador_id ON eventos_calendario(criador_id);
CREATE INDEX IF NOT EXISTS idx_eventos_calendario_data_inicio ON eventos_calendario(data_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_calendario_tipo ON eventos_calendario(tipo_evento);

-- Índices para convites_grupo
CREATE INDEX IF NOT EXISTS idx_convites_grupo_grupo_id ON convites_grupo(grupo_id);
CREATE INDEX IF NOT EXISTS idx_convites_grupo_convidado_por ON convites_grupo(convidado_por);
CREATE INDEX IF NOT EXISTS idx_convites_grupo_email ON convites_grupo(email_convidado);
CREATE INDEX IF NOT EXISTS idx_convites_grupo_codigo ON convites_grupo(codigo_convite);
CREATE INDEX IF NOT EXISTS idx_convites_grupo_status ON convites_grupo(status);
CREATE INDEX IF NOT EXISTS idx_convites_grupo_data_expiracao ON convites_grupo(data_expiracao);

-- Índices para notificacoes
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_data_criacao ON notificacoes(data_criacao);

-- Índices para historico_atividades
CREATE INDEX IF NOT EXISTS idx_historico_atividades_usuario_id ON historico_atividades(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historico_atividades_grupo_id ON historico_atividades(grupo_id);
CREATE INDEX IF NOT EXISTS idx_historico_atividades_acao ON historico_atividades(acao);
CREATE INDEX IF NOT EXISTS idx_historico_atividades_data_acao ON historico_atividades(data_acao);

-- ============================================
-- TRIGGERS PARA ATUALIZAR data_atualizacao
-- ============================================

-- Função para atualizar data_atualizacao
CREATE OR REPLACE FUNCTION atualizar_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para tabela usuarios
CREATE TRIGGER trigger_atualizar_data_atualizacao_usuarios
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_atualizacao();

-- Trigger para tabela grupos
CREATE TRIGGER trigger_atualizar_data_atualizacao_grupos
    BEFORE UPDATE ON grupos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_atualizacao();

-- ============================================
-- FUNÇÃO PARA GERAR CÓDIGO DE ACESSO DO GRUPO
-- ============================================

CREATE OR REPLACE FUNCTION gerar_codigo_acesso()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo_acesso IS NULL OR NEW.codigo_acesso = '' THEN
        NEW.codigo_acesso := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
        
        -- Garantir que o código seja único
        WHILE EXISTS (SELECT 1 FROM grupos WHERE codigo_acesso = NEW.codigo_acesso) LOOP
            NEW.codigo_acesso := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código automático
CREATE TRIGGER trigger_gerar_codigo_acesso_grupos
    BEFORE INSERT ON grupos
    FOR EACH ROW
    EXECUTE FUNCTION gerar_codigo_acesso();

-- ============================================
-- FUNÇÃO PARA AUTO-ADICIONAR CRIADOR COMO ADMIN
-- ============================================

CREATE OR REPLACE FUNCTION adicionar_criador_como_admin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO membros_grupo (grupo_id, usuario_id, nivel_permissao)
    VALUES (NEW.id, NEW.criador_id, 'admin');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para adicionar criador como admin automaticamente
CREATE TRIGGER trigger_adicionar_criador_como_admin
    AFTER INSERT ON grupos
    FOR EACH ROW
    EXECUTE FUNCTION adicionar_criador_como_admin();

-- ============================================
-- VIEWS ÚTEIS PARA CONSULTAS FREQUENTES
-- ============================================

-- View para membros com informações de usuário e grupo
CREATE VIEW view_membros_detalhados AS
SELECT 
    mg.id,
    mg.grupo_id,
    g.nome as nome_grupo,
    mg.usuario_id,
    u.nome as nome_usuario,
    u.email as email_usuario,
    u.foto_perfil,
    mg.nivel_permissao,
    mg.data_entrada,
    mg.ativo
FROM membros_grupo mg
JOIN usuarios u ON mg.usuario_id = u.id
JOIN grupos g ON mg.grupo_id = g.id
WHERE mg.ativo = true AND u.status_ativo = true;

-- View para mensagens com informações de remetente
CREATE VIEW view_mensagens_detalhadas AS
SELECT 
    m.id,
    m.grupo_id,
    g.nome as nome_grupo,
    m.remetente_id,
    u.nome as nome_remetente,
    u.foto_perfil as foto_remetente,
    m.conteudo,
    m.tipo_mensagem,
    m.arquivo_id,
    a.nome_original as nome_arquivo,
    a.url_s3 as url_arquivo,
    m.mensagem_pai_id,
    m.data_envio,
    m.data_edicao
FROM mensagens m
JOIN usuarios u ON m.remetente_id = u.id
JOIN grupos g ON m.grupo_id = g.id
LEFT JOIN arquivos a ON m.arquivo_id = a.id;

-- ============================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Inserir usuário administrador padrão (opcional)
-- INSERT INTO usuarios (nome, email, senha_hash) VALUES 
-- ('Administrador', 'admin@fatecteams.com', crypt('Admin123!', gen_salt('bf')));

COMMIT;

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================

-- Esta migration cria toda a estrutura inicial do banco de dados FatecTeams
-- Inclui:
-- - 12 tabelas principais com relacionamentos
-- - Enums para padronizar valores
-- - Índices para performance
-- - Triggers para automatizações
-- - Views para consultas frequentes
-- - Constraints para integridade dos dados

-- Para executar esta migration:
-- psql -h hostname -U username -d database_name -f 001_criar_estrutura_inicial.sql
