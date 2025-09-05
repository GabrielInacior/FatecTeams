import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { JWTPayload, AuthenticatedRequest } from '../types';

export class AuthMiddleware {
    // ============================================
    // MIDDLEWARE PRINCIPAL DE AUTENTICAÇÃO
    // ============================================
    
    public static async verificarToken(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const authHeader = req.headers.authorization as string;
            
            if (!authHeader) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Token de acesso não fornecido',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const parts = authHeader.split(' ');
            
            if (parts.length !== 2 || parts[0] !== 'Bearer') {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Formato de token inválido',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            const token = parts[1];

            // Verificar token JWT
            const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

            // Buscar usuário no banco para garantir que ainda existe e está ativo
            const usuarioRepository = new UsuarioRepository();
            const usuario = await usuarioRepository.buscarPorId(decoded.id);

            if (!usuario || !usuario.status_ativo) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Token inválido ou usuário inativo',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Adicionar dados do usuário à requisição
            req.user = {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            };

            next();

        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Token expirado',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            if (error instanceof jwt.JsonWebTokenError) {
                res.status(401).json({
                    sucesso: false,
                    mensagem: 'Token inválido',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            console.error('Erro na autenticação:', error);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                timestamp: new Date().toISOString()
            });
        }
    }

    // ============================================
    // MIDDLEWARE OPCIONAL (não obrigatório)
    // ============================================
    
    public static async verificarTokenOpcional(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const authHeader = req.headers.authorization as string;
            
            if (!authHeader) {
                // Se não houver token, continua sem definir req.user
                next();
                return;
            }

            const parts = authHeader.split(' ');
            
            if (parts.length !== 2 || parts[0] !== 'Bearer') {
                // Token mal formatado, continua sem definir req.user
                next();
                return;
            }

            const token = parts[1];

            try {
                // Verificar token JWT
                const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

                // Buscar usuário no banco
                const usuarioRepository = new UsuarioRepository();
                const usuario = await usuarioRepository.buscarPorId(decoded.id);

                if (usuario && usuario.status_ativo) {
                    // Adicionar dados do usuário à requisição se válido
                    req.user = {
                        id: usuario.id,
                        nome: usuario.nome,
                        email: usuario.email
                    };
                }

                next();

            } catch (tokenError) {
                // Token inválido/expirado, continua sem definir req.user
                next();
            }

        } catch (error) {
            console.error('Erro na verificação opcional de token:', error);
            next(); // Continua mesmo com erro
        }
    }

    // ============================================
    // UTILITÁRIOS PARA TOKENS
    // ============================================
    
    public static gerarToken(payload: JWTPayload): string {
        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn
        } as jwt.SignOptions);
    }

    public static gerarRefreshToken(payload: JWTPayload): string {
        return jwt.sign(payload, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshExpiresIn
        } as jwt.SignOptions);
    }

    public static verificarRefreshToken(token: string): JWTPayload {
        return jwt.verify(token, config.jwt.refreshSecret) as JWTPayload;
    }

    public static decodificarToken(token: string): JWTPayload | null {
        try {
            return jwt.decode(token) as JWTPayload;
        } catch {
            return null;
        }
    }
}

// Export do método para uso nas rotas
export const authenticateToken = AuthMiddleware.verificarToken;
