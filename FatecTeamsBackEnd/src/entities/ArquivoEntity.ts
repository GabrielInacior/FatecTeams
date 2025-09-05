import { ArquivoRepository, IArquivo, ICompartilhamentoArquivo } from '../repositories/ArquivoRepository';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export interface IArquivoCreate {
    nome: string;
    nome_original: string;
    tipo_mime: string;
    tamanho: number;
    url: string;
    pasta?: string;
    grupo_id: string;
    enviado_por: string;
    descricao?: string;
    tags?: string[];
    publico?: boolean;
}

export interface IArquivoUpdate {
    nome?: string;
    nome_original?: string;
    pasta?: string;
    descricao?: string;
    tags?: string[];
    publico?: boolean;
}

export class ArquivoEntity {
    private arquivoRepository: ArquivoRepository;
    private dados: IArquivo;

    constructor(dados?: IArquivo) {
        this.arquivoRepository = new ArquivoRepository();
        this.dados = dados || {} as IArquivo;
    }

    // ============================================
    // REGRAS DE NEGÓCIO PRÉ-VALIDAÇÃO
    // ============================================

    private preRules(): void {
        if (!this.dados.id) {
            this.dados.id = uuidv4();
        }

        if (this.dados.nome) {
            this.dados.nome = this.dados.nome.trim();
        }

        if (this.dados.nome_original) {
            this.dados.nome_original = this.dados.nome_original.trim();
        }

        if (this.dados.pasta) {
            this.dados.pasta = this.dados.pasta.trim();
            // Normalizar pasta (remover barras no início/fim)
            this.dados.pasta = this.dados.pasta.replace(/^\/+|\/+$/g, '');
        }

        if (this.dados.descricao) {
            this.dados.descricao = this.dados.descricao.trim();
        }

        if (this.dados.tags) {
            this.dados.tags = [...new Set(this.dados.tags.map(tag => tag.toLowerCase().trim()))];
            this.dados.tags = this.dados.tags.filter(tag => tag.length > 0);
        }

        // Auto-definir se não especificado
        if (this.dados.publico === undefined) {
            this.dados.publico = false;
        }

        if (!this.dados.downloads) {
            this.dados.downloads = 0;
        }

        if (!this.dados.versao) {
            this.dados.versao = 1;
        }
    }

    // ============================================
    // REGRAS DE VALIDAÇÃO
    // ============================================

    private async rules(): Promise<{ valido: boolean; erros: string[] }> {
        const erros: string[] = [];

        // Validação do nome
        if (!this.dados.nome || this.dados.nome.length === 0) {
            erros.push('Nome do arquivo é obrigatório');
        } else if (this.dados.nome.length > 255) {
            erros.push('Nome do arquivo deve ter no máximo 255 caracteres');
        }

        // Validação do nome original
        if (!this.dados.nome_original || this.dados.nome_original.length === 0) {
            erros.push('Nome original do arquivo é obrigatório');
        } else if (this.dados.nome_original.length > 255) {
            erros.push('Nome original deve ter no máximo 255 caracteres');
        }

        // Validação do tipo MIME
        if (!this.dados.tipo_mime || this.dados.tipo_mime.length === 0) {
            erros.push('Tipo MIME é obrigatório');
        } else {
            const mimeValido = /^[a-z]+\/[a-z0-9\-\+\.]+$/i.test(this.dados.tipo_mime);
            if (!mimeValido) {
                erros.push('Tipo MIME inválido');
            }
        }

        // Validação do tamanho
        if (!this.dados.tamanho || this.dados.tamanho <= 0) {
            erros.push('Tamanho do arquivo deve ser maior que zero');
        } else if (this.dados.tamanho > 50 * 1024 * 1024) { // 50MB
            erros.push('Arquivo não pode ser maior que 50MB');
        }

        // Validação da URL
        if (!this.dados.url || this.dados.url.length === 0) {
            erros.push('URL do arquivo é obrigatória');
        } else {
            try {
                new URL(this.dados.url);
            } catch {
                erros.push('URL do arquivo inválida');
            }
        }

        // Validação da pasta
        if (this.dados.pasta) {
            if (this.dados.pasta.length > 100) {
                erros.push('Nome da pasta deve ter no máximo 100 caracteres');
            }
            // Verificar caracteres inválidos
            const caracteresInvalidos = /[<>:"|?*\\]/;
            if (caracteresInvalidos.test(this.dados.pasta)) {
                erros.push('Nome da pasta contém caracteres inválidos');
            }
        }

        // Validação da descrição
        if (this.dados.descricao && this.dados.descricao.length > 500) {
            erros.push('Descrição deve ter no máximo 500 caracteres');
        }

        // Validação de grupo e usuário
        if (!this.dados.grupo_id) {
            erros.push('ID do grupo é obrigatório');
        }
        if (!this.dados.enviado_por) {
            erros.push('ID do usuário é obrigatório');
        }

        // Validação de tags
        if (this.dados.tags && this.dados.tags.length > 10) {
            erros.push('Não é possível ter mais de 10 tags por arquivo');
        }

        // Validação de tipos de arquivo permitidos
        const tiposPermitidos = [
            'image/', 'video/', 'audio/', 'text/', 'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument',
            'application/vnd.ms-excel', 'application/vnd.ms-powerpoint',
            'application/zip', 'application/x-rar-compressed'
        ];

        const tipoPermitido = tiposPermitidos.some(tipo => this.dados.tipo_mime.startsWith(tipo));
        if (!tipoPermitido) {
            erros.push('Tipo de arquivo não permitido');
        }

        return {
            valido: erros.length === 0,
            erros
        };
    }

    // ============================================
    // MÉTODOS PRINCIPAIS
    // ============================================

    public async create(dadosArquivo: IArquivoCreate): Promise<{ sucesso: boolean; arquivo?: any; erros?: string[] }> {
        try {
            this.dados = {
                ...dadosArquivo,
                downloads: 0,
                versao: 1,
                criado_em: new Date(),
                atualizado_em: new Date()
            };

            this.preRules();
            const validacao = await this.rules();

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    erros: validacao.erros
                };
            }

            const arquivoId = await this.arquivoRepository.criar(this.dados);
            const arquivoSalvo = await this.arquivoRepository.buscarPorId(arquivoId);

            return {
                sucesso: true,
                arquivo: arquivoSalvo
            };

        } catch (error) {
            console.error('Erro ao criar arquivo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async update(id: string, dadosAtualizacao: IArquivoUpdate): Promise<{ sucesso: boolean; arquivo?: any; erros?: string[] }> {
        try {
            const arquivoExistente = await this.arquivoRepository.buscarPorId(id);
            
            if (!arquivoExistente) {
                return {
                    sucesso: false,
                    erros: ['Arquivo não encontrado']
                };
            }

            // Manter dados essenciais inalterados
            this.dados = {
                ...arquivoExistente,
                ...dadosAtualizacao,
                // Preservar dados críticos
                id: arquivoExistente.id,
                tipo_mime: arquivoExistente.tipo_mime,
                tamanho: arquivoExistente.tamanho,
                url: arquivoExistente.url,
                grupo_id: arquivoExistente.grupo_id,
                enviado_por: arquivoExistente.enviado_por,
                criado_em: arquivoExistente.criado_em,
                atualizado_em: new Date()
            };

            this.preRules();
            const validacao = await this.rules();

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    erros: validacao.erros
                };
            }

            const atualizado = await this.arquivoRepository.atualizar(id, dadosAtualizacao);

            if (!atualizado) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível atualizar o arquivo']
                };
            }

            const arquivoAtualizado = await this.arquivoRepository.buscarPorId(id);

            return {
                sucesso: true,
                arquivo: arquivoAtualizado
            };

        } catch (error) {
            console.error('Erro ao atualizar arquivo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async delete(id: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            const deletado = await this.arquivoRepository.deletar(id);

            if (!deletado) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível deletar o arquivo']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao deletar arquivo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // VERSÕES
    // ============================================

    public async criarVersao(arquivoId: string, novosDados: Partial<IArquivoCreate>): Promise<{ sucesso: boolean; arquivo?: any; erros?: string[] }> {
        try {
            if (!novosDados.url || !novosDados.tamanho) {
                return {
                    sucesso: false,
                    erros: ['URL e tamanho são obrigatórios para nova versão']
                };
            }

            const arquivoOriginal = await this.arquivoRepository.buscarPorId(arquivoId);
            if (!arquivoOriginal) {
                return {
                    sucesso: false,
                    erros: ['Arquivo original não encontrado']
                };
            }

            // Validar se é o mesmo tipo de arquivo
            if (novosDados.tipo_mime && novosDados.tipo_mime !== arquivoOriginal.tipo_mime) {
                return {
                    sucesso: false,
                    erros: ['Nova versão deve manter o mesmo tipo de arquivo']
                };
            }

            const novaVersaoId = await this.arquivoRepository.criarVersao(arquivoId, {
                nome: novosDados.nome || `${arquivoOriginal.nome_original}_v${Date.now()}`,
                nome_original: novosDados.nome_original || arquivoOriginal.nome_original,
                tipo_mime: novosDados.tipo_mime || arquivoOriginal.tipo_mime,
                tamanho: novosDados.tamanho,
                url: novosDados.url,
                enviado_por: novosDados.enviado_por!,
                descricao: novosDados.descricao,
                tags: novosDados.tags || arquivoOriginal.tags
            });

            const novaVersao = await this.arquivoRepository.buscarPorId(novaVersaoId);

            return {
                sucesso: true,
                arquivo: novaVersao
            };

        } catch (error) {
            console.error('Erro ao criar nova versão:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async listarVersoes(arquivoId: string): Promise<{ sucesso: boolean; versoes?: any[]; erros?: string[] }> {
        try {
            const versoes = await this.arquivoRepository.listarVersoes(arquivoId);

            return {
                sucesso: true,
                versoes
            };

        } catch (error) {
            console.error('Erro ao listar versões:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // COMPARTILHAMENTO
    // ============================================

    public async compartilhar(
        arquivoId: string, 
        usuarioId: string, 
        permissoes: {
            pode_visualizar: boolean;
            pode_baixar: boolean;
            pode_editar: boolean;
        },
        dataExpiracao?: Date
    ): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            const compartilhado = await this.arquivoRepository.compartilharArquivo({
                arquivo_id: arquivoId,
                usuario_id: usuarioId,
                pode_visualizar: permissoes.pode_visualizar,
                pode_baixar: permissoes.pode_baixar,
                pode_editar: permissoes.pode_editar,
                data_expiracao: dataExpiracao
            });

            if (!compartilhado) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível compartilhar o arquivo']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao compartilhar arquivo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async removerCompartilhamento(arquivoId: string, usuarioId: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            const removido = await this.arquivoRepository.removerCompartilhamento(arquivoId, usuarioId);

            if (!removido) {
                return {
                    sucesso: false,
                    erros: ['Compartilhamento não encontrado']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao remover compartilhamento:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async verificarPermissao(arquivoId: string, usuarioId: string): Promise<{ sucesso: boolean; permissao?: ICompartilhamentoArquivo; erros?: string[] }> {
        try {
            const permissao = await this.arquivoRepository.verificarPermissao(arquivoId, usuarioId);

            return {
                sucesso: true,
                permissao: permissao || undefined
            };

        } catch (error) {
            console.error('Erro ao verificar permissão:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // MÉTODOS DE CONSULTA
    // ============================================

    public async buscarPorId(id: string): Promise<{ sucesso: boolean; arquivo?: any; erros?: string[] }> {
        try {
            const arquivo = await this.arquivoRepository.buscarPorId(id);
            
            if (!arquivo) {
                return {
                    sucesso: false,
                    erros: ['Arquivo não encontrado']
                };
            }

            return {
                sucesso: true,
                arquivo
            };

        } catch (error) {
            console.error('Erro ao buscar arquivo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async listarPorGrupo(
        grupoId: string, 
        filtros?: {
            pasta?: string;
            tipo_mime?: string;
            enviado_por?: string;
            tags?: string[];
        },
        ordenacao?: 'nome' | 'data' | 'tamanho' | 'downloads',
        direcao?: 'ASC' | 'DESC',
        limite?: number, 
        offset?: number
    ): Promise<{ sucesso: boolean; arquivos?: any[]; erros?: string[] }> {
        try {
            const arquivos = await this.arquivoRepository.listarPorGrupo(
                grupoId, 
                filtros, 
                ordenacao, 
                direcao, 
                limite, 
                offset
            );

            return {
                sucesso: true,
                arquivos
            };

        } catch (error) {
            console.error('Erro ao listar arquivos do grupo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async buscarArquivos(grupoId: string, termo: string, limite?: number): Promise<{ sucesso: boolean; arquivos?: any[]; erros?: string[] }> {
        try {
            if (!termo || termo.trim().length === 0) {
                return {
                    sucesso: false,
                    erros: ['Termo de busca é obrigatório']
                };
            }

            if (termo.length < 2) {
                return {
                    sucesso: false,
                    erros: ['Termo de busca deve ter pelo menos 2 caracteres']
                };
            }

            const arquivos = await this.arquivoRepository.buscarArquivos(grupoId, termo, limite);

            return {
                sucesso: true,
                arquivos
            };

        } catch (error) {
            console.error('Erro ao buscar arquivos:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async listarPastas(grupoId: string): Promise<{ sucesso: boolean; pastas?: string[]; erros?: string[] }> {
        try {
            const pastas = await this.arquivoRepository.listarPastas(grupoId);

            return {
                sucesso: true,
                pastas
            };

        } catch (error) {
            console.error('Erro ao listar pastas:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async obterEstatisticas(grupoId: string): Promise<{ sucesso: boolean; estatisticas?: any; erros?: string[] }> {
        try {
            const estatisticas = await this.arquivoRepository.obterEstatisticas(grupoId);

            return {
                sucesso: true,
                estatisticas
            };

        } catch (error) {
            console.error('Erro ao obter estatísticas de arquivos:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async obterRecentes(grupoId: string, limite?: number): Promise<{ sucesso: boolean; arquivos?: any[]; erros?: string[] }> {
        try {
            const arquivos = await this.arquivoRepository.obterArquivosRecentes(grupoId, limite);

            return {
                sucesso: true,
                arquivos
            };

        } catch (error) {
            console.error('Erro ao obter arquivos recentes:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // MÉTODOS DE CONVENIÊNCIA
    // ============================================

    public async incrementarDownload(id: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            const incrementado = await this.arquivoRepository.incrementarDownload(id);

            if (!incrementado) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível incrementar contador de downloads']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao incrementar download:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public static obterExtensao(nomeArquivo: string): string {
        return path.extname(nomeArquivo).toLowerCase();
    }

    public static obterTipoCategoria(tipoMime: string): string {
        if (tipoMime.startsWith('image/')) return 'imagem';
        if (tipoMime.startsWith('video/')) return 'video';
        if (tipoMime.startsWith('audio/')) return 'audio';
        if (tipoMime === 'application/pdf') return 'pdf';
        if (tipoMime.includes('word') || tipoMime.includes('document')) return 'documento';
        if (tipoMime.includes('excel') || tipoMime.includes('sheet')) return 'planilha';
        if (tipoMime.includes('powerpoint') || tipoMime.includes('presentation')) return 'apresentacao';
        if (tipoMime.includes('zip') || tipoMime.includes('rar') || tipoMime.includes('compressed')) return 'compactado';
        return 'outro';
    }

    public static formatarTamanho(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const tamanhos = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanhos[i];
    }
}
