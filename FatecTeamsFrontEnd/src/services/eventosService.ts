import { ApiResponse } from '../types';
import apiService from './api';

// ============================================
// INTERFACES - EVENTS MANAGEMENT
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
  // Configurações de lembrete
  lembrete: {
    ativo: boolean;
    minutos_antes: number[];
    enviado: boolean;
  };
  // Configurações de recorrência
  recorrencia?: {
    tipo: 'diaria' | 'semanal' | 'quinzenal' | 'mensal' | 'anual';
    intervalo: number;
    dias_semana?: number[]; // 0-6 (domingo-sábado)
    data_fim?: string;
    max_ocorrencias?: number;
  };
  // Dados relacionados
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
  // Dados do usuário
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
  participantes?: string[]; // IDs dos usuários
  lembrete?: {
    ativo: boolean;
    minutos_antes: number[];
  };
  recorrencia?: Evento['recorrencia'];
}

interface UpdateEventoData extends Partial<CreateEventoData> {
  status?: Evento['status'];
}

// ============================================
// EVENTOS SERVICE
// ============================================

class EventosService {
  // ============================================
  // CRUD BÁSICO DE EVENTOS
  // ============================================

  /**
   * Criar evento
   */
  async createEvento(eventoData: CreateEventoData): Promise<ApiResponse<Evento>> {
    return await apiService.post('/api/eventos', eventoData);
  }

  /**
   * Buscar eventos com filtros
   */
  async getEventos(filtros: FiltrosEvento = {}, pagina: number = 1, limite: number = 50): Promise<ApiResponse<{
    eventos: Evento[];
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
  }>> {
    const params = new URLSearchParams({
      pagina: pagina.toString(),
      limite: limite.toString(),
    });

    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiService.get(`/api/eventos?${params.toString()}`);
  }

  /**
   * Buscar evento por ID
   */
  async getEvento(id: string): Promise<ApiResponse<Evento>> {
    return await apiService.get(`/api/eventos/${id}`);
  }

  /**
   * Atualizar evento
   */
  async updateEvento(id: string, dados: UpdateEventoData): Promise<ApiResponse<Evento>> {
    return await apiService.put(`/api/eventos/${id}`, dados);
  }

  /**
   * Deletar evento
   */
  async deleteEvento(id: string): Promise<ApiResponse<void>> {
    return await apiService.delete(`/api/eventos/${id}`);
  }

  /**
   * Duplicar evento
   */
  async duplicarEvento(id: string, novaData?: string): Promise<ApiResponse<Evento>> {
    return await apiService.post(`/api/eventos/${id}/duplicar`, { nova_data: novaData });
  }

  // ============================================
  // BUSCA E LISTAGEM ESPECÍFICA
  // ============================================

  /**
   * Buscar eventos de um grupo
   */
  async getEventosGrupo(grupoId: string, filtros: Omit<FiltrosEvento, 'grupo_id'> = {}): Promise<ApiResponse<Evento[]>> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiService.get(`/api/grupos/${grupoId}/eventos?${params.toString()}`);
  }

  /**
   * Buscar eventos de uma tarefa
   */
  async getEventosTarefa(tarefaId: string): Promise<ApiResponse<Evento[]>> {
    return await apiService.get(`/api/tarefas/${tarefaId}/eventos`);
  }

  /**
   * Buscar meus eventos
   */
  async getMeusEventos(filtros: FiltrosEvento = {}): Promise<ApiResponse<Evento[]>> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiService.get(`/api/eventos/meus?${params.toString()}`);
  }

  /**
   * Buscar eventos de hoje
   */
  async getEventosHoje(): Promise<ApiResponse<Evento[]>> {
    return await apiService.get('/api/eventos/hoje');
  }

  /**
   * Buscar próximos eventos
   */
  async getProximosEventos(limite: number = 10): Promise<ApiResponse<Evento[]>> {
    return await apiService.get(`/api/eventos/proximos?limite=${limite}`);
  }

  /**
   * Buscar eventos por período
   */
  async getEventosPeriodo(dataInicio: string, dataFim: string): Promise<ApiResponse<Evento[]>> {
    const params = new URLSearchParams({
      data_inicio: dataInicio,
      data_fim: dataFim,
    });

    return await apiService.get(`/api/eventos/periodo?${params.toString()}`);
  }

  // ============================================
  // PARTICIPANTES
  // ============================================

  /**
   * Adicionar participante
   */
  async adicionarParticipante(eventoId: string, usuarioId: string): Promise<ApiResponse<EventoParticipante>> {
    return await apiService.post(`/api/eventos/${eventoId}/participantes`, { usuario_id: usuarioId });
  }

  /**
   * Remover participante
   */
  async removerParticipante(eventoId: string, usuarioId: string): Promise<ApiResponse<void>> {
    return await apiService.delete(`/api/eventos/${eventoId}/participantes/${usuarioId}`);
  }

  /**
   * Buscar participantes do evento
   */
  async getParticipantes(eventoId: string): Promise<ApiResponse<EventoParticipante[]>> {
    return await apiService.get(`/api/eventos/${eventoId}/participantes`);
  }

  /**
   * Responder convite (confirmar/recusar participação)
   */
  async responderConvite(eventoId: string, status: EventoParticipante['status'], comentario?: string): Promise<ApiResponse<EventoParticipante>> {
    return await apiService.post(`/api/eventos/${eventoId}/responder`, {
      status,
      comentario,
    });
  }

  // ============================================
  // CONVITES EXTERNOS
  // ============================================

  /**
   * Enviar convite por email
   */
  async enviarConviteEmail(eventoId: string, emails: string[]): Promise<ApiResponse<EventoConvite[]>> {
    return await apiService.post(`/api/eventos/${eventoId}/convites`, { emails });
  }

  /**
   * Buscar convites do evento
   */
  async getConvites(eventoId: string): Promise<ApiResponse<EventoConvite[]>> {
    return await apiService.get(`/api/eventos/${eventoId}/convites`);
  }

  /**
   * Reenviar convite
   */
  async reenviarConvite(conviteId: string): Promise<ApiResponse<EventoConvite>> {
    return await apiService.post(`/api/convites/${conviteId}/reenviar`);
  }

  /**
   * Cancelar convite
   */
  async cancelarConvite(conviteId: string): Promise<ApiResponse<void>> {
    return await apiService.delete(`/api/convites/${conviteId}`);
  }

  /**
   * Responder convite externo (por token)
   */
  async responderConviteExterno(token: string, status: EventoConvite['status']): Promise<ApiResponse<void>> {
    return await apiService.post(`/api/convites/${token}/responder`, { status });
  }

  // ============================================
  // LEMBRETES E NOTIFICAÇÕES
  // ============================================

  /**
   * Configurar lembrete
   */
  async configurarLembrete(eventoId: string, lembrete: Evento['lembrete']): Promise<ApiResponse<Evento>> {
    return await apiService.put(`/api/eventos/${eventoId}/lembrete`, lembrete);
  }

  /**
   * Enviar lembrete manual
   */
  async enviarLembrete(eventoId: string): Promise<ApiResponse<void>> {
    return await apiService.post(`/api/eventos/${eventoId}/lembrete/enviar`);
  }

  // ============================================
  // RECORRÊNCIA
  // ============================================

  /**
   * Configurar recorrência
   */
  async configurarRecorrencia(eventoId: string, recorrencia: Evento['recorrencia']): Promise<ApiResponse<Evento[]>> {
    return await apiService.put(`/api/eventos/${eventoId}/recorrencia`, recorrencia);
  }

  /**
   * Remover recorrência
   */
  async removerRecorrencia(eventoId: string): Promise<ApiResponse<Evento>> {
    return await apiService.delete(`/api/eventos/${eventoId}/recorrencia`);
  }

  /**
   * Atualizar série de eventos recorrentes
   */
  async atualizarSerieRecorrente(eventoId: string, dados: UpdateEventoData, opcao: 'este' | 'futuros' | 'todos'): Promise<ApiResponse<Evento[]>> {
    return await apiService.put(`/api/eventos/${eventoId}/serie`, {
      ...dados,
      opcao_atualizacao: opcao,
    });
  }

  // ============================================
  // ESTATÍSTICAS E RELATÓRIOS
  // ============================================

  /**
   * Estatísticas de eventos
   */
  async getEstatisticas(): Promise<ApiResponse<{
    total_eventos: number;
    eventos_por_status: { [status: string]: number };
    eventos_por_tipo: { [tipo: string]: number };
    eventos_por_mes: { mes: string; quantidade: number }[];
    taxa_participacao: number;
  }>> {
    return await apiService.get('/api/eventos/estatisticas');
  }

  /**
   * Relatório de participação
   */
  async getRelatorioParticipacao(filtros: FiltrosEvento = {}): Promise<ApiResponse<{
    usuarios: {
      usuario_id: string;
      nome: string;
      eventos_confirmados: number;
      eventos_recusados: number;
      taxa_participacao: number;
    }[];
  }>> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiService.get(`/api/eventos/relatorio/participacao?${params.toString()}`);
  }

  // ============================================
  // OPERAÇÕES UTILITÁRIAS
  // ============================================

  /**
   * Verificar se evento está ativo
   */
  isEventoAtivo(evento: Evento): boolean {
    return evento.status === 'agendado' || evento.status === 'em_andamento';
  }

  /**
   * Verificar se evento já passou
   */
  isEventoPassado(evento: Evento): boolean {
    return new Date(evento.data_fim) < new Date();
  }

  /**
   * Verificar se evento é hoje
   */
  isEventoHoje(evento: Evento): boolean {
    const hoje = new Date();
    const dataEvento = new Date(evento.data_inicio);
    
    return hoje.toDateString() === dataEvento.toDateString();
  }

  /**
   * Verificar se evento está em andamento
   */
  isEventoEmAndamento(evento: Evento): boolean {
    const agora = new Date();
    const inicio = new Date(evento.data_inicio);
    const fim = new Date(evento.data_fim);
    
    return agora >= inicio && agora <= fim;
  }

  /**
   * Calcular duração do evento
   */
  calcularDuracao(evento: Evento): {
    minutos: number;
    horas: number;
    dias: number;
    formato: string;
  } {
    const inicio = new Date(evento.data_inicio);
    const fim = new Date(evento.data_fim);
    const diferencaMs = fim.getTime() - inicio.getTime();
    
    const minutos = Math.floor(diferencaMs / (1000 * 60));
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    let formato = '';
    if (dias > 0) {
      formato = `${dias}d ${horas % 24}h ${minutos % 60}min`;
    } else if (horas > 0) {
      formato = `${horas}h ${minutos % 60}min`;
    } else {
      formato = `${minutos}min`;
    }
    
    return { minutos, horas, dias, formato };
  }

  /**
   * Obter cor padrão por tipo
   */
  getCorPorTipo(tipo: Evento['tipo']): string {
    const cores = {
      reuniao: '#3498db',
      prazo: '#e74c3c',
      workshop: '#9b59b6',
      apresentacao: '#f39c12',
      outros: '#95a5a6',
    };
    
    return cores[tipo] || cores.outros;
  }

  /**
   * Formatar período do evento
   */
  formatarPeriodo(evento: Evento): string {
    const inicio = new Date(evento.data_inicio);
    const fim = new Date(evento.data_fim);
    
    if (evento.is_dia_completo) {
      if (inicio.toDateString() === fim.toDateString()) {
        return inicio.toLocaleDateString('pt-BR');
      } else {
        return `${inicio.toLocaleDateString('pt-BR')} - ${fim.toLocaleDateString('pt-BR')}`;
      }
    } else {
      const formatarDataHora = (data: Date) => {
        return data.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };
      
      if (inicio.toDateString() === fim.toDateString()) {
        return `${inicio.toLocaleDateString('pt-BR')} ${inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return `${formatarDataHora(inicio)} - ${formatarDataHora(fim)}`;
      }
    }
  }

  /**
   * Filtrar eventos por status
   */
  filterByStatus(eventos: Evento[], status: Evento['status']): Evento[] {
    return eventos.filter(evento => evento.status === status);
  }

  /**
   * Filtrar eventos por tipo
   */
  filterByTipo(eventos: Evento[], tipo: Evento['tipo']): Evento[] {
    return eventos.filter(evento => evento.tipo === tipo);
  }

  /**
   * Ordenar eventos
   */
  sortEventos(eventos: Evento[], criterio: 'data' | 'titulo' | 'tipo' | 'status', ordem: 'asc' | 'desc' = 'asc'): Evento[] {
    return [...eventos].sort((a, b) => {
      let comparison = 0;
      
      switch (criterio) {
        case 'data':
          comparison = new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime();
          break;
        case 'titulo':
          comparison = a.titulo.localeCompare(b.titulo);
          break;
        case 'tipo':
          comparison = a.tipo.localeCompare(b.tipo);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return ordem === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Agrupar eventos por critério
   */
  groupEventos(eventos: Evento[], criterio: 'data' | 'tipo' | 'status' | 'grupo'): { [key: string]: Evento[] } {
    return eventos.reduce((grupos, evento) => {
      let key = '';
      
      switch (criterio) {
        case 'data':
          key = new Date(evento.data_inicio).toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          break;
        case 'tipo':
          key = evento.tipo.charAt(0).toUpperCase() + evento.tipo.slice(1);
          break;
        case 'status':
          key = evento.status.replace('_', ' ').charAt(0).toUpperCase() + evento.status.slice(1);
          break;
        case 'grupo':
          key = evento.grupo?.nome || 'Sem grupo';
          break;
      }
      
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(evento);
      
      return grupos;
    }, {} as { [key: string]: Evento[] });
  }

  /**
   * Buscar conflitos de horário
   */
  findConflitos(eventos: Evento[], novoEvento: { data_inicio: string; data_fim: string }): Evento[] {
    const novoInicio = new Date(novoEvento.data_inicio);
    const novoFim = new Date(novoEvento.data_fim);
    
    return eventos.filter(evento => {
      if (evento.status === 'cancelado') return false;
      
      const eventoInicio = new Date(evento.data_inicio);
      const eventoFim = new Date(evento.data_fim);
      
      return (novoInicio < eventoFim && novoFim > eventoInicio);
    });
  }
}

const eventosService = new EventosService();
export default eventosService;
