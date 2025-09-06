import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { RateLimitMiddleware } from '../middlewares/RateLimitMiddleware';

const router = Router();
const authController = new AuthController();

// ============================================
// ROTAS PÚBLICAS - SEM AUTENTICAÇÃO
// ============================================

// Login tradicional com email e senha
router.post('/login', 
    RateLimitMiddleware.login,
    authController.loginTradicional
);

// Registro tradicional
router.post('/registro', 
    RateLimitMiddleware.register,
    authController.registroTradicional
);

// OAuth Google - Login com token
router.post('/google', authController.loginGoogle);

// OAuth Google - Obter URL de autorização
router.get('/google/url', authController.obterUrlAutorizacaoGoogle);

// OAuth Google - Callback após autorização
router.get('/google/callback', authController.callbackGoogle);

// OAuth Microsoft (placeholder)
router.post('/microsoft', authController.loginMicrosoft);

// Renovar token JWT
router.post('/refresh', 
    RateLimitMiddleware.login, // Reutilizar o mesmo limite do login
    authController.renovarToken
);

// Reativar conta desativada
router.post('/reativar-conta',
    RateLimitMiddleware.login,
    authController.reativarConta
);

// ============================================
// ROTAS PROTEGIDAS - COM AUTENTICAÇÃO
// ============================================

// Validar token atual
router.get('/validar', AuthMiddleware.verificarToken, authController.validarToken);

// Logout
router.post('/logout', AuthMiddleware.verificarToken, authController.logout);

// Informações da sessão
router.get('/sessao', AuthMiddleware.verificarToken, authController.infoSessao);

// Alterar senha (apenas para login tradicional)
router.put('/senha', AuthMiddleware.verificarToken, authController.alterarSenha);

export default router;
