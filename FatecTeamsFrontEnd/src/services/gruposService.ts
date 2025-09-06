import apiService from './api';
import { ApiResponse, PaginatedResponse } from '../types';

// ============================================
// INTERFACES ESPECÍFICAS PARA GRUPOS
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

interface CreateGrupoData {
  nome: string;
  descricao?: string;
  tipo: 'projeto' | 'estudo' | 'trabalho';
  privacidade: 'publico' | 'privado';
  max_membros?: number;
  configuracoes?: any;
}

interface GruposQueryParams {
  tipo?: string;
  categoria?: string;
  limit?: number;
  offset?: number;
}

interface BuscarGruposParams {
  termo?: string;
  categoria?: string;
  limit?: number;
}

class GruposService {
  // ============================================
  // CRUD BÁSICO DE GRUPOS
  // ============================================

  /**
   * Criar novo grupo
   */
  async createGrupo(grupoData: CreateGrupoData): Promise<ApiResponse<Grupo>> {
    try {
      return await apiService.post<ApiResponse<Grupo>>('/grupos', grupoData);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Obter dados básicos de um grupo
   */
  async getGrupo(grupoId: string): Promise<ApiResponse<Grupo>> {
    try {
      return await apiService.get<ApiResponse<Grupo>>(`/grupos/${grupoId}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Obter detalhes completos do grupo
   */
  async getGrupoDetalhes(grupoId: string): Promise<ApiResponse<Grupo>> {
    try {
      return await apiService.get<ApiResponse<Grupo>>(`/grupos/${grupoId}/detalhes`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Atualizar grupo
   */
  async updateGrupo(grupoId: string, grupoData: Partial<CreateGrupoData>): Promise<ApiResponse<Grupo>> {
    try {
      return await apiService.put<ApiResponse<Grupo>>(`/grupos/${grupoId}`, grupoData);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Deletar grupo
   */
  async deleteGrupo(grupoId: string): Promise<ApiResponse<string>> {
    try {
      return await apiService.delete<ApiResponse<string>>(`/grupos/${grupoId}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Listar grupos do usuário
   */
  async getGruposUsuario(params?: GruposQueryParams): Promise<ApiResponse<Grupo[]>> {
    try {
      const queryString = params ? new URLSearchParams(params as any).toString() : '';
      const url = queryString ? `/grupos?${queryString}` : '/grupos';
      return await apiService.get<ApiResponse<Grupo[]>>(url);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Buscar grupos públicos
   */
  async buscarGruposPublicos(params: BuscarGruposParams): Promise<ApiResponse<Grupo[]>> {
    try {
      const queryString = new URLSearchParams(params as any).toString();
      return await apiService.get<ApiResponse<Grupo[]>>(`/grupos/publicos/buscar?${queryString}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // GERENCIAMENTO DE MEMBROS
  // ============================================

  /**
   * Entrar em grupo público
   */
  async joinGrupo(grupoId: string): Promise<ApiResponse<string>> {
    try {
      return await apiService.post<ApiResponse<string>>(`/grupos/${grupoId}/entrar`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Sair do grupo
   */
  async leaveGrupo(grupoId: string): Promise<ApiResponse<string>> {
    try {
      return await apiService.post<ApiResponse<string>>(`/grupos/${grupoId}/sair`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Adicionar membro ao grupo
   */
  async addMembro(grupoId: string, usuarioId: string, papel?: 'membro' | 'admin' | 'moderador'): Promise<ApiResponse<GrupoMembro>> {
    try {
      return await apiService.post<ApiResponse<GrupoMembro>>(`/grupos/${grupoId}/membros`, {
        usuario_id: usuarioId,
        papel: papel || 'membro'
      });
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Remover membro do grupo
   */
  async removeMembro(grupoId: string, usuarioId: string): Promise<ApiResponse<string>> {
    try {
      return await apiService.delete<ApiResponse<string>>(`/grupos/${grupoId}/membros/${usuarioId}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Alterar papel do membro
   */
  async updateMembroPapel(grupoId: string, usuarioId: string, papel: 'membro' | 'admin' | 'moderador'): Promise<ApiResponse<GrupoMembro>> {
    try {
      return await apiService.put<ApiResponse<GrupoMembro>>(`/grupos/${grupoId}/membros/${usuarioId}/papel`, { papel });
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Alterar nível do membro
   */
  async updateMembroNivel(grupoId: string, usuarioId: string, nivel: number): Promise<ApiResponse<GrupoMembro>> {
    try {
      return await apiService.put<ApiResponse<GrupoMembro>>(`/grupos/${grupoId}/membros/${usuarioId}/nivel`, { nivel });
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Obter membros do grupo
   */
  async getMembros(grupoId: string): Promise<ApiResponse<GrupoMembro[]>> {
    try {
      return await apiService.get<ApiResponse<GrupoMembro[]>>(`/grupos/${grupoId}/membros`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // ESTATÍSTICAS
  // ============================================

  /**
   * Obter estatísticas do grupo
   */
  async getEstatisticas(grupoId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.get<ApiResponse<any>>(`/grupos/${grupoId}/estatisticas`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }
}

export default new GruposService();
