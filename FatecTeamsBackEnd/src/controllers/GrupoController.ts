import { Request, Response } from 'express';
import { GrupoEntity, IGrupoCreate, IGrupoUpdate } from '../entities/GrupoEntity';
import { AuthenticatedRequest } from '../types';

export class GrupoController {
    private grupoEntity: GrupoEntity;

    constructor() {
        this.grupoEntity = new GrupoEntity();
    }

    // ============================================
    // CRUD BÁSICO
    // ============================================

    public criar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { nome, descricao, tipo, privacidade, max_membros, configuracoes } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const dadosGrupo: IGrupoCreate = {
                nome,
                descricao,
                categoria: tipo, // Mapear 'tipo' do frontend para 'categoria'
                privacidade,
                max_membros,
                configuracoes,
                criador_id: userId
            };

            const resultado = await this.grupoEntity.create(dadosGrupo);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao criar grupo',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(201).json({
                sucesso: true,
                mensagem: 'Grupo criado com sucesso',
                dados: resultado.grupo,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller criar grupo:', error);
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

            const resultado = await this.grupoEntity.buscarPorId(id);

            if (!resultado.sucesso) {
                res.status(404).json({
                    sucesso: false,
                    mensagem: 'Grupo não encontrado',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.grupo,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller obter grupo:', error);
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
            const { nome, descricao, tipo, privacidade, max_membros, configuracoes } = req.body;

            const dadosAtualizacao: IGrupoUpdate = {
                nome,
                descricao,
                categoria: tipo,
                privacidade,
                max_membros,
                configuracoes
            };

            const resultado = await this.grupoEntity.update(id, dadosAtualizacao);

            if (!resultado.sucesso) {
                const status = resultado.erros?.includes('Grupo não encontrado') ? 404 : 400;
                res.status(status).json({
                    sucesso: false,
                    mensagem: 'Erro ao atualizar grupo',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Grupo atualizado com sucesso',
                dados: resultado.grupo,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller atualizar grupo:', error);
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

            const resultado = await this.grupoEntity.delete(id, userId);

            if (!resultado.sucesso) {
                const status = resultado.erros?.includes('não encontrado') ? 404 : 403;
                res.status(status).json({
                    sucesso: false,
                    mensagem: 'Erro ao deletar grupo',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Grupo deletado com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller deletar grupo:', error);
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

    public listarMeus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { limite, offset } = req.query;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.grupoEntity.listarPorUsuario(
                userId,
                limite ? parseInt(limite as string) : 20,
                offset ? parseInt(offset as string) : 0
            );

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao listar grupos',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.grupos,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller listar meus grupos:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public listarPublicos = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { termo, limite, offset } = req.query;
            const userId = req.user?.id; // Usuário pode ser opcional para grupos públicos

            const resultado = await this.grupoEntity.buscarPublicos(
                termo as string,
                limite ? parseInt(limite as string) : 20,
                offset ? parseInt(offset as string) : 0,
                userId // Passar o usuário para excluir grupos onde ele já é membro
            );

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao buscar grupos públicos',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.grupos,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller listar grupos públicos:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // GESTÃO DE MEMBROS
    // ============================================

    public obterMembros = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const resultado = await this.grupoEntity.obterMembros(id);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao obter membros',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: resultado.membros,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller obter membros:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public adicionarMembro = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { usuario_id, papel } = req.body;
            const adminId = req.user?.id;

            if (!adminId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.grupoEntity.adicionarMembro(id, adminId, usuario_id, papel);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao adicionar membro',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Membro adicionado com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller adicionar membro:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public entrarGrupoPublico = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

            const resultado = await this.grupoEntity.entrarGrupoPublico(id, userId);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao entrar no grupo',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Entrada no grupo realizada com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller entrar no grupo:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public removerMembro = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id, usuarioId } = req.params;
            const adminId = req.user?.id;

            if (!adminId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.grupoEntity.removerMembro(id, adminId, usuarioId);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao remover membro',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Membro removido com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller remover membro:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public alterarPapel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id, usuarioId } = req.params;
            const { papel } = req.body;
            const adminId = req.user?.id;

            if (!adminId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.grupoEntity.alterarPapel(id, adminId, usuarioId, papel);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao alterar papel',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Papel alterado com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller alterar papel:', error);
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
            const { id } = req.params;

            const resultado = await this.grupoEntity.obterEstatisticas(id);

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

    public obterDetalhes = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'ID do grupo é obrigatório',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.grupoEntity.buscarPorId(id);

            if (!resultado.sucesso) {
                res.status(404).json({
                    sucesso: false,
                    mensagem: 'Grupo não encontrado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Buscar membros do grupo
            const resultadoMembros = await this.grupoEntity.obterMembros(id);
            
            res.status(200).json({
                sucesso: true,
                dados: {
                    ...resultado.grupo,
                    membros: resultadoMembros.sucesso ? resultadoMembros.membros : []
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller obter detalhes:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    public sairDoGrupo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const usuarioId = req.user?.id;

            if (!id || !usuarioId) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'ID do grupo e usuário são obrigatórios',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.grupoEntity.removerMembro(id, usuarioId, usuarioId);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao sair do grupo',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Saiu do grupo com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller sair do grupo:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // GESTÃO DE MEMBROS
    // ============================================

    public alterarNivelMembro = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id: grupoId, usuarioId } = req.params;
            const { nivel_permissao } = req.body;
            const administradorId = req.user?.id;

            if (!administradorId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Verificar se o usuário é admin do grupo
            const permissaoAdmin = await this.grupoEntity.verificarPermissao(grupoId, administradorId);
            if (!permissaoAdmin.sucesso || permissaoAdmin.permissao?.papel !== 'admin') {
                res.status(403).json({
                    sucesso: false,
                    mensagem: 'Apenas administradores podem alterar níveis de permissão',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.grupoEntity.alterarNivelMembro(grupoId, usuarioId, nivel_permissao);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao alterar nível do membro',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Nível do membro alterado com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro ao alterar nível do membro:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

}
