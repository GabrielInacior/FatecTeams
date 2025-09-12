import { EventoRepository, IEvento, IEventoParticipante } from '../repositories/EventoRepository';
import { GrupoRepository } from '../repositories/GrupoRepository';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { v4 as uuidv4 } from 'uuid';

export interface IEventoCreate {
    grupo_id: string;
    criado_por: string;
    titulo: string;
    descricao?: string;
    data_inicio: Date;
    data_fim: Date;
    local?: string;
    link_virtual?: string;
    tipo_evento: 'reuniao' | 'estudo' | 'prova' | 'apresentacao' | 'outro' | 'aula' | 'deadline';
    recorrencia?: {
        tipo: 'diario' | 'semanal' | 'mensal';
        intervalo: number;
        fim?: Date;
    };
    configuracoes?: any;
}

export interface IEventoUpdate {
    titulo?: string;
    descricao?: string;
    data_inicio?: Date;
    data_fim?: Date;
    local?: string;
    link_virtual?: string;
    tipo_evento?: 'reuniao' | 'estudo' | 'prova' | 'apresentacao' | 'outro' | 'aula' | 'deadline';
    recorrencia?: any;
    configuracoes?: any;
    status?: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
}

export class EventoEntity {
    private eventoRepository: EventoRepository;
    private grupoRepository: GrupoRepository;
    private usuarioRepository: UsuarioRepository;
    private dados: IEvento;

    constructor(dados?: IEvento) {
        this.eventoRepository = new EventoRepository();
        this.grupoRepository = new GrupoRepository();
        this.usuarioRepository = new UsuarioRepository();
        this.dados = dados || {} as IEvento;
    }

    // ============================================
    // REGRAS DE NEGÓCIO PRÉ-VALIDAÇÃO
    // ============================================

    private async preRules(dadosEvento: IEventoCreate): Promise<{ valido: boolean; erros: string[] }> {
        const erros: string[] = [];

        try {
            // Validar se grupo existe
            const grupo = await this.grupoRepository.buscarPorId(dadosEvento.grupo_id);
            if (!grupo) {
                erros.push('Grupo não encontrado');
                return { valido: false, erros };
            }

            // Validar se criador é membro do grupo
            const membro = await this.grupoRepository.verificarPermissao(dadosEvento.grupo_id, dadosEvento.criado_por);
            if (!membro) {
                erros.push('Apenas membros do grupo podem criar eventos');
                return { valido: false, erros };
            }

            // Validar se usuário existe
            const usuario = await this.usuarioRepository.buscarPorId(dadosEvento.criado_por);
            if (!usuario) {
                erros.push('Usuário criador não encontrado');
                return { valido: false, erros };
            }

        } catch (error) {
            console.error('Erro nas pré-regras do evento:', error);
            erros.push('Erro interno do servidor');
        }

        return { valido: erros.length === 0, erros };
    }

    // ============================================
    // REGRAS DE VALIDAÇÃO
    // ============================================

    private async rules(dadosEvento: IEventoCreate | IEventoUpdate): Promise<{ valido: boolean; erros: string[] }> {
        const erros: string[] = [];

        // Validar dados obrigatórios para criação
        if ('grupo_id' in dadosEvento && !dadosEvento.grupo_id?.trim()) {
            erros.push('ID do grupo é obrigatório');
        }

        if ('criado_por' in dadosEvento && !dadosEvento.criado_por?.trim()) {
            erros.push('ID do criador é obrigatório');
        }

        if ('titulo' in dadosEvento) {
            if (!dadosEvento.titulo?.trim()) {
                erros.push('Título é obrigatório');
            } else if (dadosEvento.titulo.length > 200) {
                erros.push('Título não pode exceder 200 caracteres');
            }
        }

        // Validar datas se fornecidas
        if (dadosEvento.data_inicio && dadosEvento.data_fim) {
            if (dadosEvento.data_fim <= dadosEvento.data_inicio) {
                erros.push('Data de fim deve ser posterior à data de início');
            }
        }

        if ('data_inicio' in dadosEvento && dadosEvento.data_inicio) {
            if (dadosEvento.data_inicio < new Date()) {
                erros.push('Data de início deve ser no futuro');
            }
        }

        // Validar descrição se fornecida
        if (dadosEvento.descricao && dadosEvento.descricao.length > 2000) {
            erros.push('Descrição não pode exceder 2000 caracteres');
        }

        // Validar local se fornecido
        if (dadosEvento.local && dadosEvento.local.length > 255) {
            erros.push('Local não pode exceder 255 caracteres');
        }

        // Validar link virtual se fornecido
        if (dadosEvento.link_virtual) {
            const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/;
            if (!urlRegex.test(dadosEvento.link_virtual)) {
                erros.push('Link virtual deve ser uma URL válida');
            }
        }

        // Validar tipo de evento se fornecido
        if ('tipo_evento' in dadosEvento && dadosEvento.tipo_evento) {
            const tiposValidos = ['reuniao', 'estudo', 'prova', 'apresentacao', 'outro', 'aula', 'deadline'];
            if (!tiposValidos.includes(dadosEvento.tipo_evento)) {
                erros.push('Tipo de evento inválido');
            }
        }

        return { valido: erros.length === 0, erros };
    }

    // ============================================
    // MÉTODOS PRINCIPAIS
    // ============================================

    public async create(dadosEvento: IEventoCreate): Promise<{ sucesso: boolean; evento?: IEvento; erros?: string[] }> {
        try {
            // Validações básicas
            const validacaoRegras = await this.rules(dadosEvento);
            if (!validacaoRegras.valido) {
                return {
                    sucesso: false,
                    erros: validacaoRegras.erros
                };
            }

            // Pré-regras de negócio
            const validacaoPreRegras = await this.preRules(dadosEvento);
            if (!validacaoPreRegras.valido) {
                return {
                    sucesso: false,
                    erros: validacaoPreRegras.erros
                };
            }

            // Preparar dados do evento
            const evento: IEvento = {
                id: uuidv4(),
                grupo_id: dadosEvento.grupo_id,
                criado_por: dadosEvento.criado_por,
                titulo: dadosEvento.titulo,
                descricao: dadosEvento.descricao,
                data_inicio: dadosEvento.data_inicio,
                data_fim: dadosEvento.data_fim,
                local: dadosEvento.local,
                link_virtual: dadosEvento.link_virtual,
                tipo_evento: dadosEvento.tipo_evento,
                status: 'agendado',
                recorrencia: dadosEvento.recorrencia ? JSON.stringify(dadosEvento.recorrencia) : null,
                configuracoes: dadosEvento.configuracoes ? JSON.stringify(dadosEvento.configuracoes) : '{}'
            };

            // Salvar evento
            const eventoId = await this.eventoRepository.criar(evento);
            const eventoCriado = await this.eventoRepository.buscarPorId(eventoId);

            // Adicionar criador como participante confirmado
            if (eventoCriado) {
                await this.eventoRepository.adicionarParticipante({
                    evento_id: eventoId,
                    usuario_id: dadosEvento.criado_por,
                    status: 'confirmado'
                });
            }

            this.dados = eventoCriado!;

            return {
                sucesso: true,
                evento: eventoCriado!
            };

        } catch (error) {
            console.error('Erro ao criar evento:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async update(id: string, dadosAtualizacao: IEventoUpdate): Promise<{ sucesso: boolean; evento?: IEvento; erros?: string[] }> {
        try {
            if (!id?.trim()) {
                return {
                    sucesso: false,
                    erros: ['ID do evento é obrigatório']
                };
            }

            // Validações básicas
            const validacaoRegras = await this.rules(dadosAtualizacao);
            if (!validacaoRegras.valido) {
                return {
                    sucesso: false,
                    erros: validacaoRegras.erros
                };
            }

            // Verificar se evento existe
            const eventoExistente = await this.eventoRepository.buscarPorId(id);
            if (!eventoExistente) {
                return {
                    sucesso: false,
                    erros: ['Evento não encontrado']
                };
            }

            // Preparar dados de atualização
            const dadosParaAtualizar: any = {
                ...dadosAtualizacao,
                recorrencia: dadosAtualizacao.recorrencia ? JSON.stringify(dadosAtualizacao.recorrencia) : undefined,
                configuracoes: dadosAtualizacao.configuracoes ? JSON.stringify(dadosAtualizacao.configuracoes) : undefined
            };

            // Atualizar evento
            const sucesso = await this.eventoRepository.atualizar(id, dadosParaAtualizar);
            
            if (!sucesso) {
                return {
                    sucesso: false,
                    erros: ['Erro ao atualizar evento']
                };
            }

            // Buscar evento atualizado
            const eventoAtualizado = await this.eventoRepository.buscarPorId(id);
            this.dados = eventoAtualizado!;

            return {
                sucesso: true,
                evento: eventoAtualizado!
            };

        } catch (error) {
            console.error('Erro ao atualizar evento:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async buscarPorId(id: string): Promise<{ sucesso: boolean; evento?: IEvento; erros?: string[] }> {
        try {
            if (!id?.trim()) {
                return {
                    sucesso: false,
                    erros: ['ID do evento é obrigatório']
                };
            }

            const evento = await this.eventoRepository.buscarPorId(id);

            if (!evento) {
                return {
                    sucesso: false,
                    erros: ['Evento não encontrado']
                };
            }

            this.dados = evento;

            return {
                sucesso: true,
                evento
            };

        } catch (error) {
            console.error('Erro ao buscar evento:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async listarPorGrupo(grupoId: string, filtros: {
        data_inicio?: Date;
        data_fim?: Date;
        tipo_evento?: string;
        status?: string;
        limite?: number;
        offset?: number;
    } = {}): Promise<{ sucesso: boolean; eventos?: IEvento[]; total?: number; erros?: string[] }> {
        try {
            if (!grupoId?.trim()) {
                return {
                    sucesso: false,
                    erros: ['ID do grupo é obrigatório']
                };
            }

            const eventos = await this.eventoRepository.listarPorGrupo(grupoId, {
                dataInicio: filtros.data_inicio,
                dataFim: filtros.data_fim,
                tipo: filtros.tipo_evento,
                status: filtros.status ? [filtros.status] : undefined
            });

            return {
                sucesso: true,
                eventos: eventos,
                total: eventos.length
            };

        } catch (error) {
            console.error('Erro ao listar eventos do grupo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async adicionarParticipante(eventoId: string, usuarioId: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            if (!eventoId?.trim() || !usuarioId?.trim()) {
                return {
                    sucesso: false,
                    erros: ['ID do evento e ID do usuário são obrigatórios']
                };
            }

            // Verificar se evento existe
            const evento = await this.eventoRepository.buscarPorId(eventoId);
            if (!evento) {
                return {
                    sucesso: false,
                    erros: ['Evento não encontrado']
                };
            }

            // Verificar se usuário é membro do grupo
            const membro = await this.grupoRepository.verificarPermissao(evento.grupo_id, usuarioId);
            if (!membro) {
                return {
                    sucesso: false,
                    erros: ['Usuário não é membro do grupo']
                };
            }

            // Verificar se usuário já é participante
            // Por enquanto, adicionar sem verificação prévia
            
            // Adicionar participante
            await this.eventoRepository.adicionarParticipante({
                evento_id: eventoId,
                usuario_id: usuarioId,
                status: 'pendente'
            });

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao adicionar participante:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async confirmarParticipacao(eventoId: string, usuarioId: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            const atualizado = await this.eventoRepository.atualizarStatusParticipante(eventoId, usuarioId, 'confirmado');

            if (!atualizado) {
                return {
                    sucesso: false,
                    erros: ['Participação não encontrada ou erro ao confirmar']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao confirmar participação:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async recusarParticipacao(eventoId: string, usuarioId: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            const atualizado = await this.eventoRepository.atualizarStatusParticipante(eventoId, usuarioId, 'recusado');

            if (!atualizado) {
                return {
                    sucesso: false,
                    erros: ['Participação não encontrada ou erro ao recusar']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao recusar participação:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async delete(id: string, usuarioId: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            if (!id?.trim()) {
                return {
                    sucesso: false,
                    erros: ['ID do evento é obrigatório']
                };
            }

            // Verificar se evento existe
            const evento = await this.eventoRepository.buscarPorId(id);
            if (!evento) {
                return {
                    sucesso: false,
                    erros: ['Evento não encontrado']
                };
            }

            // Verificar se usuário é o criador ou tem permissão
            if (evento.criado_por !== usuarioId) {
                const membro = await this.grupoRepository.verificarPermissao(evento.grupo_id, usuarioId);
                if (!membro || membro.nivel_permissao !== 'admin') {
                    return {
                        sucesso: false,
                        erros: ['Apenas o criador ou administradores podem excluir eventos']
                    };
                }
            }

            // Excluir evento
            const excluido = await this.eventoRepository.deletar(id);

            if (!excluido) {
                return {
                    sucesso: false,
                    erros: ['Erro ao excluir evento']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao excluir evento:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async listarEventosUsuario(usuarioId: string, filtros: {
        data_inicio?: Date;
        data_fim?: Date;
        apenas_confirmados?: boolean;
        limite?: number;
        offset?: number;
    } = {}): Promise<{ sucesso: boolean; eventos?: any[]; total?: number; erros?: string[] }> {
        try {
            if (!usuarioId?.trim()) {
                return {
                    sucesso: false,
                    erros: ['ID do usuário é obrigatório']
                };
            }

            const eventos = await this.eventoRepository.buscarEventosUsuario(usuarioId);

            return {
                sucesso: true,
                eventos: eventos,
                total: eventos.length
            };

        } catch (error) {
            console.error('Erro ao listar eventos do usuário:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }
}
