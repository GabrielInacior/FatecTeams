import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();
const usuarioController = new UsuarioController();

// Rotas públicas (sem autenticação)
router.post('/', usuarioController.criarUsuario);
router.post('/login', usuarioController.autenticarUsuario);
router.post('/recuperar-senha', usuarioController.recuperarSenhaUsuario);
router.post('/redefinir-senha', usuarioController.redefinirSenhaUsuario);

// Rotas protegidas (com autenticação)
router.get('/perfil', AuthMiddleware.verificarToken, usuarioController.obterPerfilUsuario);
router.put('/perfil', AuthMiddleware.verificarToken, usuarioController.atualizarPerfilUsuario);
router.post('/foto-perfil', AuthMiddleware.verificarToken, usuarioController.upload.single('foto'), usuarioController.uploadFotoPerfilUsuario);
router.delete('/perfil', AuthMiddleware.verificarToken, usuarioController.desativarUsuario);

export default router;
