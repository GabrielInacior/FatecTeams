# 🔍 ANÁLISE DAS STORES VS APIs - RELATÓRIO DE INCONSISTÊNCIAS

## ❌ PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. **AuthSlice - Implementação PARCIAL**

**✅ Implementadas corretamente:**
- `loginAsync` → `/auth/login` (email, senha)
- `registerAsync` → `/usuarios` (nome, telefone)  
- `loginWithGoogleAsync` → `/auth/google` (idToken, accessToken)
- `validateTokenAsync` → `/auth/validar`
- `logoutAsync` → `/auth/logout`
- `changePasswordAsync` → `/auth/senha` (senhaAtual, novaSenha)

**❌ APIs FALTANTES:**
- `/auth/registro` (diferente de `/usuarios`)
- `/auth/microsoft` (placeholder)
- `/auth/refresh` (refreshToken)
- `/auth/sessao`
- `/usuarios/recuperar-senha` (email)
- `/usuarios/redefinir-senha` (token, novaSenha)
- `/usuarios/perfil` (GET/PUT)
- `/usuarios/foto-perfil` (POST multipart)
- `/usuarios/perfil` (DELETE - desativar conta)

---

### 2. **GruposSlice - Implementação MÍNIMA**

**✅ Implementadas (mas sem service calls):**
- `fetchGrupos` → `/grupos` ❌ **Sem parâmetros de query**
- `createGrupo` → `/grupos` ❌ **Interface errada**
- `joinGrupo` → `/grupos/:id/entrar` ❌ **Parâmetro correto mas sem implementação**
- `leaveGrupo` → `/grupos/:id/sair` ❌ **Parâmetro correto mas sem implementação**

**❌ APIs COMPLETAMENTE FALTANTES:**
- `/grupos/:id` (GET - dados básicos)
- `/grupos/:id/detalhes` (GET - detalhes completos)
- `/grupos/:id` (PUT - atualizar)
- `/grupos/:id` (DELETE - deletar)
- `/grupos/publicos/buscar` (termo, categoria, limit)
- `/grupos/:id/membros` (POST - adicionar membro)
- `/grupos/:grupoId/membros/:usuarioId` (DELETE - remover membro)
- `/grupos/:grupoId/membros/:usuarioId/papel` (PUT - alterar papel)
- `/grupos/:id/membros/:usuarioId/nivel` (PUT - alterar nível)
- `/grupos/:id/membros` (GET - obter membros)
- `/grupos/:id/estatisticas` (GET)

---

### 3. **ChatSlice - Implementação BÁSICA**

**✅ Implementadas (mas sem service calls):**
- `fetchMensagens` → `/grupos/:grupoId/mensagens`
- `sendMensagem` → `/grupos/:grupoId/mensagens`
- `editMensagem` → `/mensagens/:id` (PUT)
- `deleteMensagem` → `/mensagens/:id` (DELETE)

**❌ APIs FALTANTES:**
- `/mensagens/:id` (GET - obter mensagem específica)
- `/grupos/:grupoId/mensagens/buscar` (termo, tipo, autor_id)
- `/mensagens/:id/reacoes` (POST/DELETE/GET)
- `/grupos/:grupoId/mensagens/nao-lidas` (GET)
- `/mensagens/:id/marcar-lida` (PUT)
- `/grupos/:grupoId/mensagens/marcar-todas-lidas` (PUT)
- `/grupos/:grupoId/mensagens/estatisticas` (GET)
- `/grupos/:grupoId/mensagens/recentes` (GET)

**❌ Parâmetros incorretos:**
- `fetchMensagens` não aceita query params: `limit`, `offset`, `data_inicio`, `data_fim`
- `sendMensagem` não aceita `mencionados` array

---

### 4. **TarefasSlice - Implementação BÁSICA**

**✅ Implementadas (mas sem service calls):**
- `fetchTarefas` → `/grupos/:grupoId/tarefas`
- `createTarefa` → `/grupos/:grupoId/tarefas`
- `updateTarefa` → `/tarefas/:id` (PUT)
- `deleteTarefa` → `/tarefas/:id` (DELETE)
- `updateStatusTarefa` → Status específico (concluir/iniciar/cancelar)
- `assignTarefa` → `/tarefas/:id/atribuir`

**❌ APIs FALTANTES:**
- `/tarefas/:id` (GET - obter tarefa específica)
- `/tarefas/:grupoId/minhas` (GET - tarefas do usuário)
- `/grupos/:grupoId/tarefas/buscar` (termo, status)
- `/tarefas/:id/concluir` (PUT)
- `/tarefas/:id/iniciar` (PUT)
- `/tarefas/:id/cancelar` (PUT)
- `/tarefas/:id/comentarios` (POST/GET)
- `/comentarios/:comentarioId` (DELETE)
- `/tarefas/:id/horas` (POST - adicionar horas)
- `/grupos/:grupoId/tarefas/estatisticas` (GET)
- `/tarefas/:id/historico` (GET)

**❌ Parâmetros incorretos:**
- `fetchTarefas` não aceita query params: `status`, `prioridade`, `responsavel_id`, `limit`, `offset`
- `createTarefa` não aceita `anexos` array

---

### 5. **NotificacoesSlice - Implementação BÁSICA**

**✅ Implementadas (mas sem service calls):**
- `fetchNotificacoes` → `/notificacoes`
- `markAsRead` → `/notificacoes/:notificacaoId/marcar-lida` (PATCH)
- `markAllAsRead` → `/notificacoes/marcar-todas-lidas` (PATCH)
- `deleteNotificacao` → `/notificacoes/:notificacaoId` (DELETE)
- `updateConfiguracoes` → `/notificacoes/configuracoes` (PUT)

**❌ APIs FALTANTES:**
- `/notificacoes/nao-lidas` (GET - contar não lidas)
- `/notificacoes` (POST - criar notificação)
- `/notificacoes/configuracoes` (GET - obter configurações)

**❌ Parâmetros incorretos:**
- `fetchNotificacoes` não aceita query params corretos: `lida`, `tipo`, `limit`, `offset`

---

### 6. **APIs COMPLETAMENTE NÃO IMPLEMENTADAS**

**❌ CONVITES** - Nenhuma store criada:
- `/convites` (POST - criar convite)
- `/grupos/:grupoId/convites` (GET - listar)
- `/convites/validar/:codigo` (GET)
- `/convites/aceitar/:codigo` (POST)
- `/convites/recusar/:codigo` (POST)
- `/convites/:codigo` (DELETE)

**❌ ARQUIVOS** - Nenhuma store criada:
- `/grupos/:grupoId/arquivos/upload` (POST multipart)
- `/grupos/:grupoId/arquivos/pasta` (POST)
- `/arquivos/:id` (GET/PUT/DELETE)
- `/arquivos/:id/download` (GET)
- `/arquivos/:id/visualizar` (GET)
- `/grupos/:grupoId/arquivos` (GET)
- `/grupos/:grupoId/arquivos/buscar` (GET)
- `/arquivos/:id/versoes` (POST/GET)
- `/arquivos/:id/compartilhar` (POST)
- E muitas outras...

**❌ EVENTOS** - Nenhuma store criada:
- `/grupos/:grupoId/eventos` (POST/GET)
- `/eventos/:id` (GET/PUT)
- `/eventos/:id/participantes` (POST)
- `/eventos/meus` (GET)

**❌ HISTÓRICO** - Nenhuma store criada:
- `/historico/meu` (GET)
- `/grupos/:grupoId/historico` (GET)
- `/historico/estatisticas` (GET)
- `/grupos/:grupoId/historico/top-usuarios` (GET)

**❌ RELATÓRIOS** - Nenhuma store criada:
- `/grupos/:grupoId/relatorios/atividade` (GET)
- `/usuarios/:usuarioId/relatorios/desempenho` (GET)
- `/relatorios/plataforma` (GET)
- `/relatorios/exportar` (GET)

---

## 🔧 CORREÇÕES NECESSÁRIAS

### 1. **Tipos de Dados Inconsistentes**
- APIs usam `uuid` (string), stores usam `number` para IDs
- APIs usam `enum` específicos, stores usam strings genéricas
- Nomenclatura diferente: API usa `grupo_id`, store usa `grupoId`

### 2. **Parâmetros Query Faltantes**
- Todas as stores precisam aceitar parâmetros de paginação
- Faltam filtros específicos de cada endpoint
- Faltam parâmetros de busca e ordenação

### 3. **Service Layer Não Implementado**
- Todas as stores têm comentários "API call será implementada"
- Nenhuma store faz chamadas reais para o backend

### 4. **WebSocket Integration**
- Stores têm alguns reducers para tempo real
- Mas não há integração completa com WebSocket service

---

## 📊 RESUMO ESTATÍSTICO

- **Total de APIs no guia**: ~115 endpoints
- **APIs implementadas (pelo menos parcialmente)**: ~15-20
- **APIs completamente implementadas**: ~5-8
- **Stores faltantes**: 4 (Convites, Arquivos, Eventos, Histórico, Relatórios)
- **Cobertura estimada**: ~15% das funcionalidades

## ⚠️ PRIORIDADE DE CORREÇÃO

1. **CRÍTICO**: Completar AuthSlice e GruposSlice
2. **ALTO**: Implementar service layer real
3. **ALTO**: Criar stores faltantes (Convites, Arquivos, Eventos)
4. **MÉDIO**: Corrigir parâmetros e tipos
5. **BAIXO**: Implementar Relatórios e Histórico
