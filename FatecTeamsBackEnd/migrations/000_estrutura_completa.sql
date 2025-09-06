-- ============================================
-- MIGRATION CONSOLIDADA: Estrutura Completa do FatecTeams
-- Data: 2025-09-06
-- Descrição: Migration única com toda a estrutura do banco de dados
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

-- Enum para status geral
DO $$ BEGIN
    CREATE TYPE enum_status_geral AS ENUM ('ativo', 'inativo', 'suspenso');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Enum para provedores OAuth
DO $$ BEGIN
    CREATE TYPE enum_provedor_oauth AS ENUM ('google', 'microsoft');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Enum para tipos de grupo
DO $$ BEGIN
    CREATE TYPE enum_tipo_grupo AS ENUM ('projeto', 'estudo', 'trabalho');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Enum para privacidade de grupo
DO $$ BEGIN
    CREATE TYPE enum_privacidade_grupo AS ENUM ('publico', 'privado');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Enum para papel de usuário no grupo
DO $$ BEGIN
    CREATE TYPE enum_papel_usuario_grupo AS ENUM ('admin', 'moderador', 'membro');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Enum para prioridade de tarefa
DO $$ BEGIN
    CREATE TYPE enum_prioridade_tarefa AS ENUM ('baixa', 'media', 'alta', 'critica', 'urgente');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Enum para status de tarefa
DO $$ BEGIN
    CREATE TYPE enum_status_tarefa AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Enum para status de convite
DO $$ BEGIN
    CREATE TYPE enum_status_convite AS ENUM ('pendente', 'aceito', 'recusado', 'expirado');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Enum para tipo de notificação
DO $$ BEGIN
    CREATE TYPE enum_tipo_notificacao AS ENUM ('convite_grupo', 'nova_tarefa', 'tarefa_atualizada', 'nova_mensagem', 'evento_criado', 'sistema', 'deadline', 'mencao');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Enum para tipo de atividade
DO $$ BEGIN
    CREATE TYPE enum_tipo_atividade AS ENUM ('grupo_criado', 'grupo_atualizado', 'membro_adicionado', 'membro_removido', 'tarefa_criada', 'tarefa_atualizada', 'tarefa_concluida', 'evento_criado', 'mensagem_enviada');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Enum para tipos de evento
DO $$ BEGIN
    CREATE TYPE enum_tipo_evento AS ENUM ('reuniao', 'estudo', 'prova', 'apresentacao', 'aula', 'deadline', 'outro');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Enum para tipos de mensagem
DO $$ BEGIN
    CREATE TYPE enum_tipo_mensagem AS ENUM ('texto', 'arquivo', 'imagem', 'sistema');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255),
    foto_perfil TEXT,
    avatar_url VARCHAR(500),
    bio TEXT,
    data_nascimento DATE,
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE,
    status enum_status_geral DEFAULT 'ativo',
    status_online BOOLEAN DEFAULT false,
    socket_id VARCHAR(255),
    ultimo_ping TIMESTAMP,
    ultimo_acesso TIMESTAMP,
    oauth_provider enum_provedor_oauth,
    oauth_id VARCHAR(255),
    email_verificado BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletado_em TIMESTAMP,
    configuracoes JSONB DEFAULT '{}'::JSONB,
    configuracoes_notificacao JSONB DEFAULT '{
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
    }'::jsonb,
    UNIQUE(oauth_provider, oauth_id)
);

-- Tabela de grupos
CREATE TABLE IF NOT EXISTS grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo enum_tipo_grupo NOT NULL DEFAULT 'projeto',
    privacidade enum_privacidade_grupo NOT NULL DEFAULT 'privado',
    max_membros INTEGER DEFAULT 50,
    codigo_acesso VARCHAR(20) UNIQUE,
    foto_capa VARCHAR(500),
    criado_por UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    criador_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletado_em TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    configuracoes JSONB DEFAULT '{}'::JSONB
);

-- Tabela de arquivos (precisa vir antes de mensagens devido à referência)
CREATE TABLE IF NOT EXISTS arquivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    enviado_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome_original VARCHAR(255) NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    caminho TEXT NOT NULL,
    url_s3 VARCHAR(500),
    tamanho INTEGER NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    tipo_mime VARCHAR(100),
    url_download TEXT,
    data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    metadados JSONB DEFAULT '{}'::JSONB
);

-- Tabela de membros dos grupos
CREATE TABLE IF NOT EXISTS membros_grupo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    papel enum_papel_usuario_grupo NOT NULL DEFAULT 'membro',
    nivel_permissao enum_papel_usuario_grupo NOT NULL DEFAULT 'membro',
    data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,
    UNIQUE(grupo_id, usuario_id)
);

-- Tabela de tarefas
CREATE TABLE IF NOT EXISTS tarefas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    prioridade enum_prioridade_tarefa DEFAULT 'media',
    status enum_status_tarefa DEFAULT 'pendente',
    data_inicio TIMESTAMP,
    data_prazo TIMESTAMP,
    data_vencimento TIMESTAMP,
    data_conclusao TIMESTAMP,
    criado_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    responsavel_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    assignado_para UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletado_em TIMESTAMP,
    etiquetas JSONB DEFAULT '[]',
    estimativa_horas INTEGER,
    horas_trabalhadas INTEGER DEFAULT 0,
    anexos JSONB DEFAULT '[]',
    configuracoes JSONB DEFAULT '{}'::JSONB
);

-- Tabela de atribuições de tarefa
CREATE TABLE IF NOT EXISTS atribuicoes_tarefa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tarefa_id UUID NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_atribuicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tarefa_id, usuario_id)
);

-- Tabela de comentários de tarefas
CREATE TABLE IF NOT EXISTS comentarios_tarefas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tarefa_id UUID NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletado_em TIMESTAMP,
    
    CONSTRAINT chk_conteudo_comentario_nao_vazio CHECK (LENGTH(TRIM(conteudo)) > 0)
);

-- Tabela de eventos
CREATE TABLE IF NOT EXISTS eventos_calendario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    local VARCHAR(255),
    link_online TEXT,
    link_virtual VARCHAR(500),
    tipo_evento enum_tipo_evento DEFAULT 'outro',
    status VARCHAR(20) DEFAULT 'agendado' CHECK (status IN ('agendado', 'em_andamento', 'concluido', 'cancelado')),
    criado_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorrencia JSONB,
    ativo BOOLEAN DEFAULT TRUE,
    configuracoes JSONB DEFAULT '{}'::JSONB,
    
    CONSTRAINT eventos_data_valida CHECK (data_fim > data_inicio)
);

-- Tabela de participantes de eventos
CREATE TABLE IF NOT EXISTS eventos_participantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento_id UUID NOT NULL REFERENCES eventos_calendario(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'recusado')),
    data_resposta TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(evento_id, usuario_id)
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    remetente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conteudo TEXT,
    tipo VARCHAR(50) DEFAULT 'texto',
    tipo_mensagem enum_tipo_mensagem DEFAULT 'texto',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    editada BOOLEAN DEFAULT FALSE,
    editado BOOLEAN DEFAULT FALSE,
    data_edicao TIMESTAMP,
    deletado_em TIMESTAMP,
    resposta_para UUID REFERENCES mensagens(id) ON DELETE SET NULL,
    mensagem_pai_id UUID REFERENCES mensagens(id) ON DELETE SET NULL,
    anexos JSONB DEFAULT '[]'::JSONB,
    metadados JSONB DEFAULT '{}'::JSONB,
    mencionados JSONB DEFAULT '[]',
    arquivo_id UUID REFERENCES arquivos(id) ON DELETE SET NULL
);

-- Tabela de leituras de mensagem
CREATE TABLE IF NOT EXISTS leituras_mensagem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mensagem_id UUID NOT NULL REFERENCES mensagens(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data_leitura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(mensagem_id, usuario_id)
);

-- Tabela de reações de mensagens
CREATE TABLE IF NOT EXISTS reacoes_mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mensagem_id UUID NOT NULL REFERENCES mensagens(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(mensagem_id, usuario_id, emoji)
);

-- Tabela de convites
CREATE TABLE IF NOT EXISTS convites_grupo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    convidado_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    email_convidado VARCHAR(150) NOT NULL,
    usuario_convidado_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    papel enum_papel_usuario_grupo DEFAULT 'membro',
    status enum_status_convite DEFAULT 'pendente',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_expiracao TIMESTAMP NOT NULL,
    data_resposta TIMESTAMP,
    token VARCHAR(255) UNIQUE NOT NULL,
    codigo_convite VARCHAR(50) NOT NULL UNIQUE,
    mensagem_personalizada TEXT,
    UNIQUE(grupo_id, email)
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    grupo_id UUID REFERENCES grupos(id) ON DELETE SET NULL,
    tipo enum_tipo_notificacao NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    origem_tipo VARCHAR(20) CHECK (origem_tipo IN ('grupo', 'tarefa', 'mensagem', 'sistema', 'evento')),
    origem_id UUID,
    referencia_id UUID,
    lida BOOLEAN DEFAULT FALSE,
    importante BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_leitura TIMESTAMP,
    metadados JSONB DEFAULT '{}'::JSONB
);

-- Tabela de histórico de atividades
CREATE TABLE IF NOT EXISTS historico_atividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo enum_tipo_atividade NOT NULL,
    acao VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    entidade_tipo VARCHAR(50),
    entidade_id UUID,
    detalhes JSONB DEFAULT '{}'::JSONB,
    metadados JSONB DEFAULT '{}'::JSONB,
    ip_origem INET,
    user_agent TEXT
);

-- Tabela para gerenciar sessões WebSocket
CREATE TABLE IF NOT EXISTS sessoes_websocket (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    socket_id VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    data_conexao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT true,
    grupos_conectados TEXT[]
);

-- Tabela para histórico de status online/offline
CREATE TABLE IF NOT EXISTS historico_status_online (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL CHECK (status IN ('online', 'offline', 'away')),
    timestamp_mudanca TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duracao_sessao INTEGER
);

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar data_atualizacao
CREATE OR REPLACE FUNCTION atualizar_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar data_atualizacao
DROP TRIGGER IF EXISTS trigger_atualizar_data_atualizacao_usuarios ON usuarios;
CREATE TRIGGER trigger_atualizar_data_atualizacao_usuarios
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_atualizacao();

DROP TRIGGER IF EXISTS trigger_atualizar_data_atualizacao_grupos ON grupos;
CREATE TRIGGER trigger_atualizar_data_atualizacao_grupos
    BEFORE UPDATE ON grupos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_atualizacao();

DROP TRIGGER IF EXISTS trigger_atualizar_data_atualizacao_tarefas ON tarefas;
CREATE TRIGGER trigger_atualizar_data_atualizacao_tarefas
    BEFORE UPDATE ON tarefas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_atualizacao();

DROP TRIGGER IF EXISTS trigger_atualizar_data_atualizacao_eventos ON eventos_calendario;
CREATE TRIGGER trigger_atualizar_data_atualizacao_eventos
    BEFORE UPDATE ON eventos_calendario
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_atualizacao();

-- Função para gerar código de acesso do grupo
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
DROP TRIGGER IF EXISTS trigger_gerar_codigo_acesso_grupos ON grupos;
CREATE TRIGGER trigger_gerar_codigo_acesso_grupos
    BEFORE INSERT ON grupos
    FOR EACH ROW
    EXECUTE FUNCTION gerar_codigo_acesso();

-- Função para auto-adicionar criador como admin
CREATE OR REPLACE FUNCTION adicionar_criador_como_admin()
RETURNS TRIGGER AS $$
BEGIN
    -- Usar criado_por se existir, senão usar criador_id
    DECLARE
        usuario_criador UUID;
    BEGIN
        usuario_criador := COALESCE(NEW.criado_por, NEW.criador_id);
        
        IF usuario_criador IS NOT NULL THEN
            INSERT INTO membros_grupo (grupo_id, usuario_id, papel, nivel_permissao)
            VALUES (NEW.id, usuario_criador, 'admin', 'admin')
            ON CONFLICT (grupo_id, usuario_id) DO UPDATE SET 
                papel = 'admin',
                nivel_permissao = 'admin';
        END IF;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para adicionar criador como admin automaticamente
DROP TRIGGER IF EXISTS trigger_adicionar_criador_como_admin ON grupos;
CREATE TRIGGER trigger_adicionar_criador_como_admin
    AFTER INSERT ON grupos
    FOR EACH ROW
    EXECUTE FUNCTION adicionar_criador_como_admin();

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_oauth ON usuarios(oauth_provider, oauth_id);
CREATE INDEX idx_usuarios_status_online ON usuarios(status_online);

-- Índices para grupos
CREATE INDEX idx_grupos_criado_por ON grupos(criado_por);
CREATE INDEX idx_grupos_codigo_acesso ON grupos(codigo_acesso);

-- Índices para membros_grupo
CREATE INDEX idx_membros_grupo_grupo ON membros_grupo(grupo_id);
CREATE INDEX idx_membros_grupo_usuario ON membros_grupo(usuario_id);
CREATE INDEX idx_membros_grupo_papel ON membros_grupo(papel);

-- Índices para tarefas
CREATE INDEX idx_tarefas_grupo ON tarefas(grupo_id);
CREATE INDEX idx_tarefas_status ON tarefas(status);
CREATE INDEX idx_tarefas_prazo ON tarefas(data_prazo);

-- Índices para mensagens
CREATE INDEX idx_mensagens_grupo ON mensagens(grupo_id);
CREATE INDEX idx_mensagens_data ON mensagens(data_criacao);

-- Índices para notificações
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);

-- Inserir usuário sistema
INSERT INTO usuarios (nome, email, senha, ativo) 
VALUES ('Sistema', 'sistema@fatecteams.com', 'disabled', false)
ON CONFLICT (email) DO NOTHING;
