# 📚 Guia Completo de APIs - FatecTeams Backend

## 🔐 Autenticação

**Base URL**: `/api`

### Legendas
- 🟢 **Rota Pública** (sem autenticação)
- 🔒 **Rota Protegida** (requer token JWT)
- 📤 **Body Parameters** - Dados enviados no corpo da requisição
- 🔍 **Query Parameters** - Parâmetros na URL (?key=value)
- 📍 **Path Parameters** - Parâmetros no caminho (/api/users/:id)

---

## 🔑 AUTH ROUTES `/auth`

### 🟢 POST `/auth/login`
**Descrição**: Login tradicional com email e senha

**Body Parameters**:
```json
{
  "email": "string (required)",
  "senha": "string (required)"
}
```

**Response Success (200)**:
```json
{
  "sucesso": true,
  "mensagem": "Login realizado com sucesso",
  "dados": {
    "usuario": {
      "id": "uuid",
      "nome": "string",
      "email": "string",
      "foto_perfil": "string"
    },
    "accessToken": "string",
    "refreshToken": "string"
  },
  "timestamp": "ISO string"
}
```

---

### 🟢 POST `/auth/registro`
**Descrição**: Registro de novo usuário

**Body Parameters**:
```json
{
  "nome": "string (required)",
  "email": "string (required)", 
  "senha": "string (required)",
  "telefone": "string (optional)"
}
```

**Response Success (201)**:
```json
{
  "sucesso": true,
  "mensagem": "Usuário registrado com sucesso",
  "dados": {
    "usuario": {
      "id": "uuid",
      "nome": "string",
      "email": "string"
    },
    "accessToken": "string",
    "refreshToken": "string"
  },
  "timestamp": "ISO string"
}
```

---

### 🟢 POST `/auth/google`
**Descrição**: Login com Google OAuth

**Body Parameters**:
```json
{
  "idToken": "string (optional) - Google ID Token",
  "accessToken": "string (optional) - Google Access Token"
}
```

**Nota**: Pelo menos um dos tokens (idToken ou accessToken) deve ser fornecido.

---

### 🟢 GET `/auth/google/url`
**Descrição**: Obter URL de autorização Google

**Response Success (200)**:
```json
{
  "sucesso": true,
  "dados": {
    "url": "string - URL de autorização"
  }
}
```

---

### 🟢 GET `/auth/google/callback`
**Descrição**: Callback do Google OAuth

**Query Parameters**:
- `code` (string, required) - Authorization code do Google

---

### 🟢 POST `/auth/microsoft`
**Descrição**: Login com Microsoft (placeholder)

---

### 🟢 POST `/auth/refresh`
**Descrição**: Renovar tokens JWT

**Body Parameters**:
```json
{
  "refreshToken": "string (required)"
}
```

**Response Success (200)**:
```json
{
  "sucesso": true,
  "mensagem": "Tokens renovados com sucesso",
  "dados": {
    "accessToken": "string",
    "refreshToken": "string",
    "usuario": {
      "id": "uuid",
      "nome": "string",
      "email": "string",
      "foto_perfil": "string"
    }
  }
}
```

---

### 🔒 GET `/auth/validar`
**Descrição**: Validar token atual

**Headers**: `Authorization: Bearer <token>`

**Response Success (200)**:
```json
{
  "sucesso": true,
  "valido": true,
  "usuario": {
    "id": "uuid",
    "nome": "string",
    "email": "string"
  }
}
```

---

### 🔒 POST `/auth/logout`
**Descrição**: Fazer logout

**Headers**: `Authorization: Bearer <token>`

---

### 🔒 GET `/auth/sessao`
**Descrição**: Obter informações da sessão atual

**Headers**: `Authorization: Bearer <token>`

---

### 🔒 PUT `/auth/senha`
**Descrição**: Alterar senha (apenas login tradicional)

**Headers**: `Authorization: Bearer <token>`

**Body Parameters**:
```json
{
  "senhaAtual": "string (required)",
  "novaSenha": "string (required)"
}
```

---

## 👤 USUARIOS ROUTES `/usuarios`

### 🟢 POST `/usuarios`
**Descrição**: Criar novo usuário

**Body Parameters**:
```json
{
  "nome": "string (required)",
  "email": "string (required)",
  "senha": "string (required)",
  "telefone": "string (optional)"
}
```

---

### 🟢 POST `/usuarios/login`
**Descrição**: Login de usuário

**Body Parameters**:
```json
{
  "email": "string (required)",
  "senha": "string (required)"
}
```

---

### 🟢 POST `/usuarios/recuperar-senha`
**Descrição**: Solicitar recuperação de senha

**Body Parameters**:
```json
{
  "email": "string (required)"
}
```

---

### 🟢 POST `/usuarios/redefinir-senha`
**Descrição**: Redefinir senha com token

**Body Parameters**:
```json
{
  "token": "string (required)",
  "novaSenha": "string (required)"
}
```

---

### 🔒 GET `/usuarios/perfil`
**Descrição**: Obter perfil do usuário logado

**Headers**: `Authorization: Bearer <token>`

**Response Success (200)**:
```json
{
  "sucesso": true,
  "dados": {
    "id": "uuid",
    "nome": "string",
    "email": "string",
    "telefone": "string",
    "foto_perfil": "string",
    "data_criacao": "ISO string",
    "ultimo_acesso": "ISO string"
  }
}
```

---

### 🔒 PUT `/usuarios/perfil`
**Descrição**: Atualizar perfil do usuário

**Headers**: `Authorization: Bearer <token>`

**Body Parameters**:
```json
{
  "nome": "string (optional)",
  "telefone": "string (optional)"
}
```

---

### 🔒 POST `/usuarios/foto-perfil`
**Descrição**: Upload de foto de perfil

**Headers**: `Authorization: Bearer <token>`

**Content-Type**: `multipart/form-data`

**Form Data**:
- `foto` (file, required) - Arquivo de imagem

---

### 🔒 DELETE `/usuarios/perfil`
**Descrição**: Desativar conta do usuário

**Headers**: `Authorization: Bearer <token>`

---

## 👥 GRUPOS ROUTES

### 🔒 POST `/grupos`
**Descrição**: Criar novo grupo

**Headers**: `Authorization: Bearer <token>`

**Body Parameters**:
```json
{
  "nome": "string (required)",
  "descricao": "string (optional)",
  "tipo_grupo": "enum: 'publico' | 'privado' (required)",
  "tipo": "enum: 'publico' | 'privado' (optional, alternativa ao tipo_grupo)",
  "configuracoes": "object (optional)"
}
```

**Response Success (201)**:
```json
{
  "sucesso": true,
  "mensagem": "Grupo criado com sucesso",
  "dados": {
    "id": "uuid",
    "nome": "string",
    "descricao": "string",
    "tipo": "string",
    "categoria": "string",
    "criador_id": "uuid",
    "data_criacao": "ISO string"
  }
}
```

---

### 🔒 GET `/grupos/:id`
**Descrição**: Obter dados básicos de um grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do grupo

---

### 🔒 GET `/grupos/:id/detalhes`
**Descrição**: Obter detalhes completos do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do grupo

---

### 🔒 PUT `/grupos/:id`
**Descrição**: Atualizar grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do grupo

**Body Parameters**:
```json
{
  "nome": "string (optional)",
  "descricao": "string (optional)",
  "tipo_grupo": "enum: 'publico' | 'privado' (optional)",
  "tipo": "enum: 'publico' | 'privado' (optional, alternativa ao tipo_grupo)",
  "configuracoes": "object (optional)"
}
```

---

### 🔒 DELETE `/grupos/:id`
**Descrição**: Deletar grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do grupo

---

### 🔒 POST `/grupos/:id/sair`
**Descrição**: Sair do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do grupo

---

### 🔒 GET `/grupos`
**Descrição**: Listar grupos do usuário

**Headers**: `Authorization: Bearer <token>`

**Query Parameters** (opcionais):
- `tipo` (string) - Filtro por tipo
- `categoria` (string) - Filtro por categoria
- `limit` (number) - Limite de resultados
- `offset` (number) - Deslocamento para paginação

---

### 🔒 GET `/grupos/publicos/buscar`
**Descrição**: Buscar grupos públicos

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `termo` (string, optional) - Termo de busca
- `categoria` (string, optional) - Filtro por categoria
- `limit` (number, optional) - Limite de resultados

---

### 🔒 POST `/grupos/:id/entrar`
**Descrição**: Entrar em grupo público

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do grupo

---

### 🔒 POST `/grupos/:id/membros`
**Descrição**: Adicionar membro ao grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do grupo

**Body Parameters**:
```json
{
  "usuario_id": "uuid (required)",
  "papel": "enum: 'membro' | 'admin' | 'moderador' (optional, default: 'membro')"
}
```

---

### 🔒 DELETE `/grupos/:grupoId/membros/:usuarioId`
**Descrição**: Remover membro do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo
- `usuarioId` (uuid, required) - ID do usuário

---

### 🔒 PUT `/grupos/:grupoId/membros/:usuarioId/papel`
**Descrição**: Alterar papel do membro

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo
- `usuarioId` (uuid, required) - ID do usuário

**Body Parameters**:
```json
{
  "papel": "enum: 'membro' | 'admin' | 'moderador' (required)"
}
```

---

### 🔒 PUT `/grupos/:id/membros/:usuarioId/nivel`
**Descrição**: Alterar nível do membro

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do grupo
- `usuarioId` (uuid, required) - ID do usuário

**Body Parameters**:
```json
{
  "nivel": "number (required)"
}
```

---

### 🔒 GET `/grupos/:id/membros`
**Descrição**: Obter membros do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do grupo

---

### 🔒 GET `/grupos/:id/estatisticas`
**Descrição**: Obter estatísticas do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do grupo

---

## 💌 CONVITES ROUTES

### 🔒 POST `/convites`
**Descrição**: Criar convite para grupo

**Headers**: `Authorization: Bearer <token>`

**Body Parameters**:
```json
{
  "grupo_id": "uuid (required)",
  "email": "string (required) - Email do destinatário"
}
```

---

### 🔒 GET `/grupos/:grupoId/convites`
**Descrição**: Listar convites do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

---

### 🔒 GET `/convites/validar/:codigo`
**Descrição**: Validar código de convite

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `codigo` (string, required) - Código do convite

---

### 🔒 POST `/convites/aceitar/:codigo`
**Descrição**: Aceitar convite

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `codigo` (string, required) - Código do convite

---

### 🔒 POST `/convites/recusar/:codigo`
**Descrição**: Recusar convite

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `codigo` (string, required) - Código do convite

---

### 🔒 DELETE `/convites/:codigo`
**Descrição**: Cancelar convite

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `codigo` (string, required) - Código do convite

---

## 💬 MENSAGENS ROUTES

### 🔒 POST `/grupos/:grupoId/mensagens`
**Descrição**: Criar nova mensagem no grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Body Parameters**:
```json
{
  "conteudo": "string (required)",
  "tipo_mensagem": "enum: 'texto' | 'arquivo' | 'imagem' (optional, default: 'texto')",
  "arquivo_id": "uuid (optional)",
  "grupo_id": "uuid (required)",
  "mensagem_pai_id": "uuid (optional) - Para respostas",
  "mencionados": "uuid[] (optional) - Array de IDs de usuários mencionados"
}
```

**Response Success (201)**:
```json
{
  "sucesso": true,
  "mensagem": "Mensagem criada com sucesso",
  "dados": {
    "id": "uuid",
    "conteudo": "string",
    "tipo": "string",
    "autor_id": "uuid",
    "grupo_id": "uuid",
    "data_criacao": "ISO string"
  }
}
```

---

### 🔒 GET `/mensagens/:id`
**Descrição**: Obter mensagem específica

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da mensagem

---

### 🔒 PUT `/mensagens/:id`
**Descrição**: Atualizar mensagem

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da mensagem

**Body Parameters**:
```json
{
  "conteudo": "string (required)"
}
```

---

### 🔒 DELETE `/mensagens/:id`
**Descrição**: Deletar mensagem

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da mensagem

---

### 🔒 GET `/grupos/:grupoId/mensagens`
**Descrição**: Listar mensagens do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Query Parameters**:
- `limit` (number, optional, default: 50) - Limite de mensagens
- `offset` (number, optional, default: 0) - Deslocamento
- `data_inicio` (ISO string, optional) - Data de início
- `data_fim` (ISO string, optional) - Data de fim

---

### 🔒 GET `/grupos/:grupoId/mensagens/buscar`
**Descrição**: Buscar mensagens no grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Query Parameters**:
- `termo` (string, required) - Termo de busca
- `tipo` (string, optional) - Filtro por tipo
- `autor_id` (uuid, optional) - Filtro por autor

---

### 🔒 POST `/mensagens/:id/reacoes`
**Descrição**: Adicionar reação à mensagem

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da mensagem

**Body Parameters**:
```json
{
  "tipo": "string (required) - Emoji da reação"
}
```

---

### 🔒 DELETE `/mensagens/:id/reacoes/:tipoReacao`
**Descrição**: Remover reação da mensagem

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da mensagem
- `tipoReacao` (string, required) - Emoji da reação

---

### 🔒 GET `/mensagens/:id/reacoes`
**Descrição**: Listar reações da mensagem

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da mensagem

---

### 🔒 GET `/grupos/:grupoId/mensagens/nao-lidas`
**Descrição**: Obter mensagens não lidas do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

---

### 🔒 PUT `/mensagens/:id/marcar-lida`
**Descrição**: Marcar mensagem como lida

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da mensagem

---

### 🔒 PUT `/grupos/:grupoId/mensagens/marcar-todas-lidas`
**Descrição**: Marcar todas mensagens do grupo como lidas

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

---

### 🔒 GET `/grupos/:grupoId/mensagens/estatisticas`
**Descrição**: Obter estatísticas de mensagens do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

---

### 🔒 GET `/grupos/:grupoId/mensagens/recentes`
**Descrição**: Obter mensagens recentes do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Query Parameters**:
- `limit` (number, optional, default: 10) - Limite de mensagens

---

## ✅ TAREFAS ROUTES

### 🔒 POST `/grupos/:grupoId/tarefas`
**Descrição**: Criar nova tarefa no grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Body Parameters**:
```json
{
  "titulo": "string (required)",
  "descricao": "string (optional)",
  "prioridade": "enum: 'baixa' | 'media' | 'alta' | 'critica' (optional, default: 'media')",
  "data_vencimento": "ISO string (optional)",
  "grupo_id": "uuid (required)",
  "assignado_para": "uuid[] (optional) - Array de IDs de usuários responsáveis",
  "etiquetas": "string[] (optional)",
  "estimativa_horas": "number (optional)",
  "anexos": "uuid[] (optional) - Array de IDs de arquivos"
}
```

---

### 🔒 GET `/tarefas/:id`
**Descrição**: Obter tarefa específica

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da tarefa

---

### 🔒 PUT `/tarefas/:id`
**Descrição**: Atualizar tarefa

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da tarefa

**Body Parameters**:
```json
{
  "titulo": "string (optional)",
  "descricao": "string (optional)",
  "status": "enum: 'pendente' | 'em_progresso' | 'concluida' | 'cancelada' (optional)",
  "prioridade": "enum: 'baixa' | 'media' | 'alta' | 'critica' (optional)",
  "data_vencimento": "ISO string (optional)",
  "responsaveis": "uuid[] (optional)",
  "tags": "string[] (optional)"
}
```

---

### 🔒 DELETE `/tarefas/:id`
**Descrição**: Deletar tarefa

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da tarefa

---

### 🔒 GET `/grupos/:grupoId/tarefas`
**Descrição**: Listar tarefas do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Query Parameters**:
- `status` (string, optional) - Filtro por status
- `prioridade` (string, optional) - Filtro por prioridade
- `responsavel_id` (uuid, optional) - Filtro por responsável
- `limit` (number, optional) - Limite de resultados
- `offset` (number, optional) - Deslocamento

---

### 🔒 GET `/tarefas/:grupoId/minhas`
**Descrição**: Listar tarefas do usuário no grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Query Parameters**:
- `status` (string, optional) - Filtro por status
- `prioridade` (string, optional) - Filtro por prioridade

---

### 🔒 GET `/grupos/:grupoId/tarefas/buscar`
**Descrição**: Buscar tarefas no grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Query Parameters**:
- `termo` (string, required) - Termo de busca
- `status` (string, optional) - Filtro por status

---

### 🔒 PUT `/tarefas/:id/concluir`
**Descrição**: Marcar tarefa como concluída

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da tarefa

---

### 🔒 PUT `/tarefas/:id/iniciar`
**Descrição**: Iniciar tarefa (status: em_progresso)

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da tarefa

---

### 🔒 PUT `/tarefas/:id/cancelar`
**Descrição**: Cancelar tarefa

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da tarefa

---

### 🔒 PUT `/tarefas/:id/atribuir`
**Descrição**: Atribuir tarefa a usuários

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da tarefa

**Body Parameters**:
```json
{
  "assignado_para": "uuid[] (required) - Array de IDs de usuários"
}
```

---

### 🔒 POST `/tarefas/:id/comentarios`
**Descrição**: Adicionar comentário à tarefa

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da tarefa

**Body Parameters**:
```json
{
  "comentario": "string (required)"
}
```

---

### 🔒 GET `/tarefas/:id/comentarios`
**Descrição**: Listar comentários da tarefa

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da tarefa

---

### 🔒 DELETE `/comentarios/:comentarioId`
**Descrição**: Deletar comentário

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `comentarioId` (uuid, required) - ID do comentário

---

### 🔒 POST `/tarefas/:id/horas`
**Descrição**: Adicionar horas trabalhadas na tarefa

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da tarefa

**Body Parameters**:
```json
{
  "horas": "number (required)",
  "descricao": "string (optional)",
  "data": "ISO string (optional, default: hoje)"
}
```

---

### 🔒 GET `/grupos/:grupoId/tarefas/estatisticas`
**Descrição**: Obter estatísticas de tarefas do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

---

### 🔒 GET `/tarefas/:id/historico`
**Descrição**: Obter histórico de alterações da tarefa

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID da tarefa

---

## 📁 ARQUIVOS ROUTES

### 🔒 POST `/grupos/:grupoId/arquivos/upload`
**Descrição**: Upload de arquivo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Content-Type**: `multipart/form-data`

**Form Data**:
- `arquivo` (file, required) - Arquivo para upload
- `grupo_id` (uuid, required) - ID do grupo
- `pasta_id` (uuid, optional) - ID da pasta pai
- `descricao` (string, optional) - Descrição do arquivo
- `publico` (boolean, optional) - Se o arquivo é público
- `etiquetas` (string, optional) - Tags separadas por vírgula

---

### 🔒 POST `/grupos/:grupoId/arquivos/pasta`
**Descrição**: Criar nova pasta

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Body Parameters**:
```json
{
  "nome": "string (required)",
  "descricao": "string (optional)",
  "pasta_pai_id": "uuid (optional)"
}
```

---

### 🔒 GET `/arquivos/:id`
**Descrição**: Obter informações do arquivo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do arquivo

---

### 🔒 PUT `/arquivos/:id`
**Descrição**: Atualizar informações do arquivo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do arquivo

**Body Parameters**:
```json
{
  "nome": "string (optional)",
  "descricao": "string (optional)",
  "tags": "string[] (optional)"
}
```

---

### 🔒 DELETE `/arquivos/:id`
**Descrição**: Deletar arquivo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do arquivo

---

### 🔒 GET `/arquivos/:id/download`
**Descrição**: Download do arquivo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do arquivo

---

### 🔒 GET `/arquivos/:id/visualizar`
**Descrição**: Visualizar arquivo (para tipos suportados)

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do arquivo

---

### 🔒 GET `/grupos/:grupoId/arquivos`
**Descrição**: Listar arquivos do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Query Parameters**:
- `pasta_id` (uuid, optional) - Filtrar por pasta
- `tipo` (string, optional) - Filtrar por tipo
- `limit` (number, optional) - Limite de resultados
- `offset` (number, optional) - Deslocamento

---

### 🔒 GET `/grupos/:grupoId/arquivos/pastas`
**Descrição**: Listar pastas do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

---

### 🔒 GET `/grupos/:grupoId/arquivos/buscar`
**Descrição**: Buscar arquivos no grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Query Parameters**:
- `termo` (string, required) - Termo de busca
- `tipo` (string, optional) - Filtrar por tipo

---

### 🔒 GET `/arquivos/:grupoId/recentes`
**Descrição**: Obter arquivos recentes do usuário

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Query Parameters**:
- `limit` (number, optional, default: 10)

---

### 🔒 POST `/arquivos/:id/versoes`
**Descrição**: Criar nova versão do arquivo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do arquivo

**Content-Type**: `multipart/form-data`

**Form Data**:
- `arquivo` (file, required) - Nova versão do arquivo
- `comentario` (string, optional) - Comentário da versão

---

### 🔒 GET `/arquivos/:id/versoes`
**Descrição**: Listar versões do arquivo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do arquivo

---

### 🔒 POST `/arquivos/:id/compartilhar`
**Descrição**: Compartilhar arquivo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do arquivo

**Body Parameters**:
```json
{
  "usuario_id": "uuid (required)",
  "permissoes": "enum: 'leitura' | 'escrita' (required)"
}
```

---

### 🔒 DELETE `/arquivos/:id/compartilhamento`
**Descrição**: Remover compartilhamento

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do arquivo

**Body Parameters**:
```json
{
  "usuario_id": "uuid (required)"
}
```

---

### 🔒 GET `/arquivos/:id/compartilhamentos`
**Descrição**: Listar compartilhamentos do arquivo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do arquivo

---

### 🔒 GET `/grupos/:grupoId/arquivos/estatisticas`
**Descrição**: Obter estatísticas de arquivos do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

---

## 🔔 NOTIFICAÇÕES ROUTES

### 🔒 GET `/notificacoes`
**Descrição**: Listar notificações do usuário

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `lida` (boolean, optional) - Filtrar por status de leitura
- `tipo` (string, optional) - Filtrar por tipo
- `limit` (number, optional, default: 20)
- `offset` (number, optional, default: 0)

---

### 🔒 GET `/notificacoes/nao-lidas`
**Descrição**: Contar notificações não lidas

**Headers**: `Authorization: Bearer <token>`

**Response Success (200)**:
```json
{
  "sucesso": true,
  "dados": {
    "total_nao_lidas": 5
  }
}
```

---

### 🔒 POST `/notificacoes`
**Descrição**: Criar notificação

**Headers**: `Authorization: Bearer <token>`

**Body Parameters**:
```json
{
  "usuario_id": "uuid (required)",
  "titulo": "string (required)",
  "mensagem": "string (required)",
  "tipo": "enum: 'info' | 'sucesso' | 'aviso' | 'erro' (required)",
  "importante": "boolean (optional, default: false)"
}
```

---

### 🔒 PATCH `/notificacoes/:notificacaoId/marcar-lida`
**Descrição**: Marcar notificação como lida

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `notificacaoId` (uuid, required) - ID da notificação

---

### 🔒 PATCH `/notificacoes/marcar-todas-lidas`
**Descrição**: Marcar todas notificações como lidas

**Headers**: `Authorization: Bearer <token>`

---

### 🔒 DELETE `/notificacoes/:notificacaoId`
**Descrição**: Remover notificação

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `notificacaoId` (uuid, required) - ID da notificação

---

### 🔒 GET `/notificacoes/configuracoes`
**Descrição**: Obter configurações de notificações

**Headers**: `Authorization: Bearer <token>`

---

### 🔒 PUT `/notificacoes/configuracoes`
**Descrição**: Atualizar configurações de notificações

**Headers**: `Authorization: Bearer <token>`

**Body Parameters**:
```json
{
  "email": "boolean (optional)",
  "push": "boolean (optional)",
  "som": "boolean (optional)",
  "tipos": {
    "mensagem": "boolean (optional)",
    "tarefa": "boolean (optional)",
    "convite": "boolean (optional)"
  }
}
```

---

## 📅 EVENTOS ROUTES

### 🔒 POST `/grupos/:grupoId/eventos`
**Descrição**: Criar evento no grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Body Parameters**:
```json
{
  "grupo_id": "uuid (required)",
  "titulo": "string (required)",
  "descricao": "string (optional)",
  "data_inicio": "ISO string (required)",
  "data_fim": "ISO string (optional)",
  "local": "string (optional)",
  "link_virtual": "string (optional)",
  "tipo": "enum: 'reuniao' | 'evento' | 'prazo' (optional, default: 'reuniao')"
}
```

---

### 🔒 GET `/eventos/:id`
**Descrição**: Obter evento específico

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do evento

---

### 🔒 PUT `/eventos/:id`
**Descrição**: Atualizar evento

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do evento

**Body Parameters**: (mesmos do POST, todos opcionais)

---

### 🔒 GET `/grupos/:grupoId/eventos`
**Descrição**: Listar eventos do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Query Parameters**:
- `data_inicio` (ISO string, optional) - Filtrar por data inicial
- `data_fim` (ISO string, optional) - Filtrar por data final

---

### 🔒 POST `/eventos/:id/participantes`
**Descrição**: Adicionar participante ao evento

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `id` (uuid, required) - ID do evento

**Body Parameters**:
```json
{
  "usuario_id": "uuid (required)"
}
```

---

### 🔒 GET `/eventos/meus`
**Descrição**: Listar eventos do usuário

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `data_inicio` (ISO string, optional)
- `data_fim` (ISO string, optional)

---

## 📊 HISTÓRICO DE ATIVIDADES ROUTES

### 🔒 GET `/historico/meu`
**Descrição**: Listar histórico do usuário

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `tipo_atividade` (string, optional) - Filtrar por tipo
- `data_inicio` (ISO string, optional)
- `data_fim` (ISO string, optional)
- `limit` (number, optional)
- `offset` (number, optional)

---

### 🔒 GET `/grupos/:grupoId/historico`
**Descrição**: Listar histórico do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Query Parameters**: (mesmos do endpoint anterior)

---

### 🔒 GET `/historico/estatisticas`
**Descrição**: Obter estatísticas de atividade do usuário

**Headers**: `Authorization: Bearer <token>`

---

### 🔒 GET `/grupos/:grupoId/historico/estatisticas`
**Descrição**: Obter estatísticas de atividade do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

---

### 🔒 GET `/grupos/:grupoId/historico/top-usuarios`
**Descrição**: Obter usuários mais ativos do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Query Parameters**:
- `limit` (number, optional, default: 10)

---

## 📈 RELATÓRIOS ROUTES

### 🔒 GET `/grupos/:grupoId/relatorios/atividade`
**Descrição**: Relatório de atividade do grupo

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `grupoId` (uuid, required) - ID do grupo

**Query Parameters**:
- `data_inicio` (ISO string, optional)
- `data_fim` (ISO string, optional)
- `formato` (enum: 'json' | 'csv' | 'pdf', optional, default: 'json')

---

### 🔒 GET `/usuarios/:usuarioId/relatorios/desempenho`
**Descrição**: Relatório de desempenho do usuário

**Headers**: `Authorization: Bearer <token>`

**Path Parameters**:
- `usuarioId` (uuid, required) - ID do usuário

**Query Parameters**: (mesmos do anterior)

---

### 🔒 GET `/relatorios/plataforma`
**Descrição**: Relatório geral da plataforma (apenas admins)

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**: (mesmos dos anteriores)

---

### 🔒 GET `/relatorios/exportar`
**Descrição**: Exportar relatório personalizado

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `tipo` (enum: 'atividade' | 'desempenho' | 'uso', required)
- `formato` (enum: 'json' | 'csv' | 'pdf', required)
- `data_inicio` (ISO string, optional)
- `data_fim` (ISO string, optional)
- `filtros` (string, optional) - JSON string com filtros específicos

---

## 🚨 Códigos de Resposta HTTP

### Sucesso
- **200 OK** - Operação realizada com sucesso
- **201 Created** - Recurso criado com sucesso
- **204 No Content** - Operação realizada sem conteúdo de retorno

### Erro do Cliente
- **400 Bad Request** - Dados inválidos ou faltantes
- **401 Unauthorized** - Token inválido ou ausente
- **403 Forbidden** - Sem permissão para acessar recurso
- **404 Not Found** - Recurso não encontrado
- **422 Unprocessable Entity** - Erro de validação

### Erro do Servidor
- **500 Internal Server Error** - Erro interno do servidor
- **503 Service Unavailable** - Serviço temporariamente indisponível

---

## 📋 Padrões de Response

### Response de Sucesso
```json
{
  "sucesso": true,
  "mensagem": "string",
  "dados": "object | array",
  "timestamp": "ISO string"
}
```

### Response de Erro
```json
{
  "sucesso": false,
  "mensagem": "string",
  "erros": "string[] (optional)",
  "timestamp": "ISO string"
}
```

### Response de Listagem (com paginação)
```json
{
  "sucesso": true,
  "dados": "array",
  "paginacao": {
    "total": "number",
    "pagina_atual": "number",
    "total_paginas": "number",
    "limite": "number"
  },
  "timestamp": "ISO string"
}
```

---

## 🔧 Headers Necessários

### Para Rotas Protegidas 🔒
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Para Upload de Arquivos
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

---

**📝 Notas Importantes:**
- Todos os IDs são UUIDs v4
- Timestamps seguem padrão ISO 8601
- Arrays vazios retornam `[]` ao invés de `null`
- Campos opcionais podem ser omitidos do body
- Rate limiting aplicado nas rotas de autenticação
- Validação de permissões em todas as operações
- Logs automáticos de todas as atividades

---

*Este guia foi gerado automaticamente baseado no código-fonte atual do backend FatecTeams. Para dúvidas ou atualizações, consulte o código dos controllers correspondentes.*
