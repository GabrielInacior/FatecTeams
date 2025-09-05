import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { HistoricoAtividadeRepository, IHistoricoAtividade } from '../repositories/HistoricoAtividadeRepository';
import { GrupoRepository } from '../repositories/GrupoRepository';

export class HistoricoAtividadeController {
    private historicoRepository: HistoricoAtividadeRepository;
    private grupoRepository: GrupoRepository;

    constructor() {
        this.historicoRepository = new HistoricoAtividadeRepository();
        this.grupoRepository = new GrupoRepository();
    }

    // ============================================
    // REGISTRAR ATIVIDADE (USO INTERNO)
    // ============================================

    public async registrarAtividade(
        usuarioId: string,
        acao: string,
        detalhes: any = {},
        grupoId?: string,
        entidadeTipo?: string,
        entidadeId?: string,
        req?: any
    ): Promise<void> {
        try {
            const atividade: IHistoricoAtividade = {
                usuario_id: usuarioId,
                grupo_id: grupoId,
                acao,
                entidade_tipo: entidadeTipo,
                entidade_id: entidadeId,
                detalhes,
                ip_origem: req?.ip || req?.connection?.remoteAddress,
                user_agent: req?.get('User-Agent')
            };

            await this.historicoRepository.registrar(atividade);
        } catch (error) {
            // Log do erro, mas não interromper o fluxo principal
            console.error('Erro ao registrar atividade:', error);
        }
    }

    // ============================================
    // LISTAR HISTÓRICO DO USUÁRIO
    // ============================================

    public listarMeuHistorico = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { 
                limite = 50, 
                offset = 0, 
                data_inicio,
                data_fim,
                grupo_id,
                acao 
            } = req.query;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const filtros = {
                limite: parseInt(limite as string),
                offset: parseInt(offset as string),
                data_inicio: data_inicio ? new Date(data_inicio as string) : undefined,
                data_fim: data_fim ? new Date(data_fim as string) : undefined,
                grupo_id: grupo_id as string,
                acao: acao as string
            };

            const resultado = await this.historicoRepository.listarPorUsuario(userId, filtros);

            res.status(200).json({
                sucesso: true,
                dados: {
                    atividades: resultado.atividades,
                    paginacao: {
                        total: resultado.total,
                        limite: filtros.limite,
                        offset: filtros.offset,
                        tem_mais: filtros.offset + filtros.limite < resultado.total
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller listar meu histórico:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // LISTAR HISTÓRICO DO GRUPO
    // ============================================

    public listarHistoricoGrupo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const userId = req.user?.id;
            const { 
                limite = 100, 
                offset = 0, 
                data_inicio,
                data_fim,
                usuario_id,
                acao 
            } = req.query;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Verificar se o usuário tem permissão para ver o histórico do grupo
            const membro = await this.grupoRepository.verificarPermissao(grupoId, userId);
            if (!membro || !['admin', 'moderador'].includes(membro.nivel_permissao)) {
                res.status(403).json({
                    sucesso: false,
                    mensagem: 'Sem permissão para ver histórico do grupo',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const filtros = {
                limite: parseInt(limite as string),
                offset: parseInt(offset as string),
                data_inicio: data_inicio ? new Date(data_inicio as string) : undefined,
                data_fim: data_fim ? new Date(data_fim as string) : undefined,
                usuario_id: usuario_id as string,
                acao: acao as string
            };

            const resultado = await this.historicoRepository.listarPorGrupo(grupoId, filtros);

            res.status(200).json({
                sucesso: true,
                dados: {
                    atividades: resultado.atividades,
                    paginacao: {
                        total: resultado.total,
                        limite: filtros.limite,
                        offset: filtros.offset,
                        tem_mais: filtros.offset + filtros.limite < resultado.total
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller listar histórico do grupo:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // ESTATÍSTICAS DE ATIVIDADE
    // ============================================

    public obterEstatisticasUsuario = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { dias = 30 } = req.query;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const estatisticas = await this.historicoRepository.obterEstatisticasUsuario(
                userId, 
                parseInt(dias as string)
            );

            res.status(200).json({
                sucesso: true,
                dados: estatisticas,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller estatísticas do usuário:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public obterEstatisticasGrupo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const userId = req.user?.id;
            const { dias = 30 } = req.query;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Verificar permissão
            const membro = await this.grupoRepository.verificarPermissao(grupoId, userId);
            if (!membro || !['admin', 'moderador'].includes(membro.nivel_permissao)) {
                res.status(403).json({
                    sucesso: false,
                    mensagem: 'Sem permissão para ver estatísticas do grupo',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const estatisticas = await this.historicoRepository.obterEstatisticasGrupo(
                grupoId, 
                parseInt(dias as string)
            );

            res.status(200).json({
                sucesso: true,
                dados: estatisticas,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller estatísticas do grupo:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // ATIVIDADE POR PERÍODO
    // ============================================

    public obterAtividadePorDia = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { 
                grupo_id,
                data_inicio,
                data_fim,
                minha_atividade = 'false'
            } = req.query;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Se for atividade de grupo específico, verificar permissão
            if (grupo_id && minha_atividade === 'false') {
                const membro = await this.grupoRepository.verificarPermissao(grupo_id as string, userId);
                if (!membro) {
                    res.status(403).json({
                        sucesso: false,
                        mensagem: 'Sem permissão para ver atividade do grupo',
                        timestamp: new Date().toISOString()
                    });
                    return;
                }
            }

            const filtros = {
                usuario_id: minha_atividade === 'true' ? userId : undefined,
                grupo_id: grupo_id as string,
                data_inicio: data_inicio ? new Date(data_inicio as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                data_fim: data_fim ? new Date(data_fim as string) : new Date()
            };

            const atividade = await this.historicoRepository.obterAtividadePorDia(filtros);

            res.status(200).json({
                sucesso: true,
                dados: atividade,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller atividade por dia:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // TOP USUÁRIOS MAIS ATIVOS
    // ============================================

    public obterTopUsuarios = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { grupoId } = req.params;
            const userId = req.user?.id;
            const { dias = 30 } = req.query;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Verificar permissão se for grupo específico
            if (grupoId) {
                const membro = await this.grupoRepository.verificarPermissao(grupoId, userId);
                if (!membro || !['admin', 'moderador'].includes(membro.nivel_permissao)) {
                    res.status(403).json({
                        sucesso: false,
                        mensagem: 'Sem permissão para ver ranking do grupo',
                        timestamp: new Date().toISOString()
                    });
                    return;
                }
            }

            const topUsuarios = await this.historicoRepository.obterTop10UsuariosMaisAtivos(
                grupoId, 
                parseInt(dias as string)
            );

            res.status(200).json({
                sucesso: true,
                dados: topUsuarios,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller top usuários:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // LIMPEZA DE HISTÓRICO ANTIGO
    // ============================================

    public limparHistoricoAntigo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { meses = 6 } = req.body;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // TODO: Verificar se o usuário é admin da plataforma
            // Por enquanto, qualquer usuário autenticado pode executar

            const registrosRemovidos = await this.historicoRepository.limparAtividadesAntigas(
                parseInt(meses)
            );

            res.status(200).json({
                sucesso: true,
                mensagem: `${registrosRemovidos} registros antigos removidos`,
                dados: {
                    registros_removidos: registrosRemovidos,
                    meses_limite: parseInt(meses)
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller limpar histórico:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };
}
