import { Request, Response } from 'express';
import { TarefaEntity, ITarefaCreate, ITarefaUpdate } from '../entities/TarefaEntity';
import { AuthenticatedRequest } from '../types';

export class TarefaController {
    private tarefaEntity: TarefaEntity;

    constructor() {
        this.tarefaEntity = new TarefaEntity();
    }

    // ============================================
    // CRUD BÁSICO
    // ============================================

    public criar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { 
                titulo, descricao, prioridade, data_vencimento, 
                grupo_id, assignado_para, etiquetas, estimativa_horas, anexos 
            } = req.body;
            
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const dadosTarefa: ITarefaCreate = {
                titulo,
                descricao,
                prioridade,
                data_vencimento: data_vencimento ? new Date(data_vencimento) : undefined,
                grupo_id,
                criado_por: userId,
                assignado_para: assignado_para || userId,
                etiquetas,
                estimativa_horas,
                anexos
            };

            const resultado = await this.tarefaEntity.create(dadosTarefa);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao criar tarefa',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(201).json({
                sucesso: true,
                mensagem: 'Tarefa criada com sucesso',
                dados: resultado.tarefa,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller criar tarefa:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public obter = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const resultado = await this.tarefaEntity.buscarPorId(id);

            if (!resultado.sucesso) {
                res.status(404).json({
                    sucesso: false,
                    mensagem: 'Tarefa não encontrada',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.tarefa,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller obter tarefa:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public atualizar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { 
                titulo, descricao, status, prioridade, data_vencimento,
                assignado_para, etiquetas, estimativa_horas, horas_trabalhadas, anexos 
            } = req.body;
            
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const dadosAtualizacao: ITarefaUpdate = {
                titulo,
                descricao,
                status,
                prioridade,
                data_vencimento: data_vencimento ? new Date(data_vencimento) : undefined,
                assignado_para,
                etiquetas,
                estimativa_horas,
                horas_trabalhadas,
                anexos
            };

            const resultado = await this.tarefaEntity.update(id, dadosAtualizacao, userId);

            if (!resultado.sucesso) {
                const status = resultado.erros?.includes('Tarefa não encontrada') ? 404 : 400;
                res.status(status).json({
                    sucesso: false,
                    mensagem: 'Erro ao atualizar tarefa',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Tarefa atualizada com sucesso',
                dados: resultado.tarefa,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller atualizar tarefa:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public deletar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const resultado = await this.tarefaEntity.delete(id);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao deletar tarefa',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Tarefa deletada com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller deletar tarefa:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // LISTAGENS E FILTROS
    // ============================================

    public listarPorGrupo = async (req: Request, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const { status, prioridade, assignado_para, vencimento, limite, offset } = req.query;

            const filtros = {
                status: status as string,
                prioridade: prioridade as string,
                assignado_para: assignado_para as string,
                vencimento: vencimento as 'vencidas' | 'hoje' | 'semana' | 'mes'
            };

            const resultado = await this.tarefaEntity.listarPorGrupo(
                grupoId,
                filtros,
                limite ? parseInt(limite as string) : 20,
                offset ? parseInt(offset as string) : 0
            );

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao listar tarefas',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.tarefas,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller listar tarefas:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public minhasTarefas = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const { limite } = req.query;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.tarefaEntity.obterTarefasPorUsuario(
                grupoId === 'todas' ? '' : grupoId,
                userId,
                limite ? parseInt(limite as string) : 20
            );

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao obter suas tarefas',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.tarefas,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller minhas tarefas:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public buscar = async (req: Request, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const { termo, limite } = req.query;

            if (!termo) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Termo de busca é obrigatório',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.tarefaEntity.buscarTarefas(
                grupoId,
                termo as string,
                limite ? parseInt(limite as string) : 20
            );

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao buscar tarefas',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.tarefas,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller buscar tarefas:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // MUDANÇAS DE STATUS
    // ============================================

    public concluir = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.tarefaEntity.concluirTarefa(id, userId);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao concluir tarefa',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Tarefa concluída com sucesso',
                dados: resultado.tarefa,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller concluir tarefa:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public iniciar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.tarefaEntity.iniciarTarefa(id, userId);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao iniciar tarefa',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Tarefa iniciada com sucesso',
                dados: resultado.tarefa,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller iniciar tarefa:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public cancelar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.tarefaEntity.cancelarTarefa(id, userId);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao cancelar tarefa',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Tarefa cancelada com sucesso',
                dados: resultado.tarefa,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller cancelar tarefa:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public atribuir = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { assignado_para } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            if (!assignado_para) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'ID do usuário a ser atribuído é obrigatório',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.tarefaEntity.atribuirTarefa(id, userId, assignado_para);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao atribuir tarefa',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Tarefa atribuída com sucesso',
                dados: resultado.tarefa,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller atribuir tarefa:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // COMENTÁRIOS
    // ============================================

    public adicionarComentario = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { conteudo } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.tarefaEntity.adicionarComentario(id, userId, conteudo);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao adicionar comentário',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(201).json({
                sucesso: true,
                mensagem: 'Comentário adicionado com sucesso',
                dados: { id: resultado.comentario },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller adicionar comentário:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public listarComentarios = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const resultado = await this.tarefaEntity.listarComentarios(id);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao listar comentários',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.comentarios,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller listar comentários:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public deletarComentario = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { comentarioId } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.tarefaEntity.deletarComentario(comentarioId, userId);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao deletar comentário',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Comentário deletado com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller deletar comentário:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // HORAS TRABALHADAS
    // ============================================

    public adicionarHoras = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { horas } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            if (!horas || horas <= 0) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Número de horas deve ser maior que zero',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.tarefaEntity.adicionarHorasTrabalhadas(id, userId, parseFloat(horas));

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao adicionar horas trabalhadas',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Horas adicionadas com sucesso',
                dados: resultado.tarefa,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller adicionar horas:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // RELATÓRIOS E ESTATÍSTICAS
    // ============================================

    public obterEstatisticas = async (req: Request, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const { periodo } = req.query;

            const resultado = await this.tarefaEntity.obterEstatisticas(
                grupoId,
                periodo ? parseInt(periodo as string) : 30
            );

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao obter estatísticas',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.estatisticas,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller obter estatísticas:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public obterHistorico = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const resultado = await this.tarefaEntity.obterHistoricoStatus(id);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao obter histórico',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.historico,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller obter histórico:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };
}
