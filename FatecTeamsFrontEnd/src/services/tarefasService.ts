import apiService from './api';
import { ApiResponse } from '../types';

// ============================================
// INTERFACES ESPECÍFICAS PARA TAREFAS
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

class TarefasService {
  // ============================================
  // CRUD BÁSICO DE TAREFAS
  // ============================================

  /**
   * Criar nova tarefa no grupo
   */
  async createTarefa(grupoId: string, tarefaData: CreateTarefaData): Promise<ApiResponse<Tarefa>> {
    try {
      return await apiService.post<ApiResponse<Tarefa>>(`/grupos/${grupoId}/tarefas`, {
        ...tarefaData,
        grupo_id: grupoId
      });
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Obter tarefa específica
   */
  async getTarefa(tarefaId: string): Promise<ApiResponse<Tarefa>> {
    try {
      return await apiService.get<ApiResponse<Tarefa>>(`/tarefas/${tarefaId}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Atualizar tarefa
   */
  async updateTarefa(tarefaId: string, tarefaData: UpdateTarefaData): Promise<ApiResponse<Tarefa>> {
    try {
      return await apiService.put<ApiResponse<Tarefa>>(`/tarefas/${tarefaId}`, tarefaData);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Deletar tarefa
   */
  async deleteTarefa(tarefaId: string): Promise<ApiResponse<string>> {
    try {
      return await apiService.delete<ApiResponse<string>>(`/tarefas/${tarefaId}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // LISTAGEM E BUSCA
  // ============================================

  /**
   * Listar tarefas do grupo
   */
  async getTarefasGrupo(grupoId: string, params?: TarefasQueryParams): Promise<ApiResponse<Tarefa[]>> {
    try {
      const queryString = params ? new URLSearchParams(params as any).toString() : '';
      const url = queryString ? `/grupos/${grupoId}/tarefas?${queryString}` : `/grupos/${grupoId}/tarefas`;
      return await apiService.get<ApiResponse<Tarefa[]>>(url);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Listar minhas tarefas no grupo
   */
  async getMinhasTarefas(grupoId: string, params?: MinhasTarefasParams): Promise<ApiResponse<Tarefa[]>> {
    try {
      const queryString = params ? new URLSearchParams(params as any).toString() : '';
      const url = queryString ? `/tarefas/${grupoId}/minhas?${queryString}` : `/tarefas/${grupoId}/minhas`;
      return await apiService.get<ApiResponse<Tarefa[]>>(url);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Buscar tarefas no grupo
   */
  async buscarTarefas(grupoId: string, params: BuscarTarefasParams): Promise<ApiResponse<Tarefa[]>> {
    try {
      const queryString = new URLSearchParams(params as any).toString();
      return await apiService.get<ApiResponse<Tarefa[]>>(`/grupos/${grupoId}/tarefas/buscar?${queryString}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // ALTERAÇÃO DE STATUS
  // ============================================

  /**
   * Marcar tarefa como concluída
   */
  async concluirTarefa(tarefaId: string): Promise<ApiResponse<Tarefa>> {
    try {
      return await apiService.put<ApiResponse<Tarefa>>(`/tarefas/${tarefaId}/concluir`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Iniciar tarefa (status: em_progresso)
   */
  async iniciarTarefa(tarefaId: string): Promise<ApiResponse<Tarefa>> {
    try {
      return await apiService.put<ApiResponse<Tarefa>>(`/tarefas/${tarefaId}/iniciar`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Cancelar tarefa
   */
  async cancelarTarefa(tarefaId: string): Promise<ApiResponse<Tarefa>> {
    try {
      return await apiService.put<ApiResponse<Tarefa>>(`/tarefas/${tarefaId}/cancelar`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Atribuir tarefa a usuários
   */
  async atribuirTarefa(tarefaId: string, assignado_para: string[]): Promise<ApiResponse<Tarefa>> {
    try {
      return await apiService.put<ApiResponse<Tarefa>>(`/tarefas/${tarefaId}/atribuir`, { assignado_para });
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // COMENTÁRIOS
  // ============================================

  /**
   * Adicionar comentário à tarefa
   */
  async addComentario(tarefaId: string, comentario: string): Promise<ApiResponse<Comentario>> {
    try {
      return await apiService.post<ApiResponse<Comentario>>(`/tarefas/${tarefaId}/comentarios`, { comentario });
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Listar comentários da tarefa
   */
  async getComentarios(tarefaId: string): Promise<ApiResponse<Comentario[]>> {
    try {
      return await apiService.get<ApiResponse<Comentario[]>>(`/tarefas/${tarefaId}/comentarios`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Deletar comentário
   */
  async deleteComentario(comentarioId: string): Promise<ApiResponse<string>> {
    try {
      return await apiService.delete<ApiResponse<string>>(`/comentarios/${comentarioId}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // CONTROLE DE HORAS
  // ============================================

  /**
   * Adicionar horas trabalhadas na tarefa
   */
  async addHorasTrabalhadas(
    tarefaId: string,
    dados: { horas: number; descricao?: string; data?: string }
  ): Promise<ApiResponse<HoraTrabalhada>> {
    try {
      return await apiService.post<ApiResponse<HoraTrabalhada>>(`/tarefas/${tarefaId}/horas`, dados);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // ESTATÍSTICAS E HISTÓRICO
  // ============================================

  /**
   * Obter estatísticas de tarefas do grupo
   */
  async getEstatisticasGrupo(grupoId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.get<ApiResponse<any>>(`/grupos/${grupoId}/tarefas/estatisticas`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Obter histórico de alterações da tarefa
   */
  async getHistoricoTarefa(tarefaId: string): Promise<ApiResponse<HistoricoTarefa[]>> {
    try {
      return await apiService.get<ApiResponse<HistoricoTarefa[]>>(`/tarefas/${tarefaId}/historico`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }
}

export default new TarefasService();
