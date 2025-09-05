import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { UsuarioRepository } from '../repositories/UsuarioRepository';

export class AuthController {
    private usuarioRepository: UsuarioRepository;

    constructor() {
        this.usuarioRepository = new UsuarioRepository();
    }

    // ============================================
    // RENOVAR TOKEN JWT
    // ============================================

    public renovarToken = async (req: Request, res: Response): Promise<void> => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Refresh token é obrigatório',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            try {
                const decoded = AuthMiddleware.verificarRefreshToken(refreshToken);
                const usuario = await this.usuarioRepository.buscarPorId(decoded.id);

                if (!usuario) {
                    res.status(401).json({
                        sucesso: false,
                        mensagem: 'Token inválido ou usuário não encontrado',
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                const novoAccessToken = AuthMiddleware.gerarToken({
                    id: usuario.id,
                    email: usuario.email,
                    nome: usuario.nome
                });

                const novoRefreshToken = AuthMiddleware.gerarRefreshToken({
                    id: usuario.id,
                    email: usuario.email,
                    nome: usuario.nome
                });

                res.status(200).json({
                    sucesso: true,
                    mensagem: 'Tokens renovados com sucesso',
                    dados: {
                        accessToken: novoAccessToken,
                        refreshToken: novoRefreshToken,
                        usuario: {
                            id: usuario.id,
                            nome: usuario.nome,
                            email: usuario.email,
                            foto_perfil: usuario.foto_perfil
                        }
                    },
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Refresh token inválido ou expirado',
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('Erro no controller renovar token:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // LOGOUT / REVOGAR TOKEN
    // ============================================

    public logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            // Em um sistema mais complexo, aqui poderíamos:
            // 1. Adicionar o token a uma blacklist
            // 2. Invalidar refresh tokens no banco
            // 3. Registrar logout em logs de auditoria

            const userId = req.user?.id;

            if (userId) {
                console.log(`📊 Usuário ${userId} fez logout em ${new Date().toISOString()}`);
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Logout realizado com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller logout:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // VALIDAR TOKEN JWT
    // ============================================

    public validarToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            // Se chegou até aqui, é porque o middleware de autenticação passou
            // Isso significa que o token é válido
            
            const usuario = req.user;

            if (!usuario) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Token inválido',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Buscar dados atualizados do usuário
            const resultado = await this.usuarioRepository.buscarPorId(usuario.id);

            if (!resultado) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não encontrado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Token válido',
                dados: {
                    usuario: {
                        id: resultado.id,
                        nome: resultado.nome,
                        email: resultado.email,
                        foto_perfil: resultado.foto_perfil,
                        telefone: resultado.telefone,
                        status_ativo: resultado.status_ativo,
                        data_criacao: resultado.data_criacao
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller validar token:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // OAUTH GOOGLE (PLACEHOLDER)
    // ============================================

    public loginGoogle = async (req: Request, res: Response): Promise<void> => {
        try {
            const { googleToken } = req.body;

            if (!googleToken) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Token do Google é obrigatório',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // TODO: Implementar validação do token Google
            // 1. Validar token com Google API
            // 2. Extrair dados do usuário
            // 3. Criar/buscar usuário no banco
            // 4. Gerar JWT tokens

            res.status(501).json({
                sucesso: false,
                mensagem: 'Login com Google não implementado ainda',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller login Google:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // OAUTH MICROSOFT (PLACEHOLDER)
    // ============================================

    public loginMicrosoft = async (req: Request, res: Response): Promise<void> => {
        try {
            const { microsoftToken } = req.body;

            if (!microsoftToken) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Token da Microsoft é obrigatório',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // TODO: Implementar validação do token Microsoft
            // 1. Validar token com Microsoft Graph API
            // 2. Extrair dados do usuário
            // 3. Criar/buscar usuário no banco
            // 4. Gerar JWT tokens

            res.status(501).json({
                sucesso: false,
                mensagem: 'Login com Microsoft não implementado ainda',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller login Microsoft:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // INFORMAÇÕES DE SESSÃO
    // ============================================

    public infoSessao = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const usuario = req.user;

            if (!usuario) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                dados: {
                    usuario: {
                        id: usuario.id,
                        email: usuario.email
                    },
                    sessao: {
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        timestamp: new Date().toISOString()
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no controller info sessão:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };
}
