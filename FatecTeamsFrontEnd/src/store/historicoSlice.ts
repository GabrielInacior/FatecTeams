import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import historicoService from '../services/historicoService';

// ============================================
// INTERFACES
// ============================================

interface AtividadeHistorico {
  id: string;
  usuario_id: string;
  tipo_atividade: 
    | 'login' | 'logout'
    | 'criar_grupo' | 'entrar_grupo' | 'sair_grupo' | 'atualizar_grupo'
    | 'criar_tarefa' | 'atualizar_tarefa' | 'concluir_tarefa' | 'comentar_tarefa'
    | 'enviar_mensagem' | 'editar_mensagem' | 'deletar_mensagem' | 'reagir_mensagem'
    | 'upload_arquivo' | 'download_arquivo' | 'compartilhar_arquivo'
    | 'criar_evento' | 'atualizar_evento' | 'participar_evento'
    | 'criar_convite' | 'aceitar_convite' | 'recusar_convite'
    | 'atualizar_perfil' | 'alterar_senha'
    | 'outros';
  descricao: string;
  dados_extras?: {
    [key: string]: any;
  };
  ip_address?: string;
  user_agent?: string;
  grupo_id?: string;
  tarefa_id?: string;
  mensagem_id?: string;
  arquivo_id?: string;
  evento_id?: string;
  data_atividade: string;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    foto_perfil?: string;
  };
  grupo?: {
    id: string;
    nome: string;
  };
  tarefa?: {
    id: string;
    titulo: string;
  };
}

interface FiltrosHistorico {
  usuario_id?: string;
  tipo_atividade?: AtividadeHistorico['tipo_atividade'] | AtividadeHistorico['tipo_atividade'][];
  grupo_id?: string;
  tarefa_id?: string;
  data_inicio?: string;
  data_fim?: string;
  ip_address?: string;
  search?: string;
}

interface EstatisticasAtividade {
  total_atividades: number;
  atividades_por_tipo: { [tipo: string]: number };
  atividades_por_dia: { data: string; quantidade: number }[];
  usuarios_mais_ativos: {
    usuario_id: string;
    nome: string;
    total_atividades: number;
    ultima_atividade: string;
  }[];
  grupos_mais_ativos: {
    grupo_id: string;
    nome: string;
    total_atividades: number;
  }[];
  tipos_mais_comuns: {
    tipo: string;
    quantidade: number;
    porcentagem: number;
  }[];
  horarios_pico: {
    hora: number;
    quantidade: number;
  }[];
}

interface RelatorioAtividade {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  resumo: {
    total_usuarios_ativos: number;
    total_atividades: number;
    media_atividades_por_usuario: number;
    crescimento_periodo_anterior: number;
  };
  detalhes_por_usuario: {
    usuario_id: string;
    nome: string;
    email: string;
    total_atividades: number;
    tipos_atividade: { [tipo: string]: number };
    primeiro_acesso: string;
    ultimo_acesso: string;
    grupos_participantes: string[];
  }[];
  detalhes_por_grupo: {
    grupo_id: string;
    nome: string;
    total_atividades: number;
    usuarios_ativos: number;
    atividade_media_por_membro: number;
  }[];
}

interface SessaoUsuario {
  id: string;
  usuario_id: string;
  ip_address: string;
  user_agent: string;
  data_inicio: string;
  data_fim?: string;
  duracao_minutos?: number;
  ativo: boolean;
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
}

interface HistoricoState {
  // Histórico de atividades
  meuHistorico: AtividadeHistorico[];
  historicoPorGrupo: { [grupoId: string]: AtividadeHistorico[] };
  historicoPorTarefa: { [tarefaId: string]: AtividadeHistorico[] };
  atividadesRecentes: AtividadeHistorico[];
  
  // Atividade específica sendo visualizada
  atividadeAtiva: AtividadeHistorico | null;
  
  // Sessões
  sessoesAtivas: SessaoUsuario[];
  minhasSessoes: SessaoUsuario[];
  
  // Estatísticas
  estatisticasUsuario: EstatisticasAtividade | null;
  estatisticasPorGrupo: { [grupoId: string]: EstatisticasAtividade };
  
  // Relatórios
  relatorioAtividade: RelatorioAtividade | null;
  
  // Estados de carregamento
  isLoading: boolean;
  isLoadingEstatisticas: boolean;
  isLoadingRelatorio: boolean;
  isExportando: boolean;
  
  // Configurações de visualização
  filtros: FiltrosHistorico;
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  agrupamento: 'data' | 'tipo' | 'usuario' | 'grupo';
  ordenacao: {
    campo: 'data' | 'tipo' | 'usuario';
    ordem: 'asc' | 'desc';
  };
  
  // Paginação
  paginacao: {
    pagina_atual: number;
    total_paginas: number;
    total_registros: number;
    limite: number;
  };
  
  error: string | null;
}

// ============================================
// INITIAL STATE
// ============================================

const hoje = new Date();
const umMesAtras = new Date(hoje);
umMesAtras.setMonth(hoje.getMonth() - 1);

const initialState: HistoricoState = {
  meuHistorico: [],
  historicoPorGrupo: {},
  historicoPorTarefa: {},
  atividadesRecentes: [],
  atividadeAtiva: null,
  sessoesAtivas: [],
  minhasSessoes: [],
  estatisticasUsuario: null,
  estatisticasPorGrupo: {},
  relatorioAtividade: null,
  isLoading: false,
  isLoadingEstatisticas: false,
  isLoadingRelatorio: false,
  isExportando: false,
  filtros: {},
  periodo: {
    data_inicio: umMesAtras.toISOString().split('T')[0],
    data_fim: hoje.toISOString().split('T')[0],
  },
  agrupamento: 'data',
  ordenacao: {
    campo: 'data',
    ordem: 'desc',
  },
  paginacao: {
    pagina_atual: 1,
    total_paginas: 1,
    total_registros: 0,
    limite: 50,
  },
  error: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Buscar meu histórico
 */
export const fetchMeuHistorico = createAsyncThunk(
  'historico/fetchMeuHistorico',
  async (params: { filtros?: FiltrosHistorico; pagina?: number; limite?: number }, { rejectWithValue }) => {
    try {
      const response = await historicoService.getMeuHistorico(
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
 * Buscar histórico de grupo
 */
export const fetchHistoricoGrupo = createAsyncThunk(
  'historico/fetchHistoricoGrupo',
  async (params: { grupoId: string; filtros?: FiltrosHistorico; pagina?: number; limite?: number }, { rejectWithValue }) => {
    try {
      const response = await historicoService.getHistoricoGrupo(
        params.grupoId,
        params.filtros || {},
        params.pagina || 1,
        params.limite || 50
      );
      return {
        grupoId: params.grupoId,
        dados: response.dados,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar histórico de tarefa
 */
export const fetchHistoricoTarefa = createAsyncThunk(
  'historico/fetchHistoricoTarefa',
  async (params: { tarefaId: string; pagina?: number; limite?: number }, { rejectWithValue }) => {
    try {
      const response = await historicoService.getHistoricoTarefa(
        params.tarefaId,
        params.pagina || 1,
        params.limite || 20
      );
      return {
        tarefaId: params.tarefaId,
        dados: response.dados,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar atividade específica
 */
export const fetchAtividade = createAsyncThunk(
  'historico/fetchAtividade',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await historicoService.getAtividade(id);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar atividades recentes
 */
export const fetchAtividadesRecentes = createAsyncThunk(
  'historico/fetchAtividadesRecentes',
  async (limite: number = 10, { rejectWithValue }) => {
    try {
      const response = await historicoService.getAtividadesRecentes(limite);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar estatísticas do usuário
 */
export const fetchEstatisticasUsuario = createAsyncThunk(
  'historico/fetchEstatisticasUsuario',
  async (filtros: { data_inicio?: string; data_fim?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await historicoService.getEstatisticasUsuario(filtros);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar estatísticas de grupo
 */
export const fetchEstatisticasGrupo = createAsyncThunk(
  'historico/fetchEstatisticasGrupo',
  async (params: { grupoId: string; filtros?: { data_inicio?: string; data_fim?: string } }, { rejectWithValue }) => {
    try {
      const response = await historicoService.getEstatisticasGrupo(params.grupoId, params.filtros || {});
      return {
        grupoId: params.grupoId,
        estatisticas: response.dados,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar top usuários do grupo
 */
export const fetchTopUsuariosGrupo = createAsyncThunk(
  'historico/fetchTopUsuariosGrupo',
  async (params: { grupoId: string; limite?: number }, { rejectWithValue }) => {
    try {
      const response = await historicoService.getTopUsuariosGrupo(params.grupoId, params.limite || 10);
      return {
        grupoId: params.grupoId,
        topUsuarios: response.dados || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Gerar relatório de atividade
 */
export const gerarRelatorioAtividade = createAsyncThunk(
  'historico/gerarRelatorioAtividade',
  async (filtros: {
    data_inicio: string;
    data_fim: string;
    grupo_id?: string;
    formato?: 'json' | 'csv' | 'pdf';
    incluir_detalhes?: boolean;
  }, { rejectWithValue }) => {
    try {
      const response = await historicoService.gerarRelatorioAtividade(filtros);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Exportar histórico
 */
export const exportarHistorico = createAsyncThunk(
  'historico/exportarHistorico',
  async (filtros: FiltrosHistorico & {
    formato: 'csv' | 'json' | 'xlsx';
    incluir_dados_relacionados?: boolean;
  }, { rejectWithValue }) => {
    try {
      const response = await historicoService.exportarHistorico(filtros);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar sessões ativas
 */
export const fetchSessoesAtivas = createAsyncThunk(
  'historico/fetchSessoesAtivas',
  async (_, { rejectWithValue }) => {
    try {
      const response = await historicoService.getSessoesAtivas();
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar minhas sessões
 */
export const fetchMinhasSessoes = createAsyncThunk(
  'historico/fetchMinhasSessoes',
  async (limite: number = 20, { rejectWithValue }) => {
    try {
      const response = await historicoService.getMinhasSessoes(limite);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Encerrar sessão
 */
export const encerrarSessao = createAsyncThunk(
  'historico/encerrarSessao',
  async (sessaoId: string, { rejectWithValue }) => {
    try {
      await historicoService.encerrarSessao(sessaoId);
      return sessaoId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Encerrar outras sessões
 */
export const encerrarOutrasSessoes = createAsyncThunk(
  'historico/encerrarOutrasSessoes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await historicoService.encerrarOutrasSessoes();
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const historicoSlice = createSlice({
  name: 'historico',
  initialState,
  reducers: {
    // Definir atividade ativa
    setAtividadeAtiva: (state, action: PayloadAction<AtividadeHistorico | null>) => {
      state.atividadeAtiva = action.payload;
    },

    // Atualizar filtros
    setFiltros: (state, action: PayloadAction<FiltrosHistorico>) => {
      state.filtros = { ...state.filtros, ...action.payload };
    },

    // Limpar filtros
    clearFiltros: (state) => {
      state.filtros = {};
    },

    // Definir período
    setPeriodo: (state, action: PayloadAction<{ data_inicio: string; data_fim: string }>) => {
      state.periodo = action.payload;
    },

    // Alterar agrupamento
    setAgrupamento: (state, action: PayloadAction<'data' | 'tipo' | 'usuario' | 'grupo'>) => {
      state.agrupamento = action.payload;
    },

    // Alterar ordenação
    setOrdenacao: (state, action: PayloadAction<{ campo: 'data' | 'tipo' | 'usuario'; ordem: 'asc' | 'desc' }>) => {
      state.ordenacao = action.payload;
    },

    // Alterar página
    setPagina: (state, action: PayloadAction<number>) => {
      state.paginacao.pagina_atual = action.payload;
    },

    // Alterar limite por página
    setLimite: (state, action: PayloadAction<number>) => {
      state.paginacao.limite = action.payload;
    },

    // Limpar dados
    clearMeuHistorico: (state) => {
      state.meuHistorico = [];
    },

    clearHistoricoGrupo: (state, action: PayloadAction<string>) => {
      delete state.historicoPorGrupo[action.payload];
    },

    clearHistoricoTarefa: (state, action: PayloadAction<string>) => {
      delete state.historicoPorTarefa[action.payload];
    },

    clearEstatisticas: (state) => {
      state.estatisticasUsuario = null;
      state.estatisticasPorGrupo = {};
    },

    clearRelatorio: (state) => {
      state.relatorioAtividade = null;
    },

    // Adicionar nova atividade em tempo real
    addAtividadeRecente: (state, action: PayloadAction<AtividadeHistorico>) => {
      state.atividadesRecentes.unshift(action.payload);
      state.meuHistorico.unshift(action.payload);
      
      // Limitar atividades recentes
      if (state.atividadesRecentes.length > 20) {
        state.atividadesRecentes = state.atividadesRecentes.slice(0, 20);
      }
      
      // Adicionar ao histórico do grupo se aplicável
      if (action.payload.grupo_id) {
        const grupoId = action.payload.grupo_id;
        if (state.historicoPorGrupo[grupoId]) {
          state.historicoPorGrupo[grupoId].unshift(action.payload);
        }
      }
      
      // Adicionar ao histórico da tarefa se aplicável
      if (action.payload.tarefa_id) {
        const tarefaId = action.payload.tarefa_id;
        if (state.historicoPorTarefa[tarefaId]) {
          state.historicoPorTarefa[tarefaId].unshift(action.payload);
        }
      }
    },

    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // FETCH MEU HISTÓRICO
      // ============================================
      .addCase(fetchMeuHistorico.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMeuHistorico.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.meuHistorico = action.payload.atividades || [];
          state.paginacao = {
            pagina_atual: action.payload.pagina || 1,
            total_paginas: action.payload.total_paginas || 1,
            total_registros: action.payload.total || 0,
            limite: action.payload.limite || 50,
          };
        }
      })
      .addCase(fetchMeuHistorico.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // FETCH HISTÓRICO GRUPO
      // ============================================
      .addCase(fetchHistoricoGrupo.fulfilled, (state, action) => {
        const { grupoId, dados } = action.payload;
        if (dados) {
          state.historicoPorGrupo[grupoId] = dados.atividades || [];
        }
      })

      // ============================================
      // FETCH HISTÓRICO TAREFA
      // ============================================
      .addCase(fetchHistoricoTarefa.fulfilled, (state, action) => {
        const { tarefaId, dados } = action.payload;
        if (dados) {
          state.historicoPorTarefa[tarefaId] = dados.atividades || [];
        }
      })

      // ============================================
      // FETCH ATIVIDADE
      // ============================================
      .addCase(fetchAtividade.fulfilled, (state, action) => {
        if (action.payload) {
          state.atividadeAtiva = action.payload;
        }
      })

      // ============================================
      // FETCH ATIVIDADES RECENTES
      // ============================================
      .addCase(fetchAtividadesRecentes.fulfilled, (state, action) => {
        state.atividadesRecentes = action.payload;
      })

      // ============================================
      // ESTATÍSTICAS USUÁRIO
      // ============================================
      .addCase(fetchEstatisticasUsuario.pending, (state) => {
        state.isLoadingEstatisticas = true;
        state.error = null;
      })
      .addCase(fetchEstatisticasUsuario.fulfilled, (state, action) => {
        state.isLoadingEstatisticas = false;
        state.estatisticasUsuario = action.payload || null;
      })
      .addCase(fetchEstatisticasUsuario.rejected, (state, action) => {
        state.isLoadingEstatisticas = false;
        state.error = action.payload as string;
      })

      // ============================================
      // ESTATÍSTICAS GRUPO
      // ============================================
      .addCase(fetchEstatisticasGrupo.fulfilled, (state, action) => {
        const { grupoId, estatisticas } = action.payload;
        if (estatisticas) {
          state.estatisticasPorGrupo[grupoId] = estatisticas;
        }
      })

      // ============================================
      // TOP USUÁRIOS GRUPO
      // ============================================
      .addCase(fetchTopUsuariosGrupo.fulfilled, (state, action) => {
        const { grupoId, topUsuarios } = action.payload;
        if (state.estatisticasPorGrupo[grupoId]) {
          state.estatisticasPorGrupo[grupoId].usuarios_mais_ativos = topUsuarios;
        }
      })

      // ============================================
      // RELATÓRIO ATIVIDADE
      // ============================================
      .addCase(gerarRelatorioAtividade.pending, (state) => {
        state.isLoadingRelatorio = true;
        state.error = null;
      })
      .addCase(gerarRelatorioAtividade.fulfilled, (state, action) => {
        state.isLoadingRelatorio = false;
        state.relatorioAtividade = action.payload || null;
      })
      .addCase(gerarRelatorioAtividade.rejected, (state, action) => {
        state.isLoadingRelatorio = false;
        state.error = action.payload as string;
      })

      // ============================================
      // EXPORTAR HISTÓRICO
      // ============================================
      .addCase(exportarHistorico.pending, (state) => {
        state.isExportando = true;
        state.error = null;
      })
      .addCase(exportarHistorico.fulfilled, (state) => {
        state.isExportando = false;
      })
      .addCase(exportarHistorico.rejected, (state, action) => {
        state.isExportando = false;
        state.error = action.payload as string;
      })

      // ============================================
      // SESSÕES
      // ============================================
      .addCase(fetchSessoesAtivas.fulfilled, (state, action) => {
        state.sessoesAtivas = action.payload;
      })

      .addCase(fetchMinhasSessoes.fulfilled, (state, action) => {
        state.minhasSessoes = action.payload;
      })

      .addCase(encerrarSessao.fulfilled, (state, action) => {
        const sessaoId = action.payload;
        state.sessoesAtivas = state.sessoesAtivas.filter(s => s.id !== sessaoId);
        state.minhasSessoes = state.minhasSessoes.map(s => 
          s.id === sessaoId ? { ...s, ativo: false, data_fim: new Date().toISOString() } : s
        );
      })

      .addCase(encerrarOutrasSessoes.fulfilled, (state, action) => {
        if (action.payload) {
          // Atualizar sessões baseado no resultado
          const { sessoes_encerradas } = action.payload;
          if (sessoes_encerradas > 0) {
            // Recarregar sessões
            state.sessoesAtivas = [];
            state.minhasSessoes = [];
          }
        }
      });
  },
});

export const {
  setAtividadeAtiva,
  setFiltros,
  clearFiltros,
  setPeriodo,
  setAgrupamento,
  setOrdenacao,
  setPagina,
  setLimite,
  clearMeuHistorico,
  clearHistoricoGrupo,
  clearHistoricoTarefa,
  clearEstatisticas,
  clearRelatorio,
  addAtividadeRecente,
  clearError,
} = historicoSlice.actions;

export default historicoSlice.reducer;
