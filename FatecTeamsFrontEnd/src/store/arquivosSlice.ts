import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import arquivosService from '../services/arquivosService';

// ============================================
// INTERFACES
// ============================================

interface Arquivo {
  id: string;
  nome: string;
  nome_original: string;
  tipo: string;
  tamanho: number;
  caminho: string;
  url_download?: string;
  url_preview?: string;
  grupo_id: string;
  tarefa_id?: string;
  mensagem_id?: string;
  upload_por: string;
  data_upload: string;
  data_modificacao?: string;
  versao: number;
  status: 'processando' | 'concluido' | 'erro';
  is_publico: boolean;
  // Dados relacionados
  grupo?: {
    id: string;
    nome: string;
  };
  tarefa?: {
    id: string;
    titulo: string;
  };
  uploader?: {
    id: string;
    nome: string;
    email: string;
    foto_perfil?: string;
  };
  metadata?: {
    largura?: number;
    altura?: number;
    duracao?: number;
    paginas?: number;
    encoding?: string;
    thumbnail_url?: string;
  };
}

interface ArquivoUpload {
  nome: string;
  tipo: string;
  tamanho: number;
  dados: string;
  grupo_id: string;
  tarefa_id?: string;
  mensagem_id?: string;
  is_publico?: boolean;
  descricao?: string;
}

interface ArquivoVersao {
  id: string;
  arquivo_id: string;
  versao: number;
  nome: string;
  tamanho: number;
  caminho: string;
  upload_por: string;
  data_upload: string;
  comentario?: string;
  url_download?: string;
  uploader?: {
    id: string;
    nome: string;
    email: string;
  };
}

interface ArquivoCompartilhamento {
  id: string;
  arquivo_id: string;
  usuario_id: string;
  tipo_permissao: 'leitura' | 'escrita' | 'admin';
  data_compartilhamento: string;
  data_expiracao?: string;
  arquivo?: Arquivo;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    foto_perfil?: string;
  };
}

interface LinkCompartilhamento {
  id: string;
  arquivo_id: string;
  codigo: string;
  tipo_acesso: 'publico' | 'protegido' | 'temporario';
  senha?: string;
  data_expiracao?: string;
  max_downloads?: number;
  downloads_realizados: number;
  criado_por: string;
  data_criacao: string;
  is_ativo: boolean;
}

interface FiltrosArquivo {
  tipo?: string;
  data_inicio?: string;
  data_fim?: string;
  tamanho_min?: number;
  tamanho_max?: number;
  grupo_id?: string;
  tarefa_id?: string;
  usuario_id?: string;
  status?: Arquivo['status'];
  is_publico?: boolean;
  search?: string;
}

interface EstatisticasArquivos {
  total_arquivos: number;
  total_tamanho: number;
  tipos_arquivo: { [tipo: string]: number };
  uploads_por_mes: { mes: string; quantidade: number; tamanho: number }[];
  usuarios_mais_ativos: {
    usuario_id: string;
    nome: string;
    quantidade: number;
    tamanho: number;
  }[];
}

interface UploadProgress {
  id: string;
  nome: string;
  progresso: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled';
  erro?: string;
}

interface ArquivosState {
  // Listas de arquivos
  arquivos: Arquivo[];
  arquivosPorGrupo: { [grupoId: string]: Arquivo[] };
  arquivosPorTarefa: { [tarefaId: string]: Arquivo[] };
  meusArquivos: Arquivo[];
  arquivosCompartilhados: Arquivo[];
  arquivosPublicos: Arquivo[];
  
  // Arquivo atualmente selecionado
  arquivoAtivo: Arquivo | null;
  
  // Versões do arquivo ativo
  versoes: ArquivoVersao[];
  
  // Compartilhamentos do arquivo ativo
  compartilhamentos: ArquivoCompartilhamento[];
  linksPublicos: LinkCompartilhamento[];
  
  // Estados de carregamento
  isLoading: boolean;
  isUploading: boolean;
  isDeleting: boolean;
  isSharing: boolean;
  
  // Progresso de upload
  uploadsProgress: UploadProgress[];
  
  // Estatísticas
  estatisticas: EstatisticasArquivos | null;
  
  // Configurações de visualização
  filtros: FiltrosArquivo;
  visualizacao: 'lista' | 'grid';
  ordenacao: {
    campo: 'nome' | 'data' | 'tamanho' | 'tipo';
    ordem: 'asc' | 'desc';
  };
  
  error: string | null;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: ArquivosState = {
  arquivos: [],
  arquivosPorGrupo: {},
  arquivosPorTarefa: {},
  meusArquivos: [],
  arquivosCompartilhados: [],
  arquivosPublicos: [],
  arquivoAtivo: null,
  versoes: [],
  compartilhamentos: [],
  linksPublicos: [],
  isLoading: false,
  isUploading: false,
  isDeleting: false,
  isSharing: false,
  uploadsProgress: [],
  estatisticas: null,
  filtros: {},
  visualizacao: 'lista',
  ordenacao: {
    campo: 'data',
    ordem: 'desc',
  },
  error: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Upload de arquivo único
 */
export const uploadArquivo = createAsyncThunk(
  'arquivos/uploadArquivo',
  async (arquivo: ArquivoUpload, { rejectWithValue, dispatch }) => {
    try {
      // Adicionar progresso inicial
      dispatch(addUploadProgress({
        id: `upload_${Date.now()}`,
        nome: arquivo.nome,
        progresso: 0,
        status: 'uploading',
      }));

      const response = await arquivosService.uploadArquivo(arquivo);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Upload múltiplos arquivos
 */
export const uploadMultiplosArquivos = createAsyncThunk(
  'arquivos/uploadMultiplosArquivos',
  async (arquivos: ArquivoUpload[], { rejectWithValue }) => {
    try {
      const response = await arquivosService.uploadMultiplosArquivos(arquivos);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar arquivos com filtros
 */
export const fetchArquivos = createAsyncThunk(
  'arquivos/fetchArquivos',
  async (params: { filtros?: FiltrosArquivo; pagina?: number; limite?: number }, { rejectWithValue }) => {
    try {
      const response = await arquivosService.getArquivos(
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
 * Buscar arquivo por ID
 */
export const fetchArquivo = createAsyncThunk(
  'arquivos/fetchArquivo',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await arquivosService.getArquivo(id);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar arquivos de um grupo
 */
export const fetchArquivosGrupo = createAsyncThunk(
  'arquivos/fetchArquivosGrupo',
  async (params: { grupoId: string; filtros?: FiltrosArquivo }, { rejectWithValue }) => {
    try {
      const response = await arquivosService.getArquivosGrupo(params.grupoId, params.filtros || {});
      return {
        grupoId: params.grupoId,
        arquivos: response.dados || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar arquivos de uma tarefa
 */
export const fetchArquivosTarefa = createAsyncThunk(
  'arquivos/fetchArquivosTarefa',
  async (tarefaId: string, { rejectWithValue }) => {
    try {
      const response = await arquivosService.getArquivosTarefa(tarefaId);
      return {
        tarefaId,
        arquivos: response.dados || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar meus arquivos
 */
export const fetchMeusArquivos = createAsyncThunk(
  'arquivos/fetchMeusArquivos',
  async (filtros: FiltrosArquivo = {}, { rejectWithValue }) => {
    try {
      const response = await arquivosService.getMeusArquivos(filtros);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar arquivos compartilhados
 */
export const fetchArquivosCompartilhados = createAsyncThunk(
  'arquivos/fetchArquivosCompartilhados',
  async (_, { rejectWithValue }) => {
    try {
      const response = await arquivosService.getArquivosCompartilhados();
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar arquivos públicos
 */
export const fetchArquivosPublicos = createAsyncThunk(
  'arquivos/fetchArquivosPublicos',
  async (filtros: FiltrosArquivo = {}, { rejectWithValue }) => {
    try {
      const response = await arquivosService.getArquivosPublicos(filtros);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Atualizar arquivo
 */
export const updateArquivo = createAsyncThunk(
  'arquivos/updateArquivo',
  async (params: { id: string; dados: Partial<Pick<Arquivo, 'nome' | 'is_publico'>> }, { rejectWithValue }) => {
    try {
      const response = await arquivosService.updateArquivo(params.id, params.dados);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Deletar arquivo
 */
export const deleteArquivo = createAsyncThunk(
  'arquivos/deleteArquivo',
  async (id: string, { rejectWithValue }) => {
    try {
      await arquivosService.deleteArquivo(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Download de arquivo
 */
export const downloadArquivo = createAsyncThunk(
  'arquivos/downloadArquivo',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await arquivosService.downloadArquivo(id);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar versões do arquivo
 */
export const fetchVersoes = createAsyncThunk(
  'arquivos/fetchVersoes',
  async (arquivoId: string, { rejectWithValue }) => {
    try {
      const response = await arquivosService.getVersoes(arquivoId);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Criar nova versão
 */
export const criarVersao = createAsyncThunk(
  'arquivos/criarVersao',
  async (params: { arquivoId: string; dados: { arquivo: string; comentario?: string } }, { rejectWithValue }) => {
    try {
      const response = await arquivosService.criarVersao(params.arquivoId, params.dados);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Restaurar versão
 */
export const restaurarVersao = createAsyncThunk(
  'arquivos/restaurarVersao',
  async (params: { arquivoId: string; versao: number }, { rejectWithValue }) => {
    try {
      const response = await arquivosService.restaurarVersao(params.arquivoId, params.versao);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Compartilhar arquivo
 */
export const compartilharArquivo = createAsyncThunk(
  'arquivos/compartilharArquivo',
  async (params: {
    arquivoId: string;
    dados: {
      usuario_id: string;
      tipo_permissao: ArquivoCompartilhamento['tipo_permissao'];
      data_expiracao?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await arquivosService.compartilharArquivo(params.arquivoId, params.dados);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar compartilhamentos
 */
export const fetchCompartilhamentos = createAsyncThunk(
  'arquivos/fetchCompartilhamentos',
  async (arquivoId: string, { rejectWithValue }) => {
    try {
      const response = await arquivosService.getCompartilhamentos(arquivoId);
      return response.dados || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Criar link público
 */
export const criarLinkPublico = createAsyncThunk(
  'arquivos/criarLinkPublico',
  async (params: {
    arquivoId: string;
    dados: {
      tipo_acesso: LinkCompartilhamento['tipo_acesso'];
      senha?: string;
      data_expiracao?: string;
      max_downloads?: number;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await arquivosService.criarLinkPublico(params.arquivoId, params.dados);
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Buscar estatísticas
 */
export const fetchEstatisticas = createAsyncThunk(
  'arquivos/fetchEstatisticas',
  async (_, { rejectWithValue }) => {
    try {
      const response = await arquivosService.getEstatisticas();
      return response.dados;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const arquivosSlice = createSlice({
  name: 'arquivos',
  initialState,
  reducers: {
    // Definir arquivo ativo
    setArquivoAtivo: (state, action: PayloadAction<Arquivo | null>) => {
      state.arquivoAtivo = action.payload;
    },

    // Atualizar filtros
    setFiltros: (state, action: PayloadAction<FiltrosArquivo>) => {
      state.filtros = { ...state.filtros, ...action.payload };
    },

    // Limpar filtros
    clearFiltros: (state) => {
      state.filtros = {};
    },

    // Alterar visualização
    setVisualizacao: (state, action: PayloadAction<'lista' | 'grid'>) => {
      state.visualizacao = action.payload;
    },

    // Alterar ordenação
    setOrdenacao: (state, action: PayloadAction<{ campo: string; ordem: 'asc' | 'desc' }>) => {
      state.ordenacao = action.payload as typeof state.ordenacao;
    },

    // Gerenciar progresso de upload
    addUploadProgress: (state, action: PayloadAction<UploadProgress>) => {
      state.uploadsProgress.push(action.payload);
    },

    updateUploadProgress: (state, action: PayloadAction<{ id: string; progresso: number; status?: UploadProgress['status'] }>) => {
      const upload = state.uploadsProgress.find(u => u.id === action.payload.id);
      if (upload) {
        upload.progresso = action.payload.progresso;
        if (action.payload.status) {
          upload.status = action.payload.status;
        }
      }
    },

    removeUploadProgress: (state, action: PayloadAction<string>) => {
      state.uploadsProgress = state.uploadsProgress.filter(u => u.id !== action.payload);
    },

    clearUploadsProgress: (state) => {
      state.uploadsProgress = [];
    },

    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },

    // Limpar dados
    clearArquivos: (state) => {
      state.arquivos = [];
    },

    clearArquivosGrupo: (state, action: PayloadAction<string>) => {
      delete state.arquivosPorGrupo[action.payload];
    },

    clearArquivosTarefa: (state, action: PayloadAction<string>) => {
      delete state.arquivosPorTarefa[action.payload];
    },

    // Atualizar status local de arquivo
    updateArquivoStatus: (state, action: PayloadAction<{ id: string; status: Arquivo['status'] }>) => {
      const { id, status } = action.payload;
      
      const updateInList = (lista: Arquivo[]) => {
        const arquivo = lista.find(a => a.id === id);
        if (arquivo) arquivo.status = status;
      };

      updateInList(state.arquivos);
      updateInList(state.meusArquivos);
      updateInList(state.arquivosCompartilhados);
      updateInList(state.arquivosPublicos);
      
      Object.values(state.arquivosPorGrupo).forEach(updateInList);
      Object.values(state.arquivosPorTarefa).forEach(updateInList);
      
      if (state.arquivoAtivo?.id === id) {
        state.arquivoAtivo.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // UPLOAD ARQUIVO
      // ============================================
      .addCase(uploadArquivo.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadArquivo.fulfilled, (state, action) => {
        state.isUploading = false;
        if (action.payload) {
          state.arquivos.push(action.payload);
          state.meusArquivos.push(action.payload);
          
          // Adicionar ao grupo se especificado
          if (action.payload.grupo_id) {
            if (!state.arquivosPorGrupo[action.payload.grupo_id]) {
              state.arquivosPorGrupo[action.payload.grupo_id] = [];
            }
            state.arquivosPorGrupo[action.payload.grupo_id].push(action.payload);
          }
          
          // Adicionar à tarefa se especificado
          if (action.payload.tarefa_id) {
            if (!state.arquivosPorTarefa[action.payload.tarefa_id]) {
              state.arquivosPorTarefa[action.payload.tarefa_id] = [];
            }
            state.arquivosPorTarefa[action.payload.tarefa_id].push(action.payload);
          }
        }
      })
      .addCase(uploadArquivo.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // UPLOAD MÚLTIPLOS ARQUIVOS
      // ============================================
      .addCase(uploadMultiplosArquivos.fulfilled, (state, action) => {
        const novosArquivos = action.payload || [];
        state.arquivos.push(...novosArquivos);
        state.meusArquivos.push(...novosArquivos);
        
        // Organizar por grupo e tarefa
        novosArquivos.forEach(arquivo => {
          if (arquivo.grupo_id) {
            if (!state.arquivosPorGrupo[arquivo.grupo_id]) {
              state.arquivosPorGrupo[arquivo.grupo_id] = [];
            }
            state.arquivosPorGrupo[arquivo.grupo_id].push(arquivo);
          }
          
          if (arquivo.tarefa_id) {
            if (!state.arquivosPorTarefa[arquivo.tarefa_id]) {
              state.arquivosPorTarefa[arquivo.tarefa_id] = [];
            }
            state.arquivosPorTarefa[arquivo.tarefa_id].push(arquivo);
          }
        });
      })

      // ============================================
      // FETCH ARQUIVOS
      // ============================================
      .addCase(fetchArquivos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchArquivos.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.arquivos = action.payload.arquivos || [];
        }
      })
      .addCase(fetchArquivos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ============================================
      // FETCH ARQUIVO
      // ============================================
      .addCase(fetchArquivo.fulfilled, (state, action) => {
        if (action.payload) {
          state.arquivoAtivo = action.payload;
          
          // Atualizar nas listas se já existir
          const updateInList = (lista: Arquivo[]) => {
            const index = lista.findIndex(a => a.id === action.payload!.id);
            if (index !== -1) {
              lista[index] = action.payload!;
            }
          };
          
          updateInList(state.arquivos);
          updateInList(state.meusArquivos);
          updateInList(state.arquivosCompartilhados);
          updateInList(state.arquivosPublicos);
          
          Object.values(state.arquivosPorGrupo).forEach(updateInList);
          Object.values(state.arquivosPorTarefa).forEach(updateInList);
        }
      })

      // ============================================
      // FETCH ARQUIVOS POR GRUPO
      // ============================================
      .addCase(fetchArquivosGrupo.fulfilled, (state, action) => {
        const { grupoId, arquivos } = action.payload;
        state.arquivosPorGrupo[grupoId] = arquivos;
      })

      // ============================================
      // FETCH ARQUIVOS POR TAREFA
      // ============================================
      .addCase(fetchArquivosTarefa.fulfilled, (state, action) => {
        const { tarefaId, arquivos } = action.payload;
        state.arquivosPorTarefa[tarefaId] = arquivos;
      })

      // ============================================
      // FETCH MEUS ARQUIVOS
      // ============================================
      .addCase(fetchMeusArquivos.fulfilled, (state, action) => {
        state.meusArquivos = action.payload;
      })

      // ============================================
      // FETCH ARQUIVOS COMPARTILHADOS
      // ============================================
      .addCase(fetchArquivosCompartilhados.fulfilled, (state, action) => {
        state.arquivosCompartilhados = action.payload;
      })

      // ============================================
      // FETCH ARQUIVOS PÚBLICOS
      // ============================================
      .addCase(fetchArquivosPublicos.fulfilled, (state, action) => {
        state.arquivosPublicos = action.payload;
      })

      // ============================================
      // UPDATE ARQUIVO
      // ============================================
      .addCase(updateArquivo.fulfilled, (state, action) => {
        if (action.payload) {
          const updateInList = (lista: Arquivo[]) => {
            const index = lista.findIndex(a => a.id === action.payload!.id);
            if (index !== -1) {
              lista[index] = { ...lista[index], ...action.payload! };
            }
          };
          
          updateInList(state.arquivos);
          updateInList(state.meusArquivos);
          updateInList(state.arquivosCompartilhados);
          updateInList(state.arquivosPublicos);
          
          Object.values(state.arquivosPorGrupo).forEach(updateInList);
          Object.values(state.arquivosPorTarefa).forEach(updateInList);
          
          if (state.arquivoAtivo?.id === action.payload.id) {
            state.arquivoAtivo = { ...state.arquivoAtivo, ...action.payload };
          }
        }
      })

      // ============================================
      // DELETE ARQUIVO
      // ============================================
      .addCase(deleteArquivo.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteArquivo.fulfilled, (state, action) => {
        state.isDeleting = false;
        const arquivoId = action.payload;
        
        const removeFromList = (lista: Arquivo[]) => 
          lista.filter(a => a.id !== arquivoId);
        
        state.arquivos = removeFromList(state.arquivos);
        state.meusArquivos = removeFromList(state.meusArquivos);
        state.arquivosCompartilhados = removeFromList(state.arquivosCompartilhados);
        state.arquivosPublicos = removeFromList(state.arquivosPublicos);
        
        Object.keys(state.arquivosPorGrupo).forEach(grupoId => {
          state.arquivosPorGrupo[grupoId] = removeFromList(state.arquivosPorGrupo[grupoId]);
        });
        
        Object.keys(state.arquivosPorTarefa).forEach(tarefaId => {
          state.arquivosPorTarefa[tarefaId] = removeFromList(state.arquivosPorTarefa[tarefaId]);
        });
        
        if (state.arquivoAtivo?.id === arquivoId) {
          state.arquivoAtivo = null;
        }
      })
      .addCase(deleteArquivo.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      })

      // ============================================
      // VERSÕES
      // ============================================
      .addCase(fetchVersoes.fulfilled, (state, action) => {
        state.versoes = action.payload;
      })

      .addCase(criarVersao.fulfilled, (state, action) => {
        if (action.payload) {
          state.versoes.push(action.payload);
        }
      })

      .addCase(restaurarVersao.fulfilled, (state, action) => {
        if (action.payload && state.arquivoAtivo) {
          state.arquivoAtivo = { ...state.arquivoAtivo, ...action.payload };
        }
      })

      // ============================================
      // COMPARTILHAMENTO
      // ============================================
      .addCase(compartilharArquivo.pending, (state) => {
        state.isSharing = true;
        state.error = null;
      })
      .addCase(compartilharArquivo.fulfilled, (state, action) => {
        state.isSharing = false;
        if (action.payload) {
          state.compartilhamentos.push(action.payload);
        }
      })
      .addCase(compartilharArquivo.rejected, (state, action) => {
        state.isSharing = false;
        state.error = action.payload as string;
      })

      .addCase(fetchCompartilhamentos.fulfilled, (state, action) => {
        state.compartilhamentos = action.payload;
      })

      .addCase(criarLinkPublico.fulfilled, (state, action) => {
        if (action.payload) {
          state.linksPublicos.push(action.payload);
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
  setArquivoAtivo,
  setFiltros,
  clearFiltros,
  setVisualizacao,
  setOrdenacao,
  addUploadProgress,
  updateUploadProgress,
  removeUploadProgress,
  clearUploadsProgress,
  clearError,
  clearArquivos,
  clearArquivosGrupo,
  clearArquivosTarefa,
  updateArquivoStatus,
} = arquivosSlice.actions;

export default arquivosSlice.reducer;
