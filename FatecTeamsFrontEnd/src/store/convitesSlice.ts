import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import convitesService from '../services/convitesService';

// ============================================
// INTERFACES
// ============================================

interface Convite {
  id: string;
  grupo_id: string;
  codigo: string;
  email: string;
  status: 'pendente' | 'aceito' | 'recusado' | 'expirado';
  data_criacao: string;
  data_expiracao: string;
  data_resposta?: string;
  criado_por: string;
  // Dados relacionados
  grupo?: {
    id: string;
    nome: string;
    descricao?: string;
    tipo: string;
  };
  criador?: {
    id: string;
    nome: string;
    email: string;
    foto_perfil?: string;
  };
  destinatario?: {
    id: string;
    nome: string;
    email: string;
    foto_perfil?: string;
  };
}

interface ConviteDetalhes {
  codigo: string;
  grupo: {
    id: string;
    nome: string;
    descricao?: string;
    tipo: string;
    total_membros: number;
  };
  criador: {
    nome: string;
    email: string;
    foto_perfil?: string;
  };
  data_expiracao: string;
  status: string;
}

interface ConvitesState {
  // Convites organizados por grupo
  convitesPorGrupo: { [grupoId: string]: Convite[] };
  // Meus convites recebidos
  meusConvites: Convite[];
  // Convites enviados por mim
  convitesEnviados: Convite[];
  // Convite sendo validado/processado
  conviteAtivo: ConviteDetalhes | null;
  isLoading: boolean;
  error: string | null;
  // Estados específicos para diferentes operações
  isValidating: boolean;
  isAccepting: boolean;
  isCreating: boolean;
}

interface CreateConviteData {
  grupo_id: string;
  email: string;
  mensagem_personalizada?: string;
  data_expiracao?: string;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: ConvitesState = {
  convitesPorGrupo: {},
  meusConvites: [],
  convitesEnviados: [],
  conviteAtivo: null,
  isLoading: false,
  error: null,
  isValidating: false,
  isAccepting: false,
  isCreating: false,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Criar convite para grupo
 */
export const createConvite = createAsyncThunk(
  'convites/createConvite',
  async (conviteData: CreateConviteData, { rejectWithValue }) => {
    try {
      const response = await convitesService.createConvite(conviteData);
      return {
        grupoId: conviteData.grupo_id,
        convite: response.dados,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar convites do grupo
 */
export const fetchConvitesGrupo = createAsyncThunk(
  'convites/fetchConvitesGrupo',
  async (grupoId: string, { rejectWithValue }) => {
    try {
      const response = await convitesService.getConvitesGrupo(grupoId);
      return {
        grupoId,
        convites: response.dados || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Validar código de convite
 */
export const validarConvite = createAsyncThunk(
  'convites/validarConvite',
  async (codigo: string, { rejectWithValue }) => {
    try {
      const response = await convitesService.validarConvite(codigo);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Aceitar convite
 */
export const aceitarConvite = createAsyncThunk(
  'convites/aceitarConvite',
  async (codigo: string, { rejectWithValue }) => {
    try {
      const response = await convitesService.aceitarConvite(codigo);
      return {
        codigo,
        resultado: response.dados,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Recusar convite
 */
export const recusarConvite = createAsyncThunk(
  'convites/recusarConvite',
  async (params: { codigo: string; motivo?: string }, { rejectWithValue }) => {
    try {
      const response = await convitesService.recusarConvite(params.codigo, params.motivo);
      return {
        codigo: params.codigo,
        convite: response.dados,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Cancelar convite
 */
export const cancelarConvite = createAsyncThunk(
  'convites/cancelarConvite',
  async (params: { codigo: string; grupoId: string }, { rejectWithValue }) => {
    try {
      await convitesService.cancelarConvite(params.codigo);
      return params;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Reenviar convite
 */
export const reenviarConvite = createAsyncThunk(
  'convites/reenviarConvite',
  async (params: { codigo: string; grupoId: string }, { rejectWithValue }) => {
    try {
      const response = await convitesService.reenviarConvite(params.codigo);
      return {
        grupoId: params.grupoId,
        convite: response.dados,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar meus convites recebidos
 */
export const fetchMeusConvites = createAsyncThunk(
  'convites/fetchMeusConvites',
  async (_, { rejectWithValue }) => {
    try {
      const response = await convitesService.getMeusConvites();
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar convites enviados por mim
 */
export const fetchConvitesEnviados = createAsyncThunk(
  'convites/fetchConvitesEnviados',
  async (_, { rejectWithValue }) => {
    try {
      const response = await convitesService.getConvitesEnviados();
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const convitesSlice = createSlice({
  name: 'convites',
  initialState,
  reducers: {
    // Limpar convite ativo
    clearConviteAtivo: (state) => {
      state.conviteAtivo = null;
      state.isValidating = false;
    },

    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },

    // Marcar convite como expirado localmente
    markConviteAsExpired: (state, action: PayloadAction<string>) => {
      const codigo = action.payload;
      
      // Atualizar em convites por grupo
      Object.keys(state.convitesPorGrupo).forEach(grupoId => {
        const convite = state.convitesPorGrupo[grupoId]?.find(c => c.codigo === codigo);
        if (convite) {
          convite.status = 'expirado';
        }
      });
      
      // Atualizar em meus convites
      const meuConvite = state.meusConvites.find(c => c.codigo === codigo);
      if (meuConvite) {
        meuConvite.status = 'expirado';
      }
      
      // Atualizar em convites enviados
      const conviteEnviado = state.convitesEnviados.find(c => c.codigo === codigo);
      if (conviteEnviado) {
        conviteEnviado.status = 'expirado';
      }
    },

    // Atualizar status de convite localmente
    updateConviteStatus: (state, action: PayloadAction<{ codigo: string; status: Convite['status'] }>) => {
      const { codigo, status } = action.payload;
      
      // Atualizar em todas as listas
      Object.keys(state.convitesPorGrupo).forEach(grupoId => {
        const convite = state.convitesPorGrupo[grupoId]?.find(c => c.codigo === codigo);
        if (convite) {
          convite.status = status;
          convite.data_resposta = new Date().toISOString();
        }
      });
      
      const meuConvite = state.meusConvites.find(c => c.codigo === codigo);
      if (meuConvite) {
        meuConvite.status = status;
        meuConvite.data_resposta = new Date().toISOString();
      }
      
      const conviteEnviado = state.convitesEnviados.find(c => c.codigo === codigo);
      if (conviteEnviado) {
        conviteEnviado.status = status;
        conviteEnviado.data_resposta = new Date().toISOString();
      }
    },

    // Limpar convites de um grupo
    clearConvitesGrupo: (state, action: PayloadAction<string>) => {
      const grupoId = action.payload;
      delete state.convitesPorGrupo[grupoId];
    },

    // Limpar todos os convites
    clearAllConvites: (state) => {
      state.convitesPorGrupo = {};
      state.meusConvites = [];
      state.convitesEnviados = [];
      state.conviteAtivo = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // CREATE CONVITE
      // ============================================
      .addCase(createConvite.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createConvite.fulfilled, (state, action) => {
        state.isCreating = false;
        const { grupoId, convite } = action.payload;
        
        if (!state.convitesPorGrupo[grupoId]) {
          state.convitesPorGrupo[grupoId] = [];
        }
        if (convite) {
          state.convitesPorGrupo[grupoId].push(convite);
          state.convitesEnviados.push(convite);
        }
      })
      .addCase(createConvite.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      })

      // ============================================
      // FETCH CONVITES GRUPO
      // ============================================
      .addCase(fetchConvitesGrupo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConvitesGrupo.fulfilled, (state, action) => {
        state.isLoading = false;
        const { grupoId, convites } = action.payload;
        state.convitesPorGrupo[grupoId] = convites;
      })
      .addCase(fetchConvitesGrupo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // VALIDAR CONVITE
      // ============================================
      .addCase(validarConvite.pending, (state) => {
        state.isValidating = true;
        state.error = null;
        state.conviteAtivo = null;
      })
      .addCase(validarConvite.fulfilled, (state, action) => {
        state.isValidating = false;
        state.conviteAtivo = action.payload || null;
      })
      .addCase(validarConvite.rejected, (state, action) => {
        state.isValidating = false;
        state.error = action.payload as string;
        state.conviteAtivo = null;
      })

      // ============================================
      // ACEITAR CONVITE
      // ============================================
      .addCase(aceitarConvite.pending, (state) => {
        state.isAccepting = true;
        state.error = null;
      })
      .addCase(aceitarConvite.fulfilled, (state, action) => {
        state.isAccepting = false;
        const { codigo } = action.payload;
        
        // Atualizar status do convite para 'aceito'
        const updateStatus = (convite: Convite) => {
          if (convite.codigo === codigo) {
            convite.status = 'aceito';
            convite.data_resposta = new Date().toISOString();
          }
        };
        
        // Atualizar em todas as listas
        Object.values(state.convitesPorGrupo).forEach(convites => {
          convites.forEach(updateStatus);
        });
        state.meusConvites.forEach(updateStatus);
        state.convitesEnviados.forEach(updateStatus);
        
        // Limpar convite ativo
        state.conviteAtivo = null;
      })
      .addCase(aceitarConvite.rejected, (state, action) => {
        state.isAccepting = false;
        state.error = action.payload as string;
      })

      // ============================================
      // RECUSAR CONVITE
      // ============================================
      .addCase(recusarConvite.fulfilled, (state, action) => {
        const { codigo } = action.payload;
        
        // Atualizar status do convite para 'recusado'
        const updateStatus = (convite: Convite) => {
          if (convite.codigo === codigo) {
            convite.status = 'recusado';
            convite.data_resposta = new Date().toISOString();
          }
        };
        
        // Atualizar em todas as listas
        Object.values(state.convitesPorGrupo).forEach(convites => {
          convites.forEach(updateStatus);
        });
        state.meusConvites.forEach(updateStatus);
        state.convitesEnviados.forEach(updateStatus);
        
        // Limpar convite ativo
        state.conviteAtivo = null;
      })

      // ============================================
      // CANCELAR CONVITE
      // ============================================
      .addCase(cancelarConvite.fulfilled, (state, action) => {
        const { codigo, grupoId } = action.payload;
        
        // Remover convite da lista do grupo
        if (state.convitesPorGrupo[grupoId]) {
          state.convitesPorGrupo[grupoId] = state.convitesPorGrupo[grupoId].filter(c => c.codigo !== codigo);
        }
        
        // Remover da lista de convites enviados
        state.convitesEnviados = state.convitesEnviados.filter(c => c.codigo !== codigo);
      })

      // ============================================
      // REENVIAR CONVITE
      // ============================================
      .addCase(reenviarConvite.fulfilled, (state, action) => {
        const { grupoId, convite } = action.payload;
        
        if (convite && state.convitesPorGrupo[grupoId]) {
          // Atualizar convite existente ou adicionar novo
          const index = state.convitesPorGrupo[grupoId].findIndex(c => c.codigo === convite.codigo);
          if (index !== -1) {
            state.convitesPorGrupo[grupoId][index] = convite;
          } else {
            state.convitesPorGrupo[grupoId].push(convite);
          }
          
          // Atualizar na lista de enviados
          const indexEnviados = state.convitesEnviados.findIndex(c => c.codigo === convite.codigo);
          if (indexEnviados !== -1) {
            state.convitesEnviados[indexEnviados] = convite;
          } else {
            state.convitesEnviados.push(convite);
          }
        }
      })

      // ============================================
      // FETCH MEUS CONVITES
      // ============================================
      .addCase(fetchMeusConvites.fulfilled, (state, action) => {
        state.meusConvites = action.payload || [];
      })

      // ============================================
      // FETCH CONVITES ENVIADOS
      // ============================================
      .addCase(fetchConvitesEnviados.fulfilled, (state, action) => {
        state.convitesEnviados = action.payload || [];
      });
  },
});

export const {
  clearConviteAtivo,
  clearError,
  markConviteAsExpired,
  updateConviteStatus,
  clearConvitesGrupo,
  clearAllConvites,
} = convitesSlice.actions;

export default convitesSlice.reducer;
