import apiService from './api';
import { ApiResponse } from '../types';

// ============================================
// INTERFACES ESPECÍFICAS PARA NOTIFICAÇÕES
// ============================================

interface Notificacao {
  id: string;
  usuario_id: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'sucesso' | 'aviso' | 'erro';
  importante: boolean;
  lida: boolean;
  data_criacao: string;
  data_leitura?: string;
  // Dados relacionados opcionais
  grupo_id?: string;
  tarefa_id?: string;
  mensagem_id?: string;
  usuario_origem_id?: string;
  link_acao?: string;
  dados_extras?: any;
}

interface CreateNotificacaoData {
  usuario_id: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'sucesso' | 'aviso' | 'erro';
  importante?: boolean;
  grupo_id?: string;
  tarefa_id?: string;
  mensagem_id?: string;
  link_acao?: string;
  dados_extras?: any;
}

interface NotificacoesQueryParams {
  lida?: boolean;
  tipo?: string;
  limit?: number;
  offset?: number;
}

interface ConfiguracoesNotificacao {
  id: string;
  usuario_id: string;
  email: boolean;
  push: boolean;
  som: boolean;
  tipos: {
    mensagem: boolean;
    tarefa: boolean;
    convite: boolean;
    arquivo: boolean;
    evento: boolean;
    sistema: boolean;
  };
  horarios: {
    inicio: string; // HH:MM
    fim: string; // HH:MM
    ativo: boolean;
  };
  data_atualizacao: string;
}

interface UpdateConfiguracoesData {
  email?: boolean;
  push?: boolean;
  som?: boolean;
  tipos?: {
    mensagem?: boolean;
    tarefa?: boolean;
    convite?: boolean;
    arquivo?: boolean;
    evento?: boolean;
    sistema?: boolean;
  };
  horarios?: {
    inicio?: string;
    fim?: string;
    ativo?: boolean;
  };
}

class NotificacoesService {
  // ============================================
  // LISTAGEM E CONTADORES
  // ============================================

  /**
   * Listar notificações do usuário
   */
  async getNotificacoes(params?: NotificacoesQueryParams): Promise<ApiResponse<Notificacao[]>> {
    try {
      const queryString = params ? new URLSearchParams(params as any).toString() : '';
      const url = queryString ? `/notificacoes?${queryString}` : '/notificacoes';
      return await apiService.get<ApiResponse<Notificacao[]>>(url);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Contar notificações não lidas
   */
  async getNotificacoesNaoLidas(): Promise<ApiResponse<{ total_nao_lidas: number }>> {
    try {
      return await apiService.get<ApiResponse<{ total_nao_lidas: number }>>('/notificacoes/nao-lidas');
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // CRIAÇÃO E GERENCIAMENTO
  // ============================================

  /**
   * Criar notificação
   */
  async createNotificacao(notificacaoData: CreateNotificacaoData): Promise<ApiResponse<Notificacao>> {
    try {
      return await apiService.post<ApiResponse<Notificacao>>('/notificacoes', notificacaoData);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Marcar notificação como lida
   */
  async marcarComoLida(notificacaoId: string): Promise<ApiResponse<Notificacao>> {
    try {
      return await apiService.patch<ApiResponse<Notificacao>>(`/notificacoes/${notificacaoId}/marcar-lida`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Marcar todas notificações como lidas
   */
  async marcarTodasComoLidas(): Promise<ApiResponse<string>> {
    try {
      return await apiService.patch<ApiResponse<string>>('/notificacoes/marcar-todas-lidas');
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Remover notificação
   */
  async deleteNotificacao(notificacaoId: string): Promise<ApiResponse<string>> {
    try {
      return await apiService.delete<ApiResponse<string>>(`/notificacoes/${notificacaoId}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // CONFIGURAÇÕES
  // ============================================

  /**
   * Obter configurações de notificações
   */
  async getConfiguracoes(): Promise<ApiResponse<ConfiguracoesNotificacao>> {
    try {
      return await apiService.get<ApiResponse<ConfiguracoesNotificacao>>('/notificacoes/configuracoes');
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Atualizar configurações de notificações
   */
  async updateConfiguracoes(configuracoes: UpdateConfiguracoesData): Promise<ApiResponse<ConfiguracoesNotificacao>> {
    try {
      return await apiService.put<ApiResponse<ConfiguracoesNotificacao>>('/notificacoes/configuracoes', configuracoes);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  /**
   * Filtrar notificações por tipo
   */
  filterByType(notificacoes: Notificacao[], tipo: string): Notificacao[] {
    return notificacoes.filter(n => n.tipo === tipo);
  }

  /**
   * Filtrar notificações não lidas
   */
  filterUnread(notificacoes: Notificacao[]): Notificacao[] {
    return notificacoes.filter(n => !n.lida);
  }

  /**
   * Filtrar notificações importantes
   */
  filterImportant(notificacoes: Notificacao[]): Notificacao[] {
    return notificacoes.filter(n => n.importante);
  }

  /**
   * Agrupar notificações por tipo
   */
  groupByType(notificacoes: Notificacao[]): { [tipo: string]: Notificacao[] } {
    return notificacoes.reduce((acc, notificacao) => {
      if (!acc[notificacao.tipo]) {
        acc[notificacao.tipo] = [];
      }
      acc[notificacao.tipo].push(notificacao);
      return acc;
    }, {} as { [tipo: string]: Notificacao[] });
  }

  /**
   * Ordenar notificações por data (mais recentes primeiro)
   */
  sortByDate(notificacoes: Notificacao[]): Notificacao[] {
    return [...notificacoes].sort((a, b) => 
      new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()
    );
  }
}

export default new NotificacoesService();
