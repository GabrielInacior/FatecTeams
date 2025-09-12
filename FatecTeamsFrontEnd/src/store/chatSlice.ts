import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import mensagensService from '../services/mensagensService';

// ============================================
// INTERFACES
// ============================================

interface Mensagem {
  id: string;
  conteudo: string;
  tipo_mensagem: 'texto' | 'arquivo' | 'imagem';
  autor_id?: string;        // Para compatibilidade com frontend
  remetente_id?: string;    // Campo real do backend
  grupo_id: string;
  data_criacao?: string;    // Para compatibilidade com frontend
  data_envio?: string;      // Campo real do backend
  data_atualizacao?: string;
  data_edicao?: string;     // Campo real do backend
  arquivo_id?: string;
  mensagem_pai_id?: string;
  mencionados?: string[];
  editado: boolean;
  autor?: {
    id: string;
    nome: string;
    email: string;
    foto_perfil?: string;
  };
  // Campos adicionais do backend
  remetente_nome?: string;
  remetente_foto?: string;
}

interface Reacao {
  id: string;
  mensagem_id: string;
  usuario_id: string;
  tipo: string;
  data_criacao: string;
  usuario?: {
    id: string;
    nome: string;
    foto_perfil?: string;
  };
}

interface ChatState {
  mensagens: { [grupoId: string]: Mensagem[] };
  reacoes: { [mensagemId: string]: Reacao[] };
  mensagemAtiva: Mensagem | null;
  isLoading: boolean;
  error: string | null;
  searchResults: Mensagem[];
  isSearching: boolean;
  unreadCounts: { [grupoId: string]: number };
  mensagensRecentes: { [grupoId: string]: Mensagem[] };
  estatisticas: { [grupoId: string]: any };
  currentUserId: string | null; // Para evitar duplicação e marcar mensagens próprias
}

interface CreateMensagemData {
  conteudo: string;
  tipo_mensagem?: 'texto' | 'arquivo' | 'imagem';
  arquivo_id?: string;
  mensagem_pai_id?: string;
  mencionados?: string[];
}

interface MensagensQueryParams {
  limit?: number;
  offset?: number;
  data_inicio?: string;
  data_fim?: string;
}

interface BuscarMensagensParams {
  termo: string;
  tipo?: string;
  autor_id?: string;
}

// ============================================
// FUNÇÕES HELPER
// ============================================

// Função para obter ID do autor da mensagem
const getAuthorId = (mensagem: Mensagem): string => {
  return mensagem.autor_id || mensagem.remetente_id || '';
};

// Função para normalizar mensagem (mapear campos do backend para frontend)
const normalizeMensagem = (mensagem: any): Mensagem => {
  return {
    ...mensagem,
    autor_id: mensagem.autor_id || mensagem.remetente_id,
    data_criacao: mensagem.data_criacao || mensagem.data_envio,
    data_atualizacao: mensagem.data_atualizacao || mensagem.data_edicao,
    // Construir objeto autor se não existir
    autor: mensagem.autor || (mensagem.remetente_nome ? {
      id: mensagem.remetente_id || '',
      nome: mensagem.remetente_nome,
      email: '',
      foto_perfil: mensagem.remetente_foto
    } : undefined)
  };
};

// ============================================
// INITIAL STATE
// ============================================

const initialState: ChatState = {
  mensagens: {},
  reacoes: {},
  mensagemAtiva: null,
  isLoading: false,
  error: null,
  searchResults: [],
  isSearching: false,
  unreadCounts: {},
  mensagensRecentes: {},
  estatisticas: {},
  currentUserId: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Buscar mensagens do grupo
 */
export const fetchMensagens = createAsyncThunk(
  'chat/fetchMensagens',
  async (params: { grupoId: string; queryParams?: MensagensQueryParams }, { rejectWithValue }) => {
    try {
      const response = await mensagensService.getMensagensGrupo(params.grupoId, params.queryParams);
      return {
        grupoId: params.grupoId,
        mensagens: response.dados || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Criar nova mensagem
 */
export const createMensagem = createAsyncThunk(
  'chat/createMensagem',
  async (params: { grupoId: string; mensagemData: CreateMensagemData }, { rejectWithValue }) => {
    try {
      const response = await mensagensService.createMensagem(params.grupoId, {
        ...params.mensagemData,
        grupo_id: params.grupoId,
      });
      return {
        grupoId: params.grupoId,
        mensagem: response.dados,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Obter mensagem específica
 */
export const getMensagem = createAsyncThunk(
  'chat/getMensagem',
  async (mensagemId: string, { rejectWithValue }) => {
    try {
      const response = await mensagensService.getMensagem(mensagemId);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Editar mensagem
 */
export const editMensagem = createAsyncThunk(
  'chat/editMensagem',
  async (params: { mensagemId: string; conteudo: string }, { rejectWithValue }) => {
    try {
      const response = await mensagensService.updateMensagem(params.mensagemId, params.conteudo);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Deletar mensagem
 */
export const deleteMensagem = createAsyncThunk(
  'chat/deleteMensagem',
  async (mensagemId: string, { rejectWithValue }) => {
    try {
      await mensagensService.deleteMensagem(mensagemId);
      return mensagemId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar mensagens
 */
export const buscarMensagens = createAsyncThunk(
  'chat/buscarMensagens',
  async (params: { grupoId: string; searchParams: BuscarMensagensParams }, { rejectWithValue }) => {
    try {
      const response = await mensagensService.buscarMensagens(params.grupoId, params.searchParams);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Obter mensagens não lidas
 */
export const getMensagensNaoLidas = createAsyncThunk(
  'chat/getMensagensNaoLidas',
  async (grupoId: string, { rejectWithValue }) => {
    try {
      const response = await mensagensService.getMensagensNaoLidas(grupoId);
      const mensagens = response.dados || [];
      return {
        grupoId,
        mensagens,
        count: mensagens.length,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Marcar mensagem como lida
 */
export const marcarMensagemLida = createAsyncThunk(
  'chat/marcarMensagemLida',
  async (mensagemId: string, { rejectWithValue }) => {
    try {
      await mensagensService.marcarMensagemLida(mensagemId);
      return mensagemId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Marcar todas mensagens do grupo como lidas
 */
export const marcarTodasMensagensLidas = createAsyncThunk(
  'chat/marcarTodasMensagensLidas',
  async (grupoId: string, { rejectWithValue }) => {
    try {
      await mensagensService.marcarTodasMensagensLidas(grupoId);
      return grupoId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Adicionar reação
 */
export const addReacao = createAsyncThunk(
  'chat/addReacao',
  async (params: { mensagemId: string; tipo: string }, { rejectWithValue }) => {
    try {
      const response = await mensagensService.addReacao(params.mensagemId, params.tipo);
      return {
        mensagemId: params.mensagemId,
        reacao: response.dados,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Remover reação
 */
export const removeReacao = createAsyncThunk(
  'chat/removeReacao',
  async (params: { mensagemId: string; tipoReacao: string }, { rejectWithValue }) => {
    try {
      await mensagensService.removeReacao(params.mensagemId, params.tipoReacao);
      return {
        mensagemId: params.mensagemId,
        tipoReacao: params.tipoReacao,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Obter reações da mensagem
 */
export const getReacoes = createAsyncThunk(
  'chat/getReacoes',
  async (mensagemId: string, { rejectWithValue }) => {
    try {
      const response = await mensagensService.getReacoes(mensagemId);
      return {
        mensagemId,
        reacoes: response.dados || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Obter mensagens recentes
 */
export const getMensagensRecentes = createAsyncThunk(
  'chat/getMensagensRecentes',
  async (params: { grupoId: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await mensagensService.getMensagensRecentes(params.grupoId, params.limit);
      return {
        grupoId: params.grupoId,
        mensagens: response.dados || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Obter estatísticas do grupo
 */
export const getEstatisticasGrupo = createAsyncThunk(
  'chat/getEstatisticasGrupo',
  async (grupoId: string, { rejectWithValue }) => {
    try {
      const response = await mensagensService.getEstatisticasGrupo(grupoId);
      return {
        grupoId,
        estatisticas: response.dados,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Definir usuário atual
    setCurrentUserId: (state, action: PayloadAction<string | null>) => {
      state.currentUserId = action.payload;
    },
    
    // Receber mensagem em tempo real (WebSocket)
    receiveMessage: (state, action: PayloadAction<{ grupoId: string; mensagem: Mensagem }>) => {
      const { grupoId, mensagem } = action.payload;
      if (!state.mensagens[grupoId]) {
        state.mensagens[grupoId] = [];
      }
      
      const normalizedMensagem = normalizeMensagem(mensagem);
      
      // Verificar se a mensagem já existe para evitar duplicatas
      const mensagemExiste = state.mensagens[grupoId].some(m => m.id === normalizedMensagem.id);
      if (!mensagemExiste) {
        state.mensagens[grupoId].push(normalizedMensagem);
        
        // Incrementar contador de não lidas apenas se não for do usuário atual
        const isOwnMessage = getAuthorId(normalizedMensagem) === state.currentUserId;
        if (!isOwnMessage) {
          if (!state.unreadCounts[grupoId]) {
            state.unreadCounts[grupoId] = 0;
          }
          state.unreadCounts[grupoId]++;
        }
      }
    },
    
    // Marcar mensagens como lidas
    markAsRead: (state, action: PayloadAction<string>) => {
      const grupoId = action.payload;
      state.unreadCounts[grupoId] = 0;
    },
    
    // Limpar mensagens de um grupo
    clearMensagens: (state, action: PayloadAction<string>) => {
      const grupoId = action.payload;
      delete state.mensagens[grupoId];
      delete state.unreadCounts[grupoId];
    },
    
    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
    
    // Definir mensagem ativa (para edição)
    setMensagemAtiva: (state, action: PayloadAction<Mensagem | null>) => {
      state.mensagemAtiva = action.payload;
    },

    // Limpar resultados de busca
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.isSearching = false;
    },

    // ============================================
    // AÇÕES WEBSOCKET
    // ============================================

    // Adicionar mensagem via WebSocket
    addMensagemWebSocket: (state, action: PayloadAction<{ grupoId: string; mensagem: Mensagem }>) => {
      const { grupoId, mensagem } = action.payload;
      if (!state.mensagens[grupoId]) {
        state.mensagens[grupoId] = [];
      }
      
      const normalizedMensagem = normalizeMensagem(mensagem);
      
      // Verificar se a mensagem já existe para evitar duplicatas
      const mensagemExiste = state.mensagens[grupoId].some(m => m.id === normalizedMensagem.id);
      if (!mensagemExiste) {
        state.mensagens[grupoId].push(normalizedMensagem);
        
        // Incrementar contador de não lidas se não for do usuário atual
        const isOwnMessage = getAuthorId(normalizedMensagem) === state.currentUserId;
        if (!isOwnMessage) {
          if (!state.unreadCounts[grupoId]) {
            state.unreadCounts[grupoId] = 0;
          }
          state.unreadCounts[grupoId]++;
        }
      }
    },

    // Atualizar mensagem via WebSocket
    updateMensagemWebSocket: (state, action: PayloadAction<{ mensagemId: string; conteudo: string; data_atualizacao: string }>) => {
      const { mensagemId, conteudo, data_atualizacao } = action.payload;
      
      // Procurar e atualizar a mensagem em todos os grupos
      Object.keys(state.mensagens).forEach(grupoId => {
        const mensagens = state.mensagens[grupoId];
        const mensagemIndex = mensagens.findIndex(m => m.id === mensagemId);
        
        if (mensagemIndex !== -1) {
          mensagens[mensagemIndex] = {
            ...mensagens[mensagemIndex],
            conteudo,
            data_atualizacao,
            editado: true
          };
        }
      });
    },

    // Remover mensagem via WebSocket
    removeMensagemWebSocket: (state, action: PayloadAction<{ grupoId: string; mensagemId: string }>) => {
      const { grupoId, mensagemId } = action.payload;
      
      if (state.mensagens[grupoId]) {
        state.mensagens[grupoId] = state.mensagens[grupoId].filter(m => m.id !== mensagemId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // FETCH MENSAGENS
      // ============================================
      .addCase(fetchMensagens.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMensagens.fulfilled, (state, action) => {
        state.isLoading = false;
        const { grupoId, mensagens } = action.payload;
        
        if (!state.mensagens[grupoId]) {
          state.mensagens[grupoId] = [];
        }
        
        // Normalizar mensagens recebidas
        const mensagensNormalizadas = mensagens.map(normalizeMensagem);
        
        // Adicionar mensagens ao início (histórico), evitando duplicatas
        const mensagensExistentes = state.mensagens[grupoId];
        const novasMensagens = mensagensNormalizadas.filter(nova => 
          !mensagensExistentes.some(existente => existente.id === nova.id)
        );
        
        state.mensagens[grupoId] = [...novasMensagens, ...mensagensExistentes];
      })
      .addCase(fetchMensagens.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // CREATE MENSAGEM
      // ============================================
      .addCase(createMensagem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMensagem.fulfilled, (state, action) => {
        state.isLoading = false;
        const { grupoId, mensagem } = action.payload;
        
        if (!state.mensagens[grupoId]) {
          state.mensagens[grupoId] = [];
        }
        if (mensagem) {
          const normalizedMensagem = normalizeMensagem(mensagem);
          // Verificar se a mensagem já existe para evitar duplicatas
          const mensagemExiste = state.mensagens[grupoId].some(m => m.id === normalizedMensagem.id);
          if (!mensagemExiste) {
            state.mensagens[grupoId].push(normalizedMensagem);
          }
        }
      })
      .addCase(createMensagem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // GET MENSAGEM
      // ============================================
      .addCase(getMensagem.fulfilled, (state, action) => {
        const mensagem = action.payload;
        // Adicionar ou atualizar mensagem no cache se necessário
        if (mensagem && mensagem.grupo_id && state.mensagens[mensagem.grupo_id]) {
          const normalizedMensagem = normalizeMensagem(mensagem);
          const index = state.mensagens[mensagem.grupo_id].findIndex(m => m.id === normalizedMensagem.id);
          if (index === -1) {
            state.mensagens[mensagem.grupo_id].push(normalizedMensagem);
          } else {
            state.mensagens[mensagem.grupo_id][index] = normalizedMensagem;
          }
        }
      })

      // ============================================
      // EDIT MENSAGEM
      // ============================================
      .addCase(editMensagem.fulfilled, (state, action) => {
        const mensagemEditada = action.payload;
        
        // Encontrar e atualizar a mensagem
        if (mensagemEditada && mensagemEditada.grupo_id && state.mensagens[mensagemEditada.grupo_id]) {
          const normalizedMensagem = normalizeMensagem(mensagemEditada);
          const index = state.mensagens[mensagemEditada.grupo_id].findIndex(m => m.id === normalizedMensagem.id);
          if (index !== -1) {
            state.mensagens[mensagemEditada.grupo_id][index] = normalizedMensagem;
          }
        }
        
        state.mensagemAtiva = null;
      })

      // ============================================
      // DELETE MENSAGEM
      // ============================================
      .addCase(deleteMensagem.fulfilled, (state, action) => {
        const mensagemId = action.payload;
        
        // Remover mensagem de todos os grupos
        Object.keys(state.mensagens).forEach(grupoId => {
          if (state.mensagens[grupoId]) {
            state.mensagens[grupoId] = state.mensagens[grupoId].filter(m => m.id !== mensagemId);
          }
        });
      })

      // ============================================
      // BUSCAR MENSAGENS
      // ============================================
      .addCase(buscarMensagens.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(buscarMensagens.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload || [];
      })
      .addCase(buscarMensagens.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      })

      // ============================================
      // MENSAGENS NÃO LIDAS
      // ============================================
      .addCase(getMensagensNaoLidas.fulfilled, (state, action) => {
        const { grupoId, count } = action.payload;
        state.unreadCounts[grupoId] = count;
      })

      // ============================================
      // MARCAR COMO LIDAS
      // ============================================
      .addCase(marcarMensagemLida.fulfilled, (state) => {
        // Lógica específica se necessário
      })
      .addCase(marcarTodasMensagensLidas.fulfilled, (state, action) => {
        const grupoId = action.payload;
        state.unreadCounts[grupoId] = 0;
      })

      // ============================================
      // REAÇÕES
      // ============================================
      .addCase(addReacao.fulfilled, (state, action) => {
        const { mensagemId, reacao } = action.payload;
        if (!state.reacoes[mensagemId]) {
          state.reacoes[mensagemId] = [];
        }
        if (reacao) {
          state.reacoes[mensagemId].push(reacao);
        }
      })
      .addCase(removeReacao.fulfilled, (state, action) => {
        const { mensagemId, tipoReacao } = action.payload;
        if (state.reacoes[mensagemId]) {
          state.reacoes[mensagemId] = state.reacoes[mensagemId].filter(r => r.tipo !== tipoReacao);
        }
      })
      .addCase(getReacoes.fulfilled, (state, action) => {
        const { mensagemId, reacoes } = action.payload;
        state.reacoes[mensagemId] = reacoes || [];
      })

      // ============================================
      // MENSAGENS RECENTES
      // ============================================
      .addCase(getMensagensRecentes.fulfilled, (state, action) => {
        const { grupoId, mensagens } = action.payload;
        state.mensagensRecentes[grupoId] = mensagens || [];
      })

      // ============================================
      // ESTATÍSTICAS
      // ============================================
      .addCase(getEstatisticasGrupo.fulfilled, (state, action) => {
        const { grupoId, estatisticas } = action.payload;
        state.estatisticas[grupoId] = estatisticas;
      });
  },
});

export const {
  receiveMessage,
  markAsRead,
  clearMensagens,
  clearError,
  setMensagemAtiva,
  clearSearchResults,
  setCurrentUserId,
  addMensagemWebSocket,
  updateMensagemWebSocket,
  removeMensagemWebSocket,
} = chatSlice.actions;

export default chatSlice.reducer;
