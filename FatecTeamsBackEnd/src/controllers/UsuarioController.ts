import { Request, Response } from 'express';
import multer from 'multer';
import { UsuarioEntity } from '../entities/UsuarioEntity';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { S3Service } from '../services/S3Service';
import { ApiResponse, AuthenticatedRequest, CriarUsuarioRequest, LoginRequest } from '../types';

// Configuração do multer para upload de fotos
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB para fotos
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de imagem não permitido'));
        }
    }
});

export class UsuarioController {
    private usuarioRepository: UsuarioRepository;
    private s3Service: S3Service;
    public upload = upload;

    constructor() {
        this.usuarioRepository = new UsuarioRepository();
        this.s3Service = new S3Service();
    }

    // ============================================
    // POST /api/usuarios - Criar usuário
    // ============================================
    public criarUsuario = async (req: Request<{}, {}, CriarUsuarioRequest>, res: Response): Promise<void> => {
        try {
            const { nome, email, senha, telefone } = req.body;

            // Validar dados obrigatórios
            if (!nome || !email || !senha) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Nome, email e senha são obrigatórios',
                    timestamp: new Date().toISOString()
                } as ApiResponse);
                return;
            }

            // Criar usuário usando a entidade
            const usuario = await UsuarioEntity.create({
                nome,
                email,
                senha,
                telefone
            });

            // Persistir no banco
            const usuarioSalvo = await usuario.persist();

            // Gerar token JWT
            const token = AuthMiddleware.gerarToken({
                id: usuarioSalvo.id,
                email: usuarioSalvo.email,
                nome: usuarioSalvo.nome
            });

            const refreshToken = AuthMiddleware.gerarRefreshToken({
                id: usuarioSalvo.id,
                email: usuarioSalvo.email,
                nome: usuarioSalvo.nome
            });

            res.status(201).json({
                sucesso: true,
                mensagem: 'Usuário criado com sucesso',
                dados: {
                    usuario: usuarioSalvo.toResponse(),
                    token,
                    refreshToken
                },
                timestamp: new Date().toISOString()
            } as ApiResponse);

        } catch (error: any) {
            console.error('Erro ao criar usuário:', error);

            const statusCode = error.message.includes('Email já está sendo utilizado') ? 409 : 400;

            res.status(statusCode).json({
                sucesso: false,
                mensagem: error.message || 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            } as ApiResponse);
        }
    }

    // ============================================
    // POST /api/usuarios/login - Autenticar usuário
    // ============================================
    public autenticarUsuario = async (req: Request<{}, {}, LoginRequest>, res: Response): Promise<void> => {
        try {
            const { email, senha } = req.body;

            // Validar dados obrigatórios
            if (!email || !senha) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Email e senha são obrigatórios',
                    timestamp: new Date().toISOString()
                } as ApiResponse);
                return;
            }

            // Buscar usuário no banco com senha
            const usuarioData = await this.usuarioRepository.buscarPorEmailComSenha(email);

            if (!usuarioData) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Email ou senha incorretos',
                    timestamp: new Date().toISOString()
                } as ApiResponse);
                return;
            }

            // Criar entidade usuário e validar senha
            const usuario = UsuarioEntity.fromDatabase(usuarioData);
            const senhaValida = await usuario.validarSenha(senha);

            if (!senhaValida) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Email ou senha incorretos',
                    timestamp: new Date().toISOString()
                } as ApiResponse);
                return;
            }

            // Gerar tokens
            const token = AuthMiddleware.gerarToken({
                id: usuario.id,
                email: usuario.email,
                nome: usuario.nome
            });

            const refreshToken = AuthMiddleware.gerarRefreshToken({
                id: usuario.id,
                email: usuario.email,
                nome: usuario.nome
            });

            res.json({
                sucesso: true,
                mensagem: 'Login realizado com sucesso',
                dados: {
                    usuario: usuario.toResponse(),
                    token,
                    refreshToken
                },
                timestamp: new Date().toISOString()
            } as ApiResponse);

        } catch (error: any) {
            console.error('Erro ao autenticar usuário:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            } as ApiResponse);
        }
    }

    // ============================================
    // GET /api/usuarios/perfil - Obter perfil do usuário
    // ============================================
    public obterPerfilUsuario = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                } as ApiResponse);
                return;
            }

            // Buscar dados completos do usuário
            const usuarioData = await this.usuarioRepository.buscarPorId(req.user.id);

            if (!usuarioData) {
                res.status(404).json({
                    sucesso: false,
                    mensagem: 'Usuário não encontrado',
                    timestamp: new Date().toISOString()
                } as ApiResponse);
                return;
            }

            const usuario = UsuarioEntity.fromDatabase(usuarioData);

            // Buscar estatísticas do usuário
            const estatisticas = await this.usuarioRepository.obterEstatisticasUsuario(req.user.id);

            res.json({
                sucesso: true,
                mensagem: 'Perfil obtido com sucesso',
                dados: {
                    usuario: usuario.toResponse(),
                    estatisticas
                },
                timestamp: new Date().toISOString()
            } as ApiResponse);

        } catch (error: any) {
            console.error('Erro ao obter perfil:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            } as ApiResponse);
        }
    }

    // ============================================
    // PUT /api/usuarios/perfil - Atualizar perfil do usuário
    // ============================================
    public atualizarPerfilUsuario = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            console.log('🔍 DEBUG - Dados recebidos no controller:');
            console.log('  req.body:', JSON.stringify(req.body, null, 2));
            console.log('  req.user:', req.user);
            console.log('  Content-Type:', req.headers['content-type']);
            console.log('  Method:', req.method);
            console.log('  URL:', req.originalUrl);
            
            if (!req.user) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                } as ApiResponse);
                return;
            }

            const { nome, telefone, foto_perfil } = req.body;
            
            console.log('🔍 DEBUG - Dados extraídos:');
            console.log('  nome:', nome);
            console.log('  telefone:', telefone);
            console.log('  foto_perfil:', foto_perfil);
            
            // Criar objeto apenas com os campos que foram efetivamente enviados
            const camposParaAtualizar: any = {};
            if (req.body.hasOwnProperty('nome')) {
                camposParaAtualizar.nome = nome;
            }
            if (req.body.hasOwnProperty('telefone')) {
                camposParaAtualizar.telefone = telefone;
            }
            if (req.body.hasOwnProperty('foto_perfil')) {
                camposParaAtualizar.foto_perfil = foto_perfil;
            }
            
            console.log('🔍 DEBUG - Campos que serão atualizados:', camposParaAtualizar);

            // Buscar usuário atual
            const usuarioData = await this.usuarioRepository.buscarPorId(req.user.id);

            if (!usuarioData) {
                res.status(404).json({
                    sucesso: false,
                    mensagem: 'Usuário não encontrado',
                    timestamp: new Date().toISOString()
                } as ApiResponse);
                return;
            }

            // Criar entidade e atualizar dados
            const usuario = UsuarioEntity.fromDatabase(usuarioData);
            usuario.atualizarPerfil(camposParaAtualizar);

            // Persistir alterações
            const usuarioAtualizado = await usuario.persist();

            res.json({
                sucesso: true,
                mensagem: 'Perfil atualizado com sucesso',
                dados: {
                    usuario: usuarioAtualizado.toResponse()
                },
                timestamp: new Date().toISOString()
            } as ApiResponse);

        } catch (error: any) {
            console.error('Erro ao atualizar perfil:', error);
            res.status(400).json({
                sucesso: false,
                mensagem: error.message || 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            } as ApiResponse);
        }
    }

    // ============================================
    // POST /api/usuarios/foto-perfil - Upload foto de perfil
    // ============================================
    public uploadFotoPerfilUsuario = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            console.log('🔍 DEBUG - Upload foto de perfil:');
            console.log('  req.user:', req.user);
            console.log('  req.file:', req.file);
            console.log('  req.files:', req.files);
            console.log('  req.body:', req.body);
            console.log('  Content-Type:', req.headers['content-type']);
            
            if (!req.user) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                } as ApiResponse);
                return;
            }

            if (!req.file) {
                console.log('❌ Nenhum arquivo encontrado no req.file');
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Nenhuma imagem foi enviada',
                    timestamp: new Date().toISOString()
                } as ApiResponse);
                return;
            }

            const file = req.file;
            const userId = req.user.id;

            try {
                // Upload para S3 na pasta de usuários
                const urlS3 = await this.s3Service.uploadImage(
                    file.buffer,
                    file.originalname,
                    `usuarios/${userId}`
                );

                // Atualizar foto_perfil no banco
                const usuarioAtualizado = await this.usuarioRepository.atualizarFotoPerfil(userId, urlS3);

                if (!usuarioAtualizado) {
                    // Se falhou ao atualizar banco, tentar remover do S3
                    const keyS3 = this.s3Service.extractKeyFromUrl(urlS3);
                    if (keyS3) {
                        await this.s3Service.deleteFile(keyS3);
                    }

                    res.status(400).json({
                        sucesso: false,
                        mensagem: 'Erro ao atualizar foto de perfil',
                        timestamp: new Date().toISOString()
                    } as ApiResponse);
                    return;
                }

                res.status(200).json({
                    sucesso: true,
                    mensagem: 'Foto de perfil atualizada com sucesso',
                    dados: {
                        foto_perfil: urlS3
                    },
                    timestamp: new Date().toISOString()
                } as ApiResponse);

            } catch (s3Error) {
                console.error('Erro ao fazer upload da foto para S3:', s3Error);
                res.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro ao fazer upload da imagem',
                    timestamp: new Date().toISOString()
                } as ApiResponse);
            }

        } catch (error: any) {
            console.error('Erro no upload da foto:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            } as ApiResponse);
        }
    }

    // ============================================
    // DELETE /api/usuarios/perfil - Desativar usuário
    // ============================================
    public desativarUsuario = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Usuário não autenticado',
                    timestamp: new Date().toISOString()
                } as ApiResponse);
                return;
            }

            // Buscar usuário
            const usuarioData = await this.usuarioRepository.buscarPorId(req.user.id);

            if (!usuarioData) {
                res.status(404).json({
                    sucesso: false,
                    mensagem: 'Usuário não encontrado',
                    timestamp: new Date().toISOString()
                } as ApiResponse);
                return;
            }

            // Desativar usuário
            const usuario = UsuarioEntity.fromDatabase(usuarioData);
            usuario.desativar();
            await usuario.persist();

            res.json({
                sucesso: true,
                mensagem: 'Usuário desativado com sucesso',
                timestamp: new Date().toISOString()
            } as ApiResponse);

        } catch (error: any) {
            console.error('Erro ao desativar usuário:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            } as ApiResponse);
        }
    }

    // ============================================
    // POST /api/usuarios/recuperar-senha - Recuperar senha
    // ============================================
    public recuperarSenhaUsuario = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email } = req.body;

            if (!email) {
                res.status(400).json({
                    sucesso: false,
                    mensagem: 'Email é obrigatório',
                    timestamp: new Date().toISOString()
                } as ApiResponse);
                return;
            }

            // Buscar usuário
            const usuarioData = await this.usuarioRepository.buscarPorEmail(email);

            if (!usuarioData) {
                // Por segurança, sempre retornar sucesso mesmo se usuário não existir
                res.json({
                    sucesso: true,
                    mensagem: 'Se o email estiver cadastrado, você receberá as instruções de recuperação',
                    timestamp: new Date().toISOString()
                } as ApiResponse);
                return;
            }

            // TODO: Implementar envio de email de recuperação
            res.json({
                sucesso: true,
                mensagem: 'Se o email estiver cadastrado, você receberá as instruções de recuperação',
                timestamp: new Date().toISOString()
            } as ApiResponse);

        } catch (error: any) {
            console.error('Erro ao recuperar senha:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            } as ApiResponse);
        }
    }

    // ============================================
    // POST /api/usuarios/redefinir-senha - Redefinir senha
    // ============================================
    public redefinirSenhaUsuario = async (req: Request, res: Response): Promise<void> => {
        try {
            // TODO: Implementar redefinição de senha com token
            res.status(501).json({
                sucesso: false,
                mensagem: 'Redefinição de senha ainda não implementada',
                timestamp: new Date().toISOString()
            } as ApiResponse);

        } catch (error: any) {
            console.error('Erro ao redefinir senha:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            } as ApiResponse);
        }
    }
}
