import { MensagemRepository, IMensagem, IReacao } from '../repositories/MensagemRepository';
import { v4 as uuidv4 } from 'uuid';

export interface IMensagemCreate {
    conteudo: string;
    tipo: 'texto' | 'arquivo' | 'imagem' | 'video' | 'audio' | 'link';
    arquivo_url?: string;
    arquivo_nome?: string;
    arquivo_tamanho?: number;
    grupo_id: string;
    usuario_id: string;
    parent_message_id?: string;
    mencionados?: string[];
}

export interface IMensagemUpdate {
    conteudo: string;
}

export class MensagemEntity {
    private mensagemRepository: MensagemRepository;
    private dados: IMensagem;

    constructor(dados?: IMensagem) {
        this.mensagemRepository = new MensagemRepository();
        this.dados = dados || {} as IMensagem;
    }

    // ============================================
    // REGRAS DE NEGÓCIO PRÉ-VALIDAÇÃO
    // ============================================

    private preRules(): void {
        if (!this.dados.id) {
            this.dados.id = uuidv4();
        }

        if (this.dados.conteudo) {
            this.dados.conteudo = this.dados.conteudo.trim();
        }

        if (this.dados.arquivo_nome) {
            this.dados.arquivo_nome = this.dados.arquivo_nome.trim();
        }

        if (this.dados.mencionados) {
            this.dados.mencionados = [...new Set(this.dados.mencionados)]; // Remove duplicatas
        }

        if (this.dados.tipo === 'texto' && this.dados.conteudo && this.dados.conteudo.includes('http')) {
            // Auto-detectar links
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            if (urlRegex.test(this.dados.conteudo)) {
                this.dados.tipo = 'link';
            }
        }
    }

    // ============================================
    // REGRAS DE VALIDAÇÃO
    // ============================================

    private async rules(): Promise<{ valido: boolean; erros: string[] }> {
        const erros: string[] = [];

        // Validação do conteúdo
        if (!this.dados.conteudo || this.dados.conteudo.length === 0) {
            if (this.dados.tipo === 'texto' || this.dados.tipo === 'link') {
                erros.push('Conteúdo da mensagem é obrigatório');
            }
        } else if (this.dados.conteudo.length > 4000) {
            erros.push('Mensagem deve ter no máximo 4000 caracteres');
        }

        // Validação do tipo
        const tiposValidos = ['texto', 'arquivo', 'imagem', 'video', 'audio', 'link'];
        if (!this.dados.tipo || !tiposValidos.includes(this.dados.tipo)) {
            erros.push('Tipo de mensagem inválido');
        }

        // Validação para arquivos
        if (['arquivo', 'imagem', 'video', 'audio'].includes(this.dados.tipo)) {
            if (!this.dados.arquivo_url) {
                erros.push('URL do arquivo é obrigatória para mensagens de arquivo');
            }
            if (!this.dados.arquivo_nome) {
                erros.push('Nome do arquivo é obrigatório para mensagens de arquivo');
            }
            if (!this.dados.arquivo_tamanho || this.dados.arquivo_tamanho <= 0) {
                erros.push('Tamanho do arquivo deve ser maior que zero');
            }
            if (this.dados.arquivo_tamanho && this.dados.arquivo_tamanho > 50 * 1024 * 1024) { // 50MB
                erros.push('Arquivo não pode ser maior que 50MB');
            }
        }

        // Validação de grupo e usuário
        if (!this.dados.grupo_id) {
            erros.push('ID do grupo é obrigatório');
        }
        if (!this.dados.usuario_id) {
            erros.push('ID do usuário é obrigatório');
        }

        // Validação de menções
        if (this.dados.mencionados && this.dados.mencionados.length > 20) {
            erros.push('Não é possível mencionar mais de 20 usuários por mensagem');
        }

        return {
            valido: erros.length === 0,
            erros
        };
    }

    // ============================================
    // MÉTODOS PRINCIPAIS
    // ============================================

    public async create(dadosMensagem: IMensagemCreate): Promise<{ sucesso: boolean; mensagem?: any; erros?: string[] }> {
        try {
            this.dados = {
                ...dadosMensagem,
                editado: false,
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

            const mensagemId = await this.mensagemRepository.criar(this.dados);
            const mensagemSalva = await this.mensagemRepository.buscarPorId(mensagemId);

            return {
                sucesso: true,
                mensagem: mensagemSalva
            };

        } catch (error) {
            console.error('Erro ao criar mensagem:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async update(id: string, conteudo: string, usuarioId: string): Promise<{ sucesso: boolean; mensagem?: any; erros?: string[] }> {
        try {
            if (!conteudo || conteudo.trim().length === 0) {
                return {
                    sucesso: false,
                    erros: ['Conteúdo da mensagem é obrigatório']
                };
            }

            if (conteudo.length > 4000) {
                return {
                    sucesso: false,
                    erros: ['Mensagem deve ter no máximo 4000 caracteres']
                };
            }

            const atualizado = await this.mensagemRepository.atualizar(id, conteudo.trim(), usuarioId);

            if (!atualizado) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível editar a mensagem. Verifique se você tem permissão e se não passou dos 5 minutos limite.']
                };
            }

            const mensagemAtualizada = await this.mensagemRepository.buscarPorId(id);

            return {
                sucesso: true,
                mensagem: mensagemAtualizada
            };

        } catch (error) {
            console.error('Erro ao atualizar mensagem:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async delete(id: string, usuarioId: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            const deletado = await this.mensagemRepository.deletar(id, usuarioId);

            if (!deletado) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível deletar a mensagem. Verifique se você tem permissão.']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao deletar mensagem:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // REAÇÕES
    // ============================================

    public async adicionarReacao(mensagemId: string, usuarioId: string, emoji: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            // Validar emoji básico
            if (!emoji || emoji.length === 0) {
                return {
                    sucesso: false,
                    erros: ['Emoji é obrigatório']
                };
            }

            if (emoji.length > 10) {
                return {
                    sucesso: false,
                    erros: ['Emoji inválido']
                };
            }

            const adicionado = await this.mensagemRepository.adicionarReacao({
                mensagem_id: mensagemId,
                usuario_id: usuarioId,
                emoji: emoji
            });

            if (!adicionado) {
                return {
                    sucesso: false,
                    erros: ['Reação já foi adicionada ou erro ao processar']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao adicionar reação:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async removerReacao(mensagemId: string, usuarioId: string, emoji: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            const removido = await this.mensagemRepository.removerReacao(mensagemId, usuarioId, emoji);

            if (!removido) {
                return {
                    sucesso: false,
                    erros: ['Reação não encontrada ou erro ao processar']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao remover reação:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async listarReacoes(mensagemId: string): Promise<{ sucesso: boolean; reacoes?: any[]; erros?: string[] }> {
        try {
            const reacoes = await this.mensagemRepository.listarReacoes(mensagemId);

            return {
                sucesso: true,
                reacoes
            };

        } catch (error) {
            console.error('Erro ao listar reações:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // MÉTODOS DE CONSULTA
    // ============================================

    public async buscarPorId(id: string): Promise<{ sucesso: boolean; mensagem?: any; erros?: string[] }> {
        try {
            const mensagem = await this.mensagemRepository.buscarPorId(id);
            
            if (!mensagem) {
                return {
                    sucesso: false,
                    erros: ['Mensagem não encontrada']
                };
            }

            return {
                sucesso: true,
                mensagem
            };

        } catch (error) {
            console.error('Erro ao buscar mensagem:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async listarPorGrupo(grupoId: string, limite?: number, offset?: number): Promise<{ sucesso: boolean; mensagens?: any[]; erros?: string[] }> {
        try {
            const mensagens = await this.mensagemRepository.listarPorGrupo(grupoId, limite, offset);

            return {
                sucesso: true,
                mensagens
            };

        } catch (error) {
            console.error('Erro ao listar mensagens do grupo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async buscarMensagens(grupoId: string, termo: string, limite?: number): Promise<{ sucesso: boolean; mensagens?: any[]; erros?: string[] }> {
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

            const mensagens = await this.mensagemRepository.buscarMensagens(grupoId, termo, limite);

            return {
                sucesso: true,
                mensagens
            };

        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async obterMensagensRecentes(grupoId: string, dataReferencia: Date, limite?: number): Promise<{ sucesso: boolean; mensagens?: any[]; erros?: string[] }> {
        try {
            const mensagens = await this.mensagemRepository.obterMensagensRecentes(grupoId, dataReferencia, limite);

            return {
                sucesso: true,
                mensagens
            };

        } catch (error) {
            console.error('Erro ao obter mensagens recentes:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async obterEstatisticas(grupoId: string, dataInicio?: Date): Promise<{ sucesso: boolean; estatisticas?: any; erros?: string[] }> {
        try {
            const estatisticas = await this.mensagemRepository.obterEstatisticas(grupoId, dataInicio);

            return {
                sucesso: true,
                estatisticas
            };

        } catch (error) {
            console.error('Erro ao obter estatísticas de mensagens:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // MENSAGENS NÃO LIDAS
    // ============================================

    public async obterMensagensNaoLidas(usuarioId: string, grupoId: string): Promise<{ sucesso: boolean; total?: number; erros?: string[] }> {
        try {
            const total = await this.mensagemRepository.obterMensagensNaoLidas(usuarioId, grupoId);

            return {
                sucesso: true,
                total
            };

        } catch (error) {
            console.error('Erro ao obter mensagens não lidas:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async marcarComoLida(mensagemId: string, usuarioId: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            const marcado = await this.mensagemRepository.marcarComoLida(mensagemId, usuarioId);

            if (!marcado) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível marcar mensagem como lida']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao marcar mensagem como lida:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async marcarTodasComoLidas(grupoId: string, usuarioId: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            const marcadas = await this.mensagemRepository.marcarTodasComoLidas(grupoId, usuarioId);

            if (!marcadas) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível marcar mensagens como lidas']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao marcar todas mensagens como lidas:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }
}
