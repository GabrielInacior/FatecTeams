import { ApiResponse } from '../types';
import apiService from './api';

// ============================================
// INTERFACES - FILE MANAGEMENT
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
  // Metadados específicos do tipo
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
  dados: string; // base64 ou blob
  grupo_id: string;
  tarefa_id?: string;
  mensagem_id?: string;
  is_publico?: boolean;
  descricao?: string;
}

interface ArquivoCompartilhamento {
  id: string;
  arquivo_id: string;
  usuario_id: string;
  tipo_permissao: 'leitura' | 'escrita' | 'admin';
  data_compartilhamento: string;
  data_expiracao?: string;
  // Dados relacionados
  arquivo?: Arquivo;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    foto_perfil?: string;
  };
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
  // Dados relacionados
  uploader?: {
    id: string;
    nome: string;
    email: string;
  };
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

// ============================================
// ARQUIVO SERVICE
// ============================================

class ArquivosService {
  // ============================================
  // UPLOAD E GERENCIAMENTO BÁSICO
  // ============================================

  /**
   * Upload de arquivo
   */
  async uploadArquivo(arquivo: ArquivoUpload): Promise<ApiResponse<Arquivo>> {
    return await apiService.post('/api/arquivos/upload', arquivo);
  }

  /**
   * Upload múltiplos arquivos
   */
  async uploadMultiplosArquivos(arquivos: ArquivoUpload[]): Promise<ApiResponse<Arquivo[]>> {
    return await apiService.post('/api/arquivos/upload/multiplos', { arquivos });
  }

  /**
   * Upload por chunk (arquivos grandes)
   */
  async uploadArquivoChunk(params: {
    nome: string;
    chunk: string;
    chunk_index: number;
    total_chunks: number;
    grupo_id: string;
    tarefa_id?: string;
  }): Promise<ApiResponse<{ upload_id: string; progresso: number }>> {
    return await apiService.post('/api/arquivos/upload/chunk', params);
  }

  /**
   * Finalizar upload por chunks
   */
  async finalizarUploadChunk(uploadId: string): Promise<ApiResponse<Arquivo>> {
    return await apiService.post(`/api/arquivos/upload/chunk/${uploadId}/finalizar`);
  }

  /**
   * Buscar arquivos com filtros
   */
  async getArquivos(filtros: FiltrosArquivo = {}, pagina: number = 1, limite: number = 20): Promise<ApiResponse<{
    arquivos: Arquivo[];
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

    return await apiService.get(`/api/arquivos?${params.toString()}`);
  }

  /**
   * Buscar arquivo por ID
   */
  async getArquivo(id: string): Promise<ApiResponse<Arquivo>> {
    return await apiService.get(`/api/arquivos/${id}`);
  }

  /**
   * Atualizar informações do arquivo
   */
  async updateArquivo(id: string, dados: Partial<Pick<Arquivo, 'nome' | 'is_publico'>>): Promise<ApiResponse<Arquivo>> {
    return await apiService.put(`/api/arquivos/${id}`, dados);
  }

  /**
   * Deletar arquivo
   */
  async deleteArquivo(id: string): Promise<ApiResponse<void>> {
    return await apiService.delete(`/api/arquivos/${id}`);
  }

  /**
   * Download de arquivo
   */
  async downloadArquivo(id: string): Promise<ApiResponse<{ url: string }>> {
    return await apiService.get(`/api/arquivos/${id}/download`);
  }

  /**
   * Preview de arquivo (para imagens, PDFs, etc.)
   */
  async previewArquivo(id: string): Promise<ApiResponse<{ url: string }>> {
    return await apiService.get(`/api/arquivos/${id}/preview`);
  }

  // ============================================
  // BUSCA E LISTAGEM ESPECÍFICA
  // ============================================

  /**
   * Buscar arquivos por grupo
   */
  async getArquivosGrupo(grupoId: string, filtros: Omit<FiltrosArquivo, 'grupo_id'> = {}): Promise<ApiResponse<Arquivo[]>> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiService.get(`/api/grupos/${grupoId}/arquivos?${params.toString()}`);
  }

  /**
   * Buscar arquivos por tarefa
   */
  async getArquivosTarefa(tarefaId: string): Promise<ApiResponse<Arquivo[]>> {
    return await apiService.get(`/api/tarefas/${tarefaId}/arquivos`);
  }

  /**
   * Buscar arquivos por mensagem
   */
  async getArquivosMensagem(mensagemId: string): Promise<ApiResponse<Arquivo[]>> {
    return await apiService.get(`/api/mensagens/${mensagemId}/arquivos`);
  }

  /**
   * Buscar meus arquivos
   */
  async getMeusArquivos(filtros: FiltrosArquivo = {}): Promise<ApiResponse<Arquivo[]>> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiService.get(`/api/arquivos/meus?${params.toString()}`);
  }

  /**
   * Buscar arquivos compartilhados comigo
   */
  async getArquivosCompartilhados(): Promise<ApiResponse<Arquivo[]>> {
    return await apiService.get('/api/arquivos/compartilhados');
  }

  /**
   * Buscar arquivos públicos
   */
  async getArquivosPublicos(filtros: Omit<FiltrosArquivo, 'is_publico'> = {}): Promise<ApiResponse<Arquivo[]>> {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return await apiService.get(`/api/arquivos/publicos?${params.toString()}`);
  }

  // ============================================
  // VERSIONAMENTO
  // ============================================

  /**
   * Criar nova versão de arquivo
   */
  async criarVersao(arquivoId: string, dados: {
    arquivo: string; // base64
    comentario?: string;
  }): Promise<ApiResponse<ArquivoVersao>> {
    return await apiService.post(`/api/arquivos/${arquivoId}/versoes`, dados);
  }

  /**
   * Buscar versões do arquivo
   */
  async getVersoes(arquivoId: string): Promise<ApiResponse<ArquivoVersao[]>> {
    return await apiService.get(`/api/arquivos/${arquivoId}/versoes`);
  }

  /**
   * Buscar versão específica
   */
  async getVersao(arquivoId: string, versao: number): Promise<ApiResponse<ArquivoVersao>> {
    return await apiService.get(`/api/arquivos/${arquivoId}/versoes/${versao}`);
  }

  /**
   * Download de versão específica
   */
  async downloadVersao(arquivoId: string, versao: number): Promise<ApiResponse<{ url: string }>> {
    return await apiService.get(`/api/arquivos/${arquivoId}/versoes/${versao}/download`);
  }

  /**
   * Restaurar versão específica
   */
  async restaurarVersao(arquivoId: string, versao: number): Promise<ApiResponse<Arquivo>> {
    return await apiService.post(`/api/arquivos/${arquivoId}/versoes/${versao}/restaurar`);
  }

  // ============================================
  // COMPARTILHAMENTO
  // ============================================

  /**
   * Compartilhar arquivo com usuário
   */
  async compartilharArquivo(arquivoId: string, dados: {
    usuario_id: string;
    tipo_permissao: ArquivoCompartilhamento['tipo_permissao'];
    data_expiracao?: string;
  }): Promise<ApiResponse<ArquivoCompartilhamento>> {
    return await apiService.post(`/api/arquivos/${arquivoId}/compartilhar`, dados);
  }

  /**
   * Buscar compartilhamentos do arquivo
   */
  async getCompartilhamentos(arquivoId: string): Promise<ApiResponse<ArquivoCompartilhamento[]>> {
    return await apiService.get(`/api/arquivos/${arquivoId}/compartilhamentos`);
  }

  /**
   * Atualizar permissão de compartilhamento
   */
  async updateCompartilhamento(compartilhamentoId: string, dados: {
    tipo_permissao: ArquivoCompartilhamento['tipo_permissao'];
    data_expiracao?: string;
  }): Promise<ApiResponse<ArquivoCompartilhamento>> {
    return await apiService.put(`/api/compartilhamentos/${compartilhamentoId}`, dados);
  }

  /**
   * Remover compartilhamento
   */
  async removeCompartilhamento(compartilhamentoId: string): Promise<ApiResponse<void>> {
    return await apiService.delete(`/api/compartilhamentos/${compartilhamentoId}`);
  }

  /**
   * Criar link público de compartilhamento
   */
  async criarLinkPublico(arquivoId: string, dados: {
    tipo_acesso: LinkCompartilhamento['tipo_acesso'];
    senha?: string;
    data_expiracao?: string;
    max_downloads?: number;
  }): Promise<ApiResponse<LinkCompartilhamento>> {
    return await apiService.post(`/api/arquivos/${arquivoId}/link-publico`, dados);
  }

  /**
   * Buscar links públicos do arquivo
   */
  async getLinksPublicos(arquivoId: string): Promise<ApiResponse<LinkCompartilhamento[]>> {
    return await apiService.get(`/api/arquivos/${arquivoId}/links-publicos`);
  }

  /**
   * Atualizar link público
   */
  async updateLinkPublico(linkId: string, dados: Partial<Pick<LinkCompartilhamento, 'data_expiracao' | 'max_downloads' | 'is_ativo'>>): Promise<ApiResponse<LinkCompartilhamento>> {
    return await apiService.put(`/api/links-publicos/${linkId}`, dados);
  }

  /**
   * Deletar link público
   */
  async deleteLinkPublico(linkId: string): Promise<ApiResponse<void>> {
    return await apiService.delete(`/api/links-publicos/${linkId}`);
  }

  /**
   * Acessar arquivo via link público
   */
  async acessarLinkPublico(codigo: string, senha?: string): Promise<ApiResponse<{
    arquivo: Arquivo;
    link: LinkCompartilhamento;
  }>> {
    return await apiService.post(`/api/links-publicos/${codigo}/acessar`, { senha });
  }

  // ============================================
  // ESTATÍSTICAS E RELATÓRIOS
  // ============================================

  /**
   * Estatísticas gerais de arquivos
   */
  async getEstatisticas(): Promise<ApiResponse<EstatisticasArquivos>> {
    return await apiService.get('/api/arquivos/estatisticas');
  }

  /**
   * Estatísticas por grupo
   */
  async getEstatisticasGrupo(grupoId: string): Promise<ApiResponse<EstatisticasArquivos>> {
    return await apiService.get(`/api/grupos/${grupoId}/arquivos/estatisticas`);
  }

  /**
   * Arquivos duplicados
   */
  async getArquivosDuplicados(): Promise<ApiResponse<{
    grupos: {
      hash: string;
      arquivos: Arquivo[];
      tamanho_total: number;
    }[];
  }>> {
    return await apiService.get('/api/arquivos/duplicados');
  }

  /**
   * Limpeza de arquivos órfãos
   */
  async limparArquivosOrfaos(): Promise<ApiResponse<{
    arquivos_removidos: number;
    espaco_liberado: number;
  }>> {
    return await apiService.post('/api/arquivos/limpeza');
  }

  // ============================================
  // OPERAÇÕES UTILITÁRIAS
  // ============================================

  /**
   * Verificar se arquivo existe
   */
  isArquivoExistente(arquivo: Arquivo | null): boolean {
    return arquivo !== null && arquivo.status === 'concluido';
  }

  /**
   * Verificar se é imagem
   */
  isImagem(arquivo: Arquivo): boolean {
    const tiposImagem = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    return tiposImagem.includes(arquivo.tipo.toLowerCase());
  }

  /**
   * Verificar se é documento
   */
  isDocumento(arquivo: Arquivo): boolean {
    const tiposDocumento = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv'
    ];
    return tiposDocumento.includes(arquivo.tipo.toLowerCase());
  }

  /**
   * Verificar se é vídeo
   */
  isVideo(arquivo: Arquivo): boolean {
    return arquivo.tipo.toLowerCase().startsWith('video/');
  }

  /**
   * Verificar se é áudio
   */
  isAudio(arquivo: Arquivo): boolean {
    return arquivo.tipo.toLowerCase().startsWith('audio/');
  }

  /**
   * Formatar tamanho de arquivo
   */
  formatarTamanho(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obter ícone por tipo de arquivo
   */
  getIconePorTipo(arquivo: Arquivo): string {
    if (this.isImagem(arquivo)) return '🖼️';
    if (this.isVideo(arquivo)) return '🎥';
    if (this.isAudio(arquivo)) return '🎵';
    if (arquivo.tipo.includes('pdf')) return '📄';
    if (arquivo.tipo.includes('word') || arquivo.tipo.includes('document')) return '📝';
    if (arquivo.tipo.includes('excel') || arquivo.tipo.includes('spreadsheet')) return '📊';
    if (arquivo.tipo.includes('powerpoint') || arquivo.tipo.includes('presentation')) return '📈';
    if (arquivo.tipo.includes('zip') || arquivo.tipo.includes('rar')) return '🗜️';
    return '📁';
  }

  /**
   * Filtrar arquivos por tipo
   */
  filterByTipo(arquivos: Arquivo[], tipo: 'imagem' | 'documento' | 'video' | 'audio' | 'outros'): Arquivo[] {
    return arquivos.filter(arquivo => {
      switch (tipo) {
        case 'imagem':
          return this.isImagem(arquivo);
        case 'documento':
          return this.isDocumento(arquivo);
        case 'video':
          return this.isVideo(arquivo);
        case 'audio':
          return this.isAudio(arquivo);
        case 'outros':
          return !this.isImagem(arquivo) && !this.isDocumento(arquivo) && !this.isVideo(arquivo) && !this.isAudio(arquivo);
        default:
          return true;
      }
    });
  }

  /**
   * Ordenar arquivos
   */
  sortArquivos(arquivos: Arquivo[], criterio: 'nome' | 'data' | 'tamanho' | 'tipo', ordem: 'asc' | 'desc' = 'asc'): Arquivo[] {
    return [...arquivos].sort((a, b) => {
      let comparison = 0;
      
      switch (criterio) {
        case 'nome':
          comparison = a.nome.localeCompare(b.nome);
          break;
        case 'data':
          comparison = new Date(a.data_upload).getTime() - new Date(b.data_upload).getTime();
          break;
        case 'tamanho':
          comparison = a.tamanho - b.tamanho;
          break;
        case 'tipo':
          comparison = a.tipo.localeCompare(b.tipo);
          break;
      }
      
      return ordem === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Agrupar arquivos por critério
   */
  groupArquivos(arquivos: Arquivo[], criterio: 'tipo' | 'data' | 'grupo'): { [key: string]: Arquivo[] } {
    return arquivos.reduce((grupos, arquivo) => {
      let key = '';
      
      switch (criterio) {
        case 'tipo':
          if (this.isImagem(arquivo)) key = 'Imagens';
          else if (this.isDocumento(arquivo)) key = 'Documentos';
          else if (this.isVideo(arquivo)) key = 'Vídeos';
          else if (this.isAudio(arquivo)) key = 'Áudios';
          else key = 'Outros';
          break;
        case 'data':
          key = new Date(arquivo.data_upload).toLocaleDateString('pt-BR', { 
            year: 'numeric', 
            month: 'long' 
          });
          break;
        case 'grupo':
          key = arquivo.grupo?.nome || 'Sem grupo';
          break;
      }
      
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(arquivo);
      
      return grupos;
    }, {} as { [key: string]: Arquivo[] });
  }
}

const arquivosService = new ArquivosService();
export default arquivosService;
