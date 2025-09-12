import apiService from './api';

// ============================================
// INTERFACES ESPECÍFICAS PARA O BACKEND
// ============================================

export interface EventoBackend {
  id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim: string;
  local?: string;
  link_virtual?: string;
  tipo_evento: 'reuniao' | 'estudo' | 'prova' | 'apresentacao' | 'outro' | 'aula' | 'deadline';
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
  criado_por: string; // Mudança: backend retorna criado_por, não criador_id
  grupo_id: string;
  criado_em?: string;
  atualizado_em?: string;
  participantes?: any[];
  configuracoes?: any;
  recorrencia?: any;
}

export interface CreateEventoBackendData {
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim: string;
  local?: string;
  link_virtual?: string;
  tipo_evento?: 'reuniao' | 'estudo' | 'prova' | 'apresentacao' | 'outro' | 'aula' | 'deadline';
}

export interface UpdateEventoBackendData extends Partial<CreateEventoBackendData> {
  status?: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
}

// ============================================
// EVENTOS BACKEND SERVICE
// ============================================

class EventosBackendService {
  /**
   * Criar evento para um grupo
   */
  async criarEvento(grupoId: string, eventoData: CreateEventoBackendData): Promise<{ mensagem: string; evento: EventoBackend }> {
    const response = await apiService.post(`/grupos/${grupoId}/eventos`, {
      grupo_id: grupoId,
      ...eventoData,
      tipo: eventoData.tipo_evento || 'reuniao'
    });
    return response;
  }

  /**
   * Buscar eventos de um grupo
   */
  async listarEventosGrupo(grupoId: string): Promise<{ eventos: EventoBackend[] }> {
    const response = await apiService.get(`/grupos/${grupoId}/eventos`);
    return response;
  }

  /**
   * Buscar evento por ID
   */
  async obterEvento(eventoId: string): Promise<{ evento: EventoBackend; participantes: any[] }> {
    const response = await apiService.get(`/eventos/${eventoId}`);
    return response;
  }

  /**
   * Atualizar evento
   */
  async atualizarEvento(eventoId: string, dadosAtualizacao: UpdateEventoBackendData): Promise<{ mensagem: string; evento: EventoBackend }> {
    const response = await apiService.put(`/eventos/${eventoId}`, dadosAtualizacao);
    return response;
  }

  /**
   * Deletar evento
   */
  async deletarEvento(eventoId: string): Promise<{ mensagem: string }> {
    const response = await apiService.delete(`/eventos/${eventoId}`);
    return response;
  }

  /**
   * Adicionar participante ao evento
   */
  async adicionarParticipante(eventoId: string, usuarioId: string): Promise<{ mensagem: string }> {
    const response = await apiService.post(`/eventos/${eventoId}/participantes`, {
      usuario_id: usuarioId
    });
    return response;
  }

  /**
   * Buscar meus eventos
   */
  async meuEventos(): Promise<{ eventos: EventoBackend[] }> {
    const response = await apiService.get('/eventos/meus');
    return response;
  }
}

const eventosBackendService = new EventosBackendService();
export default eventosBackendService;
