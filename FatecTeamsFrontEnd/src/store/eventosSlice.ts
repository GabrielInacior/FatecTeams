import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import eventosService from '../services/eventosService';

// ============================================
// INTERFACES
// ============================================

interface Evento {
  id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim: string;
  local?: string;
  tipo: 'reuniao' | 'prazo' | 'workshop' | 'apresentacao' | 'outros';
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado' | 'adiado';
  is_dia_completo: boolean;
  cor: string;
  grupo_id?: string;
  tarefa_id?: string;
  criado_por: string;
  data_criacao: string;
  data_modificacao?: string;
  lembrete: {
    ativo: boolean;
    minutos_antes: number[];
    enviado: boolean;
  };
  recorrencia?: {
    tipo: 'diaria' | 'semanal' | 'quinzenal' | 'mensal' | 'anual';
    intervalo: number;
    dias_semana?: number[];
    data_fim?: string;
    max_ocorrencias?: number;
  };
  grupo?: {
    id: string;
    nome: string;
  };
  tarefa?: {
    id: string;
    titulo: string;
  };
  criador?: {
    id: string;
    nome: string;
    email: string;
    foto_perfil?: string;
  };
  participantes?: EventoParticipante[];
}

interface EventoParticipante {
  id: string;
  evento_id: string;
  usuario_id: string;
  status: 'convidado' | 'confirmado' | 'recusado' | 'tentativo';
  data_resposta?: string;
  comentario?: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    foto_perfil?: string;
  };
}

interface EventoConvite {
  id: string;
  evento_id: string;
  email: string;
  token: string;
  status: 'pendente' | 'aceito' | 'recusado';
  data_criacao: string;
  data_expiracao: string;
  data_resposta?: string;
}

interface FiltrosEvento {
  data_inicio?: string;
  data_fim?: string;
  tipo?: Evento['tipo'];
  status?: Evento['status'];
  grupo_id?: string;
  usuario_id?: string;
  criado_por?: string;
  is_dia_completo?: boolean;
  search?: string;
}

interface CreateEventoData {
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim: string;
  local?: string;
  tipo: Evento['tipo'];
  is_dia_completo?: boolean;
  cor?: string;
  grupo_id?: string;
  tarefa_id?: string;
  participantes?: string[];
  lembrete?: {
    ativo: boolean;
    minutos_antes: number[];
  };
  recorrencia?: Evento['recorrencia'];
}

interface UpdateEventoData extends Partial<CreateEventoData> {
  status?: Evento['status'];
}

interface EstatisticasEventos {
  total_eventos: number;
  eventos_por_status: { [status: string]: number };
  eventos_por_tipo: { [tipo: string]: number };
  eventos_por_mes: { mes: string; quantidade: number }[];
  taxa_participacao: number;
}

interface EventosState {
  // Listas de eventos
  eventos: Evento[];
  eventosPorGrupo: { [grupoId: string]: Evento[] };
  eventosPorTarefa: { [tarefaId: string]: Evento[] };
  meusEventos: Evento[];
  eventosHoje: Evento[];
  proximosEventos: Evento[];
  
  // Evento atualmente selecionado
  eventoAtivo: Evento | null;
  
  // Participantes e convites do evento ativo
  participantes: EventoParticipante[];
  convites: EventoConvite[];
  
  // Estados de carregamento
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Configurações de visualização (calendário)
  visualizacao: 'mes' | 'semana' | 'dia' | 'lista';
  dataAtual: string; // Data selecionada no calendário
  
  // Filtros ativos
  filtros: FiltrosEvento;
  
  // Estatísticas
  estatisticas: EstatisticasEventos | null;
  
  error: string | null;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: EventosState = {
  eventos: [],
  eventosPorGrupo: {},
  eventosPorTarefa: {},
  meusEventos: [],
  eventosHoje: [],
  proximosEventos: [],
  eventoAtivo: null,
  participantes: [],
  convites: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  visualizacao: 'mes',
  dataAtual: new Date().toISOString().split('T')[0],
  filtros: {},
  estatisticas: null,
  error: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Criar novo evento
 */
export const createEvento = createAsyncThunk(
  'eventos/createEvento',
  async (eventoData: CreateEventoData, { rejectWithValue }) => {
    try {
      const response = await eventosService.createEvento(eventoData);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar eventos com filtros
 */
export const fetchEventos = createAsyncThunk(
  'eventos/fetchEventos',
  async (params: { filtros?: FiltrosEvento; pagina?: number; limite?: number }, { rejectWithValue }) => {
    try {
      const response = await eventosService.getEventos(
        params.filtros || {},
        params.pagina || 1,
        params.limite || 50
      );
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar evento por ID
 */
export const fetchEvento = createAsyncThunk(
  'eventos/fetchEvento',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await eventosService.getEvento(id);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar eventos de um grupo
 */
export const fetchEventosGrupo = createAsyncThunk(
  'eventos/fetchEventosGrupo',
  async (params: { grupoId: string; filtros?: FiltrosEvento }, { rejectWithValue }) => {
    try {
      const response = await eventosService.getEventosGrupo(params.grupoId, params.filtros || {});
      return {
        grupoId: params.grupoId,
        eventos: response.dados || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar eventos de uma tarefa
 */
export const fetchEventosTarefa = createAsyncThunk(
  'eventos/fetchEventosTarefa',
  async (tarefaId: string, { rejectWithValue }) => {
    try {
      const response = await eventosService.getEventosTarefa(tarefaId);
      return {
        tarefaId,
        eventos: response.dados || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar meus eventos
 */
export const fetchMeusEventos = createAsyncThunk(
  'eventos/fetchMeusEventos',
  async (filtros: FiltrosEvento = {}, { rejectWithValue }) => {
    try {
      const response = await eventosService.getMeusEventos(filtros);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar eventos de hoje
 */
export const fetchEventosHoje = createAsyncThunk(
  'eventos/fetchEventosHoje',
  async (_, { rejectWithValue }) => {
    try {
      const response = await eventosService.getEventosHoje();
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar próximos eventos
 */
export const fetchProximosEventos = createAsyncThunk(
  'eventos/fetchProximosEventos',
  async (limite: number = 10, { rejectWithValue }) => {
    try {
      const response = await eventosService.getProximosEventos(limite);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar eventos por período
 */
export const fetchEventosPeriodo = createAsyncThunk(
  'eventos/fetchEventosPeriodo',
  async (params: { dataInicio: string; dataFim: string }, { rejectWithValue }) => {
    try {
      const response = await eventosService.getEventosPeriodo(params.dataInicio, params.dataFim);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Atualizar evento
 */
export const updateEvento = createAsyncThunk(
  'eventos/updateEvento',
  async (params: { id: string; dados: UpdateEventoData }, { rejectWithValue }) => {
    try {
      const response = await eventosService.updateEvento(params.id, params.dados);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Deletar evento
 */
export const deleteEvento = createAsyncThunk(
  'eventos/deleteEvento',
  async (id: string, { rejectWithValue }) => {
    try {
      await eventosService.deleteEvento(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Duplicar evento
 */
export const duplicarEvento = createAsyncThunk(
  'eventos/duplicarEvento',
  async (params: { id: string; novaData?: string }, { rejectWithValue }) => {
    try {
      const response = await eventosService.duplicarEvento(params.id, params.novaData);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Adicionar participante
 */
export const adicionarParticipante = createAsyncThunk(
  'eventos/adicionarParticipante',
  async (params: { eventoId: string; usuarioId: string }, { rejectWithValue }) => {
    try {
      const response = await eventosService.adicionarParticipante(params.eventoId, params.usuarioId);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Remover participante
 */
export const removerParticipante = createAsyncThunk(
  'eventos/removerParticipante',
  async (params: { eventoId: string; usuarioId: string }, { rejectWithValue }) => {
    try {
      await eventosService.removerParticipante(params.eventoId, params.usuarioId);
      return params;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar participantes do evento
 */
export const fetchParticipantes = createAsyncThunk(
  'eventos/fetchParticipantes',
  async (eventoId: string, { rejectWithValue }) => {
    try {
      const response = await eventosService.getParticipantes(eventoId);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Responder convite de participação
 */
export const responderConvite = createAsyncThunk(
  'eventos/responderConvite',
  async (params: { eventoId: string; status: EventoParticipante['status']; comentario?: string }, { rejectWithValue }) => {
    try {
      const response = await eventosService.responderConvite(params.eventoId, params.status, params.comentario);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Enviar convites por email
 */
export const enviarConviteEmail = createAsyncThunk(
  'eventos/enviarConviteEmail',
  async (params: { eventoId: string; emails: string[] }, { rejectWithValue }) => {
    try {
      const response = await eventosService.enviarConviteEmail(params.eventoId, params.emails);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar convites do evento
 */
export const fetchConvites = createAsyncThunk(
  'eventos/fetchConvites',
  async (eventoId: string, { rejectWithValue }) => {
    try {
      const response = await eventosService.getConvites(eventoId);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Configurar lembrete
 */
export const configurarLembrete = createAsyncThunk(
  'eventos/configurarLembrete',
  async (params: { eventoId: string; lembrete: Evento['lembrete'] }, { rejectWithValue }) => {
    try {
      const response = await eventosService.configurarLembrete(params.eventoId, params.lembrete);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Configurar recorrência
 */
export const configurarRecorrencia = createAsyncThunk(
  'eventos/configurarRecorrencia',
  async (params: { eventoId: string; recorrencia: Evento['recorrencia'] }, { rejectWithValue }) => {
    try {
      const response = await eventosService.configurarRecorrencia(params.eventoId, params.recorrencia);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar estatísticas
 */
export const fetchEstatisticas = createAsyncThunk(
  'eventos/fetchEstatisticas',
  async (_, { rejectWithValue }) => {
    try {
      const response = await eventosService.getEstatisticas();
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const eventosSlice = createSlice({
  name: 'eventos',
  initialState,
  reducers: {
    // Definir evento ativo
    setEventoAtivo: (state, action: PayloadAction<Evento | null>) => {
      state.eventoAtivo = action.payload;
    },

    // Atualizar filtros
    setFiltros: (state, action: PayloadAction<FiltrosEvento>) => {
      state.filtros = { ...state.filtros, ...action.payload };
    },

    // Limpar filtros
    clearFiltros: (state) => {
      state.filtros = {};
    },

    // Alterar visualização do calendário
    setVisualizacao: (state, action: PayloadAction<'mes' | 'semana' | 'dia' | 'lista'>) => {
      state.visualizacao = action.payload;
    },

    // Alterar data atual do calendário
    setDataAtual: (state, action: PayloadAction<string>) => {
      state.dataAtual = action.payload;
    },

    // Navegar no calendário
    navegarCalendario: (state, action: PayloadAction<'anterior' | 'proximo' | 'hoje'>) => {
      const dataAtual = new Date(state.dataAtual);
      
      switch (action.payload) {
        case 'anterior':
          if (state.visualizacao === 'mes') {
            dataAtual.setMonth(dataAtual.getMonth() - 1);
          } else if (state.visualizacao === 'semana') {
            dataAtual.setDate(dataAtual.getDate() - 7);
          } else if (state.visualizacao === 'dia') {
            dataAtual.setDate(dataAtual.getDate() - 1);
          }
          break;
        case 'proximo':
          if (state.visualizacao === 'mes') {
            dataAtual.setMonth(dataAtual.getMonth() + 1);
          } else if (state.visualizacao === 'semana') {
            dataAtual.setDate(dataAtual.getDate() + 7);
          } else if (state.visualizacao === 'dia') {
            dataAtual.setDate(dataAtual.getDate() + 1);
          }
          break;
        case 'hoje':
          dataAtual.setTime(new Date().getTime());
          break;
      }
      
      state.dataAtual = dataAtual.toISOString().split('T')[0];
    },

    // Atualizar status local de evento
    updateEventoStatus: (state, action: PayloadAction<{ id: string; status: Evento['status'] }>) => {
      const { id, status } = action.payload;
      
      const updateInList = (lista: Evento[]) => {
        const evento = lista.find(e => e.id === id);
        if (evento) {
          evento.status = status;
          evento.data_modificacao = new Date().toISOString();
        }
      };

      updateInList(state.eventos);
      updateInList(state.meusEventos);
      updateInList(state.eventosHoje);
      updateInList(state.proximosEventos);
      
      Object.values(state.eventosPorGrupo).forEach(updateInList);
      Object.values(state.eventosPorTarefa).forEach(updateInList);
      
      if (state.eventoAtivo?.id === id) {
        state.eventoAtivo.status = status;
        state.eventoAtivo.data_modificacao = new Date().toISOString();
      }
    },

    // Limpar dados
    clearEventos: (state) => {
      state.eventos = [];
    },

    clearEventosGrupo: (state, action: PayloadAction<string>) => {
      delete state.eventosPorGrupo[action.payload];
    },

    clearEventosTarefa: (state, action: PayloadAction<string>) => {
      delete state.eventosPorTarefa[action.payload];
    },

    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // CREATE EVENTO
      // ============================================
      .addCase(createEvento.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createEvento.fulfilled, (state, action) => {
        state.isCreating = false;
        if (action.payload) {
          state.eventos.push(action.payload);
          state.meusEventos.push(action.payload);
          
          // Adicionar ao grupo se especificado
          if (action.payload.grupo_id) {
            if (!state.eventosPorGrupo[action.payload.grupo_id]) {
              state.eventosPorGrupo[action.payload.grupo_id] = [];
            }
            state.eventosPorGrupo[action.payload.grupo_id].push(action.payload);
          }
          
          // Adicionar à tarefa se especificado
          if (action.payload.tarefa_id) {
            if (!state.eventosPorTarefa[action.payload.tarefa_id]) {
              state.eventosPorTarefa[action.payload.tarefa_id] = [];
            }
            state.eventosPorTarefa[action.payload.tarefa_id].push(action.payload);
          }
        }
      })
      .addCase(createEvento.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      })

      // ============================================
      // FETCH EVENTOS
      // ============================================
      .addCase(fetchEventos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventos.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.eventos = action.payload.eventos || [];
        }
      })
      .addCase(fetchEventos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // FETCH EVENTO
      // ============================================
      .addCase(fetchEvento.fulfilled, (state, action) => {
        if (action.payload) {
          state.eventoAtivo = action.payload;
          
          // Atualizar nas listas se já existir
          const updateInList = (lista: Evento[]) => {
            const index = lista.findIndex(e => e.id === action.payload!.id);
            if (index !== -1) {
              lista[index] = action.payload!;
            }
          };
          
          updateInList(state.eventos);
          updateInList(state.meusEventos);
          updateInList(state.eventosHoje);
          updateInList(state.proximosEventos);
          
          Object.values(state.eventosPorGrupo).forEach(updateInList);
          Object.values(state.eventosPorTarefa).forEach(updateInList);
        }
      })

      // ============================================
      // FETCH EVENTOS POR GRUPO
      // ============================================
      .addCase(fetchEventosGrupo.fulfilled, (state, action) => {
        const { grupoId, eventos } = action.payload;
        state.eventosPorGrupo[grupoId] = eventos;
      })

      // ============================================
      // FETCH EVENTOS POR TAREFA
      // ============================================
      .addCase(fetchEventosTarefa.fulfilled, (state, action) => {
        const { tarefaId, eventos } = action.payload;
        state.eventosPorTarefa[tarefaId] = eventos;
      })

      // ============================================
      // FETCH MEUS EVENTOS
      // ============================================
      .addCase(fetchMeusEventos.fulfilled, (state, action) => {
        state.meusEventos = action.payload;
      })

      // ============================================
      // FETCH EVENTOS HOJE
      // ============================================
      .addCase(fetchEventosHoje.fulfilled, (state, action) => {
        state.eventosHoje = action.payload;
      })

      // ============================================
      // FETCH PRÓXIMOS EVENTOS
      // ============================================
      .addCase(fetchProximosEventos.fulfilled, (state, action) => {
        state.proximosEventos = action.payload;
      })

      // ============================================
      // FETCH EVENTOS PERÍODO
      // ============================================
      .addCase(fetchEventosPeriodo.fulfilled, (state, action) => {
        state.eventos = action.payload;
      })

      // ============================================
      // UPDATE EVENTO
      // ============================================
      .addCase(updateEvento.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateEvento.fulfilled, (state, action) => {
        state.isUpdating = false;
        if (action.payload) {
          const updateInList = (lista: Evento[]) => {
            const index = lista.findIndex(e => e.id === action.payload!.id);
            if (index !== -1) {
              lista[index] = { ...lista[index], ...action.payload! };
            }
          };
          
          updateInList(state.eventos);
          updateInList(state.meusEventos);
          updateInList(state.eventosHoje);
          updateInList(state.proximosEventos);
          
          Object.values(state.eventosPorGrupo).forEach(updateInList);
          Object.values(state.eventosPorTarefa).forEach(updateInList);
          
          if (state.eventoAtivo?.id === action.payload.id) {
            state.eventoAtivo = { ...state.eventoAtivo, ...action.payload };
          }
        }
      })
      .addCase(updateEvento.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      })

      // ============================================
      // DELETE EVENTO
      // ============================================
      .addCase(deleteEvento.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteEvento.fulfilled, (state, action) => {
        state.isDeleting = false;
        const eventoId = action.payload;
        
        const removeFromList = (lista: Evento[]) => 
          lista.filter(e => e.id !== eventoId);
        
        state.eventos = removeFromList(state.eventos);
        state.meusEventos = removeFromList(state.meusEventos);
        state.eventosHoje = removeFromList(state.eventosHoje);
        state.proximosEventos = removeFromList(state.proximosEventos);
        
        Object.keys(state.eventosPorGrupo).forEach(grupoId => {
          state.eventosPorGrupo[grupoId] = removeFromList(state.eventosPorGrupo[grupoId]);
        });
        
        Object.keys(state.eventosPorTarefa).forEach(tarefaId => {
          state.eventosPorTarefa[tarefaId] = removeFromList(state.eventosPorTarefa[tarefaId]);
        });
        
        if (state.eventoAtivo?.id === eventoId) {
          state.eventoAtivo = null;
        }
      })
      .addCase(deleteEvento.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      })

      // ============================================
      // DUPLICAR EVENTO
      // ============================================
      .addCase(duplicarEvento.fulfilled, (state, action) => {
        if (action.payload) {
          state.eventos.push(action.payload);
          state.meusEventos.push(action.payload);
          
          if (action.payload.grupo_id && state.eventosPorGrupo[action.payload.grupo_id]) {
            state.eventosPorGrupo[action.payload.grupo_id].push(action.payload);
          }
          
          if (action.payload.tarefa_id && state.eventosPorTarefa[action.payload.tarefa_id]) {
            state.eventosPorTarefa[action.payload.tarefa_id].push(action.payload);
          }
        }
      })

      // ============================================
      // PARTICIPANTES
      // ============================================
      .addCase(fetchParticipantes.fulfilled, (state, action) => {
        state.participantes = action.payload;
      })

      .addCase(adicionarParticipante.fulfilled, (state, action) => {
        if (action.payload) {
          state.participantes.push(action.payload);
        }
      })

      .addCase(removerParticipante.fulfilled, (state, action) => {
        const { usuarioId } = action.payload;
        state.participantes = state.participantes.filter(p => p.usuario_id !== usuarioId);
      })

      .addCase(responderConvite.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.participantes.findIndex(p => p.id === action.payload!.id);
          if (index !== -1) {
            state.participantes[index] = action.payload;
          } else {
            state.participantes.push(action.payload);
          }
        }
      })

      // ============================================
      // CONVITES
      // ============================================
      .addCase(fetchConvites.fulfilled, (state, action) => {
        state.convites = action.payload;
      })

      .addCase(enviarConviteEmail.fulfilled, (state, action) => {
        const novosConvites = action.payload;
        state.convites.push(...novosConvites);
      })

      // ============================================
      // CONFIGURAÇÕES
      // ============================================
      .addCase(configurarLembrete.fulfilled, (state, action) => {
        if (action.payload && state.eventoAtivo?.id === action.payload.id) {
          state.eventoAtivo.lembrete = action.payload.lembrete;
        }
      })

      .addCase(configurarRecorrencia.fulfilled, (state, action) => {
        const eventosRecorrentes = action.payload;
        if (eventosRecorrentes.length > 0) {
          // Adicionar novos eventos da série
          state.eventos.push(...eventosRecorrentes);
          state.meusEventos.push(...eventosRecorrentes);
        }
      })

      // ============================================
      // ESTATÍSTICAS
      // ============================================
      .addCase(fetchEstatisticas.fulfilled, (state, action) => {
        state.estatisticas = action.payload || null;
      });
  },
});

export const {
  setEventoAtivo,
  setFiltros,
  clearFiltros,
  setVisualizacao,
  setDataAtual,
  navegarCalendario,
  updateEventoStatus,
  clearEventos,
  clearEventosGrupo,
  clearEventosTarefa,
  clearError,
} = eventosSlice.actions;

export default eventosSlice.reducer;
