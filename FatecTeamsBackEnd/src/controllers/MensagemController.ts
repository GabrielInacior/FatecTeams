import { Request, Response } from 'express';
import { MensagemEntity, IMensagemCreate, IMensagemUpdate } from '../entities/MensagemEntity';
import { AuthenticatedRequest } from '../types';
import { WebSocketService } from '../services/WebSocketService';

export class MensagemController {
    private mensagemEntity: MensagemEntity;
    private webSocketService: WebSocketService;

    constructor() {
        this.mensagemEntity = new MensagemEntity();
        this.webSocketService = WebSocketService.getInstance();
    }

    // ============================================
    // CRUD BÁSICO
    // ============================================

    public criar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { conteudo, tipo_mensagem, arquivo_id, grupo_id, mensagem_pai_id, mencionados } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const dadosMensagem: IMensagemCreate = {
                conteudo,
                tipo_mensagem: tipo_mensagem || 'texto',
                arquivo_id,
                grupo_id,
                remetente_id: userId,
                mensagem_pai_id,
                mencionados
            };

            const resultado = await this.mensagemEntity.create(dadosMensagem);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao criar mensagem',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Emitir nova mensagem via WebSocket
            if (resultado.mensagem) {
                this.webSocketService.emitirNovaMensagem(grupo_id, {
                    ...resultado.mensagem,
                    remetente_nome: req.user?.nome || 'Usuário'
                });
            }

            res.status(201).json({
                sucesso: true,
                mensagem: 'Mensagem criada com sucesso',
                dados: resultado.mensagem,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller criar mensagem:', error);
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

            const resultado = await this.mensagemEntity.buscarPorId(id);

            if (!resultado.sucesso) {
                res.status(404).json({
                    sucesso: false,
                    mensagem: 'Mensagem não encontrada',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.mensagem,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller obter mensagem:', error);
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

            const resultado = await this.mensagemEntity.update(id, conteudo, userId);

            if (!resultado.sucesso) {
                const status = resultado.erros?.some(erro => erro.includes('não foi possível')) ? 403 : 400;
                res.status(status).json({
                    sucesso: false,
                    mensagem: 'Erro ao atualizar mensagem',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Emitir mensagem editada via WebSocket
            if (resultado.mensagem && resultado.mensagem.grupo_id) {
                this.webSocketService.emitirMensagemEditada(resultado.mensagem.grupo_id, resultado.mensagem);
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Mensagem atualizada com sucesso',
                dados: resultado.mensagem,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller atualizar mensagem:', error);
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
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Obter informações da mensagem antes de deletar
            const mensagemInfo = await this.mensagemEntity.buscarPorId(id);
            
            const resultado = await this.mensagemEntity.delete(id, userId);

            if (!resultado.sucesso) {
                res.status(403).json({
                    sucesso: false,
                    mensagem: 'Erro ao deletar mensagem',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Emitir mensagem deletada via WebSocket
            if (mensagemInfo.sucesso && mensagemInfo.mensagem?.grupo_id) {
                this.webSocketService.emitirMensagemDeletada(mensagemInfo.mensagem.grupo_id, id);
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Mensagem deletada com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller deletar mensagem:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // LISTAGENS
    // ============================================

    public listarPorGrupo = async (req: Request, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const { limite, offset } = req.query;

            const resultado = await this.mensagemEntity.listarPorGrupo(
                grupoId,
                limite ? parseInt(limite as string) : 50,
                offset ? parseInt(offset as string) : 0
            );

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao listar mensagens',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.mensagens,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller listar mensagens:', error);
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

            const resultado = await this.mensagemEntity.buscarMensagens(
                grupoId,
                termo as string,
                limite ? parseInt(limite as string) : 20
            );

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao buscar mensagens',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.mensagens,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller buscar mensagens:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // REAÇÕES
    // ============================================

    public adicionarReacao = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { emoji } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.mensagemEntity.adicionarReacao(id, userId, emoji);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao adicionar reação',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Reação adicionada com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller adicionar reação:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public removerReacao = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { emoji } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.mensagemEntity.removerReacao(id, userId, emoji);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao remover reação',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Reação removida com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller remover reação:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public listarReacoes = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const resultado = await this.mensagemEntity.listarReacoes(id);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao listar reações',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.reacoes,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller listar reações:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // MENSAGENS NÃO LIDAS
    // ============================================

    public obterNaoLidas = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.mensagemEntity.obterMensagensNaoLidas(userId, grupoId);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao obter mensagens não lidas',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: { total: resultado.total },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller obter não lidas:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public marcarComoLida = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

            const resultado = await this.mensagemEntity.marcarComoLida(id, userId);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao marcar como lida',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Mensagem marcada como lida',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller marcar como lida:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public marcarTodasComoLidas = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.mensagemEntity.marcarTodasComoLidas(grupoId, userId);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao marcar todas como lidas',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Todas as mensagens marcadas como lidas',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller marcar todas como lidas:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // ESTATÍSTICAS
    // ============================================

    public obterEstatisticas = async (req: Request, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const { dataInicio } = req.query;

            const dataInicioObj = dataInicio ? new Date(dataInicio as string) : undefined;

            const resultado = await this.mensagemEntity.obterEstatisticas(grupoId, dataInicioObj);

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

    public obterRecentes = async (req: Request, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const { dataReferencia, limite } = req.query;

            const dataRef = dataReferencia ? new Date(dataReferencia as string) : new Date(Date.now() - 24 * 60 * 60 * 1000); // últimas 24h

            const resultado = await this.mensagemEntity.obterMensagensRecentes(
                grupoId,
                dataRef,
                limite ? parseInt(limite as string) : 50
            );

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao obter mensagens recentes',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.mensagens,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller obter recentes:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };
}
