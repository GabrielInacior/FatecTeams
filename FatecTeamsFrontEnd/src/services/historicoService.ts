import { ApiResponse } from '../types';
import apiService from './api';

// ============================================
// INTERFACES - ACTIVITY HISTORY
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
  // Dados relacionados
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
  // Dados do usuário
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
}

// ============================================
// HISTÓRICO SERVICE
// ============================================

class HistoricoService {
  // ============================================
  // CONSULTA DE HISTÓRICO
  // ============================================

  /**
   * Buscar histórico do usuário logado
   */
  async getMeuHistorico(filtros: Omit<FiltrosHistorico, 'usuario_id'> = {}, pagina: number = 1, limite: number = 50): Promise<ApiResponse<{
    atividades: AtividadeHistorico[];
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
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    return await apiService.get(`/api/historico/meu?${params.toString()}`);
  }

  /**
   * Buscar histórico de um grupo
   */
  async getHistoricoGrupo(grupoId: string, filtros: Omit<FiltrosHistorico, 'grupo_id'> = {}, pagina: number = 1, limite: number = 50): Promise<ApiResponse<{
    atividades: AtividadeHistorico[];
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
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    return await apiService.get(`/api/grupos/${grupoId}/historico?${params.toString()}`);
  }

  /**
   * Buscar histórico de uma tarefa
   */
  async getHistoricoTarefa(tarefaId: string, pagina: number = 1, limite: number = 20): Promise<ApiResponse<{
    atividades: AtividadeHistorico[];
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
  }>> {
    const params = new URLSearchParams({
      pagina: pagina.toString(),
      limite: limite.toString(),
    });

    return await apiService.get(`/api/tarefas/${tarefaId}/historico?${params.toString()}`);
  }

  /**
   * Buscar histórico de um usuário específico (para admins)
   */
  async getHistoricoUsuario(usuarioId: string, filtros: Omit<FiltrosHistorico, 'usuario_id'> = {}, pagina: number = 1, limite: number = 50): Promise<ApiResponse<{
    atividades: AtividadeHistorico[];
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
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    return await apiService.get(`/api/usuarios/${usuarioId}/historico?${params.toString()}`);
  }

  /**
   * Buscar atividade específica
   */
  async getAtividade(id: string): Promise<ApiResponse<AtividadeHistorico>> {
    return await apiService.get(`/api/historico/${id}`);
  }

  /**
   * Buscar atividades recentes
   */
  async getAtividadesRecentes(limite: number = 10): Promise<ApiResponse<AtividadeHistorico[]>> {
    return await apiService.get(`/api/historico/recentes?limite=${limite}`);
  }

  // ============================================
  // ESTATÍSTICAS
  // ============================================

  /**
   * Estatísticas de atividade do usuário
   */
  async getEstatisticasUsuario(filtros: { data_inicio?: string; data_fim?: string } = {}): Promise<ApiResponse<EstatisticasAtividade>> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiService.get(`/api/historico/estatisticas?${params.toString()}`);
  }

  /**
   * Estatísticas de atividade de um grupo
   */
  async getEstatisticasGrupo(grupoId: string, filtros: { data_inicio?: string; data_fim?: string } = {}): Promise<ApiResponse<EstatisticasAtividade>> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiService.get(`/api/grupos/${grupoId}/historico/estatisticas?${params.toString()}`);
  }

  /**
   * Top usuários mais ativos de um grupo
   */
  async getTopUsuariosGrupo(grupoId: string, limite: number = 10): Promise<ApiResponse<EstatisticasAtividade['usuarios_mais_ativos']>> {
    return await apiService.get(`/api/grupos/${grupoId}/historico/top-usuarios?limite=${limite}`);
  }

  /**
   * Estatísticas gerais da plataforma (admin)
   */
  async getEstatisticasPlataforma(filtros: { data_inicio?: string; data_fim?: string } = {}): Promise<ApiResponse<EstatisticasAtividade>> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiService.get(`/api/admin/historico/estatisticas?${params.toString()}`);
  }

  // ============================================
  // RELATÓRIOS
  // ============================================

  /**
   * Gerar relatório de atividade
   */
  async gerarRelatorioAtividade(filtros: {
    data_inicio: string;
    data_fim: string;
    grupo_id?: string;
    formato?: 'json' | 'csv' | 'pdf';
    incluir_detalhes?: boolean;
  }): Promise<ApiResponse<RelatorioAtividade>> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiService.get(`/api/historico/relatorio?${params.toString()}`);
  }

  /**
   * Exportar histórico
   */
  async exportarHistorico(filtros: FiltrosHistorico & {
    formato: 'csv' | 'json' | 'xlsx';
    incluir_dados_relacionados?: boolean;
  }): Promise<ApiResponse<{ url: string; expires_at: string }>> {
    return await apiService.post('/api/historico/exportar', filtros);
  }

  // ============================================
  // SESSÕES DE USUÁRIO
  // ============================================

  /**
   * Listar sessões ativas
   */
  async getSessoesAtivas(): Promise<ApiResponse<SessaoUsuario[]>> {
    return await apiService.get('/api/historico/sessoes/ativas');
  }

  /**
   * Buscar minhas sessões
   */
  async getMinhasSessoes(limite: number = 20): Promise<ApiResponse<SessaoUsuario[]>> {
    return await apiService.get(`/api/historico/sessoes/minhas?limite=${limite}`);
  }

  /**
   * Encerrar sessão
   */
  async encerrarSessao(sessaoId: string): Promise<ApiResponse<void>> {
    return await apiService.post(`/api/historico/sessoes/${sessaoId}/encerrar`);
  }

  /**
   * Encerrar todas as outras sessões
   */
  async encerrarOutrasSessoes(): Promise<ApiResponse<{ sessoes_encerradas: number }>> {
    return await apiService.post('/api/historico/sessoes/encerrar-outras');
  }

  // ============================================
  // LIMPEZA E MANUTENÇÃO
  // ============================================

  /**
   * Limpar histórico antigo
   */
  async limparHistoricoAntigo(diasParaManter: number = 90): Promise<ApiResponse<{
    registros_removidos: number;
    espaco_liberado: string;
  }>> {
    return await apiService.post('/api/admin/historico/limpar', {
      dias_para_manter: diasParaManter,
    });
  }

  /**
   * Arquivar histórico
   */
  async arquivarHistorico(filtros: {
    data_inicio: string;
    data_fim: string;
    remover_originais?: boolean;
  }): Promise<ApiResponse<{
    registros_arquivados: number;
    arquivo_gerado: string;
  }>> {
    return await apiService.post('/api/admin/historico/arquivar', filtros);
  }

  // ============================================
  // OPERAÇÕES UTILITÁRIAS
  // ============================================

  /**
   * Verificar se atividade é recente (último dia)
   */
  isAtividadeRecente(atividade: AtividadeHistorico): boolean {
    const agora = new Date();
    const dataAtividade = new Date(atividade.data_atividade);
    const umDiaMs = 24 * 60 * 60 * 1000;
    
    return (agora.getTime() - dataAtividade.getTime()) < umDiaMs;
  }

  /**
   * Agrupar atividades por tipo
   */
  groupByTipo(atividades: AtividadeHistorico[]): { [tipo: string]: AtividadeHistorico[] } {
    return atividades.reduce((grupos, atividade) => {
      const tipo = atividade.tipo_atividade;
      if (!grupos[tipo]) {
        grupos[tipo] = [];
      }
      grupos[tipo].push(atividade);
      return grupos;
    }, {} as { [tipo: string]: AtividadeHistorico[] });
  }

  /**
   * Agrupar atividades por data
   */
  groupByData(atividades: AtividadeHistorico[]): { [data: string]: AtividadeHistorico[] } {
    return atividades.reduce((grupos, atividade) => {
      const data = new Date(atividade.data_atividade).toLocaleDateString('pt-BR');
      if (!grupos[data]) {
        grupos[data] = [];
      }
      grupos[data].push(atividade);
      return grupos;
    }, {} as { [data: string]: AtividadeHistorico[] });
  }

  /**
   * Agrupar atividades por usuário
   */
  groupByUsuario(atividades: AtividadeHistorico[]): { [usuarioId: string]: AtividadeHistorico[] } {
    return atividades.reduce((grupos, atividade) => {
      const usuarioId = atividade.usuario_id;
      if (!grupos[usuarioId]) {
        grupos[usuarioId] = [];
      }
      grupos[usuarioId].push(atividade);
      return grupos;
    }, {} as { [usuarioId: string]: AtividadeHistorico[] });
  }

  /**
   * Filtrar atividades por período
   */
  filterByPeriodo(atividades: AtividadeHistorico[], dataInicio: string, dataFim: string): AtividadeHistorico[] {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    return atividades.filter(atividade => {
      const dataAtividade = new Date(atividade.data_atividade);
      return dataAtividade >= inicio && dataAtividade <= fim;
    });
  }

  /**
   * Obter descrição amigável do tipo de atividade
   */
  getDescricaoTipo(tipo: AtividadeHistorico['tipo_atividade']): string {
    const descricoes = {
      login: 'Login',
      logout: 'Logout',
      criar_grupo: 'Criou grupo',
      entrar_grupo: 'Entrou no grupo',
      sair_grupo: 'Saiu do grupo',
      atualizar_grupo: 'Atualizou grupo',
      criar_tarefa: 'Criou tarefa',
      atualizar_tarefa: 'Atualizou tarefa',
      concluir_tarefa: 'Concluiu tarefa',
      comentar_tarefa: 'Comentou em tarefa',
      enviar_mensagem: 'Enviou mensagem',
      editar_mensagem: 'Editou mensagem',
      deletar_mensagem: 'Deletou mensagem',
      reagir_mensagem: 'Reagiu à mensagem',
      upload_arquivo: 'Fez upload de arquivo',
      download_arquivo: 'Baixou arquivo',
      compartilhar_arquivo: 'Compartilhou arquivo',
      criar_evento: 'Criou evento',
      atualizar_evento: 'Atualizou evento',
      participar_evento: 'Participou de evento',
      criar_convite: 'Enviou convite',
      aceitar_convite: 'Aceitou convite',
      recusar_convite: 'Recusou convite',
      atualizar_perfil: 'Atualizou perfil',
      alterar_senha: 'Alterou senha',
      outros: 'Outros',
    };
    
    return descricoes[tipo] || tipo;
  }

  /**
   * Obter ícone por tipo de atividade
   */
  getIconePorTipo(tipo: AtividadeHistorico['tipo_atividade']): string {
    const icones = {
      login: '🔓',
      logout: '🔒',
      criar_grupo: '👥',
      entrar_grupo: '➡️',
      sair_grupo: '⬅️',
      atualizar_grupo: '✏️',
      criar_tarefa: '📝',
      atualizar_tarefa: '🔄',
      concluir_tarefa: '✅',
      comentar_tarefa: '💬',
      enviar_mensagem: '📩',
      editar_mensagem: '✏️',
      deletar_mensagem: '🗑️',
      reagir_mensagem: '😊',
      upload_arquivo: '📤',
      download_arquivo: '📥',
      compartilhar_arquivo: '🔗',
      criar_evento: '📅',
      atualizar_evento: '📝',
      participar_evento: '🙋',
      criar_convite: '📧',
      aceitar_convite: '✅',
      recusar_convite: '❌',
      atualizar_perfil: '👤',
      alterar_senha: '🔐',
      outros: '📋',
    };
    
    return icones[tipo] || '📋';
  }

  /**
   * Calcular estatísticas básicas
   */
  calcularEstatisticasBasicas(atividades: AtividadeHistorico[]): {
    total: number;
    tipos_unicos: number;
    usuarios_unicos: number;
    periodo: {
      inicio: string;
      fim: string;
    };
    atividade_mais_comum: string;
  } {
    const tiposUnicos = new Set(atividades.map(a => a.tipo_atividade));
    const usuariosUnicos = new Set(atividades.map(a => a.usuario_id));
    
    // Encontrar tipo mais comum
    const contagemTipos = atividades.reduce((acc, atividade) => {
      acc[atividade.tipo_atividade] = (acc[atividade.tipo_atividade] || 0) + 1;
      return acc;
    }, {} as { [tipo: string]: number });
    
    const tipoMaisComum = Object.entries(contagemTipos)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Nenhuma';
    
    // Calcular período
    const datas = atividades.map(a => new Date(a.data_atividade).getTime()).sort();
    const inicio = datas[0] ? new Date(datas[0]).toISOString() : '';
    const fim = datas[datas.length - 1] ? new Date(datas[datas.length - 1]).toISOString() : '';
    
    return {
      total: atividades.length,
      tipos_unicos: tiposUnicos.size,
      usuarios_unicos: usuariosUnicos.size,
      periodo: { inicio, fim },
      atividade_mais_comum: tipoMaisComum,
    };
  }

  /**
   * Ordenar atividades
   */
  sortAtividades(atividades: AtividadeHistorico[], criterio: 'data' | 'tipo' | 'usuario', ordem: 'asc' | 'desc' = 'desc'): AtividadeHistorico[] {
    return [...atividades].sort((a, b) => {
      let comparison = 0;
      
      switch (criterio) {
        case 'data':
          comparison = new Date(a.data_atividade).getTime() - new Date(b.data_atividade).getTime();
          break;
        case 'tipo':
          comparison = a.tipo_atividade.localeCompare(b.tipo_atividade);
          break;
        case 'usuario':
          comparison = (a.usuario?.nome || '').localeCompare(b.usuario?.nome || '');
          break;
      }
      
      return ordem === 'desc' ? -comparison : comparison;
    });
  }
}

const historicoService = new HistoricoService();
export default historicoService;
