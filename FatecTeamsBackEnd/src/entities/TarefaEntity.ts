import { TarefaRepository, ITarefa, IComentarioTarefa } from '../repositories/TarefaRepository';
import { v4 as uuidv4 } from 'uuid';

export interface ITarefaCreate {
    titulo: string;
    descricao?: string;
    status?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
    prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
    data_vencimento?: Date;
    grupo_id: string;
    criado_por: string;
    assignado_para?: string;
    etiquetas?: string[];
    estimativa_horas?: number;
    anexos?: string[];
}

export interface ITarefaUpdate {
    titulo?: string;
    descricao?: string;
    status?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
    prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
    data_vencimento?: Date;
    assignado_para?: string;
    etiquetas?: string[];
    estimativa_horas?: number;
    horas_trabalhadas?: number;
    anexos?: string[];
}

export class TarefaEntity {
    private tarefaRepository: TarefaRepository;
    private dados: ITarefa;

    constructor(dados?: ITarefa) {
        this.tarefaRepository = new TarefaRepository();
        this.dados = dados || {} as ITarefa;
    }

    // ============================================
    // REGRAS DE NEGÓCIO PRÉ-VALIDAÇÃO
    // ============================================

    private preRules(): void {
        if (!this.dados.id) {
            this.dados.id = uuidv4();
        }

        if (this.dados.titulo) {
            this.dados.titulo = this.dados.titulo.trim();
        }

        if (this.dados.descricao) {
            this.dados.descricao = this.dados.descricao.trim();
        }

        if (!this.dados.status) {
            this.dados.status = 'pendente';
        }

        if (this.dados.etiquetas) {
            this.dados.etiquetas = [...new Set(this.dados.etiquetas.map(tag => tag.toLowerCase().trim()))];
        }

        if (this.dados.anexos) {
            this.dados.anexos = [...new Set(this.dados.anexos)];
        }

        // Auto-assign para o criador se não especificado
        if (!this.dados.assignado_para && this.dados.criador_id) {
            this.dados.assignado_para = this.dados.criador_id;
        }
    }

    // ============================================
    // REGRAS DE VALIDAÇÃO
    // ============================================

    private async rules(): Promise<{ valido: boolean; erros: string[] }> {
        const erros: string[] = [];

        // Validação do título
        if (!this.dados.titulo || this.dados.titulo.length === 0) {
            erros.push('Título da tarefa é obrigatório');
        } else if (this.dados.titulo.length < 3) {
            erros.push('Título deve ter pelo menos 3 caracteres');
        } else if (this.dados.titulo.length > 200) {
            erros.push('Título deve ter no máximo 200 caracteres');
        }

        // Validação da descrição
        if (this.dados.descricao && this.dados.descricao.length > 2000) {
            erros.push('Descrição deve ter no máximo 2000 caracteres');
        }

        // Validação do status
        const statusValidos = ['pendente', 'em_andamento', 'concluida', 'cancelada'];
        if (!this.dados.status || !statusValidos.includes(this.dados.status)) {
            erros.push('Status inválido. Use: pendente, em_andamento, concluida ou cancelada');
        }

        // Validação da prioridade
        const prioridadesValidas = ['baixa', 'media', 'alta', 'urgente'];
        if (!this.dados.prioridade || !prioridadesValidas.includes(this.dados.prioridade)) {
            erros.push('Prioridade inválida. Use: baixa, media, alta ou urgente');
        }

        // Validação da data de vencimento
        if (this.dados.data_vencimento) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            
            if (this.dados.data_vencimento < hoje) {
                erros.push('Data de vencimento não pode ser anterior a hoje');
            }
        }

        // Validação de grupo e usuário
        if (!this.dados.grupo_id) {
            erros.push('ID do grupo é obrigatório');
        }
        if (!this.dados.criador_id) {
            erros.push('ID do criador é obrigatório');
        }

        // Validação de etiquetas
        if (this.dados.etiquetas && this.dados.etiquetas.length > 10) {
            erros.push('Não é possível ter mais de 10 etiquetas por tarefa');
        }

        // Validação de horas
        if (this.dados.estimativa_horas !== undefined) {
            if (this.dados.estimativa_horas < 0) {
                erros.push('Estimativa de horas não pode ser negativa');
            } else if (this.dados.estimativa_horas > 999) {
                erros.push('Estimativa de horas não pode ser maior que 999');
            }
        }

        if (this.dados.horas_trabalhadas !== undefined) {
            if (this.dados.horas_trabalhadas < 0) {
                erros.push('Horas trabalhadas não pode ser negativa');
            } else if (this.dados.horas_trabalhadas > 999) {
                erros.push('Horas trabalhadas não pode ser maior que 999');
            }
        }

        return {
            valido: erros.length === 0,
            erros
        };
    }

    // ============================================
    // MÉTODOS PRINCIPAIS
    // ============================================

    public async create(dadosTarefa: ITarefaCreate): Promise<{ sucesso: boolean; tarefa?: any; erros?: string[] }> {
        try {
            this.dados = {
                ...dadosTarefa,
                status: dadosTarefa.status || 'pendente',
                data_criacao: new Date(),
                criador_id: dadosTarefa.criado_por
            };

            this.preRules();
            const validacao = await this.rules();

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    erros: validacao.erros
                };
            }

            const tarefaId = await this.tarefaRepository.criar(this.dados);
            
            // Registrar no histórico
            await this.tarefaRepository.registrarMudancaStatus(tarefaId, this.dados.criador_id, 'nova', this.dados.status);
            
            const tarefaSalva = await this.tarefaRepository.buscarPorId(tarefaId);

            return {
                sucesso: true,
                tarefa: tarefaSalva
            };

        } catch (error) {
            console.error('Erro ao criar tarefa:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async update(id: string, dadosAtualizacao: ITarefaUpdate, usuarioId: string): Promise<{ sucesso: boolean; tarefa?: any; erros?: string[] }> {
        try {
            const tarefaExistente = await this.tarefaRepository.buscarPorId(id);
            
            if (!tarefaExistente) {
                return {
                    sucesso: false,
                    erros: ['Tarefa não encontrada']
                };
            }

            const statusAnterior = tarefaExistente.status;

            this.dados = {
                ...tarefaExistente,
                ...dadosAtualizacao,
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

            const atualizado = await this.tarefaRepository.atualizar(id, dadosAtualizacao);

            if (!atualizado) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível atualizar a tarefa']
                };
            }

            // Registrar mudança de status se houve alteração
            if (dadosAtualizacao.status && dadosAtualizacao.status !== statusAnterior) {
                await this.tarefaRepository.registrarMudancaStatus(id, usuarioId, statusAnterior, dadosAtualizacao.status);
            }

            const tarefaAtualizada = await this.tarefaRepository.buscarPorId(id);

            return {
                sucesso: true,
                tarefa: tarefaAtualizada
            };

        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async delete(id: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            const deletado = await this.tarefaRepository.deletar(id);

            if (!deletado) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível deletar a tarefa']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao deletar tarefa:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // COMENTÁRIOS
    // ============================================

    public async adicionarComentario(tarefaId: string, usuarioId: string, conteudo: string): Promise<{ sucesso: boolean; comentario?: string; erros?: string[] }> {
        try {
            if (!conteudo || conteudo.trim().length === 0) {
                return {
                    sucesso: false,
                    erros: ['Conteúdo do comentário é obrigatório']
                };
            }

            if (conteudo.length > 1000) {
                return {
                    sucesso: false,
                    erros: ['Comentário deve ter no máximo 1000 caracteres']
                };
            }

            const comentarioId = await this.tarefaRepository.adicionarComentario({
                tarefa_id: tarefaId,
                usuario_id: usuarioId,
                conteudo: conteudo.trim()
            });

            return {
                sucesso: true,
                comentario: comentarioId
            };

        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async listarComentarios(tarefaId: string): Promise<{ sucesso: boolean; comentarios?: any[]; erros?: string[] }> {
        try {
            const comentarios = await this.tarefaRepository.listarComentarios(tarefaId);

            return {
                sucesso: true,
                comentarios
            };

        } catch (error) {
            console.error('Erro ao listar comentários:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async deletarComentario(comentarioId: string, usuarioId: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            const deletado = await this.tarefaRepository.deletarComentario(comentarioId, usuarioId);

            if (!deletado) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível deletar o comentário. Verifique se você tem permissão.']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao deletar comentário:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // MÉTODOS DE CONSULTA
    // ============================================

    public async buscarPorId(id: string): Promise<{ sucesso: boolean; tarefa?: any; erros?: string[] }> {
        try {
            const tarefa = await this.tarefaRepository.buscarPorId(id);
            
            if (!tarefa) {
                return {
                    sucesso: false,
                    erros: ['Tarefa não encontrada']
                };
            }

            return {
                sucesso: true,
                tarefa
            };

        } catch (error) {
            console.error('Erro ao buscar tarefa:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async listarPorGrupo(
        grupoId: string, 
        filtros?: {
            status?: string;
            prioridade?: string;
            assignado_para?: string;
            vencimento?: 'vencidas' | 'hoje' | 'semana' | 'mes';
        }, 
        limite?: number, 
        offset?: number
    ): Promise<{ sucesso: boolean; tarefas?: any[]; erros?: string[] }> {
        try {
            const tarefas = await this.tarefaRepository.listarPorGrupo(grupoId, filtros, limite, offset);

            return {
                sucesso: true,
                tarefas
            };

        } catch (error) {
            console.error('Erro ao listar tarefas do grupo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async buscarTarefas(grupoId: string, termo: string, limite?: number): Promise<{ sucesso: boolean; tarefas?: any[]; erros?: string[] }> {
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

            const tarefas = await this.tarefaRepository.buscarTarefas(grupoId, termo, limite);

            return {
                sucesso: true,
                tarefas
            };

        } catch (error) {
            console.error('Erro ao buscar tarefas:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async obterTarefasPorUsuario(grupoId: string, usuarioId: string, limite?: number): Promise<{ sucesso: boolean; tarefas?: any[]; erros?: string[] }> {
        try {
            const tarefas = await this.tarefaRepository.obterTarefasPorUsuario(grupoId, usuarioId, limite);

            return {
                sucesso: true,
                tarefas
            };

        } catch (error) {
            console.error('Erro ao obter tarefas do usuário:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async obterEstatisticas(grupoId: string, periodo?: number): Promise<{ sucesso: boolean; estatisticas?: any; erros?: string[] }> {
        try {
            const estatisticas = await this.tarefaRepository.obterEstatisticas(grupoId, periodo);

            return {
                sucesso: true,
                estatisticas
            };

        } catch (error) {
            console.error('Erro ao obter estatísticas de tarefas:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async obterHistoricoStatus(tarefaId: string): Promise<{ sucesso: boolean; historico?: any[]; erros?: string[] }> {
        try {
            const historico = await this.tarefaRepository.obterHistoricoStatus(tarefaId);

            return {
                sucesso: true,
                historico
            };

        } catch (error) {
            console.error('Erro ao obter histórico da tarefa:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // MÉTODOS DE CONVENIÊNCIA
    // ============================================

    public async concluirTarefa(id: string, usuarioId: string): Promise<{ sucesso: boolean; tarefa?: any; erros?: string[] }> {
        return await this.update(id, { status: 'concluida' }, usuarioId);
    }

    public async iniciarTarefa(id: string, usuarioId: string): Promise<{ sucesso: boolean; tarefa?: any; erros?: string[] }> {
        return await this.update(id, { status: 'em_andamento' }, usuarioId);
    }

    public async cancelarTarefa(id: string, usuarioId: string): Promise<{ sucesso: boolean; tarefa?: any; erros?: string[] }> {
        return await this.update(id, { status: 'cancelada' }, usuarioId);
    }

    public async atribuirTarefa(id: string, usuarioId: string, assignadoPara: string): Promise<{ sucesso: boolean; tarefa?: any; erros?: string[] }> {
        return await this.update(id, { assignado_para: assignadoPara }, usuarioId);
    }

    public async adicionarHorasTrabalhadas(id: string, usuarioId: string, horas: number): Promise<{ sucesso: boolean; tarefa?: any; erros?: string[] }> {
        try {
            if (horas <= 0) {
                return {
                    sucesso: false,
                    erros: ['Horas trabalhadas deve ser maior que zero']
                };
            }

            const tarefaExistente = await this.tarefaRepository.buscarPorId(id);
            if (!tarefaExistente) {
                return {
                    sucesso: false,
                    erros: ['Tarefa não encontrada']
                };
            }

            const horasAtuais = tarefaExistente.horas_trabalhadas || 0;
            const novasHoras = horasAtuais + horas;

            return await this.update(id, { horas_trabalhadas: novasHoras }, usuarioId);

        } catch (error) {
            console.error('Erro ao adicionar horas trabalhadas:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }
}
