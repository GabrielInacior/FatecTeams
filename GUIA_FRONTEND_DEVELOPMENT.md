# 📱 GUIA COMPLETO DE DESENVOLVIMENTO FRONTEND - FATECTEAMS

## 🎯 **VISÃO GERAL**
Este guia detalha todas as telas, APIs, componentes e funcionalidades necessárias para desenvolver o frontend do FatecTeams. O backend está 100% funcional e todas as APIs estão disponíveis.

**Base URL da API**: `http://localhost:3000/api`

---

## 🔐 **SISTEMA DE AUTENTICAÇÃO**

### **Headers Necessários**
```javascript
// Para requisições autenticadas
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}

// Para upload de arquivos
const headersUpload = {
  'Authorization': `Bearer ${token}`,
  // Não definir Content-Type para FormData
}
```

---

---

## ⚡ **WEBSOCKETS E TEMPO REAL**

### **Configuração do Socket.IO**
```javascript
import io from 'socket.io-client';

// Conectar com autenticação
const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
  auth: {
    token: localStorage.getItem('authToken')
  }
});

// Eventos de conexão
socket.on('connect', () => {
  console.log('Conectado ao servidor:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Desconectado do servidor');
});

socket.on('connect_error', (error) => {
  console.error('Erro de conexão:', error.message);
});
```

### **Eventos Disponíveis**

#### **Gerenciar Salas de Grupos**:
```javascript
// Entrar na sala do grupo (para receber mensagens em tempo real)
const entrarGrupo = (grupoId) => {
  socket.emit('join-group', grupoId);
};

// Sair da sala do grupo
const sairGrupo = (grupoId) => {
  socket.emit('leave-group', grupoId);
};
```

#### **Mensagens em Tempo Real**:
```javascript
// Escutar novas mensagens
socket.on('new-message', (mensagem) => {
  // Adicionar mensagem à lista do chat
  adicionarMensagemAoChat(mensagem);
  
  // Tocar som de notificação se não estiver na tela
  if (!document.hasFocus()) {
    tocarSomNotificacao();
  }
  
  // Atualizar contador de mensagens não lidas
  atualizarContadorNaoLidas(mensagem.grupo_id);
});

// Escutar mensagens editadas
socket.on('message-edited', (mensagem) => {
  atualizarMensagemNaLista(mensagem);
});

// Escutar mensagens deletadas
socket.on('message-deleted', (mensagemId) => {
  removerMensagemDaLista(mensagemId);
});
```

#### **Status de Digitação**:
```javascript
// Enviar status de digitação
const enviarStatusDigitacao = (grupoId, digitando) => {
  socket.emit('user-typing', {
    grupoId,
    usuarioId: currentUser.id,
    nomeUsuario: currentUser.nome,
    typing: digitando
  });
};

// Escutar quando alguém está digitando
socket.on('user-typing', (data) => {
  if (data.grupoId === currentGrupoId && data.usuarioId !== currentUser.id) {
    mostrarIndicadorDigitacao(data.nomeUsuario);
    
    // Remover indicador após timeout
    setTimeout(() => {
      ocultarIndicadorDigitacao(data.usuarioId);
    }, 3000);
  }
});
```

#### **Status Online/Offline**:
```javascript
// Usuário ficou online
socket.on('user-online', (usuarioData) => {
  atualizarStatusUsuario(usuarioData.id, 'online');
});

// Usuário ficou offline
socket.on('user-offline', (usuarioData) => {
  atualizarStatusUsuario(usuarioData.id, 'offline');
});
```

### **Implementação no Chat**:
```javascript
// Exemplo de implementação no componente de Chat
const ChatScreen = () => {
  const [mensagens, setMensagens] = useState([]);
  const [usuariosDigitando, setUsuariosDigitando] = useState([]);
  const [inputText, setInputText] = useState('');
  
  useEffect(() => {
    // Entrar no grupo quando a tela carregar
    socket.emit('join-group', grupoId);
    
    // Escutar novas mensagens
    socket.on('new-message', (novaMensagem) => {
      setMensagens(prev => [...prev, novaMensagem]);
    });
    
    // Escutar digitação
    socket.on('user-typing', (data) => {
      if (data.typing) {
        setUsuariosDigitando(prev => [...prev, data]);
      } else {
        setUsuariosDigitando(prev => 
          prev.filter(u => u.usuarioId !== data.usuarioId)
        );
      }
    });
    
    // Cleanup ao sair da tela
    return () => {
      socket.emit('leave-group', grupoId);
      socket.off('new-message');
      socket.off('user-typing');
    };
  }, [grupoId]);
  
  // Controle de digitação com debounce
  const handleInputChange = useCallback(
    debounce((text) => {
      if (text.length > 0) {
        socket.emit('user-typing', { grupoId, typing: true });
        setTimeout(() => {
          socket.emit('user-typing', { grupoId, typing: false });
        }, 1000);
      }
    }, 300),
    [grupoId]
  );
  
  return (
    // UI do chat...
  );
};
```

---

## � **RELATÓRIOS E ANALYTICS**

### **APIs de Relatórios**:

```javascript
// Relatório de atividade do grupo
const obterRelatorioAtividadeGrupo = async (grupoId, dataInicio, dataFim) => {
  const response = await axios.get(
    `/api/grupos/${grupoId}/relatorios/atividade`,
    {
      params: { data_inicio: dataInicio, data_fim: dataFim },
      headers
    }
  );
  // Retorna: mensagens por dia, arquivos enviados, tarefas criadas/concluídas
};

// Relatório de desempenho do usuário
const obterRelatorioDesempenhoUsuario = async (usuarioId, periodo) => {
  const response = await axios.get(
    `/api/usuarios/${usuarioId}/relatorios/desempenho`,
    {
      params: { periodo }, // 'semana', 'mes', 'trimestre'
      headers
    }
  );
  // Retorna: tarefas concluídas, participação em grupos, etc.
};

// Relatório da plataforma (admin only)
const obterRelatorioPlataforma = async (filtros = {}) => {
  const response = await axios.get('/api/relatorios/plataforma', {
    params: filtros,
    headers
  });
  // Retorna: estatísticas gerais da plataforma
};

// Exportar relatório
const exportarRelatorio = async (tipo, formato, filtros = {}) => {
  const response = await axios.get('/api/relatorios/exportar', {
    params: {
      tipo, // 'grupo', 'usuario', 'plataforma'
      formato, // 'pdf', 'excel', 'csv'
      ...filtros
    },
    headers
  });
  // Retorna: URL do arquivo gerado
};
```

### **Histórico de Atividades**:

```javascript
// Meu histórico
const obterMeuHistorico = async (limite = 50, offset = 0) => {
  const response = await axios.get(
    `/api/historico/meu?limite=${limite}&offset=${offset}`,
    { headers }
  );
};

// Histórico do grupo (admin/moderador only)
const obterHistoricoGrupo = async (grupoId, limite = 50, offset = 0) => {
  const response = await axios.get(
    `/api/grupos/${grupoId}/historico?limite=${limite}&offset=${offset}`,
    { headers }
  );
};

// Top usuários do grupo
const obterTopUsuarios = async (grupoId, limite = 10) => {
  const response = await axios.get(
    `/api/grupos/${grupoId}/historico/top-usuarios?limite=${limite}`,
    { headers }
  );
};
```

---

## 🔧 **CONFIGURAÇÕES AVANÇADAS**

### **Gerenciar Membros do Grupo**:

```javascript
// Adicionar membro ao grupo
const adicionarMembroGrupo = async (grupoId, usuarioId, papel = 'membro') => {
  const response = await axios.post(`/api/grupos/${grupoId}/membros`, {
    usuario_id: usuarioId,
    papel // 'admin', 'moderador', 'membro'
  }, { headers });
};

// Remover membro do grupo
const removerMembroGrupo = async (grupoId, usuarioId) => {
  const response = await axios.delete(
    `/api/grupos/${grupoId}/membros/${usuarioId}`,
    { headers }
  );
};

// Alterar papel do membro
const alterarPapelMembro = async (grupoId, usuarioId, novoPapel) => {
  const response = await axios.put(
    `/api/grupos/${grupoId}/membros/${usuarioId}/papel`,
    { papel: novoPapel },
    { headers }
  );
};
```

### **Atualizar Dados do Grupo**:

```javascript
// Atualizar informações básicas
const atualizarGrupo = async (grupoId, dadosGrupo) => {
  const response = await axios.put(`/api/grupos/${grupoId}`, {
    nome: dadosGrupo.nome,
    descricao: dadosGrupo.descricao,
    tipo_grupo: dadosGrupo.tipo
  }, { headers });
};

// Deletar grupo (apenas criador)
const deletarGrupo = async (grupoId) => {
  const response = await axios.delete(`/api/grupos/${grupoId}`, { headers });
};
```

---

## 🎯 **OTIMIZAÇÕES E PERFORMANCE**

### **Interceptors do Axios**:

```javascript
// Setup dos interceptors
const setupAxiosInterceptors = (navigate) => {
  // Request interceptor - adicionar token automaticamente
  axios.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - tratar erros globalmente
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expirado, tentar renovar
        try {
          const refreshToken = getRefreshToken();
          if (refreshToken) {
            const response = await axios.post('/api/auth/refresh', {
              refresh_token: refreshToken
            });
            
            setAuthToken(response.data.dados.token);
            
            // Repetir requisição original
            return axios.request(error.config);
          }
        } catch (refreshError) {
          // Refresh falhou, fazer logout
          clearAuthTokens();
          navigate('/login');
        }
      }
      
      // Mostrar erro para o usuário
      if (error.response?.data?.mensagem) {
        showErrorToast(error.response.data.mensagem);
      }
      
      return Promise.reject(error);
    }
  );
};
```

### **Cache Estratégico**:

```javascript
// Cache para dados que mudam pouco
const cacheService = {
  // Cache dos grupos do usuário
  grupos: null,
  gruposTimestamp: null,
  
  // Cache de membros por grupo
  membrosGrupo: new Map(),
  
  // Obter grupos com cache
  async obterGrupos(forceRefresh = false) {
    const agora = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
    
    if (!forceRefresh && 
        this.grupos && 
        this.gruposTimestamp && 
        (agora - this.gruposTimestamp) < CACHE_DURATION) {
      return this.grupos;
    }
    
    const response = await axios.get('/api/grupos', { headers });
    this.grupos = response.data.dados;
    this.gruposTimestamp = agora;
    
    return this.grupos;
  },
  
  // Invalidar cache quando necessário
  invalidarCache() {
    this.grupos = null;
    this.gruposTimestamp = null;
    this.membrosGrupo.clear();
  }
};
```

### **Paginação Eficiente**:

```javascript
// Hook customizado para paginação infinita
const useInfinitePagination = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await fetchFunction({ page, limite: 20 });
      const newItems = response.data.dados;
      
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setData(prev => [...prev, ...newItems]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Erro ao carregar mais dados:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, fetchFunction]);
  
  // Reset quando dependências mudarem
  useEffect(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    loadMore();
  }, dependencies);
  
  return { data, loading, hasMore, loadMore };
};

// Uso do hook
const MensagensScreen = ({ grupoId }) => {
  const {
    data: mensagens,
    loading,
    hasMore,
    loadMore
  } = useInfinitePagination(
    ({ page, limite }) => listarMensagensGrupo(grupoId, limite, (page - 1) * limite),
    [grupoId]
  );
  
  return (
    <FlatList
      data={mensagens}
      onEndReached={loadMore}
      onEndReachedThreshold={0.1}
      ListFooterComponent={loading ? <LoadingSpinner /> : null}
    />
  );
};
```

---

## 🔒 **SEGURANÇA E VALIDAÇÕES**

### **Validação de Formulários**:

```javascript
// Schemas de validação usando Yup
import * as Yup from 'yup';

const criarGrupoSchema = Yup.object({
  nome: Yup.string()
    .required('Nome é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  descricao: Yup.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
  tipo_grupo: Yup.string()
    .required('Tipo do grupo é obrigatório')
    .oneOf(['publico', 'privado', 'secreto'], 'Tipo inválido'),
  codigo_acesso: Yup.string()
    .min(6, 'Código deve ter pelo menos 6 caracteres')
    .max(20, 'Código deve ter no máximo 20 caracteres')
});

const criarTarefaSchema = Yup.object({
  titulo: Yup.string()
    .required('Título é obrigatório')
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(100, 'Título deve ter no máximo 100 caracteres'),
  descricao: Yup.string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres'),
  data_vencimento: Yup.date()
    .min(new Date(), 'Data de vencimento deve ser futura'),
  prioridade: Yup.string()
    .required('Prioridade é obrigatória')
    .oneOf(['baixa', 'media', 'alta'], 'Prioridade inválida')
});
```

### **Sanitização de Dados**:

```javascript
// Utilitários para sanitização
const sanitizeUtils = {
  // Remove HTML/scripts de texto
  sanitizeText: (text) => {
    if (!text) return '';
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  },
  
  // Validar URLs
  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  // Validar tipos de arquivo
  isAllowedFileType: (file) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv'
    ];
    return allowedTypes.includes(file.type);
  },
  
  // Validar tamanho de arquivo
  isValidFileSize: (file, maxSizeMB = 50) => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxBytes;
  }
};
```

---

## 📱 **RESPONSIVIDADE E ACESSIBILIDADE**

### **Breakpoints Responsivos**:

```css
/* Mobile First */
.container {
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
    max-width: 1024px;
    margin: 0 auto;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
  }
}

/* Large Desktop */
@media (min-width: 1440px) {
  .container {
    max-width: 1400px;
  }
}
```

### **Acessibilidade**:

```javascript
// Componentes acessíveis
const AccessibleButton = ({ children, onPress, disabled, ...props }) => (
  <TouchableOpacity
    {...props}
    onPress={onPress}
    disabled={disabled}
    accessible={true}
    accessibilityRole="button"
    accessibilityLabel={props.accessibilityLabel || children}
    accessibilityState={{ disabled }}
  >
    {children}
  </TouchableOpacity>
);

const AccessibleInput = ({ label, value, onChangeText, ...props }) => (
  <View>
    <Text accessibilityRole="text" style={styles.label}>
      {label}
    </Text>
    <TextInput
      {...props}
      value={value}
      onChangeText={onChangeText}
      accessible={true}
      accessibilityLabel={label}
      accessibilityHint={props.accessibilityHint}
    />
  </View>
);
```

---

### **1. FLUXO DE AUTENTICAÇÃO**

#### **1.1 TelaBoasVindas (Splash Screen)**
- **Descrição**: Tela inicial com logo e loading
- **Navegação**: Automaticamente para Login ou Home se já autenticado
- **Tempo**: 2-3 segundos
- **Verificação**: `GET /api/auth/validate`

#### **1.2 TelaLogin**
- **Campos**:
  - Email (input text)
  - Senha (input password)
  - "Lembrar de mim" (checkbox)
- **Botões**:
  - Login tradicional
  - Login com Google
  - Login com Microsoft
  - "Esqueci minha senha"
  - "Criar conta"

**APIs Utilizadas**:

```javascript
// Login Tradicional
const loginTradicional = async (email, senha) => {
  const response = await axios.post('/api/usuarios/login', {
    email,
    senha
  });
  // Response: { sucesso: boolean, dados: { token, usuario }, mensagem }
};

// Login Google OAuth
const loginGoogle = async (googleToken) => {
  const response = await axios.post('/api/auth/google', {
    token: googleToken
  });
};

// Login Microsoft OAuth
const loginMicrosoft = async (microsoftToken) => {
  const response = await axios.post('/api/auth/microsoft', {
    token: microsoftToken
  });
};
```

#### **1.3 TelaCadastro**
- **Campos**:
  - Nome completo (required)
  - Email (required)
  - Telefone (optional)
  - Senha (required, min 8 chars)
  - Confirmar senha (required)
- **Validações**: Frontend + backend

**API**:
```javascript
const criarUsuario = async (dados) => {
  const response = await axios.post('/api/usuarios', {
    nome: dados.nome,
    email: dados.email,
    telefone: dados.telefone, // opcional
    senha: dados.senha
  });
};
```

#### **1.4 TelaRecuperarSenha**
- **Campo**: Email
- **Fluxo**: Envio de email → Tela de redefinição

**APIs**:
```javascript
const recuperarSenha = async (email) => {
  const response = await axios.post('/api/usuarios/recuperar-senha', {
    email
  });
};

const redefinirSenha = async (token, novaSenha) => {
  const response = await axios.post('/api/usuarios/redefinir-senha', {
    token,
    nova_senha: novaSenha
  });
};
```

---

### **2. FLUXO PRINCIPAL**

#### **2.1 TelaHome (Dashboard)**
- **Componentes**:
  - Header com avatar e notificações
  - Lista de grupos recentes
  - Atalhos rápidos
  - Estatísticas pessoais

**APIs**:
```javascript
// Dados do usuário logado
const obterPerfilUsuario = async () => {
  const response = await axios.get('/api/usuarios/perfil', { headers });
};

// Grupos do usuário
const obterMeusGrupos = async () => {
  const response = await axios.get('/api/grupos', { headers });
};

// Notificações não lidas
const contarNotificacoesNaoLidas = async () => {
  const response = await axios.get('/api/notificacoes/nao-lidas', { headers });
};

// Estatísticas do usuário
const obterEstatisticasUsuario = async () => {
  const response = await axios.get('/api/historico/estatisticas', { headers });
};
```

#### **2.2 TelaListaGrupos**
- **Funcionalidades**:
  - Lista todos os grupos do usuário
  - Filtrar por tipo (público/privado)
  - Buscar grupos públicos
  - Botão "Criar Grupo"
  - Botão "Entrar com Código"

**APIs**:
```javascript
// Listar meus grupos
const listarMeusGrupos = async (pagina = 1, limite = 20) => {
  const response = await axios.get(`/api/grupos?pagina=${pagina}&limite=${limite}`, { headers });
};

// Buscar grupos públicos
const buscarGruposPublicos = async (termo = '', limite = 20) => {
  const response = await axios.get(`/api/grupos/publicos/buscar?termo=${termo}&limite=${limite}`);
};
```

#### **2.3 TelaCriarGrupo**
- **Campos**:
  - Nome do grupo (required)
  - Descrição (optional)
  - Tipo: público/privado/secreto (required)
  - Foto de capa (upload opcional)
  - Código de acesso (auto-gerado, editável)

**API**:
```javascript
const criarGrupo = async (dadosGrupo) => {
  const response = await axios.post('/api/grupos', {
    nome: dadosGrupo.nome,
    descricao: dadosGrupo.descricao,
    tipo_grupo: dadosGrupo.tipo, // 'publico', 'privado', 'secreto'
    codigo_acesso: dadosGrupo.codigo // opcional, será gerado se não fornecido
  }, { headers });
};
```

#### **2.4 TelaDetalhesGrupo**
- **Informações exibidas**:
  - Info básica do grupo
  - Estatísticas (membros, mensagens, arquivos)
  - Lista de membros (com níveis)
  - Botões de ação baseados em permissão

**APIs**:
```javascript
// Detalhes do grupo
const obterDetalhesGrupo = async (grupoId) => {
  const response = await axios.get(`/api/grupos/${grupoId}`, { headers });
};

// Estatísticas do grupo
const obterEstatisticasGrupo = async (grupoId) => {
  const response = await axios.get(`/api/grupos/${grupoId}/estatisticas`, { headers });
};

// Lista de membros
const listarMembrosGrupo = async (grupoId) => {
  const response = await axios.get(`/api/grupos/${grupoId}/membros`, { headers });
};
```

---

### **3. FLUXO DE COMUNICAÇÃO**

#### **3.1 TelaChat**
- **Funcionalidades**:
  - Lista de mensagens em tempo real
  - Envio de mensagens texto
  - Upload de arquivos/imagens
  - Reações às mensagens
  - Responder mensagens (thread)
  - Buscar mensagens
  - Marcar como lida

**APIs Principais**:
```javascript
// Listar mensagens do grupo
const listarMensagensGrupo = async (grupoId, limite = 50, offset = 0) => {
  const response = await axios.get(
    `/api/grupos/${grupoId}/mensagens?limite=${limite}&offset=${offset}`, 
    { headers }
  );
};

// Enviar mensagem texto
const enviarMensagem = async (grupoId, dados) => {
  const response = await axios.post(`/api/grupos/${grupoId}/mensagens`, {
    conteudo: dados.conteudo,
    tipo: dados.tipo || 'texto',
    parent_message_id: dados.parentId, // para respostas
    mencionados: dados.mencionados // array de user IDs
  }, { headers });
};

// Adicionar reação
const adicionarReacao = async (mensagemId, emoji) => {
  const response = await axios.post(`/api/mensagens/${mensagemId}/reacoes`, {
    emoji
  }, { headers });
};

// Remover reação
const removerReacao = async (mensagemId, emoji) => {
  const response = await axios.delete(`/api/mensagens/${mensagemId}/reacoes/${emoji}`, { headers });
};

// Buscar mensagens
const buscarMensagens = async (grupoId, termo) => {
  const response = await axios.get(
    `/api/grupos/${grupoId}/mensagens/buscar?termo=${encodeURIComponent(termo)}`, 
    { headers }
  );
};

// Marcar mensagem como lida
const marcarMensagemLida = async (mensagemId) => {
  const response = await axios.put(`/api/mensagens/${mensagemId}/marcar-lida`, {}, { headers });
};

// Marcar todas como lidas
const marcarTodasLidas = async (grupoId) => {
  const response = await axios.put(`/api/grupos/${grupoId}/mensagens/marcar-todas-lidas`, {}, { headers });
};
```

**WebSocket para Tempo Real**:
```javascript
// Conectar ao WebSocket (Socket.IO)
const socket = io('http://localhost:3000', {
  auth: { token }
});

// Entrar no grupo
socket.emit('join-group', grupoId);

// Escutar novas mensagens
socket.on('new-message', (mensagem) => {
  // Adicionar mensagem à lista
});

// Enviar notificação de digitação
socket.emit('user-typing', { grupoId, typing: true });
```

---

### **4. FLUXO DE ARQUIVOS**

#### **4.1 TelaGerenciarArquivos**
- **Funcionalidades**:
  - Lista de arquivos do grupo
  - Criar pastas
  - Upload múltiplo
  - Download
  - Visualização inline (imagens/PDFs)
  - Buscar arquivos
  - Versioning

**APIs**:
```javascript
// Listar arquivos do grupo
const listarArquivosGrupo = async (grupoId, pastaId = null) => {
  const url = pastaId 
    ? `/api/grupos/${grupoId}/arquivos?pasta=${pastaId}`
    : `/api/grupos/${grupoId}/arquivos`;
  const response = await axios.get(url, { headers });
};

// Upload de arquivo
const uploadArquivo = async (grupoId, file, pastaId = null) => {
  const formData = new FormData();
  formData.append('arquivo', file);
  if (pastaId) formData.append('pasta_id', pastaId);
  
  const response = await axios.post(
    `/api/grupos/${grupoId}/arquivos/upload`,
    formData,
    { 
      headers: { 'Authorization': `Bearer ${token}` },
      onUploadProgress: (progressEvent) => {
        const progress = (progressEvent.loaded / progressEvent.total) * 100;
        // Atualizar progress bar
      }
    }
  );
};

// Criar pasta
const criarPasta = async (grupoId, nomePasta, pastaId = null) => {
  const response = await axios.post(`/api/grupos/${grupoId}/arquivos/pasta`, {
    nome: nomePasta,
    pasta_pai_id: pastaId
  }, { headers });
};

// Obter URL de download
const obterUrlDownload = async (arquivoId) => {
  const response = await axios.get(`/api/arquivos/${arquivoId}/download`, { headers });
  // Response contém URL assinada temporária
  return response.data.dados.url_download;
};

// Visualizar arquivo
const visualizarArquivo = async (arquivoId) => {
  const response = await axios.get(`/api/arquivos/${arquivoId}/visualizar`, { headers });
  return response.data.dados.url_visualizacao;
};

// Buscar arquivos
const buscarArquivos = async (grupoId, termo, tipo = null) => {
  const params = new URLSearchParams({ termo });
  if (tipo) params.append('tipo', tipo);
  
  const response = await axios.get(
    `/api/grupos/${grupoId}/arquivos/buscar?${params}`, 
    { headers }
  );
};

// Deletar arquivo
const deletarArquivo = async (arquivoId) => {
  const response = await axios.delete(`/api/arquivos/${arquivoId}`, { headers });
};
```

#### **4.2 TelaUploadArquivo**
- **Funcionalidades**:
  - Drag & drop
  - Seleção múltipla
  - Progress bars individuais
  - Preview de imagens
  - Validação de tipos/tamanhos

---

### **5. FLUXO DE TAREFAS**

#### **5.1 TelaListaTarefas**
- **Funcionalidades**:
  - Lista com filtros (status, prioridade, atribuído)
  - Kanban board
  - Estatísticas
  - Criar nova tarefa

**APIs**:
```javascript
// Listar tarefas do grupo
const listarTarefasGrupo = async (grupoId, filtros = {}) => {
  const params = new URLSearchParams(filtros);
  const response = await axios.get(
    `/api/grupos/${grupoId}/tarefas?${params}`, 
    { headers }
  );
};

// Minhas tarefas
const minhasTarefas = async (grupoId) => {
  const response = await axios.get(`/api/tarefas/${grupoId}/minhas`, { headers });
};

// Estatísticas de tarefas
const obterEstatisticasTarefas = async (grupoId) => {
  const response = await axios.get(`/api/grupos/${grupoId}/tarefas/estatisticas`, { headers });
};
```

#### **5.2 TelaCriarTarefa**
- **Campos**:
  - Título (required)
  - Descrição (rich text)
  - Data de vencimento
  - Prioridade (baixa/média/alta)
  - Atribuir usuários
  - Tags/Labels

**API**:
```javascript
const criarTarefa = async (grupoId, dadosTarefa) => {
  const response = await axios.post(`/api/grupos/${grupoId}/tarefas`, {
    titulo: dadosTarefa.titulo,
    descricao: dadosTarefa.descricao,
    data_vencimento: dadosTarefa.dataVencimento, // ISO string
    prioridade: dadosTarefa.prioridade, // 'baixa', 'media', 'alta'
    usuarios_atribuidos: dadosTarefa.usuariosAtribuidos // array de IDs
  }, { headers });
};
```

#### **5.3 TelaDetalheTarefa**
- **Informações**:
  - Detalhes completos
  - Comentários
  - Histórico de alterações
  - Controle de horas
  - Anexos

**APIs**:
```javascript
// Obter tarefa
const obterTarefa = async (tarefaId) => {
  const response = await axios.get(`/api/tarefas/${tarefaId}`, { headers });
};

// Atualizar status
const concluirTarefa = async (tarefaId) => {
  const response = await axios.put(`/api/tarefas/${tarefaId}/concluir`, {}, { headers });
};

const iniciarTarefa = async (tarefaId) => {
  const response = await axios.put(`/api/tarefas/${tarefaId}/iniciar`, {}, { headers });
};

// Adicionar comentário
const adicionarComentario = async (tarefaId, comentario) => {
  const response = await axios.post(`/api/tarefas/${tarefaId}/comentarios`, {
    conteudo: comentario
  }, { headers });
};

// Listar comentários
const listarComentarios = async (tarefaId) => {
  const response = await axios.get(`/api/tarefas/${tarefaId}/comentarios`, { headers });
};

// Adicionar horas trabalhadas
const adicionarHoras = async (tarefaId, horas, descricao) => {
  const response = await axios.post(`/api/tarefas/${tarefaId}/horas`, {
    horas,
    descricao
  }, { headers });
};

// Histórico da tarefa
const obterHistoricoTarefa = async (tarefaId) => {
  const response = await axios.get(`/api/tarefas/${tarefaId}/historico`, { headers });
};
```

---

### **6. FLUXO DE CALENDÁRIO**

#### **6.1 TelaCalendario**
- **Views**: Mensal, semanal, diária
- **Funcionalidades**:
  - Visualizar eventos
  - Criar evento (click em data)
  - Filtrar por tipo

**APIs**:
```javascript
// Listar eventos do grupo
const listarEventosGrupo = async (grupoId, dataInicio, dataFim) => {
  const response = await axios.get(
    `/api/grupos/${grupoId}/eventos?data_inicio=${dataInicio}&data_fim=${dataFim}`, 
    { headers }
  );
};

// Meus eventos (todos os grupos)
const meusEventos = async (dataInicio, dataFim) => {
  const response = await axios.get(
    `/api/eventos/meus?data_inicio=${dataInicio}&data_fim=${dataFim}`, 
    { headers }
  );
};
```

#### **6.2 TelaCriarEvento**
- **Campos**:
  - Título (required)
  - Descrição
  - Data/hora início (required)
  - Data/hora fim (required)
  - Local físico
  - Link virtual
  - Tipo (reunião/estudo/prova/apresentação)

**API**:
```javascript
const criarEvento = async (grupoId, dadosEvento) => {
  const response = await axios.post(`/api/grupos/${grupoId}/eventos`, {
    titulo: dadosEvento.titulo,
    descricao: dadosEvento.descricao,
    data_inicio: dadosEvento.dataInicio, // ISO string
    data_fim: dadosEvento.dataFim,
    local: dadosEvento.local,
    link_virtual: dadosEvento.linkVirtual,
    tipo: dadosEvento.tipo // 'reuniao', 'estudo', 'prova', 'apresentacao', 'outro'
  }, { headers });
};
```

#### **6.3 TelaDetalheEvento**
- **Informações**:
  - Detalhes do evento
  - Lista de participantes
  - Ações (participar, sair, editar)

**APIs**:
```javascript
// Obter evento
const obterEvento = async (eventoId) => {
  const response = await axios.get(`/api/eventos/${eventoId}`, { headers });
};

// Adicionar participante
const adicionarParticipante = async (eventoId, usuarioId) => {
  const response = await axios.post(`/api/eventos/${eventoId}/participantes`, {
    usuario_id: usuarioId
  }, { headers });
};

// Atualizar evento
const atualizarEvento = async (eventoId, dadosEvento) => {
  const response = await axios.put(`/api/eventos/${eventoId}`, dadosEvento, { headers });
};
```

---

### **7. FLUXO DE CONVITES**

#### **7.1 TelaConvitarMembros**
- **Campos**:
  - Email do convidado
  - Mensagem personalizada
- **Opção**: Gerar link de convite

**APIs**:
```javascript
// Criar convite
const criarConvite = async (grupoId, emailConvidado, mensagem = null) => {
  const response = await axios.post('/api/convites', {
    grupo_id: grupoId,
    email_convidado: emailConvidado,
    mensagem_personalizada: mensagem
  }, { headers });
};

// Listar convites do grupo (admin/moderador only)
const listarConvitesGrupo = async (grupoId) => {
  const response = await axios.get(`/api/grupos/${grupoId}/convites`, { headers });
};
```

#### **7.2 TelaConvitesPendentes**
- **Funcionalidades**:
  - Lista de convites recebidos
  - Aceitar/recusar
  - Ver detalhes do grupo

**APIs**:
```javascript
// Validar convite (ver detalhes)
const validarConvite = async (codigo) => {
  const response = await axios.get(`/api/convites/validar/${codigo}`, { headers });
};

// Aceitar convite
const aceitarConvite = async (codigo) => {
  const response = await axios.post(`/api/convites/aceitar/${codigo}`, {}, { headers });
};

// Recusar convite
const recusarConvite = async (codigo) => {
  const response = await axios.post(`/api/convites/recusar/${codigo}`, {}, { headers });
};
```

---

### **8. FLUXO DE PERFIL**

#### **8.1 TelaPerfil**
- **Informações exibidas**:
  - Foto de perfil
  - Dados pessoais
  - Estatísticas de atividade
  - Grupos participantes

**APIs**:
```javascript
// Obter perfil
const obterPerfil = async () => {
  const response = await axios.get('/api/usuarios/perfil', { headers });
};
```

#### **8.2 TelaEditarPerfil**
- **Campos editáveis**:
  - Nome
  - Telefone
  - Foto de perfil

**APIs**:
```javascript
// Atualizar perfil
const atualizarPerfil = async (dadosPerfil) => {
  const response = await axios.put('/api/usuarios/perfil', {
    nome: dadosPerfil.nome,
    telefone: dadosPerfil.telefone
  }, { headers });
};

// Upload foto de perfil
const uploadFotoPerfil = async (file) => {
  const formData = new FormData();
  formData.append('foto', file);
  
  const response = await axios.post('/api/usuarios/foto-perfil', formData, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

#### **8.3 TelaConfiguracoes**
- **Seções**:
  - Notificações
  - Privacidade
  - Conta
  - Sobre

**APIs**:
```javascript
// Configurações de notificação
const obterConfiguracaoNotificacoes = async () => {
  const response = await axios.get('/api/notificacoes/configuracoes', { headers });
};

const atualizarConfiguracaoNotificacoes = async (configuracoes) => {
  const response = await axios.put('/api/notificacoes/configuracoes', configuracoes, { headers });
};

// Desativar conta
const desativarConta = async () => {
  const response = await axios.delete('/api/usuarios/perfil', { headers });
};
```

---

### **9. COMPONENTES GLOBAIS**

#### **9.1 ComponenteNotificacoes**
**APIs**:
```javascript
// Listar notificações
const listarNotificacoes = async (limite = 20, offset = 0) => {
  const response = await axios.get(
    `/api/notificacoes?limite=${limite}&offset=${offset}`, 
    { headers }
  );
};

// Marcar como lida
const marcarNotificacaoLida = async (notificacaoId) => {
  const response = await axios.patch(`/api/notificacoes/${notificacaoId}/marcar-lida`, {}, { headers });
};

// Marcar todas como lidas
const marcarTodasNotificacoesLidas = async () => {
  const response = await axios.patch('/api/notificacoes/marcar-todas-lidas', {}, { headers });
};

// Remover notificação
const removerNotificacao = async (notificacaoId) => {
  const response = await axios.delete(`/api/notificacoes/${notificacaoId}`, { headers });
};
```

#### **9.2 ComponenteMenu (Navigation)**
- **Itens baseados em contexto**:
  - Home
  - Grupos
  - Mensagens
  - Tarefas
  - Calendário
  - Arquivos
  - Perfil
  - Configurações
  - Logout

#### **9.3 ComponenteLoadingGlobal**
- **Estados**:
  - Loading inicial
  - Loading de API
  - Progress bars para uploads

---

## 📊 **TIPOS DE DADOS IMPORTANTES**

### **Estruturas de Response Padrão**:
```typescript
interface ApiResponse<T> {
  sucesso: boolean;
  mensagem: string;
  dados?: T;
  erro?: string;
  erros?: string[];
  timestamp: string;
}

interface PaginationResponse<T> {
  dados: T[];
  pagina_atual: number;
  total_paginas: number;
  total_itens: number;
  itens_por_pagina: number;
}
```

### **Enums Importantes**:
```typescript
// Tipos de grupo
TipoGrupo: 'publico' | 'privado' | 'secreto'

// Níveis de permissão
NivelPermissao: 'admin' | 'moderador' | 'membro' | 'visitante'

// Status de tarefa
StatusTarefa: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'

// Prioridade de tarefa
PrioridadeTarefa: 'baixa' | 'media' | 'alta'

// Tipos de evento
TipoEvento: 'reuniao' | 'estudo' | 'prova' | 'apresentacao' | 'outro'

// Tipos de mensagem
TipoMensagem: 'texto' | 'arquivo' | 'imagem' | 'sistema'

// Status de convite
StatusConvite: 'pendente' | 'aceito' | 'recusado' | 'expirado'

// Tipos de notificação
TipoNotificacao: 'mensagem' | 'convite' | 'tarefa' | 'evento' | 'sistema'
```

---

## 🔄 **FLUXOS DE NAVEGAÇÃO**

### **Fluxo de Primeiro Uso**:
1. TelaBoasVindas → TelaLogin → TelaCadastro → TelaHome
2. Criar primeiro grupo ou entrar em grupo existente

### **Fluxo Principal Diário**:
1. TelaHome → TelaListaGrupos → TelaDetalhesGrupo → TelaChat
2. Navegação lateral sempre disponível

### **Fluxo de Colaboração**:
1. TelaChat → TelaGerenciarArquivos → Upload
2. TelaTarefas → TelaCriarTarefa → TelaDetalheTarefa
3. TelaCalendario → TelaCriarEvento

---

## 🎨 **CONSIDERAÇÕES DE UX/UI**

### **Responsividade**:
- Mobile-first design
- Breakpoints: 320px, 768px, 1024px, 1440px

### **Estados de Loading**:
- Skeleton screens para listas
- Progress bars para uploads
- Spinners para ações rápidas

### **Tratamento de Erros**:
- Toast notifications para feedback
- Error boundaries para crashes
- Retry automático para falhas de rede

### **Offline First**:
- Cache das mensagens recentes
- Queue de ações offline
- Sync quando voltar online

---

## 🚀 **PRÓXIMOS PASSOS RECOMENDADOS**

1. **Setup do Projeto**:
   - React Native + expo (npx create-expo-app@latest FatecTeamsFrontEnd)
   - Configurar Axios interceptors
   - Setup de state management (Redux/Context)

2. **Implementação por Prioridade**:
   - Sistema de autenticação
   - Navegação principal
   - Chat básico
   - Gestão de arquivos
   - Tarefas e calendário

3. **Integrações**:
   - Socket.IO para tempo real
   - Push notifications
   - OAuth providers

4. **Testes**:
   - Testes unitários para API calls
   - Testes de integração para fluxos
   - Testes E2E para user stories

---

## 📞 **SUPORTE TÉCNICO**

O backend está 100% funcional e testado. Todas as APIs documentadas neste guia estão implementadas e funcionando. Em caso de dúvidas sobre endpoints específicos, consultar:

- Logs do servidor: Console do backend
- Documentação Swagger: `http://localhost:3000/api` (se habilitado)
- Código fonte: `src/controllers/` para exemplos de uso

## 🧪 **TESTES E QUALIDADE**

### **Estrutura de Testes**:

```javascript
// __tests__/api/authApi.test.js
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { loginTradicional, criarUsuario } from '../../src/api/authApi';

describe('Auth API', () => {
  let mock;
  
  beforeEach(() => {
    mock = new MockAdapter(axios);
  });
  
  afterEach(() => {
    mock.restore();
  });
  
  test('login com credenciais válidas', async () => {
    const mockResponse = {
      sucesso: true,
      dados: {
        token: 'mock-token',
        usuario: { id: '1', nome: 'Teste', email: 'test@test.com' }
      }
    };
    
    mock.onPost('/api/usuarios/login').reply(200, mockResponse);
    
    const result = await loginTradicional('test@test.com', '123456');
    expect(result.data.sucesso).toBe(true);
    expect(result.data.dados.token).toBe('mock-token');
  });
  
  test('login com credenciais inválidas', async () => {
    mock.onPost('/api/usuarios/login').reply(401, {
      sucesso: false,
      mensagem: 'Credenciais inválidas'
    });
    
    await expect(loginTradicional('wrong@email.com', 'wrong')).rejects.toThrow();
  });
});
```

### **Testes de Componentes**:

```javascript
// __tests__/components/ChatMessage.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ChatMessage from '../../src/components/ChatMessage';

describe('ChatMessage', () => {
  const mockMessage = {
    id: '1',
    conteudo: 'Mensagem de teste',
    remetente: { nome: 'Usuário Teste' },
    data_envio: new Date().toISOString()
  };
  
  test('renderiza mensagem corretamente', () => {
    const { getByText } = render(
      <ChatMessage message={mockMessage} currentUserId="2" />
    );
    
    expect(getByText('Mensagem de teste')).toBeTruthy();
    expect(getByText('Usuário Teste')).toBeTruthy();
  });
  
  test('mostra opções ao pressionar longamente', () => {
    const onReaction = jest.fn();
    const { getByText } = render(
      <ChatMessage 
        message={mockMessage} 
        currentUserId="2"
        onReaction={onReaction}
      />
    );
    
    fireEvent(getByText('Mensagem de teste'), 'longPress');
    // Verificar se menu de opções apareceu
  });
});
```

### **Testes E2E com Detox**:

```javascript
// e2e/loginFlow.e2e.js
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  beforeEach(async () => {
    await device.reloadReactNative();
  });
  
  it('deve fazer login com credenciais válidas', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('123456');
    await element(by.id('login-button')).tap();
    
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
  
  it('deve mostrar erro com credenciais inválidas', async () => {
    await element(by.id('email-input')).typeText('wrong@email.com');
    await element(by.id('password-input')).typeText('wrong');
    await element(by.id('login-button')).tap();
    
    await waitFor(element(by.text('Credenciais inválidas')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
```

---

## 🏗️ **ESTRUTURA RECOMENDADA DO PROJETO**

```
FatecTeamsFrontEnd/
├── src/
│   ├── api/                    # Serviços de API
│   │   ├── authApi.js
│   │   ├── grupoApi.js
│   │   ├── mensagemApi.js
│   │   ├── tarefaApi.js
│   │   ├── arquivoApi.js
│   │   └── index.js
│   ├── components/             # Componentes reutilizáveis
│   │   ├── common/             # Componentes básicos
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   └── LoadingSpinner/
│   │   ├── chat/               # Componentes específicos do chat
│   │   │   ├── ChatMessage/
│   │   │   ├── ChatInput/
│   │   │   ├── ReactionPicker/
│   │   │   └── TypingIndicator/
│   │   ├── grupo/              # Componentes de grupo
│   │   │   ├── GrupoCard/
│   │   │   ├── MembrosList/
│   │   │   └── GrupoStats/
│   │   └── tarefa/             # Componentes de tarefa
│   │       ├── TarefaCard/
│   │       ├── KanbanBoard/
│   │       └── TarefaForm/
│   ├── screens/                # Telas da aplicação
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   ├── CadastroScreen.js
│   │   │   └── RecuperarSenhaScreen.js
│   │   ├── main/
│   │   │   ├── HomeScreen.js
│   │   │   ├── GruposScreen.js
│   │   │   └── PerfilScreen.js
│   │   ├── chat/
│   │   │   ├── ChatScreen.js
│   │   │   └── ChatListScreen.js
│   │   ├── grupo/
│   │   │   ├── CriarGrupoScreen.js
│   │   │   ├── DetalhesGrupoScreen.js
│   │   │   └── ConfiguracoesGrupoScreen.js
│   │   ├── tarefa/
│   │   │   ├── TarefasScreen.js
│   │   │   ├── CriarTarefaScreen.js
│   │   │   └── DetalhesTarefaScreen.js
│   │   ├── arquivo/
│   │   │   ├── ArquivosScreen.js
│   │   │   └── UploadScreen.js
│   │   ├── evento/
│   │   │   ├── CalendarioScreen.js
│   │   │   ├── CriarEventoScreen.js
│   │   │   └── DetalhesEventoScreen.js
│   │   └── convite/
│   │       ├── ConvitesScreen.js
│   │       └── ConvidarScreen.js
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useSocket.js
│   │   ├── useInfinitePagination.js
│   │   ├── useDebounce.js
│   │   └── usePermissions.js
│   ├── context/                # Context providers
│   │   ├── AuthContext.js
│   │   ├── SocketContext.js
│   │   └── NotificationContext.js
│   ├── utils/                  # Utilitários
│   │   ├── constants.js
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── storage.js
│   │   └── permissions.js
│   ├── styles/                 # Estilos globais
│   │   ├── colors.js
│   │   ├── typography.js
│   │   ├── dimensions.js
│   │   └── themes.js
│   └── navigation/             # Navegação
│       ├── AuthNavigator.js
│       ├── MainNavigator.js
│       └── RootNavigator.js
├── __tests__/                  # Testes
│   ├── api/
│   ├── components/
│   ├── screens/
│   └── utils/
├── e2e/                        # Testes E2E
├── android/                    # Configurações Android
├── ios/                        # Configurações iOS
└── package.json
```

---

## 📦 **DEPENDÊNCIAS RECOMENDADAS**

### **Core Dependencies**:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.72.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "axios": "^1.5.0",
    "socket.io-client": "^4.7.0",
    "react-native-async-storage": "^1.19.0",
    "react-native-keychain": "^8.1.0",
    "react-native-image-picker": "^5.6.0",
    "react-native-document-picker": "^9.1.0",
    "react-native-file-viewer": "^2.1.5",
    "react-native-calendars": "^1.1300.0",
    "react-native-vector-icons": "^10.0.0",
    "react-hook-form": "^7.45.0",
    "yup": "^1.3.0",
    "@hookform/resolvers": "^3.3.0"
  },
  "devDependencies": {
    "@testing-library/react-native": "^12.3.0",
    "@testing-library/jest-native": "^5.4.0",
    "jest": "^29.6.0",
    "detox": "^20.11.0",
    "eslint": "^8.47.0",
    "prettier": "^3.0.0"
  }
}
```

### **Configurações Essenciais**:

#### **Axios Setup** (`src/api/index.js`):
```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://api.fatecteams.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['authToken', 'refreshToken']);
      // Navigate to login
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### **Socket Setup** (`src/hooks/useSocket.js`):
```javascript
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSocket = () => {
  const socketRef = useRef(null);
  
  useEffect(() => {
    const initSocket = async () => {
      const token = await AsyncStorage.getItem('authToken');
      
      socketRef.current = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
        auth: { token }
      });
      
      socketRef.current.on('connect', () => {
        console.log('Conectado ao servidor');
      });
      
      socketRef.current.on('disconnect', () => {
        console.log('Desconectado do servidor');
      });
    };
    
    initSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  return socketRef.current;
};
```

---

## 🚀 **ROADMAP DE DESENVOLVIMENTO**

### **Fase 1 - Fundação (Semana 1-2)**:
1. ✅ Setup inicial do projeto React Native
2. ✅ Configurar navegação (Stack + Tabs)
3. ✅ Setup do Axios com interceptors
4. ✅ Implementar sistema de autenticação
5. ✅ Criar telas básicas de login/cadastro
6. ✅ Setup do AsyncStorage para persistência

### **Fase 2 - Core Features (Semana 3-4)**:
1. ✅ Implementar listagem e criação de grupos
2. ✅ Chat básico com mensagens de texto
3. ✅ Upload e download de arquivos
4. ✅ Sistema de notificações basic
5. ✅ Tela de perfil e configurações

### **Fase 3 - Advanced Features (Semana 5-6)**:
1. ✅ WebSocket para chat em tempo real
2. ✅ Sistema de tarefas (CRUD completo)
3. ✅ Calendário com eventos
4. ✅ Sistema de convites
5. ✅ Reações nas mensagens

### **Fase 4 - Polish & Performance (Semana 7-8)**:
1. ✅ Otimizações de performance
2. ✅ Cache estratégico
3. ✅ Offline support básico
4. ✅ Testes unitários e E2E
5. ✅ Melhorias de UX/UI

### **Fase 5 - Production Ready (Semana 9-10)**:
1. ✅ Analytics e relatórios
2. ✅ Error tracking (Crashlytics)
3. ✅ Push notifications
4. ✅ App store deployment
5. ✅ Documentação completa

---

## 📋 **CHECKLIST PRÉ-PRODUÇÃO**

### **Funcionalidades**:
- [ ] Sistema de autenticação completo
- [ ] Chat em tempo real funcionando
- [ ] Upload/download de arquivos
- [ ] Sistema de tarefas
- [ ] Calendário de eventos
- [ ] Sistema de convites
- [ ] Notificações push
- [ ] Relatórios básicos

### **Performance**:
- [ ] Tempo de carregamento < 3s
- [ ] Scroll suave nas listas
- [ ] Cache implementado
- [ ] Lazy loading de imagens
- [ ] Bundle size otimizado

### **Qualidade**:
- [ ] Testes unitários > 80% coverage
- [ ] Testes E2E dos fluxos principais
- [ ] Error handling completo
- [ ] Logs estruturados
- [ ] Performance monitoring

### **Segurança**:
- [ ] Tokens JWT seguros
- [ ] Dados sensíveis criptografados
- [ ] Validação no frontend e backend
- [ ] Rate limiting implementado
- [ ] SSL/TLS configurado

### **Acessibilidade**:
- [ ] Screen reader compatible
- [ ] Contraste adequado
- [ ] Touch targets > 44px
- [ ] Navegação por teclado
- [ ] Texto escalável

---

## 📞 **SUPORTE E RECURSOS**

### **Documentação Oficial**:
- **React Native**: https://reactnative.dev/
- **React Navigation**: https://reactnavigation.org/
- **Socket.IO**: https://socket.io/docs/v4/
- **Axios**: https://axios-http.com/docs/intro

### **Ferramentas de Debug**:
- **Flipper**: Para debug e network inspection
- **Reactotron**: Para state management debug
- **React DevTools**: Para component tree

### **Monitoramento**:
- **Firebase Crashlytics**: Para crash reporting
- **Firebase Analytics**: Para usage analytics
- **Sentry**: Para error tracking avançado

---

## ✅ **CONCLUSÃO**

Este guia fornece uma base sólida para o desenvolvimento do frontend do FatecTeams. O backend está 100% funcional e todas as APIs documentadas estão implementadas e testadas.

**Próximos Passos**:
1. Escolher a tecnologia (React Native/React)
2. Seguir o roadmap de desenvolvimento
3. Implementar as funcionalidades por prioridade
4. Testar continuamente com o backend

**Status do Backend**: ✅ **100% FUNCIONAL E PRONTO PARA INTEGRAÇÃO**

**Última Atualização**: 04/09/2025

---
