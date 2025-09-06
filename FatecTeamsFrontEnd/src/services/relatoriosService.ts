import { ApiResponse } from '../types';
import apiService from './api';

// ============================================
// INTERFACES - REPORTS SYSTEM
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
  // Dados do gerador
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
    dia_semana?: number; // Para semanal
    dia_mes?: number; // Para mensal
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

// ============================================
// RELATÓRIOS SERVICE
// ============================================

class RelatoriosService {
  // ============================================
  // GERAÇÃO DE RELATÓRIOS
  // ============================================

  /**
   * Gerar relatório de atividade
   */
  async gerarRelatorioAtividade(configuracao: Omit<ConfiguracaoRelatorio, 'tipo'> & { tipo?: 'atividade' }): Promise<ApiResponse<RelatorioBase>> {
    const config = { ...configuracao, tipo: 'atividade' as const };
    return await apiService.post('/api/relatorios/atividade', config);
  }

  /**
   * Gerar relatório de desempenho
   */
  async gerarRelatorioDesempenho(configuracao: Omit<ConfiguracaoRelatorio, 'tipo'> & { tipo?: 'desempenho' }): Promise<ApiResponse<RelatorioBase>> {
    const config = { ...configuracao, tipo: 'desempenho' as const };
    return await apiService.post('/api/relatorios/desempenho', config);
  }

  /**
   * Gerar relatório de uso da plataforma
   */
  async gerarRelatorioUso(configuracao: Omit<ConfiguracaoRelatorio, 'tipo'> & { tipo?: 'uso' }): Promise<ApiResponse<RelatorioBase>> {
    const config = { ...configuracao, tipo: 'uso' as const };
    return await apiService.post('/api/relatorios/uso', config);
  }

  /**
   * Gerar relatório personalizado
   */
  async gerarRelatorioPersonalizado(configuracao: ConfiguracaoRelatorio): Promise<ApiResponse<RelatorioBase>> {
    return await apiService.post('/api/relatorios/personalizado', configuracao);
  }

  /**
   * Obter relatório de atividade de grupo
   */
  async getRelatorioAtividadeGrupo(grupoId: string, parametros: {
    data_inicio: string;
    data_fim: string;
    formato?: 'json' | 'csv' | 'pdf';
  }): Promise<ApiResponse<RelatorioAtividade>> {
    const params = new URLSearchParams();
    Object.entries(parametros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiService.get(`/api/grupos/${grupoId}/relatorios/atividade?${params.toString()}`);
  }

  /**
   * Obter relatório de desempenho de usuário
   */
  async getRelatorioDesempenhoUsuario(usuarioId: string, parametros: {
    data_inicio: string;
    data_fim: string;
    formato?: 'json' | 'csv' | 'pdf';
  }): Promise<ApiResponse<RelatorioDesempenho>> {
    const params = new URLSearchParams();
    Object.entries(parametros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiService.get(`/api/usuarios/${usuarioId}/relatorios/desempenho?${params.toString()}`);
  }

  /**
   * Obter relatório geral da plataforma
   */
  async getRelatorioPlataforma(parametros: {
    data_inicio: string;
    data_fim: string;
    formato?: 'json' | 'csv' | 'pdf';
  }): Promise<ApiResponse<RelatorioUso>> {
    const params = new URLSearchParams();
    Object.entries(parametros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiService.get(`/api/relatorios/plataforma?${params.toString()}`);
  }

  // ============================================
  // GESTÃO DE RELATÓRIOS
  // ============================================

  /**
   * Listar relatórios gerados
   */
  async getRelatorios(filtros: FiltrosRelatorio = {}, pagina: number = 1, limite: number = 20): Promise<ApiResponse<{
    relatorios: RelatorioBase[];
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

    return await apiService.get(`/api/relatorios?${params.toString()}`);
  }

  /**
   * Obter relatório por ID
   */
  async getRelatorio(id: string): Promise<ApiResponse<RelatorioBase>> {
    return await apiService.get(`/api/relatorios/${id}`);
  }

  /**
   * Obter dados do relatório
   */
  async getDadosRelatorio(id: string): Promise<ApiResponse<RelatorioAtividade | RelatorioDesempenho | RelatorioUso>> {
    return await apiService.get(`/api/relatorios/${id}/dados`);
  }

  /**
   * Download de relatório
   */
  async downloadRelatorio(id: string): Promise<ApiResponse<{ url: string; expires_at: string }>> {
    return await apiService.get(`/api/relatorios/${id}/download`);
  }

  /**
   * Deletar relatório
   */
  async deleteRelatorio(id: string): Promise<ApiResponse<void>> {
    return await apiService.delete(`/api/relatorios/${id}`);
  }

  /**
   * Recriar relatório
   */
  async recrearRelatorio(id: string): Promise<ApiResponse<RelatorioBase>> {
    return await apiService.post(`/api/relatorios/${id}/recrear`);
  }

  // ============================================
  // EXPORT RÁPIDO
  // ============================================

  /**
   * Exportar dados com configurações simples
   */
  async exportarRapido(tipo: 'atividade' | 'desempenho' | 'uso', parametros: {
    data_inicio: string;
    data_fim: string;
    formato: 'csv' | 'json' | 'xlsx';
    grupo_id?: string;
    usuario_id?: string;
    filtros?: { [key: string]: any };
  }): Promise<ApiResponse<{ url: string; expires_at: string }>> {
    return await apiService.post('/api/relatorios/exportar', {
      tipo,
      ...parametros,
    });
  }

  // ============================================
  // DASHBOARD EXECUTIVO
  // ============================================

  /**
   * Obter dashboard executivo
   */
  async getDashboardExecutivo(parametros: {
    periodo?: 'semana' | 'mes' | 'trimestre' | 'ano';
    data_inicio?: string;
    data_fim?: string;
  } = {}): Promise<ApiResponse<DashboardExecutivo>> {
    const params = new URLSearchParams();
    Object.entries(parametros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiService.get(`/api/relatorios/dashboard?${params.toString()}`);
  }

  /**
   * Obter KPIs principais
   */
  async getKpisPrincipais(): Promise<ApiResponse<DashboardExecutivo['kpis_principais']>> {
    return await apiService.get('/api/relatorios/kpis');
  }

  /**
   * Obter métricas rápidas
   */
  async getMetricasRapidas(): Promise<ApiResponse<DashboardExecutivo['metricas_rapidas']>> {
    return await apiService.get('/api/relatorios/metricas-rapidas');
  }

  // ============================================
  // RELATÓRIOS AGENDADOS
  // ============================================

  /**
   * Criar relatório agendado
   */
  async criarRelatorioAgendado(configuracao: ConfiguracaoRelatorio): Promise<ApiResponse<{
    id: string;
    configuracao: ConfiguracaoRelatorio;
    proximo_execucao: string;
  }>> {
    return await apiService.post('/api/relatorios/agendados', configuracao);
  }

  /**
   * Listar relatórios agendados
   */
  async getRelatoriosAgendados(): Promise<ApiResponse<{
    id: string;
    configuracao: ConfiguracaoRelatorio;
    proximo_execucao: string;
    ultimo_execucao?: string;
    status: 'ativo' | 'pausado' | 'erro';
  }[]>> {
    return await apiService.get('/api/relatorios/agendados');
  }

  /**
   * Atualizar relatório agendado
   */
  async updateRelatorioAgendado(id: string, configuracao: Partial<ConfiguracaoRelatorio>): Promise<ApiResponse<void>> {
    return await apiService.put(`/api/relatorios/agendados/${id}`, configuracao);
  }

  /**
   * Pausar/Retomar relatório agendado
   */
  async toggleRelatorioAgendado(id: string, ativo: boolean): Promise<ApiResponse<void>> {
    return await apiService.patch(`/api/relatorios/agendados/${id}`, { ativo });
  }

  /**
   * Deletar relatório agendado
   */
  async deleteRelatorioAgendado(id: string): Promise<ApiResponse<void>> {
    return await apiService.delete(`/api/relatorios/agendados/${id}`);
  }

  /**
   * Executar relatório agendado manualmente
   */
  async executarRelatorioAgendado(id: string): Promise<ApiResponse<RelatorioBase>> {
    return await apiService.post(`/api/relatorios/agendados/${id}/executar`);
  }

  // ============================================
  // ANÁLISES AVANÇADAS
  // ============================================

  /**
   * Análise de tendências
   */
  async getAnaliseTendencias(parametros: {
    metrica: 'usuarios' | 'atividade' | 'grupos' | 'tarefas';
    periodo: 'mes' | 'trimestre' | 'ano';
    data_inicio: string;
    data_fim: string;
  }): Promise<ApiResponse<{
    tendencia: 'crescimento' | 'declinio' | 'estavel';
    porcentagem_mudanca: number;
    dados_historicos: { periodo: string; valor: number }[];
    projecoes: { periodo: string; valor_projetado: number }[];
  }>> {
    return await apiService.post('/api/relatorios/analise/tendencias', parametros);
  }

  /**
   * Análise comparativa
   */
  async getAnaliseComparativa(parametros: {
    tipo: 'grupos' | 'usuarios' | 'periodos';
    itens: string[];
    metricas: string[];
    data_inicio: string;
    data_fim: string;
  }): Promise<ApiResponse<{
    comparacao: {
      item: string;
      metricas: { [metrica: string]: number };
      ranking: number;
    }[];
    insights: string[];
  }>> {
    return await apiService.post('/api/relatorios/analise/comparativa', parametros);
  }

  // ============================================
  // OPERAÇÕES UTILITÁRIAS
  // ============================================

  /**
   * Verificar se relatório está pronto
   */
  isRelatorioCompleto(relatorio: RelatorioBase): boolean {
    return relatorio.status === 'concluido' && !!relatorio.url_download;
  }

  /**
   * Verificar se relatório expirou
   */
  isRelatorioExpirado(relatorio: RelatorioBase): boolean {
    if (!relatorio.data_expiracao) return false;
    return new Date(relatorio.data_expiracao) < new Date();
  }

  /**
   * Obter status amigável
   */
  getStatusAmigavel(status: RelatorioBase['status']): string {
    const statusMap = {
      'gerando': 'Gerando...',
      'concluido': 'Concluído',
      'erro': 'Erro na geração'
    };
    return statusMap[status] || status;
  }

  /**
   * Obter ícone por tipo
   */
  getIconePorTipo(tipo: RelatorioBase['tipo']): string {
    const icones = {
      'atividade': '📊',
      'desempenho': '📈',
      'uso': '💻',
      'personalizado': '⚙️'
    };
    return icones[tipo] || '📋';
  }

  /**
   * Formatar tamanho do arquivo
   */
  formatarTamanhoArquivo(bytes?: number): string {
    if (!bytes) return 'N/A';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Calcular tempo até expiração
   */
  getTempoAteExpiracao(dataExpiracao?: string): string {
    if (!dataExpiracao) return 'Não expira';
    
    const agora = new Date();
    const expira = new Date(dataExpiracao);
    const diffMs = expira.getTime() - agora.getTime();
    
    if (diffMs <= 0) return 'Expirado';
    
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (dias > 0) return `${dias} dia${dias > 1 ? 's' : ''}`;
    return `${horas} hora${horas > 1 ? 's' : ''}`;
  }

  /**
   * Filtrar relatórios por status
   */
  filterByStatus(relatorios: RelatorioBase[], status: RelatorioBase['status']): RelatorioBase[] {
    return relatorios.filter(relatorio => relatorio.status === status);
  }

  /**
   * Filtrar relatórios por tipo
   */
  filterByTipo(relatorios: RelatorioBase[], tipo: RelatorioBase['tipo']): RelatorioBase[] {
    return relatorios.filter(relatorio => relatorio.tipo === tipo);
  }

  /**
   * Ordenar relatórios
   */
  sortRelatorios(relatorios: RelatorioBase[], criterio: 'data' | 'titulo' | 'tipo' | 'status', ordem: 'asc' | 'desc' = 'desc'): RelatorioBase[] {
    return [...relatorios].sort((a, b) => {
      let comparison = 0;
      
      switch (criterio) {
        case 'data':
          comparison = new Date(a.data_geracao).getTime() - new Date(b.data_geracao).getTime();
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
   * Agrupar relatórios por critério
   */
  groupRelatorios(relatorios: RelatorioBase[], criterio: 'tipo' | 'status' | 'data'): { [key: string]: RelatorioBase[] } {
    return relatorios.reduce((grupos, relatorio) => {
      let key = '';
      
      switch (criterio) {
        case 'tipo':
          key = relatorio.tipo;
          break;
        case 'status':
          key = relatorio.status;
          break;
        case 'data':
          key = new Date(relatorio.data_geracao).toLocaleDateString('pt-BR', { 
            year: 'numeric', 
            month: 'long' 
          });
          break;
      }
      
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(relatorio);
      
      return grupos;
    }, {} as { [key: string]: RelatorioBase[] });
  }
}

const relatoriosService = new RelatoriosService();
export default relatoriosService;
