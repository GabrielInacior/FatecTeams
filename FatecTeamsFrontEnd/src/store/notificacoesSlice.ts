import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import notificacoesService from '../services/notificacoesService';

// ============================================
// INTERFACES
// ============================================

interface Notificacao {
  id: string;
  usuario_id: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'sucesso' | 'aviso' | 'erro';
  importante: boolean;
  lida: boolean;
  data_criacao: string;
  data_leitura?: string;
  // Dados relacionados opcionais
  grupo_id?: string;
  tarefa_id?: string;
  mensagem_id?: string;
  usuario_origem_id?: string;
  link_acao?: string;
  dados_extras?: any;
}

interface ConfiguracoesNotificacao {
  id: string;
  usuario_id: string;
  email: boolean;
  push: boolean;
  som: boolean;
  tipos: {
    mensagem: boolean;
    tarefa: boolean;
    convite: boolean;
    arquivo: boolean;
    evento: boolean;
    sistema: boolean;
  };
  horarios: {
    inicio: string; // HH:MM
    fim: string; // HH:MM
    ativo: boolean;
  };
  data_atualizacao: string;
}

interface NotificacoesState {
  notificacoes: Notificacao[];
  configuracoes: ConfiguracoesNotificacao | null;
  totalNaoLidas: number;
  isLoading: boolean;
  error: string | null;
  filters: {
    tipo?: string;
    lida?: boolean;
    importante?: boolean;
  };
}

interface CreateNotificacaoData {
  usuario_id: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'sucesso' | 'aviso' | 'erro';
  importante?: boolean;
  grupo_id?: string;
  tarefa_id?: string;
  mensagem_id?: string;
  link_acao?: string;
  dados_extras?: any;
}

interface NotificacoesQueryParams {
  lida?: boolean;
  tipo?: string;
  limit?: number;
  offset?: number;
}

interface UpdateConfiguracoesData {
  email?: boolean;
  push?: boolean;
  som?: boolean;
  tipos?: {
    mensagem?: boolean;
    tarefa?: boolean;
    convite?: boolean;
    arquivo?: boolean;
    evento?: boolean;
    sistema?: boolean;
  };
  horarios?: {
    inicio?: string;
    fim?: string;
    ativo?: boolean;
  };
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: NotificacoesState = {
  notificacoes: [],
  configuracoes: null,
  totalNaoLidas: 0,
  isLoading: false,
  error: null,
  filters: {},
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Buscar notificações
 */
export const fetchNotificacoes = createAsyncThunk(
  'notificacoes/fetchNotificacoes',
  async (params: NotificacoesQueryParams | undefined, { rejectWithValue }) => {
    try {
      const response = await notificacoesService.getNotificacoes(params);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Contar notificações não lidas
 */
export const fetchTotalNaoLidas = createAsyncThunk(
  'notificacoes/fetchTotalNaoLidas',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificacoesService.getNotificacoesNaoLidas();
      return response.dados?.total_nao_lidas || 0;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Criar notificação
 */
export const createNotificacao = createAsyncThunk(
  'notificacoes/createNotificacao',
  async (notificacaoData: CreateNotificacaoData, { rejectWithValue }) => {
    try {
      const response = await notificacoesService.createNotificacao(notificacaoData);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Marcar notificação como lida
 */
export const marcarComoLida = createAsyncThunk(
  'notificacoes/marcarComoLida',
  async (notificacaoId: string, { rejectWithValue }) => {
    try {
      const response = await notificacoesService.marcarComoLida(notificacaoId);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Marcar todas como lidas
 */
export const marcarTodasComoLidas = createAsyncThunk(
  'notificacoes/marcarTodasComoLidas',
  async (_, { rejectWithValue }) => {
    try {
      await notificacoesService.marcarTodasComoLidas();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Deletar notificação
 */
export const deleteNotificacao = createAsyncThunk(
  'notificacoes/deleteNotificacao',
  async (notificacaoId: string, { rejectWithValue }) => {
    try {
      await notificacoesService.deleteNotificacao(notificacaoId);
      return notificacaoId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar configurações
 */
export const fetchConfiguracoes = createAsyncThunk(
  'notificacoes/fetchConfiguracoes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificacoesService.getConfiguracoes();
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Atualizar configurações
 */
export const updateConfiguracoes = createAsyncThunk(
  'notificacoes/updateConfiguracoes',
  async (configuracoes: UpdateConfiguracoesData, { rejectWithValue }) => {
    try {
      const response = await notificacoesService.updateConfiguracoes(configuracoes);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const notificacoesSlice = createSlice({
  name: 'notificacoes',
  initialState,
  reducers: {
    // Adicionar notificação em tempo real (WebSocket/Push)
    addNotificacao: (state, action: PayloadAction<Notificacao>) => {
      state.notificacoes.unshift(action.payload);
      if (!action.payload.lida) {
        state.totalNaoLidas += 1;
      }
    },

    // Marcar como lida localmente (para UX responsiva)
    markAsReadLocal: (state, action: PayloadAction<string>) => {
      const notificacao = state.notificacoes.find(n => n.id === action.payload);
      if (notificacao && !notificacao.lida) {
        notificacao.lida = true;
        notificacao.data_leitura = new Date().toISOString();
        state.totalNaoLidas = Math.max(0, state.totalNaoLidas - 1);
      }
    },

    // Marcar todas como lidas localmente
    markAllAsReadLocal: (state) => {
      state.notificacoes.forEach(n => {
        if (!n.lida) {
          n.lida = true;
          n.data_leitura = new Date().toISOString();
        }
      });
      state.totalNaoLidas = 0;
    },

    // Remover notificação localmente
    removeNotificacaoLocal: (state, action: PayloadAction<string>) => {
      const index = state.notificacoes.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notificacao = state.notificacoes[index];
        if (!notificacao.lida) {
          state.totalNaoLidas = Math.max(0, state.totalNaoLidas - 1);
        }
        state.notificacoes.splice(index, 1);
      }
    },

    // Definir filtros
    setFilters: (state, action: PayloadAction<Partial<NotificacoesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Limpar filtros
    clearFilters: (state) => {
      state.filters = {};
    },

    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },

    // Limpar todas as notificações
    clearNotificacoes: (state) => {
      state.notificacoes = [];
      state.totalNaoLidas = 0;
    },

    // Atualizar contador em tempo real
    updateUnreadCount: (state, action: PayloadAction<number>) => {
      state.totalNaoLidas = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // FETCH NOTIFICAÇÕES
      // ============================================
      .addCase(fetchNotificacoes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificacoes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notificacoes = action.payload || [];
      })
      .addCase(fetchNotificacoes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // TOTAL NÃO LIDAS
      // ============================================
      .addCase(fetchTotalNaoLidas.fulfilled, (state, action) => {
        state.totalNaoLidas = action.payload;
      })

      // ============================================
      // CREATE NOTIFICAÇÃO
      // ============================================
      .addCase(createNotificacao.fulfilled, (state, action) => {
        const novaNotificacao = action.payload;
        if (novaNotificacao) {
          state.notificacoes.unshift(novaNotificacao);
          if (!novaNotificacao.lida) {
            state.totalNaoLidas += 1;
          }
        }
      })

      // ============================================
      // MARCAR COMO LIDA
      // ============================================
      .addCase(marcarComoLida.fulfilled, (state, action) => {
        const notificacaoAtualizada = action.payload;
        if (notificacaoAtualizada) {
          const index = state.notificacoes.findIndex(n => n.id === notificacaoAtualizada.id);
          if (index !== -1) {
            const wasUnread = !state.notificacoes[index].lida;
            state.notificacoes[index] = notificacaoAtualizada;
            if (wasUnread && notificacaoAtualizada.lida) {
              state.totalNaoLidas = Math.max(0, state.totalNaoLidas - 1);
            }
          }
        }
      })

      // ============================================
      // MARCAR TODAS COMO LIDAS
      // ============================================
      .addCase(marcarTodasComoLidas.fulfilled, (state) => {
        state.notificacoes.forEach(n => {
          if (!n.lida) {
            n.lida = true;
            n.data_leitura = new Date().toISOString();
          }
        });
        state.totalNaoLidas = 0;
      })

      // ============================================
      // DELETE NOTIFICAÇÃO
      // ============================================
      .addCase(deleteNotificacao.fulfilled, (state, action) => {
        const notificacaoId = action.payload;
        const index = state.notificacoes.findIndex(n => n.id === notificacaoId);
        if (index !== -1) {
          const notificacao = state.notificacoes[index];
          if (!notificacao.lida) {
            state.totalNaoLidas = Math.max(0, state.totalNaoLidas - 1);
          }
          state.notificacoes.splice(index, 1);
        }
      })

      // ============================================
      // CONFIGURAÇÕES
      // ============================================
      .addCase(fetchConfiguracoes.fulfilled, (state, action) => {
        state.configuracoes = action.payload || null;
      })
      .addCase(updateConfiguracoes.fulfilled, (state, action) => {
        state.configuracoes = action.payload || null;
      });
  },
});

export const {
  addNotificacao,
  markAsReadLocal,
  markAllAsReadLocal,
  removeNotificacaoLocal,
  setFilters,
  clearFilters,
  clearError,
  clearNotificacoes,
  updateUnreadCount,
} = notificacoesSlice.actions;

export default notificacoesSlice.reducer;
