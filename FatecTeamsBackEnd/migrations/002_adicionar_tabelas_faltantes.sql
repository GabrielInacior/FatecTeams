-- ============================================
-- MIGRATION: Adicionar tabelas faltantes
-- ============================================

-- Tabela de provedores OAuth
CREATE TABLE IF NOT EXISTS provedores_oauth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    provedor VARCHAR(20) NOT NULL CHECK (provedor IN ('google', 'microsoft')),
    provedor_id VARCHAR(255) NOT NULL,
    email_provedor VARCHAR(150) NOT NULL,
    data_vinculacao TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(provedor, provedor_id),
    UNIQUE(usuario_id, provedor)
);

-- Tabela de eventos do calendário
CREATE TABLE IF NOT EXISTS eventos_calendario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    criador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    local VARCHAR(255),
    link_virtual VARCHAR(500),
    tipo_evento VARCHAR(20) NOT NULL CHECK (tipo_evento IN ('reuniao', 'estudo', 'prova', 'apresentacao', 'outro', 'aula', 'deadline')),
    status VARCHAR(20) DEFAULT 'agendado' CHECK (status IN ('agendado', 'em_andamento', 'concluido', 'cancelado')),
    recorrencia JSONB,
    configuracoes JSONB DEFAULT '{}',
    data_criacao TIMESTAMP DEFAULT NOW(),
    data_atualizacao TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT eventos_data_valida CHECK (data_fim > data_inicio)
);

-- Tabela de participantes de eventos
CREATE TABLE IF NOT EXISTS eventos_participantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL REFERENCES eventos_calendario(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'recusado')),
    data_resposta TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(evento_id, usuario_id)
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('mensagem', 'convite', 'tarefa', 'evento', 'sistema', 'deadline', 'mencao')),
    origem_tipo VARCHAR(20) CHECK (origem_tipo IN ('grupo', 'tarefa', 'mensagem', 'sistema', 'evento')),
    origem_id UUID,
    referencia_id UUID,
    lida BOOLEAN DEFAULT FALSE,
    importante BOOLEAN DEFAULT FALSE,
    metadados JSONB DEFAULT '{}',
    data_criacao TIMESTAMP DEFAULT NOW(),
    data_leitura TIMESTAMP
);

-- Tabela de convites para grupos
CREATE TABLE IF NOT EXISTS convites_grupo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    convidado_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    email_convidado VARCHAR(150) NOT NULL,
    usuario_convidado_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    codigo_convite VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'recusado', 'expirado')),
    mensagem_personalizada TEXT,
    data_criacao TIMESTAMP DEFAULT NOW(),
    data_expiracao TIMESTAMP NOT NULL,
    data_resposta TIMESTAMP
);

-- Tabela de histórico de atividades
CREATE TABLE IF NOT EXISTS historico_atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    grupo_id UUID REFERENCES grupos(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL,
    entidade_tipo VARCHAR(50),
    entidade_id UUID,
    detalhes JSONB DEFAULT '{}',
    ip_origem INET,
    user_agent TEXT,
    data_acao TIMESTAMP DEFAULT NOW()
);

-- Tabela de configurações de notificação por usuário
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_provedores_oauth_usuario ON provedores_oauth(usuario_id);
CREATE INDEX IF NOT EXISTS idx_provedores_oauth_provedor ON provedores_oauth(provedor, provedor_id);

CREATE INDEX IF NOT EXISTS idx_eventos_grupo ON eventos_calendario(grupo_id);
CREATE INDEX IF NOT EXISTS idx_eventos_criador ON eventos_calendario(criador_id);
CREATE INDEX IF NOT EXISTS idx_eventos_data_inicio ON eventos_calendario(data_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_status ON eventos_calendario(status);

CREATE INDEX IF NOT EXISTS idx_eventos_participantes_evento ON eventos_participantes(evento_id);
CREATE INDEX IF NOT EXISTS idx_eventos_participantes_usuario ON eventos_participantes(usuario_id);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_data ON notificacoes(data_criacao);

CREATE INDEX IF NOT EXISTS idx_convites_grupo ON convites_grupo(grupo_id);
CREATE INDEX IF NOT EXISTS idx_convites_email ON convites_grupo(email_convidado);
CREATE INDEX IF NOT EXISTS idx_convites_codigo ON convites_grupo(codigo_convite);
CREATE INDEX IF NOT EXISTS idx_convites_status ON convites_grupo(status);

CREATE INDEX IF NOT EXISTS idx_historico_usuario ON historico_atividades(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historico_grupo ON historico_atividades(grupo_id);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_atividades(data_acao);
CREATE INDEX IF NOT EXISTS idx_historico_acao ON historico_atividades(acao);

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar data_atualizacao
CREATE TRIGGER update_eventos_data_atualizacao BEFORE UPDATE ON eventos_calendario
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_notificacao_data_atualizacao BEFORE UPDATE ON configuracoes_notificacao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
