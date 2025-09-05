# 📋 PLANEJAMENTO INICIAL - FATECTEAMS

## 📊 BANCO DE DADOS - TABELAS

### Tabelas Principais

#### usuarios
- `id` (UUID, PK)
- `nome` (VARCHAR(100))
- `email` (VARCHAR(150), UNIQUE)
- `senha_hash` (VARCHAR(255))
- `foto_perfil` (VARCHAR(500))
- `telefone` (VARCHAR(20))
- `status_ativo` (BOOLEAN, DEFAULT true)
- `data_criacao` (TIMESTAMP)
- `data_atualizacao` (TIMESTAMP)

#### provedores_oauth
- `id` (UUID, PK)
- `usuario_id` (UUID, FK -> usuarios)
- `provedor` (ENUM: 'google', 'microsoft')
- `provedor_id` (VARCHAR(255))
- `email_provedor` (VARCHAR(150))
- `data_vinculacao` (TIMESTAMP)

#### grupos
- `id` (UUID, PK)
- `nome` (VARCHAR(100))
- `descricao` (TEXT)
- `foto_capa` (VARCHAR(500))
- `codigo_acesso` (VARCHAR(20), UNIQUE)
- `tipo_grupo` (ENUM: 'publico', 'privado', 'secreto')
- `criador_id` (UUID, FK -> usuarios)
- `data_criacao` (TIMESTAMP)
- `data_atualizacao` (TIMESTAMP)

#### membros_grupo
- `id` (UUID, PK)
- `grupo_id` (UUID, FK -> grupos)
- `usuario_id` (UUID, FK -> usuarios)
- `nivel_permissao` (ENUM: 'admin', 'moderador', 'membro', 'visitante')
- `data_entrada` (TIMESTAMP)
- `ativo` (BOOLEAN, DEFAULT true)

#### mensagens
- `id` (UUID, PK)
- `grupo_id` (UUID, FK -> grupos)
- `remetente_id` (UUID, FK -> usuarios)
- `conteudo` (TEXT)
- `tipo_mensagem` (ENUM: 'texto', 'arquivo', 'imagem', 'sistema')
- `arquivo_id` (UUID, FK -> arquivos, NULLABLE)
- `mensagem_pai_id` (UUID, FK -> mensagens, NULLABLE) -- para respostas
- `data_envio` (TIMESTAMP)
- `data_edicao` (TIMESTAMP, NULLABLE)

#### arquivos
- `id` (UUID, PK)
- `nome_original` (VARCHAR(255))
- `nome_arquivo` (VARCHAR(255))
- `url_s3` (VARCHAR(500))
- `tamanho_bytes` (BIGINT)
- `tipo_mime` (VARCHAR(100))
- `enviado_por` (UUID, FK -> usuarios)
- `grupo_id` (UUID, FK -> grupos, NULLABLE)
- `data_upload` (TIMESTAMP)

#### tarefas
- `id` (UUID, PK)
- `grupo_id` (UUID, FK -> grupos)
- `criador_id` (UUID, FK -> usuarios)
- `titulo` (VARCHAR(200))
- `descricao` (TEXT)
- `data_vencimento` (TIMESTAMP, NULLABLE)
- `status` (ENUM: 'pendente', 'em_andamento', 'concluida', 'cancelada')
- `prioridade` (ENUM: 'baixa', 'media', 'alta')
- `data_criacao` (TIMESTAMP)

#### atribuicoes_tarefa
- `id` (UUID, PK)
- `tarefa_id` (UUID, FK -> tarefas)
- `usuario_id` (UUID, FK -> usuarios)
- `data_atribuicao` (TIMESTAMP)

#### eventos_calendario
- `id` (UUID, PK)
- `grupo_id` (UUID, FK -> grupos)
- `criador_id` (UUID, FK -> usuarios)
- `titulo` (VARCHAR(200))
- `descricao` (TEXT)
- `data_inicio` (TIMESTAMP)
- `data_fim` (TIMESTAMP)
- `local` (VARCHAR(255), NULLABLE)
- `tipo_evento` (ENUM: 'reuniao', 'estudo', 'prova', 'apresentacao', 'outro')
- `data_criacao` (TIMESTAMP)

#### notificacoes
- `id` (UUID, PK)
- `usuario_id` (UUID, FK -> usuarios)
- `titulo` (VARCHAR(200))
- `mensagem` (TEXT)
- `tipo` (ENUM: 'mensagem', 'convite', 'tarefa', 'evento', 'sistema')
- `referencia_id` (UUID, NULLABLE) -- ID da entidade relacionada
- `lida` (BOOLEAN, DEFAULT false)
- `data_criacao` (TIMESTAMP)

#### convites_grupo
- `id` (UUID, PK)
- `grupo_id` (UUID, FK -> grupos)
- `convidado_por` (UUID, FK -> usuarios)
- `email_convidado` (VARCHAR(150))
- `usuario_convidado_id` (UUID, FK -> usuarios, NULLABLE)
- `codigo_convite` (VARCHAR(50), UNIQUE)
- `status` (ENUM: 'pendente', 'aceito', 'recusado', 'expirado')
- `data_criacao` (TIMESTAMP)
- `data_expiracao` (TIMESTAMP)

#### historico_atividades
- `id` (UUID, PK)
- `usuario_id` (UUID, FK -> usuarios)
- `grupo_id` (UUID, FK -> grupos, NULLABLE)
- `acao` (VARCHAR(100))
- `detalhes` (JSONB)
- `ip_origem` (INET)
- `data_acao` (TIMESTAMP)

---

## 📱 FRONTEND - TELAS

### Fluxo de Autenticação
- **TelaBoasVindas** - Splash screen com logo
- **TelaLogin** - Email/senha + botões OAuth
- **TelaCadastro** - Formulário de registro
- **TelaRecuperarSenha** - Recuperação por email
- **TelaRedefinirSenha** - Nova senha

### Fluxo Principal
- **TelaHome** - Dashboard com grupos recentes
- **TelaListaGrupos** - Todos os grupos do usuário
- **TelaCriarGrupo** - Formulário novo grupo
- **TelaDetalhesGrupo** - Informações do grupo
- **TelaChat** - Mensagens em tempo real
- **TelaConfiguracoesGrupo** - Administração do grupo

### Fluxo de Perfil
- **TelaPerfil** - Dados do usuário
- **TelaEditarPerfil** - Edição de dados
- **TelaConfiguracoes** - Preferências do app

### Fluxo de Arquivos
- **TelaUploadArquivo** - Seleção e upload
- **TelaGerenciarArquivos** - Lista de arquivos do grupo
- **TelaVisualizarArquivo** - Preview de arquivos

### Fluxo de Tarefas
- **TelaListaTarefas** - Tarefas do grupo
- **TelaCriarTarefa** - Nova tarefa
- **TelaDetalheTarefa** - Informações da tarefa

### Fluxo de Calendário
- **TelaCalendario** - Eventos do grupo
- **TelaCriarEvento** - Novo evento
- **TelaDetalheEvento** - Informações do evento

### Fluxo de Convites
- **TelaConvitarMembros** - Convitar por email/código
- **TelaConvitesPendentes** - Convites recebidos

### Componentes Globais
- **ComponenteNotificacoes** - Lista de notificações
- **ComponenteMenu** - Navegação lateral
- **ComponenteLoadingGlobal** - Indicador de carregamento

---

## 🏗️ BACKEND - ENTIDADES

### Entidades Principais

#### UsuarioEntity
- **preRules**: validar email único, senha forte
- **rules**: validar dados obrigatórios
- **persist**: salvar usuário com senha criptografada
- **create**: instanciar usuário

#### GrupoEntity
- **preRules**: validar nome único por criador
- **rules**: validar dados obrigatórios, código acesso único
- **persist**: salvar grupo e criar primeiro membro como admin
- **create**: instanciar grupo

#### MembroGrupoEntity
- **preRules**: validar se usuário não é membro
- **rules**: validar permissões
- **persist**: adicionar membro ao grupo
- **create**: instanciar membro

#### MensagemEntity
- **preRules**: validar se usuário é membro do grupo
- **rules**: validar conteúdo não vazio
- **persist**: salvar mensagem e notificar membros
- **create**: instanciar mensagem

#### ArquivoEntity
- **preRules**: validar tamanho e tipo de arquivo
- **rules**: validar permissões de upload
- **persist**: salvar no S3 e metadados no banco
- **create**: instanciar arquivo

#### TarefaEntity
- **preRules**: validar se criador é membro
- **rules**: validar data vencimento
- **persist**: salvar tarefa
- **create**: instanciar tarefa

#### EventoCalendarioEntity
- **preRules**: validar se criador é membro
- **rules**: validar datas início/fim
- **persist**: salvar evento
- **create**: instanciar evento

#### ConviteGrupoEntity
- **preRules**: validar se email não é membro
- **rules**: validar permissões para convidar
- **persist**: salvar convite e enviar email
- **create**: instanciar convite

---

## 🔄 BACKEND - CONTROLLERS E MÉTODOS

### UsuarioController
- `criarUsuario` → POST /api/usuarios
- `autenticarUsuario` → POST /api/usuarios/login
- `obterPerfilUsuario` → GET /api/usuarios/perfil
- `atualizarPerfilUsuario` → PUT /api/usuarios/perfil
- `uploadFotoPerfilUsuario` → POST /api/usuarios/foto-perfil
- `desativarUsuario` → DELETE /api/usuarios/perfil
- `recuperarSenhaUsuario` → POST /api/usuarios/recuperar-senha
- `redefinirSenhaUsuario` → POST /api/usuarios/redefinir-senha

### AuthController
- `loginOauthGoogle` → POST /api/auth/google
- `loginOauthMicrosoft` → POST /api/auth/microsoft
- `renovarTokenJwt` → POST /api/auth/refresh
- `revogarTokenJwt` → POST /api/auth/logout
- `validarTokenJwt` → GET /api/auth/validate

### GrupoController
- `criarGrupo` → POST /api/grupos
- `listarGruposUsuario` → GET /api/grupos
- `obterDetalhesGrupo` → GET /api/grupos/:id
- `atualizarGrupo` → PUT /api/grupos/:id
- `excluirGrupo` → DELETE /api/grupos/:id
- `sairGrupo` → POST /api/grupos/:id/sair
- `buscarGruposPorCodigo` → GET /api/grupos/buscar/:codigo

### MembroGrupoController
- `listarMembrosGrupo` → GET /api/grupos/:id/membros
- `adicionarMembroGrupo` → POST /api/grupos/:id/membros
- `atualizarPermissaoMembro` → PUT /api/grupos/:id/membros/:usuarioId
- `removerMembroGrupo` → DELETE /api/grupos/:id/membros/:usuarioId

### MensagemController
- `enviarMensagem` → POST /api/grupos/:id/mensagens
- `listarMensagensGrupo` → GET /api/grupos/:id/mensagens
- `editarMensagem` → PUT /api/mensagens/:id
- `excluirMensagem` → DELETE /api/mensagens/:id
- `marcarMensagemLida` → POST /api/mensagens/:id/lida

### ArquivoController
- `uploadArquivo` → POST /api/grupos/:id/arquivos
- `listarArquivosGrupo` → GET /api/grupos/:id/arquivos
- `baixarArquivo` → GET /api/arquivos/:id/download
- `excluirArquivo` → DELETE /api/arquivos/:id
- `obterDetalhesArquivo` → GET /api/arquivos/:id

### TarefaController
- `criarTarefa` → POST /api/grupos/:id/tarefas
- `listarTarefasGrupo` → GET /api/grupos/:id/tarefas
- `obterDetalhesTarefa` → GET /api/tarefas/:id
- `atualizarTarefa` → PUT /api/tarefas/:id
- `excluirTarefa` → DELETE /api/tarefas/:id
- `atribuirTarefaUsuario` → POST /api/tarefas/:id/atribuir
- `marcarTarefaConcluida` → POST /api/tarefas/:id/concluir

### EventoController
- `criarEvento` → POST /api/grupos/:id/eventos
- `listarEventosGrupo` → GET /api/grupos/:id/eventos
- `obterDetalhesEvento` → GET /api/eventos/:id
- `atualizarEvento` → PUT /api/eventos/:id
- `excluirEvento` → DELETE /api/eventos/:id

### ConviteController
- `enviarConviteEmail` → POST /api/grupos/:id/convites
- `listarConvitesPendentes` → GET /api/convites
- `aceitarConvite` → POST /api/convites/:codigo/aceitar
- `recusarConvite` → POST /api/convites/:codigo/recusar
- `listarConvitesGrupo` → GET /api/grupos/:id/convites

### NotificacaoController
- `listarNotificacoesUsuario` → GET /api/notificacoes
- `marcarNotificacaoLida` → PUT /api/notificacoes/:id/lida
- `marcarTodasLidas` → PUT /api/notificacoes/marcar-todas-lidas
- `excluirNotificacao` → DELETE /api/notificacoes/:id

### RelatorioController
- `obterEstatisticasGrupo` → GET /api/grupos/:id/estatisticas
- `obterHistoricoAtividades` → GET /api/grupos/:id/historico
- `obterRelatorioUsuario` → GET /api/usuarios/relatorio

---

## 🗄️ REPOSITORIES

Cada entidade terá seu Repository correspondente:
- **UsuarioRepository**
- **GrupoRepository**
- **MembroGrupoRepository**
- **MensagemRepository**
- **ArquivoRepository**
- **TarefaRepository**
- **EventoCalendarioRepository**
- **ConviteGrupoRepository**
- **NotificacaoRepository**
- **HistoricoAtividadeRepository**

---

## 🌟 FUNCIONALIDADES ESPECIAIS

### WebSocket Events (Socket.IO)
- `join-group` - Entrar na sala do grupo
- `leave-group` - Sair da sala do grupo
- `new-message` - Nova mensagem
- `message-edited` - Mensagem editada
- `message-deleted` - Mensagem excluída
- `user-typing` - Usuário digitando
- `user-online` - Usuário online
- `user-offline` - Usuário offline

### Middleware de Autenticação
- Validação de JWT em rotas protegidas
- Refresh automático de tokens
- Rate limiting por usuário

### Sistema de Permissões
- **Admin**: todas as permissões
- **Moderador**: gerenciar mensagens e membros
- **Membro**: participar normalmente
- **Visitante**: apenas visualizar

---

## 📦 ARMAZENAMENTO

### Amazon S3
- Armazenamento de arquivos enviados pelos usuários
- Fotos de perfil dos usuários
- Fotos de capa dos grupos
- Sistema de URLs pré-assinadas para segurança
- Organização por pastas: `/usuarios/{id}/`, `/grupos/{id}/`, `/arquivos/`
