import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { AuthTradicionalService } from '../services/AuthTradicionalService';
import { GoogleOAuthService, IGoogleUserInfo } from '../services/GoogleOAuthService';

export class AuthController {
    private usuarioRepository: UsuarioRepository;
    private authTradicionalService: AuthTradicionalService;
    private googleOAuthService: GoogleOAuthService;

    constructor() {
        this.usuarioRepository = new UsuarioRepository();
        this.authTradicionalService = new AuthTradicionalService();
        this.googleOAuthService = new GoogleOAuthService();
    }

    // ============================================
    // LOGIN TRADICIONAL
    // ============================================

    public loginTradicional = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, senha } = req.body;

            if (!email || !senha) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Email e senha são obrigatórios',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.authTradicionalService.login({ email, senha });

            if (!resultado.sucesso) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Falha na autenticação',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Login realizado com sucesso',
                dados: {
                    usuario: resultado.usuario,
                    accessToken: resultado.accessToken,
                    refreshToken: resultado.refreshToken
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no login tradicional:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // REGISTRO TRADICIONAL
    // ============================================

    public registroTradicional = async (req: Request, res: Response): Promise<void> => {
        try {
            const { nome, email, senha, telefone } = req.body;

            if (!nome || !email || !senha) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Nome, email e senha são obrigatórios',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.authTradicionalService.registro({
                nome,
                email,
                senha,
                telefone
            });

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Falha no registro',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(201).json({
                sucesso: true,
                mensagem: 'Usuário registrado com sucesso',
                dados: {
                    usuario: resultado.usuario,
                    accessToken: resultado.accessToken,
                    refreshToken: resultado.refreshToken
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no registro tradicional:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

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
    // OAUTH GOOGLE
    // ============================================

    public loginGoogle = async (req: Request, res: Response): Promise<void> => {
        try {
            const { idToken, accessToken } = req.body;

            if (!idToken && !accessToken) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Token do Google (ID Token ou Access Token) é obrigatório',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            let googleUserInfo: IGoogleUserInfo | null = null;

            // Tentar verificar ID Token primeiro
            if (idToken) {
                googleUserInfo = await this.googleOAuthService.verificarTokenId(idToken);
            }

            // Se não conseguiu com ID Token, tentar com Access Token
            if (!googleUserInfo && accessToken) {
                googleUserInfo = await this.googleOAuthService.obterInformacoesUsuario(accessToken);
            }

            if (!googleUserInfo) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Token do Google inválido',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Buscar ou criar usuário no banco
            let usuario = await this.usuarioRepository.buscarPorEmail(googleUserInfo.email);

            if (!usuario) {
                // Criar novo usuário
                const novoUsuario = await this.usuarioRepository.criar({
                    nome: googleUserInfo.name,
                    email: googleUserInfo.email,
                    hash_senha: '', // OAuth não precisa de senha local
                    status_ativo: true,
                    data_criacao: new Date()
                });

                if (!novoUsuario) {
                    res.status(500).json({
                        sucesso: false,
                        mensagem: 'Erro ao criar usuário com dados do Google',
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                usuario = novoUsuario;

                // Se tiver foto, atualizar
                if (googleUserInfo.picture) {
                    await this.usuarioRepository.atualizarFotoPerfil(usuario.id, googleUserInfo.picture);
                    usuario.foto_perfil = googleUserInfo.picture;
                }
            } else if (!usuario.status_ativo) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Conta desativada. Entre em contato com o suporte.',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Gerar tokens JWT
            const payload = {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            };

            const jwtAccessToken = AuthMiddleware.gerarToken(payload);
            const refreshToken = AuthMiddleware.gerarRefreshToken(payload);

            // Atualizar último acesso
            await this.usuarioRepository.atualizarUltimoAcesso(usuario.id);

            res.status(200).json({
                sucesso: true,
                mensagem: 'Login com Google realizado com sucesso',
                dados: {
                    usuario: {
                        id: usuario.id,
                        nome: usuario.nome,
                        email: usuario.email,
                        foto_perfil: usuario.foto_perfil,
                        telefone: usuario.telefone
                    },
                    accessToken: jwtAccessToken,
                    refreshToken: refreshToken
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro no login Google:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // URL DE AUTORIZAÇÃO GOOGLE
    // ============================================

    public obterUrlAutorizacaoGoogle = async (req: Request, res: Response): Promise<void> => {
        try {
            const { state } = req.query;

            const url = this.googleOAuthService.gerarUrlAutorizacao(state as string);

            res.status(200).json({
                sucesso: true,
                dados: {
                    authUrl: url
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro ao gerar URL de autorização Google:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };

    // ============================================
    // CALLBACK GOOGLE OAUTH
    // ============================================

    public callbackGoogle = async (req: Request, res: Response): Promise<void> => {
        try {
            const { code, state } = req.query;

            if (!code) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Código de autorização não fornecido',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Trocar código por tokens
            const tokens = await this.googleOAuthService.trocarCodigoPorTokens(code as string);

            if (!tokens) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao obter tokens do Google',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Usar o access token para fazer login
            req.body = { accessToken: tokens.access_token };
            await this.loginGoogle(req, res);

        } catch (error) {
            console.error('Erro no callback Google:', error);
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

    // ============================================
    // ALTERAR SENHA
    // ============================================

    public alterarSenha = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { senhaAtual, novaSenha } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            if (!senhaAtual || !novaSenha) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Senha atual e nova senha são obrigatórias',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const resultado = await this.authTradicionalService.alterarSenha(userId, senhaAtual, novaSenha);

            if (!resultado.sucesso) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Erro ao alterar senha',
                    erros: resultado.erros,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                sucesso: true,
                mensagem: 'Senha alterada com sucesso',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    };
}
