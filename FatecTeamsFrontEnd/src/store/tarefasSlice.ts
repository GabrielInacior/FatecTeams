import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import tarefasService from '../services/tarefasService';

// ============================================
// INTERFACES
// ============================================

interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  status: 'pendente' | 'em_progresso' | 'concluida' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  data_vencimento?: string;
  grupo_id: string;
  criador_id: string;
  assignado_para?: string[];
  etiquetas?: string[];
  estimativa_horas?: number;
  anexos?: string[];
  data_criacao: string;
  data_atualizacao?: string;
  horas_trabalhadas?: number;
  responsaveis?: UsuarioBasico[];
  grupo?: {
    id: string;
    nome: string;
  };
  criador?: UsuarioBasico;
}

interface UsuarioBasico {
  id: string;
  nome: string;
  email: string;
  foto_perfil?: string;
}

interface Comentario {
  id: string;
  tarefa_id: string;
  usuario_id: string;
  comentario: string;
  data_criacao: string;
  usuario?: UsuarioBasico;
}

interface HoraTrabalhada {
  id: string;
  tarefa_id: string;
  usuario_id: string;
  horas: number;
  descricao?: string;
  data: string;
  data_criacao: string;
  usuario?: UsuarioBasico;
}

interface HistoricoTarefa {
  id: string;
  tarefa_id: string;
  usuario_id: string;
  acao: string;
  detalhes: string;
  data_criacao: string;
  usuario?: UsuarioBasico;
}

interface TarefasState {
  tarefas: { [grupoId: string]: Tarefa[] };
  minhasTarefas: { [grupoId: string]: Tarefa[] };
  tarefaAtiva: Tarefa | null;
  comentarios: { [tarefaId: string]: Comentario[] };
  horasTrabalhadas: { [tarefaId: string]: HoraTrabalhada[] };
  historico: { [tarefaId: string]: HistoricoTarefa[] };
  isLoading: boolean;
  error: string | null;
  searchResults: Tarefa[];
  isSearching: boolean;
  estatisticas: { [grupoId: string]: any };
  filtros: {
    status?: string;
    prioridade?: string;
    responsavel_id?: string;
  };
}

interface CreateTarefaData {
  titulo: string;
  descricao?: string;
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  data_vencimento?: string;
  assignado_para?: string[];
  etiquetas?: string[];
  estimativa_horas?: number;
  anexos?: string[];
}

interface UpdateTarefaData {
  titulo?: string;
  descricao?: string;
  status?: 'pendente' | 'em_progresso' | 'concluida' | 'cancelada';
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  data_vencimento?: string;
  responsaveis?: string[];
  tags?: string[];
}

interface TarefasQueryParams {
  status?: string;
  prioridade?: string;
  responsavel_id?: string;
  limit?: number;
  offset?: number;
}

interface MinhasTarefasParams {
  status?: string;
  prioridade?: string;
}

interface BuscarTarefasParams {
  termo: string;
  status?: string;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: TarefasState = {
  tarefas: {},
  minhasTarefas: {},
  tarefaAtiva: null,
  comentarios: {},
  horasTrabalhadas: {},
  historico: {},
  isLoading: false,
  error: null,
  searchResults: [],
  isSearching: false,
  estatisticas: {},
  filtros: {},
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Buscar tarefas do grupo
 */
export const fetchTarefas = createAsyncThunk(
  'tarefas/fetchTarefas',
  async (params: { grupoId: string; queryParams?: TarefasQueryParams }, { rejectWithValue }) => {
    try {
      const response = await tarefasService.getTarefasGrupo(params.grupoId, params.queryParams);
      return {
        grupoId: params.grupoId,
        tarefas: response.dados || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Criar nova tarefa
 */
export const createTarefa = createAsyncThunk(
  'tarefas/createTarefa',
  async (params: { grupoId: string; tarefaData: CreateTarefaData }, { rejectWithValue }) => {
    try {
      const response = await tarefasService.createTarefa(params.grupoId, params.tarefaData);
      return {
        grupoId: params.grupoId,
        tarefa: response.dados,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Obter tarefa específica
 */
export const getTarefa = createAsyncThunk(
  'tarefas/getTarefa',
  async (tarefaId: string, { rejectWithValue }) => {
    try {
      const response = await tarefasService.getTarefa(tarefaId);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Atualizar tarefa
 */
export const updateTarefa = createAsyncThunk(
  'tarefas/updateTarefa',
  async (params: { tarefaId: string; tarefaData: UpdateTarefaData }, { rejectWithValue }) => {
    try {
      const response = await tarefasService.updateTarefa(params.tarefaId, params.tarefaData);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Deletar tarefa
 */
export const deleteTarefa = createAsyncThunk(
  'tarefas/deleteTarefa',
  async (tarefaId: string, { rejectWithValue }) => {
    try {
      await tarefasService.deleteTarefa(tarefaId);
      return tarefaId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar minhas tarefas no grupo
 */
export const fetchMinhasTarefas = createAsyncThunk(
  'tarefas/fetchMinhasTarefas',
  async (params: { grupoId: string; queryParams?: MinhasTarefasParams }, { rejectWithValue }) => {
    try {
      const response = await tarefasService.getMinhasTarefas(params.grupoId, params.queryParams);
      return {
        grupoId: params.grupoId,
        tarefas: response.dados || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar tarefas
 */
export const buscarTarefas = createAsyncThunk(
  'tarefas/buscarTarefas',
  async (params: { grupoId: string; searchParams: BuscarTarefasParams }, { rejectWithValue }) => {
    try {
      const response = await tarefasService.buscarTarefas(params.grupoId, params.searchParams);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Concluir tarefa
 */
export const concluirTarefa = createAsyncThunk(
  'tarefas/concluirTarefa',
  async (tarefaId: string, { rejectWithValue }) => {
    try {
      const response = await tarefasService.concluirTarefa(tarefaId);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Iniciar tarefa
 */
export const iniciarTarefa = createAsyncThunk(
  'tarefas/iniciarTarefa',
  async (tarefaId: string, { rejectWithValue }) => {
    try {
      const response = await tarefasService.iniciarTarefa(tarefaId);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Cancelar tarefa
 */
export const cancelarTarefa = createAsyncThunk(
  'tarefas/cancelarTarefa',
  async (tarefaId: string, { rejectWithValue }) => {
    try {
      const response = await tarefasService.cancelarTarefa(tarefaId);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Atribuir tarefa
 */
export const atribuirTarefa = createAsyncThunk(
  'tarefas/atribuirTarefa',
  async (params: { tarefaId: string; assignado_para: string[] }, { rejectWithValue }) => {
    try {
      const response = await tarefasService.atribuirTarefa(params.tarefaId, params.assignado_para);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Adicionar comentário
 */
export const addComentario = createAsyncThunk(
  'tarefas/addComentario',
  async (params: { tarefaId: string; comentario: string }, { rejectWithValue }) => {
    try {
      const response = await tarefasService.addComentario(params.tarefaId, params.comentario);
      return {
        tarefaId: params.tarefaId,
        comentario: response.dados,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Obter comentários da tarefa
 */
export const getComentarios = createAsyncThunk(
  'tarefas/getComentarios',
  async (tarefaId: string, { rejectWithValue }) => {
    try {
      const response = await tarefasService.getComentarios(tarefaId);
      return {
        tarefaId,
        comentarios: response.dados || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Deletar comentário
 */
export const deleteComentario = createAsyncThunk(
  'tarefas/deleteComentario',
  async (params: { comentarioId: string; tarefaId: string }, { rejectWithValue }) => {
    try {
      await tarefasService.deleteComentario(params.comentarioId);
      return params;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Adicionar horas trabalhadas
 */
export const addHorasTrabalhadas = createAsyncThunk(
  'tarefas/addHorasTrabalhadas',
  async (
    params: { 
      tarefaId: string; 
      dados: { horas: number; descricao?: string; data?: string } 
    }, 
    { rejectWithValue }
  ) => {
    try {
      const response = await tarefasService.addHorasTrabalhadas(params.tarefaId, params.dados);
      return {
        tarefaId: params.tarefaId,
        hora: response.dados,
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
  'tarefas/getEstatisticasGrupo',
  async (grupoId: string, { rejectWithValue }) => {
    try {
      const response = await tarefasService.getEstatisticasGrupo(grupoId);
      return {
        grupoId,
        estatisticas: response.dados,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Obter histórico da tarefa
 */
export const getHistoricoTarefa = createAsyncThunk(
  'tarefas/getHistoricoTarefa',
  async (tarefaId: string, { rejectWithValue }) => {
    try {
      const response = await tarefasService.getHistoricoTarefa(tarefaId);
      return {
        tarefaId,
        historico: response.dados || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const tarefasSlice = createSlice({
  name: 'tarefas',
  initialState,
  reducers: {
    // Definir tarefa ativa
    setTarefaAtiva: (state, action: PayloadAction<Tarefa | null>) => {
      state.tarefaAtiva = action.payload;
    },

    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },

    // Limpar resultados de busca
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.isSearching = false;
    },

    // Definir filtros
    setFiltros: (state, action: PayloadAction<Partial<TarefasState['filtros']>>) => {
      state.filtros = { ...state.filtros, ...action.payload };
    },

    // Limpar filtros
    clearFiltros: (state) => {
      state.filtros = {};
    },

    // Limpar tarefas de um grupo
    clearTarefasGrupo: (state, action: PayloadAction<string>) => {
      const grupoId = action.payload;
      delete state.tarefas[grupoId];
      delete state.minhasTarefas[grupoId];
      delete state.estatisticas[grupoId];
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // FETCH TAREFAS
      // ============================================
      .addCase(fetchTarefas.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTarefas.fulfilled, (state, action) => {
        state.isLoading = false;
        const { grupoId, tarefas } = action.payload;
        state.tarefas[grupoId] = tarefas;
      })
      .addCase(fetchTarefas.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // CREATE TAREFA
      // ============================================
      .addCase(createTarefa.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTarefa.fulfilled, (state, action) => {
        state.isLoading = false;
        const { grupoId, tarefa } = action.payload;
        
        if (!state.tarefas[grupoId]) {
          state.tarefas[grupoId] = [];
        }
        if (tarefa) {
          state.tarefas[grupoId].push(tarefa);
        }
      })
      .addCase(createTarefa.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // GET TAREFA
      // ============================================
      .addCase(getTarefa.fulfilled, (state, action) => {
        const tarefa = action.payload;
        if (tarefa) {
          // Atualizar no cache se já existe
          if (tarefa.grupo_id && state.tarefas[tarefa.grupo_id]) {
            const index = state.tarefas[tarefa.grupo_id].findIndex(t => t.id === tarefa.id);
            if (index !== -1) {
              state.tarefas[tarefa.grupo_id][index] = tarefa;
            }
          }
          state.tarefaAtiva = tarefa;
        }
      })

      // ============================================
      // UPDATE TAREFA
      // ============================================
      .addCase(updateTarefa.fulfilled, (state, action) => {
        const tarefaAtualizada = action.payload;
        
        if (tarefaAtualizada && tarefaAtualizada.grupo_id && state.tarefas[tarefaAtualizada.grupo_id]) {
          const index = state.tarefas[tarefaAtualizada.grupo_id].findIndex(t => t.id === tarefaAtualizada.id);
          if (index !== -1) {
            state.tarefas[tarefaAtualizada.grupo_id][index] = tarefaAtualizada;
          }
        }
        
        if (state.tarefaAtiva && state.tarefaAtiva.id === tarefaAtualizada?.id) {
          state.tarefaAtiva = tarefaAtualizada;
        }
      })

      // ============================================
      // DELETE TAREFA
      // ============================================
      .addCase(deleteTarefa.fulfilled, (state, action) => {
        const tarefaId = action.payload;
        
        // Remover tarefa de todos os grupos
        Object.keys(state.tarefas).forEach(grupoId => {
          if (state.tarefas[grupoId]) {
            state.tarefas[grupoId] = state.tarefas[grupoId].filter(t => t.id !== tarefaId);
          }
        });

        // Limpar se era a tarefa ativa
        if (state.tarefaAtiva?.id === tarefaId) {
          state.tarefaAtiva = null;
        }
      })

      // ============================================
      // FETCH MINHAS TAREFAS
      // ============================================
      .addCase(fetchMinhasTarefas.fulfilled, (state, action) => {
        const { grupoId, tarefas } = action.payload;
        state.minhasTarefas[grupoId] = tarefas;
      })

      // ============================================
      // BUSCAR TAREFAS
      // ============================================
      .addCase(buscarTarefas.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(buscarTarefas.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload || [];
      })
      .addCase(buscarTarefas.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      })

      // ============================================
      // ALTERAÇÃO DE STATUS
      // ============================================
      .addCase(concluirTarefa.fulfilled, (state, action) => {
        const tarefaAtualizada = action.payload;
        if (tarefaAtualizada && tarefaAtualizada.grupo_id && state.tarefas[tarefaAtualizada.grupo_id]) {
          const index = state.tarefas[tarefaAtualizada.grupo_id].findIndex(t => t.id === tarefaAtualizada.id);
          if (index !== -1) {
            state.tarefas[tarefaAtualizada.grupo_id][index] = tarefaAtualizada;
          }
        }
      })
      .addCase(iniciarTarefa.fulfilled, (state, action) => {
        const tarefaAtualizada = action.payload;
        if (tarefaAtualizada && tarefaAtualizada.grupo_id && state.tarefas[tarefaAtualizada.grupo_id]) {
          const index = state.tarefas[tarefaAtualizada.grupo_id].findIndex(t => t.id === tarefaAtualizada.id);
          if (index !== -1) {
            state.tarefas[tarefaAtualizada.grupo_id][index] = tarefaAtualizada;
          }
        }
      })
      .addCase(cancelarTarefa.fulfilled, (state, action) => {
        const tarefaAtualizada = action.payload;
        if (tarefaAtualizada && tarefaAtualizada.grupo_id && state.tarefas[tarefaAtualizada.grupo_id]) {
          const index = state.tarefas[tarefaAtualizada.grupo_id].findIndex(t => t.id === tarefaAtualizada.id);
          if (index !== -1) {
            state.tarefas[tarefaAtualizada.grupo_id][index] = tarefaAtualizada;
          }
        }
      })
      .addCase(atribuirTarefa.fulfilled, (state, action) => {
        const tarefaAtualizada = action.payload;
        if (tarefaAtualizada && tarefaAtualizada.grupo_id && state.tarefas[tarefaAtualizada.grupo_id]) {
          const index = state.tarefas[tarefaAtualizada.grupo_id].findIndex(t => t.id === tarefaAtualizada.id);
          if (index !== -1) {
            state.tarefas[tarefaAtualizada.grupo_id][index] = tarefaAtualizada;
          }
        }
      })

      // ============================================
      // COMENTÁRIOS
      // ============================================
      .addCase(addComentario.fulfilled, (state, action) => {
        const { tarefaId, comentario } = action.payload;
        if (!state.comentarios[tarefaId]) {
          state.comentarios[tarefaId] = [];
        }
        if (comentario) {
          state.comentarios[tarefaId].push(comentario);
        }
      })
      .addCase(getComentarios.fulfilled, (state, action) => {
        const { tarefaId, comentarios } = action.payload;
        state.comentarios[tarefaId] = comentarios;
      })
      .addCase(deleteComentario.fulfilled, (state, action) => {
        const { comentarioId, tarefaId } = action.payload;
        if (state.comentarios[tarefaId]) {
          state.comentarios[tarefaId] = state.comentarios[tarefaId].filter(c => c.id !== comentarioId);
        }
      })

      // ============================================
      // HORAS TRABALHADAS
      // ============================================
      .addCase(addHorasTrabalhadas.fulfilled, (state, action) => {
        const { tarefaId, hora } = action.payload;
        if (!state.horasTrabalhadas[tarefaId]) {
          state.horasTrabalhadas[tarefaId] = [];
        }
        if (hora) {
          state.horasTrabalhadas[tarefaId].push(hora);
        }
      })

      // ============================================
      // ESTATÍSTICAS
      // ============================================
      .addCase(getEstatisticasGrupo.fulfilled, (state, action) => {
        const { grupoId, estatisticas } = action.payload;
        state.estatisticas[grupoId] = estatisticas;
      })

      // ============================================
      // HISTÓRICO
      // ============================================
      .addCase(getHistoricoTarefa.fulfilled, (state, action) => {
        const { tarefaId, historico } = action.payload;
        state.historico[tarefaId] = historico;
      });
  },
});

export const {
  setTarefaAtiva,
  clearError,
  clearSearchResults,
  setFiltros,
  clearFiltros,
  clearTarefasGrupo,
} = tarefasSlice.actions;

export default tarefasSlice.reducer;
