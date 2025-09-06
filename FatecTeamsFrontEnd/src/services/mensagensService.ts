import apiService from './api';
import { ApiResponse, PaginatedResponse } from '../types';

// ============================================
// INTERFACES ESPECÍFICAS PARA MENSAGENS
// ============================================

interface Mensagem {
  id: string;
  conteudo: string;
  tipo_mensagem: 'texto' | 'arquivo' | 'imagem';
  autor_id: string;
  grupo_id: string;
  data_criacao: string;
  data_atualizacao?: string;
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
}

interface CreateMensagemData {
  conteudo: string;
  tipo_mensagem?: 'texto' | 'arquivo' | 'imagem';
  arquivo_id?: string;
  grupo_id: string;
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

class MensagensService {
  // ============================================
  // CRUD BÁSICO DE MENSAGENS
  // ============================================

  /**
   * Criar nova mensagem no grupo
   */
  async createMensagem(grupoId: string, mensagemData: CreateMensagemData): Promise<ApiResponse<Mensagem>> {
    try {
      return await apiService.post<ApiResponse<Mensagem>>(`/grupos/${grupoId}/mensagens`, {
        ...mensagemData,
        grupo_id: grupoId
      });
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Obter mensagem específica
   */
  async getMensagem(mensagemId: string): Promise<ApiResponse<Mensagem>> {
    try {
      return await apiService.get<ApiResponse<Mensagem>>(`/mensagens/${mensagemId}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Atualizar mensagem
   */
  async updateMensagem(mensagemId: string, conteudo: string): Promise<ApiResponse<Mensagem>> {
    try {
      return await apiService.put<ApiResponse<Mensagem>>(`/mensagens/${mensagemId}`, { conteudo });
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Deletar mensagem
   */
  async deleteMensagem(mensagemId: string): Promise<ApiResponse<string>> {
    try {
      return await apiService.delete<ApiResponse<string>>(`/mensagens/${mensagemId}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // LISTAGEM E BUSCA
  // ============================================

  /**
   * Listar mensagens do grupo
   */
  async getMensagensGrupo(grupoId: string, params?: MensagensQueryParams): Promise<ApiResponse<Mensagem[]>> {
    try {
      const queryString = params ? new URLSearchParams(params as any).toString() : '';
      const url = queryString ? `/grupos/${grupoId}/mensagens?${queryString}` : `/grupos/${grupoId}/mensagens`;
      return await apiService.get<ApiResponse<Mensagem[]>>(url);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Buscar mensagens no grupo
   */
  async buscarMensagens(grupoId: string, params: BuscarMensagensParams): Promise<ApiResponse<Mensagem[]>> {
    try {
      const queryString = new URLSearchParams(params as any).toString();
      return await apiService.get<ApiResponse<Mensagem[]>>(`/grupos/${grupoId}/mensagens/buscar?${queryString}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Obter mensagens não lidas do grupo
   */
  async getMensagensNaoLidas(grupoId: string): Promise<ApiResponse<Mensagem[]>> {
    try {
      return await apiService.get<ApiResponse<Mensagem[]>>(`/grupos/${grupoId}/mensagens/nao-lidas`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Obter mensagens recentes do grupo
   */
  async getMensagensRecentes(grupoId: string, limit?: number): Promise<ApiResponse<Mensagem[]>> {
    try {
      const queryString = limit ? `?limit=${limit}` : '';
      return await apiService.get<ApiResponse<Mensagem[]>>(`/grupos/${grupoId}/mensagens/recentes${queryString}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // MARCAÇÃO DE LEITURA
  // ============================================

  /**
   * Marcar mensagem como lida
   */
  async marcarMensagemLida(mensagemId: string): Promise<ApiResponse<string>> {
    try {
      return await apiService.put<ApiResponse<string>>(`/mensagens/${mensagemId}/marcar-lida`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Marcar todas mensagens do grupo como lidas
   */
  async marcarTodasMensagensLidas(grupoId: string): Promise<ApiResponse<string>> {
    try {
      return await apiService.put<ApiResponse<string>>(`/grupos/${grupoId}/mensagens/marcar-todas-lidas`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // REAÇÕES
  // ============================================

  /**
   * Adicionar reação à mensagem
   */
  async addReacao(mensagemId: string, tipo: string): Promise<ApiResponse<Reacao>> {
    try {
      return await apiService.post<ApiResponse<Reacao>>(`/mensagens/${mensagemId}/reacoes`, { tipo });
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Remover reação da mensagem
   */
  async removeReacao(mensagemId: string, tipoReacao: string): Promise<ApiResponse<string>> {
    try {
      return await apiService.delete<ApiResponse<string>>(`/mensagens/${mensagemId}/reacoes/${tipoReacao}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Listar reações da mensagem
   */
  async getReacoes(mensagemId: string): Promise<ApiResponse<Reacao[]>> {
    try {
      return await apiService.get<ApiResponse<Reacao[]>>(`/mensagens/${mensagemId}/reacoes`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // ESTATÍSTICAS
  // ============================================

  /**
   * Obter estatísticas de mensagens do grupo
   */
  async getEstatisticasGrupo(grupoId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.get<ApiResponse<any>>(`/grupos/${grupoId}/mensagens/estatisticas`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }
}

export default new MensagensService();
