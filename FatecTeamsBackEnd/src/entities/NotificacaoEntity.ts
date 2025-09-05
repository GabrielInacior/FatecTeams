import { NotificacaoRepository, INotificacao, IConfiguracaoNotificacao } from '../repositories/NotificacaoRepository';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { v4 as uuidv4 } from 'uuid';

export interface INotificacaoCreate {
    usuario_id: string;
    titulo: string;
    mensagem: string;
    tipo: 'mensagem' | 'convite' | 'tarefa' | 'evento' | 'sistema' | 'deadline' | 'mencao';
    origem_tipo?: 'grupo' | 'tarefa' | 'mensagem' | 'sistema' | 'evento';
    origem_id?: string;
    referencia_id?: string;
    importante?: boolean;
    metadados?: any;
}

export interface INotificacaoUpdate {
    lida?: boolean;
    importante?: boolean;
    metadados?: any;
}

export class NotificacaoEntity {
    private notificacaoRepository: NotificacaoRepository;
    private usuarioRepository: UsuarioRepository;
    private dados: INotificacao;

    constructor(dados?: INotificacao) {
        this.notificacaoRepository = new NotificacaoRepository();
        this.usuarioRepository = new UsuarioRepository();
        this.dados = dados || {} as INotificacao;
    }

    // ============================================
    // REGRAS DE NEGÓCIO PRÉ-VALIDAÇÃO
    // ============================================

    private async preRules(dadosNotificacao: INotificacaoCreate): Promise<{ valido: boolean; erros: string[] }> {
        const erros: string[] = [];

        try {
            // Validar se usuário existe
            const usuario = await this.usuarioRepository.buscarPorId(dadosNotificacao.usuario_id);
            if (!usuario) {
                erros.push('Usuário não encontrado');
                return { valido: false, erros };
            }

            // Validar se usuário está ativo
            if (!usuario.status_ativo) {
                erros.push('Usuário inativo não pode receber notificações');
                return { valido: false, erros };
            }

            // Verificar configurações de notificação do usuário
            const configuracoes = await this.notificacaoRepository.obterConfiguracoes(dadosNotificacao.usuario_id);
            if (configuracoes) {
                // Verificar se o tipo de notificação está ativo
                const tipoAtivado = configuracoes.tipos_ativados && (configuracoes.tipos_ativados as any)[dadosNotificacao.tipo];
                if (!tipoAtivado) {
                    erros.push('Usuário desabilitou este tipo de notificação');
                    return { valido: false, erros };
                }

                // Verificar horário silencioso
                if (configuracoes.horario_silencioso?.ativado) {
                    const agora = new Date();
                    const horaAtual = agora.getHours();
                    const inicio = parseInt(configuracoes.horario_silencioso.inicio.split(':')[0]);
                    const fim = parseInt(configuracoes.horario_silencioso.fim.split(':')[0]);

                    if (horaAtual >= inicio || horaAtual <= fim) {
                        // Não criar notificação no horário silencioso, exceto se for importante
                        if (!dadosNotificacao.importante) {
                            erros.push('Notificação bloqueada pelo horário silencioso');
                            return { valido: false, erros };
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Erro nas pré-regras da notificação:', error);
            erros.push('Erro interno do servidor');
        }

        return { valido: erros.length === 0, erros };
    }

    // ============================================
    // REGRAS DE VALIDAÇÃO
    // ============================================

    private async rules(dadosNotificacao: INotificacaoCreate): Promise<{ valido: boolean; erros: string[] }> {
        const erros: string[] = [];

        // Validar dados obrigatórios
        if (!dadosNotificacao.usuario_id?.trim()) {
            erros.push('ID do usuário é obrigatório');
        }

        if (!dadosNotificacao.titulo?.trim()) {
            erros.push('Título é obrigatório');
        } else if (dadosNotificacao.titulo.length > 200) {
            erros.push('Título não pode exceder 200 caracteres');
        }

        if (!dadosNotificacao.mensagem?.trim()) {
            erros.push('Mensagem é obrigatória');
        } else if (dadosNotificacao.mensagem.length > 1000) {
            erros.push('Mensagem não pode exceder 1000 caracteres');
        }

        // Validar tipo
        const tiposValidos = ['mensagem', 'convite', 'tarefa', 'evento', 'sistema', 'deadline', 'mencao'];
        if (!tiposValidos.includes(dadosNotificacao.tipo)) {
            erros.push('Tipo de notificação inválido');
        }

        // Validar origem_tipo se fornecido
        if (dadosNotificacao.origem_tipo) {
            const origensValidas = ['grupo', 'tarefa', 'mensagem', 'sistema', 'evento'];
            if (!origensValidas.includes(dadosNotificacao.origem_tipo)) {
                erros.push('Tipo de origem inválido');
            }
        }

        // Validar metadados se fornecidos
        if (dadosNotificacao.metadados) {
            try {
                JSON.stringify(dadosNotificacao.metadados);
            } catch (error) {
                erros.push('Metadados devem ser um objeto JSON válido');
            }
        }

        return { valido: erros.length === 0, erros };
    }

    // ============================================
    // MÉTODOS PRINCIPAIS
    // ============================================

    public async create(dadosNotificacao: INotificacaoCreate): Promise<{ sucesso: boolean; notificacao?: INotificacao; erros?: string[] }> {
        try {
            // Validações básicas
            const validacaoRegras = await this.rules(dadosNotificacao);
            if (!validacaoRegras.valido) {
                return {
                    sucesso: false,
                    erros: validacaoRegras.erros
                };
            }

            // Pré-regras de negócio
            const validacaoPreRegras = await this.preRules(dadosNotificacao);
            if (!validacaoPreRegras.valido) {
                return {
                    sucesso: false,
                    erros: validacaoPreRegras.erros
                };
            }

            // Preparar dados da notificação
            const notificacao: INotificacao = {
                id: uuidv4(),
                usuario_id: dadosNotificacao.usuario_id,
                titulo: dadosNotificacao.titulo,
                mensagem: dadosNotificacao.mensagem,
                tipo: dadosNotificacao.tipo,
                origem_tipo: dadosNotificacao.origem_tipo,
                origem_id: dadosNotificacao.origem_id,
                referencia_id: dadosNotificacao.referencia_id,
                lida: false,
                importante: dadosNotificacao.importante || false,
                metadados: dadosNotificacao.metadados ? JSON.stringify(dadosNotificacao.metadados) : '{}',
                data_criacao: new Date()
            };

            // Salvar notificação
            const notificacaoId = await this.notificacaoRepository.criar(notificacao);
            const notificacaoCriada = await this.notificacaoRepository.buscarPorId(notificacaoId);

            this.dados = notificacaoCriada!;

            return {
                sucesso: true,
                notificacao: notificacaoCriada!
            };

        } catch (error) {
            console.error('Erro ao criar notificação:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async marcarComoLida(id: string, usuarioId: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            if (!id?.trim()) {
                return {
                    sucesso: false,
                    erros: ['ID da notificação é obrigatório']
                };
            }

            if (!usuarioId?.trim()) {
                return {
                    sucesso: false,
                    erros: ['ID do usuário é obrigatório']
                };
            }

            const marcada = await this.notificacaoRepository.marcarComoLida(id, usuarioId);

            if (!marcada) {
                return {
                    sucesso: false,
                    erros: ['Notificação não encontrada ou erro ao marcar como lida']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async marcarTodasComoLidas(usuarioId: string): Promise<{ sucesso: boolean; marcadas?: number; erros?: string[] }> {
        try {
            if (!usuarioId?.trim()) {
                return {
                    sucesso: false,
                    erros: ['ID do usuário é obrigatório']
                };
            }

            const marcadas = await this.notificacaoRepository.marcarTodasComoLidas(usuarioId);

            return {
                sucesso: true,
                marcadas
            };

        } catch (error) {
            console.error('Erro ao marcar todas notificações como lidas:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async listarPorUsuario(usuarioId: string, filtros: {
        limite?: number;
        offset?: number;
        apenas_nao_lidas?: boolean;
        tipo?: string;
    } = {}): Promise<{ sucesso: boolean; notificacoes?: INotificacao[]; total?: number; erros?: string[] }> {
        try {
            if (!usuarioId?.trim()) {
                return {
                    sucesso: false,
                    erros: ['ID do usuário é obrigatório']
                };
            }

            const resultado = await this.notificacaoRepository.listarPorUsuario(usuarioId, filtros);

            return {
                sucesso: true,
                notificacoes: resultado.notificacoes,
                total: resultado.total
            };

        } catch (error) {
            console.error('Erro ao listar notificações do usuário:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async deletar(id: string, usuarioId: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            if (!id?.trim()) {
                return {
                    sucesso: false,
                    erros: ['ID da notificação é obrigatório']
                };
            }

            if (!usuarioId?.trim()) {
                return {
                    sucesso: false,
                    erros: ['ID do usuário é obrigatório']
                };
            }

            const deletada = await this.notificacaoRepository.deletar(id, usuarioId);

            if (!deletada) {
                return {
                    sucesso: false,
                    erros: ['Notificação não encontrada ou erro ao deletar']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao deletar notificação:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async obterEstatisticas(usuarioId: string): Promise<{ sucesso: boolean; estatisticas?: any; erros?: string[] }> {
        try {
            if (!usuarioId?.trim()) {
                return {
                    sucesso: false,
                    erros: ['ID do usuário é obrigatório']
                };
            }

            const estatisticas = await this.notificacaoRepository.obterEstatisticas(usuarioId);

            return {
                sucesso: true,
                estatisticas
            };

        } catch (error) {
            console.error('Erro ao obter estatísticas de notificações:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // CONFIGURAÇÕES DE NOTIFICAÇÃO
    // ============================================

    public async obterConfiguracoes(usuarioId: string): Promise<{ sucesso: boolean; configuracoes?: IConfiguracaoNotificacao; erros?: string[] }> {
        try {
            if (!usuarioId?.trim()) {
                return {
                    sucesso: false,
                    erros: ['ID do usuário é obrigatório']
                };
            }

            const configuracoes = await this.notificacaoRepository.obterConfiguracoes(usuarioId);

            return {
                sucesso: true,
                configuracoes: configuracoes || undefined
            };

        } catch (error) {
            console.error('Erro ao obter configurações de notificação:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async atualizarConfiguracoes(usuarioId: string, configuracoes: Partial<IConfiguracaoNotificacao>): Promise<{ sucesso: boolean; configuracoes?: IConfiguracaoNotificacao; erros?: string[] }> {
        try {
            if (!usuarioId?.trim()) {
                return {
                    sucesso: false,
                    erros: ['ID do usuário é obrigatório']
                };
            }

            const configuracaoAtualizada = await this.notificacaoRepository.atualizarConfiguracoes(usuarioId, configuracoes);

            if (!configuracaoAtualizada) {
                return {
                    sucesso: false,
                    erros: ['Erro ao atualizar configurações']
                };
            }

            // Buscar configurações atualizadas
            const configuracoesAtualizadas = await this.notificacaoRepository.obterConfiguracoes(usuarioId);

            return {
                sucesso: true,
                configuracoes: configuracoesAtualizadas || undefined
            };

        } catch (error) {
            console.error('Erro ao atualizar configurações de notificação:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // MÉTODOS DE CONVENIÊNCIA
    // ============================================

    public async criarNotificacaoMensagem(usuarioId: string, grupoNome: string, remetente: string, conteudo: string): Promise<{ sucesso: boolean; notificacao?: INotificacao; erros?: string[] }> {
        return this.create({
            usuario_id: usuarioId,
            titulo: `Nova mensagem em ${grupoNome}`,
            mensagem: `${remetente}: ${conteudo.substring(0, 100)}${conteudo.length > 100 ? '...' : ''}`,
            tipo: 'mensagem',
            origem_tipo: 'mensagem'
        });
    }

    public async criarNotificacaoConvite(usuarioId: string, grupoNome: string, convidadoPor: string): Promise<{ sucesso: boolean; notificacao?: INotificacao; erros?: string[] }> {
        return this.create({
            usuario_id: usuarioId,
            titulo: 'Novo convite para grupo',
            mensagem: `${convidadoPor} convidou você para participar do grupo "${grupoNome}"`,
            tipo: 'convite',
            origem_tipo: 'grupo',
            importante: true
        });
    }

    public async criarNotificacaoTarefa(usuarioId: string, titulo: string, acao: string, grupoNome: string): Promise<{ sucesso: boolean; notificacao?: INotificacao; erros?: string[] }> {
        return this.create({
            usuario_id: usuarioId,
            titulo: `Tarefa ${acao}`,
            mensagem: `A tarefa "${titulo}" foi ${acao} no grupo "${grupoNome}"`,
            tipo: 'tarefa',
            origem_tipo: 'tarefa'
        });
    }

    public async criarNotificacaoEvento(usuarioId: string, tituloEvento: string, dataEvento: Date, grupoNome: string): Promise<{ sucesso: boolean; notificacao?: INotificacao; erros?: string[] }> {
        const dataFormatada = dataEvento.toLocaleDateString('pt-BR');
        const horaFormatada = dataEvento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        return this.create({
            usuario_id: usuarioId,
            titulo: 'Novo evento agendado',
            mensagem: `Evento "${tituloEvento}" agendado para ${dataFormatada} às ${horaFormatada} no grupo "${grupoNome}"`,
            tipo: 'evento',
            origem_tipo: 'evento'
        });
    }

    public async criarNotificacaoDeadline(usuarioId: string, titulo: string, dataVencimento: Date): Promise<{ sucesso: boolean; notificacao?: INotificacao; erros?: string[] }> {
        const agora = new Date();
        const diffHoras = Math.ceil((dataVencimento.getTime() - agora.getTime()) / (1000 * 60 * 60));

        let mensagem = '';
        if (diffHoras <= 1) {
            mensagem = `A tarefa "${titulo}" vence em menos de 1 hora!`;
        } else if (diffHoras <= 24) {
            mensagem = `A tarefa "${titulo}" vence em ${diffHoras} horas`;
        } else {
            const diffDias = Math.ceil(diffHoras / 24);
            mensagem = `A tarefa "${titulo}" vence em ${diffDias} dias`;
        }

        return this.create({
            usuario_id: usuarioId,
            titulo: 'Deadline se aproximando',
            mensagem,
            tipo: 'deadline',
            importante: diffHoras <= 24
        });
    }

    public async limparNotificacoesAntigas(usuarioId: string, diasParaExcluir: number = 30): Promise<{ sucesso: boolean; excluidas?: number; erros?: string[] }> {
        try {
            const excluidas = await this.notificacaoRepository.limparNotificacoesAntigas(usuarioId);

            return {
                sucesso: true,
                excluidas
            };

        } catch (error) {
            console.error('Erro ao limpar notificações antigas:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }
}
