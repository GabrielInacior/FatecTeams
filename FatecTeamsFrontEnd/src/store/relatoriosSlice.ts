import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import relatoriosService from '../services/relatoriosService';

// ============================================
// INTERFACES
// ============================================

interface RelatorioBase {
  id: string;
  titulo: string;
  tipo: 'atividade' | 'desempenho' | 'uso' | 'personalizado';
  formato: 'json' | 'csv' | 'pdf' | 'xlsx';
  status: 'gerando' | 'concluido' | 'erro';
  gerado_por: string;
  data_geracao: string;
  data_expiracao?: string;
  url_download?: string;
  tamanho_arquivo?: number;
  parametros: {
    data_inicio: string;
    data_fim: string;
    grupo_id?: string;
    usuario_id?: string;
    filtros_adicionais?: { [key: string]: any };
  };
  gerador?: {
    id: string;
    nome: string;
    email: string;
  };
  grupo?: {
    id: string;
    nome: string;
  };
}

interface RelatorioAtividade {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  resumo_geral: {
    total_usuarios_ativos: number;
    total_atividades: number;
    total_grupos_ativos: number;
    media_atividades_por_usuario: number;
    crescimento_periodo_anterior: number;
  };
  atividades_por_tipo: {
    tipo: string;
    quantidade: number;
    porcentagem: number;
    crescimento: number;
  }[];
  atividades_por_periodo: {
    data: string;
    quantidade: number;
    usuarios_unicos: number;
  }[];
  usuarios_mais_ativos: {
    usuario_id: string;
    nome: string;
    email: string;
    total_atividades: number;
    tipos_atividade: { [tipo: string]: number };
    primeiro_acesso: string;
    ultimo_acesso: string;
  }[];
  grupos_mais_ativos: {
    grupo_id: string;
    nome: string;
    total_atividades: number;
    usuarios_ativos: number;
    atividade_media_por_membro: number;
  }[];
}

interface RelatorioDesempenho {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  usuario?: {
    id: string;
    nome: string;
    email: string;
  };
  grupo?: {
    id: string;
    nome: string;
  };
  metricas_gerais: {
    tarefas_criadas: number;
    tarefas_concluidas: number;
    taxa_conclusao: number;
    tempo_medio_conclusao_horas: number;
    mensagens_enviadas: number;
    arquivos_compartilhados: number;
    eventos_criados: number;
    eventos_participados: number;
  };
  desempenho_tarefas: {
    total_tarefas: number;
    concluidas_no_prazo: number;
    concluidas_com_atraso: number;
    em_andamento: number;
    atrasadas: number;
    taxa_pontualidade: number;
  };
  distribuicao_por_prioridade: {
    prioridade: string;
    total: number;
    concluidas: number;
    taxa_conclusao: number;
  }[];
  evolucao_temporal: {
    mes: string;
    tarefas_criadas: number;
    tarefas_concluidas: number;
    taxa_conclusao: number;
  }[];
  colaboracao: {
    grupos_participantes: number;
    interacoes_mensagens: number;
    arquivos_compartilhados: number;
    eventos_organizados: number;
  };
}

interface RelatorioUso {
  periodo: {
    data_inicio: string;
    data_fim: string;
  };
  metricas_plataforma: {
    usuarios_registrados: number;
    usuarios_ativos: number;
    taxa_ativacao: number;
    sessoes_totais: number;
    tempo_medio_sessao_minutos: number;
    grupos_criados: number;
    grupos_ativos: number;
  };
  engagement: {
    usuarios_diarios_ativos: number;
    usuarios_semanais_ativos: number;
    usuarios_mensais_ativos: number;
    taxa_retencao_7_dias: number;
    taxa_retencao_30_dias: number;
  };
  funcionalidades_mais_usadas: {
    funcionalidade: string;
    uso_total: number;
    usuarios_unicos: number;
    crescimento: number;
  }[];
  dispositivos_navegadores: {
    dispositivo?: string;
    navegador?: string;
    sistema_operacional?: string;
    quantidade: number;
    porcentagem: number;
  }[];
  horarios_pico: {
    hora: number;
    dia_semana: string;
    atividade_media: number;
  }[];
  geografica?: {
    pais?: string;
    regiao?: string;
    usuarios: number;
    atividade_total: number;
  }[];
}

interface ConfiguracaoRelatorio {
  titulo: string;
  tipo: RelatorioBase['tipo'];
  formato: RelatorioBase['formato'];
  agendamento?: {
    ativo: boolean;
    frequencia: 'diaria' | 'semanal' | 'mensal' | 'trimestral';
    dia_semana?: number;
    dia_mes?: number;
    hora: number;
    emails_destinatarios: string[];
  };
  parametros: {
    data_inicio: string;
    data_fim: string;
    grupo_id?: string;
    usuario_id?: string;
    incluir_detalhes?: boolean;
    incluir_graficos?: boolean;
    incluir_dados_brutos?: boolean;
    filtros_personalizados?: { [key: string]: any };
  };
}

interface DashboardExecutivo {
  periodo_atual: {
    data_inicio: string;
    data_fim: string;
  };
  kpis_principais: {
    usuarios_ativos_mes: number;
    crescimento_usuarios: number;
    engagement_score: number;
    satisfacao_media: number;
    tempo_resposta_medio_horas: number;
  };
  metricas_rapidas: {
    grupos_criados_mes: number;
    tarefas_concluidas_mes: number;
    mensagens_enviadas_mes: number;
    arquivos_compartilhados_mes: number;
  };
  tendencias: {
    usuarios_novos_por_dia: { data: string; quantidade: number }[];
    atividade_por_semana: { semana: string; atividade: number }[];
    crescimento_grupos: { mes: string; grupos: number }[];
  };
  top_grupos: {
    grupo_id: string;
    nome: string;
    membros: number;
    atividade_score: number;
    crescimento: number;
  }[];
  alertas: {
    tipo: 'info' | 'warning' | 'error';
    titulo: string;
    descricao: string;
    data: string;
  }[];
}

interface FiltrosRelatorio {
  tipo?: RelatorioBase['tipo'];
  formato?: RelatorioBase['formato'];
  status?: RelatorioBase['status'];
  gerado_por?: string;
  grupo_id?: string;
  data_inicio?: string;
  data_fim?: string;
}

interface RelatoriosState {
  // Lista de relatórios
  relatorios: RelatorioBase[];
  relatoriosAgendados: {
    id: string;
    configuracao: ConfiguracaoRelatorio;
    proximo_execucao: string;
    ultimo_execucao?: string;
    status: 'ativo' | 'pausado' | 'erro';
  }[];
  
  // Relatório ativo sendo visualizado
  relatorioAtivo: RelatorioBase | null;
  dadosRelatorioAtivo: RelatorioAtividade | RelatorioDesempenho | RelatorioUso | null;
  
  // Dashboard executivo
  dashboardExecutivo: DashboardExecutivo | null;
  kpisPrincipais: DashboardExecutivo['kpis_principais'] | null;
  metricasRapidas: DashboardExecutivo['metricas_rapidas'] | null;
  
  // Estados de carregamento
  isLoading: boolean;
  isGenerating: boolean;
  isExporting: boolean;
  isLoadingDashboard: boolean;
  
  // Configurações
  filtros: FiltrosRelatorio;
  configuracaoAtiva: ConfiguracaoRelatorio | null;
  
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

const initialState: RelatoriosState = {
  relatorios: [],
  relatoriosAgendados: [],
  relatorioAtivo: null,
  dadosRelatorioAtivo: null,
  dashboardExecutivo: null,
  kpisPrincipais: null,
  metricasRapidas: null,
  isLoading: false,
  isGenerating: false,
  isExporting: false,
  isLoadingDashboard: false,
  filtros: {},
  configuracaoAtiva: null,
  paginacao: {
    pagina_atual: 1,
    total_paginas: 1,
    total_registros: 0,
    limite: 20,
  },
  error: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Gerar relatório de atividade
 */
export const gerarRelatorioAtividade = createAsyncThunk(
  'relatorios/gerarRelatorioAtividade',
  async (configuracao: Omit<ConfiguracaoRelatorio, 'tipo'>, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.gerarRelatorioAtividade(configuracao);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Gerar relatório de desempenho
 */
export const gerarRelatorioDesempenho = createAsyncThunk(
  'relatorios/gerarRelatorioDesempenho',
  async (configuracao: Omit<ConfiguracaoRelatorio, 'tipo'>, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.gerarRelatorioDesempenho(configuracao);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Gerar relatório de uso
 */
export const gerarRelatorioUso = createAsyncThunk(
  'relatorios/gerarRelatorioUso',
  async (configuracao: Omit<ConfiguracaoRelatorio, 'tipo'>, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.gerarRelatorioUso(configuracao);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Gerar relatório personalizado
 */
export const gerarRelatorioPersonalizado = createAsyncThunk(
  'relatorios/gerarRelatorioPersonalizado',
  async (configuracao: ConfiguracaoRelatorio, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.gerarRelatorioPersonalizado(configuracao);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar relatórios
 */
export const fetchRelatorios = createAsyncThunk(
  'relatorios/fetchRelatorios',
  async (params: { filtros?: FiltrosRelatorio; pagina?: number; limite?: number }, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.getRelatorios(
        params.filtros || {},
        params.pagina || 1,
        params.limite || 20
      );
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar relatório por ID
 */
export const fetchRelatorio = createAsyncThunk(
  'relatorios/fetchRelatorio',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.getRelatorio(id);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar dados do relatório
 */
export const fetchDadosRelatorio = createAsyncThunk(
  'relatorios/fetchDadosRelatorio',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.getDadosRelatorio(id);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Download de relatório
 */
export const downloadRelatorio = createAsyncThunk(
  'relatorios/downloadRelatorio',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.downloadRelatorio(id);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Deletar relatório
 */
export const deleteRelatorio = createAsyncThunk(
  'relatorios/deleteRelatorio',
  async (id: string, { rejectWithValue }) => {
    try {
      await relatoriosService.deleteRelatorio(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Recriar relatório
 */
export const recrearRelatorio = createAsyncThunk(
  'relatorios/recrearRelatorio',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.recrearRelatorio(id);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Exportar relatório rápido
 */
export const exportarRapido = createAsyncThunk(
  'relatorios/exportarRapido',
  async (params: {
    tipo: 'atividade' | 'desempenho' | 'uso';
    parametros: {
      data_inicio: string;
      data_fim: string;
      formato: 'csv' | 'json' | 'xlsx';
      grupo_id?: string;
      usuario_id?: string;
      filtros?: { [key: string]: any };
    };
  }, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.exportarRapido(params.tipo, params.parametros);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar dashboard executivo
 */
export const fetchDashboardExecutivo = createAsyncThunk(
  'relatorios/fetchDashboardExecutivo',
  async (parametros: {
    periodo?: 'semana' | 'mes' | 'trimestre' | 'ano';
    data_inicio?: string;
    data_fim?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.getDashboardExecutivo(parametros);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar KPIs principais
 */
export const fetchKpisPrincipais = createAsyncThunk(
  'relatorios/fetchKpisPrincipais',
  async (_, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.getKpisPrincipais();
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar métricas rápidas
 */
export const fetchMetricasRapidas = createAsyncThunk(
  'relatorios/fetchMetricasRapidas',
  async (_, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.getMetricasRapidas();
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Criar relatório agendado
 */
export const criarRelatorioAgendado = createAsyncThunk(
  'relatorios/criarRelatorioAgendado',
  async (configuracao: ConfiguracaoRelatorio, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.criarRelatorioAgendado(configuracao);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar relatórios agendados
 */
export const fetchRelatoriosAgendados = createAsyncThunk(
  'relatorios/fetchRelatoriosAgendados',
  async (_, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.getRelatoriosAgendados();
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Atualizar relatório agendado
 */
export const updateRelatorioAgendado = createAsyncThunk(
  'relatorios/updateRelatorioAgendado',
  async (params: { id: string; configuracao: Partial<ConfiguracaoRelatorio> }, { rejectWithValue }) => {
    try {
      await relatoriosService.updateRelatorioAgendado(params.id, params.configuracao);
      return params;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Toggle relatório agendado
 */
export const toggleRelatorioAgendado = createAsyncThunk(
  'relatorios/toggleRelatorioAgendado',
  async (params: { id: string; ativo: boolean }, { rejectWithValue }) => {
    try {
      await relatoriosService.toggleRelatorioAgendado(params.id, params.ativo);
      return params;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Deletar relatório agendado
 */
export const deleteRelatorioAgendado = createAsyncThunk(
  'relatorios/deleteRelatorioAgendado',
  async (id: string, { rejectWithValue }) => {
    try {
      await relatoriosService.deleteRelatorioAgendado(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Executar relatório agendado
 */
export const executarRelatorioAgendado = createAsyncThunk(
  'relatorios/executarRelatorioAgendado',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await relatoriosService.executarRelatorioAgendado(id);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const relatoriosSlice = createSlice({
  name: 'relatorios',
  initialState,
  reducers: {
    // Definir relatório ativo
    setRelatorioAtivo: (state, action: PayloadAction<RelatorioBase | null>) => {
      state.relatorioAtivo = action.payload;
      if (!action.payload) {
        state.dadosRelatorioAtivo = null;
      }
    },

    // Definir configuração ativa
    setConfiguracaoAtiva: (state, action: PayloadAction<ConfiguracaoRelatorio | null>) => {
      state.configuracaoAtiva = action.payload;
    },

    // Atualizar filtros
    setFiltros: (state, action: PayloadAction<FiltrosRelatorio>) => {
      state.filtros = { ...state.filtros, ...action.payload };
    },

    // Limpar filtros
    clearFiltros: (state) => {
      state.filtros = {};
    },

    // Alterar página
    setPagina: (state, action: PayloadAction<number>) => {
      state.paginacao.pagina_atual = action.payload;
    },

    // Alterar limite por página
    setLimite: (state, action: PayloadAction<number>) => {
      state.paginacao.limite = action.payload;
    },

    // Atualizar status do relatório
    updateRelatorioStatus: (state, action: PayloadAction<{ id: string; status: RelatorioBase['status']; url_download?: string }>) => {
      const { id, status, url_download } = action.payload;
      
      const relatorio = state.relatorios.find(r => r.id === id);
      if (relatorio) {
        relatorio.status = status;
        if (url_download) {
          relatorio.url_download = url_download;
        }
      }
      
      if (state.relatorioAtivo?.id === id) {
        state.relatorioAtivo.status = status;
        if (url_download) {
          state.relatorioAtivo.url_download = url_download;
        }
      }
    },

    // Adicionar novo relatório
    addRelatorio: (state, action: PayloadAction<RelatorioBase>) => {
      state.relatorios.unshift(action.payload);
      state.paginacao.total_registros += 1;
    },

    // Limpar dados
    clearRelatorios: (state) => {
      state.relatorios = [];
      state.paginacao = initialState.paginacao;
    },

    clearDashboard: (state) => {
      state.dashboardExecutivo = null;
      state.kpisPrincipais = null;
      state.metricasRapidas = null;
    },

    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // GERAR RELATÓRIOS
      // ============================================
      .addCase(gerarRelatorioAtividade.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(gerarRelatorioAtividade.fulfilled, (state, action) => {
        state.isGenerating = false;
        if (action.payload) {
          state.relatorios.unshift(action.payload);
          state.paginacao.total_registros += 1;
        }
      })
      .addCase(gerarRelatorioAtividade.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      })

      .addCase(gerarRelatorioDesempenho.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(gerarRelatorioDesempenho.fulfilled, (state, action) => {
        state.isGenerating = false;
        if (action.payload) {
          state.relatorios.unshift(action.payload);
          state.paginacao.total_registros += 1;
        }
      })
      .addCase(gerarRelatorioDesempenho.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      })

      .addCase(gerarRelatorioUso.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(gerarRelatorioUso.fulfilled, (state, action) => {
        state.isGenerating = false;
        if (action.payload) {
          state.relatorios.unshift(action.payload);
          state.paginacao.total_registros += 1;
        }
      })
      .addCase(gerarRelatorioUso.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      })

      .addCase(gerarRelatorioPersonalizado.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(gerarRelatorioPersonalizado.fulfilled, (state, action) => {
        state.isGenerating = false;
        if (action.payload) {
          state.relatorios.unshift(action.payload);
          state.paginacao.total_registros += 1;
        }
      })
      .addCase(gerarRelatorioPersonalizado.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      })

      // ============================================
      // FETCH RELATÓRIOS
      // ============================================
      .addCase(fetchRelatorios.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRelatorios.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.relatorios = action.payload.relatorios || [];
          state.paginacao = {
            pagina_atual: action.payload.pagina || 1,
            total_paginas: action.payload.total_paginas || 1,
            total_registros: action.payload.total || 0,
            limite: action.payload.limite || 20,
          };
        }
      })
      .addCase(fetchRelatorios.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // FETCH RELATÓRIO
      // ============================================
      .addCase(fetchRelatorio.fulfilled, (state, action) => {
        if (action.payload) {
          state.relatorioAtivo = action.payload;
          
          // Atualizar na lista se já existir
          const index = state.relatorios.findIndex(r => r.id === action.payload!.id);
          if (index !== -1) {
            state.relatorios[index] = action.payload;
          }
        }
      })

      // ============================================
      // FETCH DADOS RELATÓRIO
      // ============================================
      .addCase(fetchDadosRelatorio.fulfilled, (state, action) => {
        state.dadosRelatorioAtivo = action.payload || null;
      })

      // ============================================
      // DELETE RELATÓRIO
      // ============================================
      .addCase(deleteRelatorio.fulfilled, (state, action) => {
        const relatorioId = action.payload;
        state.relatorios = state.relatorios.filter(r => r.id !== relatorioId);
        state.paginacao.total_registros = Math.max(0, state.paginacao.total_registros - 1);
        
        if (state.relatorioAtivo?.id === relatorioId) {
          state.relatorioAtivo = null;
          state.dadosRelatorioAtivo = null;
        }
      })

      // ============================================
      // RECRIAR RELATÓRIO
      // ============================================
      .addCase(recrearRelatorio.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.relatorios.findIndex(r => r.id === action.payload!.id);
          if (index !== -1) {
            state.relatorios[index] = action.payload;
          }
          
          if (state.relatorioAtivo?.id === action.payload.id) {
            state.relatorioAtivo = action.payload;
          }
        }
      })

      // ============================================
      // EXPORTAR RÁPIDO
      // ============================================
      .addCase(exportarRapido.pending, (state) => {
        state.isExporting = true;
        state.error = null;
      })
      .addCase(exportarRapido.fulfilled, (state) => {
        state.isExporting = false;
      })
      .addCase(exportarRapido.rejected, (state, action) => {
        state.isExporting = false;
        state.error = action.payload as string;
      })

      // ============================================
      // DASHBOARD EXECUTIVO
      // ============================================
      .addCase(fetchDashboardExecutivo.pending, (state) => {
        state.isLoadingDashboard = true;
        state.error = null;
      })
      .addCase(fetchDashboardExecutivo.fulfilled, (state, action) => {
        state.isLoadingDashboard = false;
        state.dashboardExecutivo = action.payload || null;
      })
      .addCase(fetchDashboardExecutivo.rejected, (state, action) => {
        state.isLoadingDashboard = false;
        state.error = action.payload as string;
      })

      // ============================================
      // KPIs E MÉTRICAS
      // ============================================
      .addCase(fetchKpisPrincipais.fulfilled, (state, action) => {
        state.kpisPrincipais = action.payload || null;
      })

      .addCase(fetchMetricasRapidas.fulfilled, (state, action) => {
        state.metricasRapidas = action.payload || null;
      })

      // ============================================
      // RELATÓRIOS AGENDADOS
      // ============================================
      .addCase(fetchRelatoriosAgendados.fulfilled, (state, action) => {
        state.relatoriosAgendados = action.payload;
      })

      .addCase(criarRelatorioAgendado.fulfilled, (state, action) => {
        if (action.payload) {
          state.relatoriosAgendados.push({
            ...action.payload,
            status: 'ativo'
          });
        }
      })

      .addCase(updateRelatorioAgendado.fulfilled, (state, action) => {
        const { id, configuracao } = action.payload;
        const relatorio = state.relatoriosAgendados.find(r => r.id === id);
        if (relatorio) {
          relatorio.configuracao = { ...relatorio.configuracao, ...configuracao };
        }
      })

      .addCase(toggleRelatorioAgendado.fulfilled, (state, action) => {
        const { id, ativo } = action.payload;
        const relatorio = state.relatoriosAgendados.find(r => r.id === id);
        if (relatorio) {
          relatorio.status = ativo ? 'ativo' : 'pausado';
        }
      })

      .addCase(deleteRelatorioAgendado.fulfilled, (state, action) => {
        const id = action.payload;
        state.relatoriosAgendados = state.relatoriosAgendados.filter(r => r.id !== id);
      })

      .addCase(executarRelatorioAgendado.fulfilled, (state, action) => {
        if (action.payload) {
          state.relatorios.unshift(action.payload);
          state.paginacao.total_registros += 1;
        }
      });
  },
});

export const {
  setRelatorioAtivo,
  setConfiguracaoAtiva,
  setFiltros,
  clearFiltros,
  setPagina,
  setLimite,
  updateRelatorioStatus,
  addRelatorio,
  clearRelatorios,
  clearDashboard,
  clearError,
} = relatoriosSlice.actions;

export default relatoriosSlice.reducer;
