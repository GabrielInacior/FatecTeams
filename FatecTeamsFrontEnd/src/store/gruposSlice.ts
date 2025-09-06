import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import gruposService from '../services/gruposService';

// ============================================
// INTERFACES
// ============================================

interface Grupo {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'projeto' | 'estudo' | 'trabalho';
  privacidade: 'publico' | 'privado';
  max_membros?: number;
  criado_por: string;
  data_criacao: string;
  ativo: boolean;
  configuracoes?: any;
  membros?: any[];
  _count?: {
    membros: number;
    mensagens: number;
    tarefas: number;
  };
}

interface GrupoMembro {
  id: string;
  usuario_id: string;
  grupo_id: string;
  papel: 'membro' | 'admin' | 'moderador';
  nivel?: number;
  data_ingresso: string;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    foto_perfil?: string;
  };
}

interface GrupoState {
  grupos: Grupo[];
  grupoAtivo: Grupo | null;
  grupoDetalhes: Grupo | null;
  membrosGrupoAtivo: GrupoMembro[];
  gruposPublicos: Grupo[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  filtros: {
    tipo?: 'projeto' | 'estudo' | 'trabalho';
    privacidade?: 'publico' | 'privado';
    categoria?: string;
  };
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: GrupoState = {
  grupos: [],
  grupoAtivo: null,
  grupoDetalhes: null,
  membrosGrupoAtivo: [],
  gruposPublicos: [],
  isLoading: false,
  error: null,
  searchTerm: '',
  filtros: {},
};

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchGrupos = createAsyncThunk(
  'grupos/fetchGrupos',
  async (params: { tipo?: string; categoria?: string; limit?: number; offset?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await gruposService.getGruposUsuario(params);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createGrupo = createAsyncThunk(
  'grupos/createGrupo',
  async (grupoData: {
    nome: string;
    descricao?: string;
    tipo: 'projeto' | 'estudo' | 'trabalho';
    privacidade: 'publico' | 'privado';
    max_membros?: number;
    configuracoes?: any;
  }, { rejectWithValue }) => {
    try {
      const response = await gruposService.createGrupo(grupoData);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getGrupoDetalhes = createAsyncThunk(
  'grupos/getGrupoDetalhes',
  async (grupoId: string, { rejectWithValue }) => {
    try {
      const response = await gruposService.getGrupoDetalhes(grupoId);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateGrupoAsync = createAsyncThunk(
  'grupos/updateGrupoAsync',
  async (params: { grupoId: string; data: Partial<Grupo> }, { rejectWithValue }) => {
    try {
      const response = await gruposService.updateGrupo(params.grupoId, params.data);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteGrupo = createAsyncThunk(
  'grupos/deleteGrupo',
  async (grupoId: string, { rejectWithValue }) => {
    try {
      const response = await gruposService.deleteGrupo(grupoId);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return grupoId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const joinGrupo = createAsyncThunk(
  'grupos/joinGrupo',
  async (grupoId: string, { rejectWithValue }) => {
    try {
      const response = await gruposService.joinGrupo(grupoId);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return grupoId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const leaveGrupo = createAsyncThunk(
  'grupos/leaveGrupo',
  async (grupoId: string, { rejectWithValue }) => {
    try {
      const response = await gruposService.leaveGrupo(grupoId);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return grupoId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const buscarGruposPublicos = createAsyncThunk(
  'grupos/buscarGruposPublicos',
  async (params: { termo?: string; categoria?: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await gruposService.buscarGruposPublicos(params);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const getMembrosGrupo = createAsyncThunk(
  'grupos/getMembrosGrupo',
  async (grupoId: string, { rejectWithValue }) => {
    try {
      const response = await gruposService.getMembros(grupoId);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addMembroGrupo = createAsyncThunk(
  'grupos/addMembroGrupo',
  async (params: { grupoId: string; usuarioId: string; papel?: 'membro' | 'admin' | 'moderador' }, { rejectWithValue }) => {
    try {
      const response = await gruposService.addMembro(params.grupoId, params.usuarioId, params.papel);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeMembroGrupo = createAsyncThunk(
  'grupos/removeMembroGrupo',
  async (params: { grupoId: string; usuarioId: string }, { rejectWithValue }) => {
    try {
      const response = await gruposService.removeMembro(params.grupoId, params.usuarioId);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return params.usuarioId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateMembroPapel = createAsyncThunk(
  'grupos/updateMembroPapel',
  async (params: { grupoId: string; usuarioId: string; papel: 'membro' | 'admin' | 'moderador' }, { rejectWithValue }) => {
    try {
      const response = await gruposService.updateMembroPapel(params.grupoId, params.usuarioId, params.papel);
      if (!response.sucesso) {
        return rejectWithValue(response.mensagem);
      }
      return response.dados!;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const gruposSlice = createSlice({
  name: 'grupos',
  initialState,
  reducers: {
    setGrupoAtivo: (state, action: PayloadAction<Grupo | null>) => {
      state.grupoAtivo = action.payload;
    },
    setMembrosGrupoAtivo: (state, action: PayloadAction<any[]>) => {
      state.membrosGrupoAtivo = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setFiltros: (state, action: PayloadAction<Partial<GrupoState['filtros']>>) => {
      state.filtros = { ...state.filtros, ...action.payload };
    },
    clearFiltros: (state) => {
      state.filtros = {};
      state.searchTerm = '';
    },
    clearError: (state) => {
      state.error = null;
    },
    updateGrupo: (state, action: PayloadAction<Grupo>) => {
      const index = state.grupos.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.grupos[index] = action.payload;
      }
      if (state.grupoAtivo?.id === action.payload.id) {
        state.grupoAtivo = action.payload;
      }
    },
    removeGrupo: (state, action: PayloadAction<string>) => {
      state.grupos = state.grupos.filter(g => g.id !== action.payload);
      if (state.grupoAtivo?.id === action.payload) {
        state.grupoAtivo = null;
        state.membrosGrupoAtivo = [];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch grupos
      .addCase(fetchGrupos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGrupos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.grupos = action.payload;
      })
      .addCase(fetchGrupos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create grupo
      .addCase(createGrupo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createGrupo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.grupos.unshift(action.payload);
      })
      .addCase(createGrupo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Join grupo
      .addCase(joinGrupo.fulfilled, (state, action) => {
        // Atualizar status do grupo localmente
        const grupo = state.grupos.find(g => g.id === action.payload);
        if (grupo) {
          // Lógica para atualizar o grupo após join
        }
      })
      // Leave grupo
      .addCase(leaveGrupo.fulfilled, (state, action) => {
        // Remover grupo da lista ou atualizar status
        const grupo = state.grupos.find(g => g.id === action.payload);
        if (grupo) {
          // Lógica para atualizar o grupo após leave
        }
      });
  },
});

// ============================================
// ACTIONS & SELECTORS
// ============================================

export const {
  setGrupoAtivo,
  setMembrosGrupoAtivo,
  setSearchTerm,
  setFiltros,
  clearFiltros,
  clearError,
  updateGrupo,
  removeGrupo,
} = gruposSlice.actions;

// Selectors
export const selectGrupos = (state: { grupos: GrupoState }) => state.grupos.grupos;
export const selectGrupoAtivo = (state: { grupos: GrupoState }) => state.grupos.grupoAtivo;
export const selectMembrosGrupoAtivo = (state: { grupos: GrupoState }) => state.grupos.membrosGrupoAtivo;
export const selectGruposLoading = (state: { grupos: GrupoState }) => state.grupos.isLoading;
export const selectGruposError = (state: { grupos: GrupoState }) => state.grupos.error;
export const selectSearchTerm = (state: { grupos: GrupoState }) => state.grupos.searchTerm;
export const selectFiltros = (state: { grupos: GrupoState }) => state.grupos.filtros;

// Selector para grupos filtrados
export const selectGruposFiltrados = (state: { grupos: GrupoState }) => {
  const { grupos, searchTerm, filtros } = state.grupos;
  
  return grupos.filter(grupo => {
    const matchSearch = !searchTerm || 
      grupo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grupo.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTipo = !filtros.tipo || grupo.tipo === filtros.tipo;
    const matchPrivacidade = !filtros.privacidade || grupo.privacidade === filtros.privacidade;
    
    return matchSearch && matchTipo && matchPrivacidade;
  });
};

export default gruposSlice.reducer;
