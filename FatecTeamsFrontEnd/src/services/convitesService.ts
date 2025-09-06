import apiService from './api';
import { ApiResponse } from '../types';

// ============================================
// INTERFACES ESPECÍFICAS PARA CONVITES
// ============================================

interface Convite {
  id: string;
  grupo_id: string;
  codigo: string;
  email: string;
  status: 'pendente' | 'aceito' | 'recusado' | 'expirado';
  data_criacao: string;
  data_expiracao: string;
  data_resposta?: string;
  criado_por: string;
  // Dados relacionados
  grupo?: {
    id: string;
    nome: string;
    descricao?: string;
    tipo: string;
  };
  criador?: {
    id: string;
    nome: string;
    email: string;
    foto_perfil?: string;
  };
  destinatario?: {
    id: string;
    nome: string;
    email: string;
    foto_perfil?: string;
  };
}

interface CreateConviteData {
  grupo_id: string;
  email: string;
  mensagem_personalizada?: string;
  data_expiracao?: string;
}

interface ValidarConviteResponse {
  valido: boolean;
  convite?: Convite;
  motivo?: string;
}

interface ConviteDetalhes {
  codigo: string;
  grupo: {
    id: string;
    nome: string;
    descricao?: string;
    tipo: string;
    total_membros: number;
  };
  criador: {
    nome: string;
    email: string;
    foto_perfil?: string;
  };
  data_expiracao: string;
  status: string;
}

class ConvitesService {
  // ============================================
  // CRIAÇÃO E ENVIO DE CONVITES
  // ============================================

  /**
   * Criar convite para grupo
   */
  async createConvite(conviteData: CreateConviteData): Promise<ApiResponse<Convite>> {
    try {
      return await apiService.post<ApiResponse<Convite>>('/convites', conviteData);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Listar convites do grupo
   */
  async getConvitesGrupo(grupoId: string): Promise<ApiResponse<Convite[]>> {
    try {
      return await apiService.get<ApiResponse<Convite[]>>(`/grupos/${grupoId}/convites`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // VALIDAÇÃO E ACEITAÇÃO DE CONVITES
  // ============================================

  /**
   * Validar código de convite
   */
  async validarConvite(codigo: string): Promise<ApiResponse<ConviteDetalhes>> {
    try {
      return await apiService.get<ApiResponse<ConviteDetalhes>>(`/convites/validar/${codigo}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Aceitar convite
   */
  async aceitarConvite(codigo: string): Promise<ApiResponse<{ convite: Convite; grupo: any }>> {
    try {
      return await apiService.post<ApiResponse<{ convite: Convite; grupo: any }>>(`/convites/aceitar/${codigo}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Recusar convite
   */
  async recusarConvite(codigo: string, motivo?: string): Promise<ApiResponse<Convite>> {
    try {
      const data = motivo ? { motivo } : {};
      return await apiService.post<ApiResponse<Convite>>(`/convites/recusar/${codigo}`, data);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // GERENCIAMENTO DE CONVITES
  // ============================================

  /**
   * Cancelar convite
   */
  async cancelarConvite(codigo: string): Promise<ApiResponse<string>> {
    try {
      return await apiService.delete<ApiResponse<string>>(`/convites/${codigo}`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Reenviar convite
   */
  async reenviarConvite(codigo: string): Promise<ApiResponse<Convite>> {
    try {
      return await apiService.post<ApiResponse<Convite>>(`/convites/${codigo}/reenviar`);
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Obter meus convites pendentes
   */
  async getMeusConvites(): Promise<ApiResponse<Convite[]>> {
    try {
      return await apiService.get<ApiResponse<Convite[]>>('/convites/meus');
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  /**
   * Obter convites enviados por mim
   */
  async getConvitesEnviados(): Promise<ApiResponse<Convite[]>> {
    try {
      return await apiService.get<ApiResponse<Convite[]>>('/convites/enviados');
    } catch (error) {
      throw new Error(apiService.handleError(error));
    }
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  /**
   * Verificar se convite está válido
   */
  isConviteValido(convite: Convite): boolean {
    const agora = new Date();
    const dataExpiracao = new Date(convite.data_expiracao);
    return convite.status === 'pendente' && dataExpiracao > agora;
  }

  /**
   * Calcular tempo restante do convite
   */
  getTempoRestante(convite: Convite): string {
    const agora = new Date();
    const dataExpiracao = new Date(convite.data_expiracao);
    const diferenca = dataExpiracao.getTime() - agora.getTime();
    
    if (diferenca <= 0) {
      return 'Expirado';
    }
    
    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (dias > 0) {
      return `${dias}d ${horas}h`;
    } else if (horas > 0) {
      return `${horas}h`;
    } else {
      const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutos}min`;
    }
  }

  /**
   * Filtrar convites por status
   */
  filterByStatus(convites: Convite[], status: Convite['status']): Convite[] {
    return convites.filter(c => c.status === status);
  }

  /**
   * Agrupar convites por grupo
   */
  groupByGrupo(convites: Convite[]): { [grupoId: string]: Convite[] } {
    return convites.reduce((acc, convite) => {
      if (!acc[convite.grupo_id]) {
        acc[convite.grupo_id] = [];
      }
      acc[convite.grupo_id].push(convite);
      return acc;
    }, {} as { [grupoId: string]: Convite[] });
  }

  /**
   * Ordenar convites por data (mais recentes primeiro)
   */
  sortByDate(convites: Convite[]): Convite[] {
    return [...convites].sort((a, b) => 
      new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()
    );
  }
}

export default new ConvitesService();
