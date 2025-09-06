import { Router } from 'express';
import authRoutes from './authRoutes';

const router = Router();

// Configurar apenas as rotas de autenticação para teste
router.use('/auth', authRoutes);

// ============================================
// ROTA DE TESTE
// ============================================

router.get('/health', (req, res) => {
    res.json({
        sucesso: true,
        mensagem: 'API funcionando',
        timestamp: new Date().toISOString()
    });
});

export default router;
