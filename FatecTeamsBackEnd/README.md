npx create-expo-app@latest# FatecTeams Backend

Backend completo para a plataforma FatecTeams - Sistema de colaboração e comunicação para equipes acadêmicas.

## 🚀 Tecnologias

- **Node.js** + **Express** - Runtime e framework web
- **TypeScript** - Linguagem de programação
- **PostgreSQL** - Banco de dados
- **Socket.IO** - Comunicação em tempo real
- **JWT** - Autenticação e autorização
- **Multer** - Upload de arquivos
- **Bcrypt** - Hash de senhas

## 🏗️ Arquitetura

O projeto segue os princípios de **Domain Driven Design (DDD)** com a seguinte estrutura:

```
src/
├── config/           # Configurações do sistema
├── controllers/      # Controladores HTTP (apenas delegam para entities)
├── entities/         # Entidades de domínio (lógica de negócio)
├── repositories/     # Acesso aos dados (SQL puro)
├── middlewares/      # Middlewares personalizados
├── routes/           # Definição das rotas da API
├── types/            # Definições de tipos TypeScript
└── app.ts           # Configuração principal da aplicação
```

### Princípios de Design

1. **Controllers** apenas recebem requisições HTTP e delegam para Entities
2. **Entities** contêm toda a lógica de negócio e validações
3. **Repositories** fazem apenas acesso a dados com SQL puro (sem ORM)
4. Separação clara de responsabilidades entre camadas

## 🛠️ Instalação e Configuração

### 1. Pré-requisitos

- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn

### 2. Clonagem e Dependências

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd FatecTeamsBackEnd

# Instale as dependências
npm install
```

### 3. Configuração do Banco de Dados

```sql
-- Conecte ao PostgreSQL e execute:
CREATE DATABASE fatecteams;
CREATE USER fatecuser WITH PASSWORD 'senha123';
GRANT ALL PRIVILEGES ON DATABASE fatecteams TO fatecuser;
```

Execute o script de migração:

```bash
# Execute o arquivo migration.sql no seu banco PostgreSQL
psql -U postgres -d fatecteams -f migration.sql
```

### 4. Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas configurações
nano .env
```

Principais variáveis:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Configurações do PostgreSQL
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - Chaves para JWT
- `PORT` - Porta do servidor (padrão: 3001)

### 5. Execução

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

O servidor estará disponível em `http://localhost:3001`

## 📚 API Endpoints

### Autenticação

- `POST /api/usuarios/registrar` - Registrar novo usuário
- `POST /api/usuarios/login` - Login do usuário
- `POST /api/usuarios/refresh` - Renovar token JWT

### Grupos

- `POST /api/grupos` - Criar grupo
- `GET /api/grupos/:id` - Obter grupo
- `PUT /api/grupos/:id` - Atualizar grupo
- `DELETE /api/grupos/:id` - Deletar grupo
- `GET /api/grupos` - Listar meus grupos
- `GET /api/grupos/publicos/buscar` - Buscar grupos públicos
- `POST /api/grupos/:id/membros` - Adicionar membro
- `DELETE /api/grupos/:grupoId/membros/:usuarioId` - Remover membro
- `PUT /api/grupos/:grupoId/membros/:usuarioId/papel` - Alterar papel do membro
- `GET /api/grupos/:id/estatisticas` - Estatísticas do grupo

### Mensagens

- `POST /api/grupos/:grupoId/mensagens` - Enviar mensagem
- `GET /api/mensagens/:id` - Obter mensagem
- `PUT /api/mensagens/:id` - Editar mensagem
- `DELETE /api/mensagens/:id` - Deletar mensagem
- `GET /api/grupos/:grupoId/mensagens` - Listar mensagens
- `GET /api/grupos/:grupoId/mensagens/buscar` - Buscar mensagens
- `POST /api/mensagens/:id/reacoes` - Adicionar reação
- `DELETE /api/mensagens/:id/reacoes/:tipoReacao` - Remover reação
- `PUT /api/mensagens/:id/marcar-lida` - Marcar como lida

### Tarefas

- `POST /api/grupos/:grupoId/tarefas` - Criar tarefa
- `GET /api/tarefas/:id` - Obter tarefa
- `PUT /api/tarefas/:id` - Atualizar tarefa
- `DELETE /api/tarefas/:id` - Deletar tarefa
- `GET /api/grupos/:grupoId/tarefas` - Listar tarefas
- `GET /api/tarefas/:grupoId/minhas` - Minhas tarefas
- `PUT /api/tarefas/:id/concluir` - Concluir tarefa
- `PUT /api/tarefas/:id/iniciar` - Iniciar tarefa
- `POST /api/tarefas/:id/comentarios` - Adicionar comentário
- `POST /api/tarefas/:id/horas` - Adicionar horas trabalhadas

### Arquivos

- `POST /api/grupos/:grupoId/arquivos/upload` - Upload de arquivo
- `POST /api/grupos/:grupoId/arquivos/pasta` - Criar pasta
- `GET /api/arquivos/:id` - Obter informações do arquivo
- `GET /api/arquivos/:id/download` - Download do arquivo
- `GET /api/arquivos/:id/visualizar` - Visualizar arquivo
- `GET /api/grupos/:grupoId/arquivos` - Listar arquivos
- `POST /api/arquivos/:id/versoes` - Nova versão
- `POST /api/arquivos/:id/compartilhar` - Compartilhar arquivo

## 🔒 Autenticação

Todas as rotas (exceto registro, login e busca pública) requerem autenticação via JWT Bearer Token:

```
Authorization: Bearer <seu-jwt-token>
```

## 📁 Estrutura de Upload

Arquivos são salvos na pasta `uploads/` com organização automática por data e tipo.

Tipos de arquivo suportados:
- Imagens: JPG, PNG, GIF, WebP
- Documentos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- Texto: TXT, CSV
- Comprimidos: ZIP

Limite: 50MB por arquivo.

## 🔄 WebSocket Events

O servidor Socket.IO suporta os seguintes eventos:

### Eventos de entrada (cliente → servidor):
- `join-group` - Entrar em um grupo
- `leave-group` - Sair de um grupo
- `user-typing` - Usuário digitando

### Eventos de saída (servidor → cliente):
- `nova-mensagem` - Nova mensagem no grupo
- `mensagem-editada` - Mensagem editada
- `mensagem-deletada` - Mensagem deletada
- `user-typing` - Broadcast de usuário digitando
- `tarefa-atualizada` - Tarefa foi atualizada
- `membro-adicionado` - Novo membro no grupo

## 🛡️ Segurança

- Rate limiting (100 req/15min por IP)
- Helmet.js para headers de segurança
- CORS configurável
- Validação rigorosa de entrada
- Hash de senhas com bcrypt
- JWT com refresh tokens
- Sanitização de dados

## 📊 Monitoramento

- Logs estruturados com Morgan
- Tratamento centralizado de erros
- Compressão gzip automática
- Métricas de performance

## 🧪 Testes

```bash
# Executar testes unitários
npm test

# Executar testes com coverage
npm run test:coverage

# Executar testes e2e
npm run test:e2e
```

## 📦 Deploy

### Docker

```bash
# Construir imagem
docker build -t fatecteams-backend .

# Executar container
docker run -p 3001:3001 --env-file .env fatecteams-backend
```

### PM2 (Produção)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Executar aplicação
pm2 start dist/app.js --name fatecteams-api

# Monitorar
pm2 monit
```

## 🐛 Troubleshooting

### Erro de conexão com PostgreSQL
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no `.env`
- Teste a conexão: `psql -U postgres -h localhost`

### Erro de compilação TypeScript
- Execute `npm run build` para ver erros detalhados
- Verifique se todas as dependências estão instaladas

### Erro de upload de arquivos
- Verifique se a pasta `uploads/` existe e tem permissões
- Confirme o limite de arquivo no `.env`

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 👥 Contribuição

1. Faça fork do projeto
2. Crie uma branch para sua feature: `git checkout -b feature/nova-feature`
3. Commit suas mudanças: `git commit -m 'Adiciona nova feature'`
4. Push para a branch: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas e suporte:
- Abra uma issue no GitHub
- Entre em contato com a equipe de desenvolvimento

---

**FatecTeams** - Sistema de colaboração acadêmica desenvolvido com ❤️
