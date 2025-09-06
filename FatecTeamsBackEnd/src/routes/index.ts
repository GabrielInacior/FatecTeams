import { Router } from 'express';
import usuarioRoutes from './usuarioRoutes';
import authRoutes from './authRoutes';
import { GrupoController } from '../controllers/GrupoController';
import { MensagemController } from '../controllers/MensagemController';
import { TarefaController } from '../controllers/TarefaController';
import { ArquivoController } from '../controllers/ArquivoController';
import { ConviteController } from '../controllers/ConviteController';
import { NotificacaoController } from '../controllers/NotificacaoController';
import { EventoController } from '../controllers/EventoController';
import { HistoricoAtividadeController } from '../controllers/HistoricoAtividadeController';
import { RelatorioController } from '../controllers/RelatorioController';
import { authenticateToken } from '../middlewares/AuthMiddleware';

const router = Router();

// Instanciar controllers
const grupoController = new GrupoController();
const mensagemController = new MensagemController();
const tarefaController = new TarefaController();
const arquivoController = new ArquivoController();
const conviteController = new ConviteController();
const notificacaoController = new NotificacaoController();
const eventoController = new EventoController();
const historicoAtividadeController = new HistoricoAtividadeController();
const relatorioController = new RelatorioController();

// Configurar rotas da API
router.use('/usuarios', usuarioRoutes);
router.use('/auth', authRoutes);

// ============================================
// ROTAS DE GRUPOS
// ============================================

router.post('/grupos', authenticateToken, grupoController.criar);
router.get('/grupos/:id', authenticateToken, grupoController.obter);
router.get('/grupos/:id/detalhes', authenticateToken, grupoController.obterDetalhes);
router.put('/grupos/:id', authenticateToken, grupoController.atualizar);
router.delete('/grupos/:id', authenticateToken, grupoController.deletar);
router.post('/grupos/:id/sair', authenticateToken, grupoController.sairDoGrupo);
router.get('/grupos', authenticateToken, grupoController.listarMeus);
router.get('/grupos/publicos/buscar', authenticateToken, grupoController.listarPublicos);
router.post('/grupos/:id/entrar', authenticateToken, grupoController.entrarGrupoPublico);
router.post('/grupos/:id/membros', authenticateToken, grupoController.adicionarMembro);
router.delete('/grupos/:grupoId/membros/:usuarioId', authenticateToken, grupoController.removerMembro);
router.put('/grupos/:grupoId/membros/:usuarioId/papel', authenticateToken, grupoController.alterarPapel);
router.put('/grupos/:id/membros/:usuarioId/nivel', authenticateToken, grupoController.alterarNivelMembro);
router.get('/grupos/:id/membros', authenticateToken, grupoController.obterMembros);
router.get('/grupos/:id/estatisticas', authenticateToken, grupoController.obterEstatisticas);

// ============================================
// ROTAS DE CONVITES
// ============================================

router.post('/convites', authenticateToken, conviteController.criarConvite);
router.get('/grupos/:grupoId/convites', authenticateToken, conviteController.listarConvitesGrupo);
router.get('/convites/validar/:codigo', authenticateToken, conviteController.validarConvite);
router.post('/convites/aceitar/:codigo', authenticateToken, conviteController.aceitarConvite);
router.post('/convites/recusar/:codigo', authenticateToken, conviteController.recusarConvite);
router.delete('/convites/:codigo', authenticateToken, conviteController.cancelarConvite);

// ============================================
// ROTAS DE MENSAGENS
// ============================================

router.post('/grupos/:grupoId/mensagens', authenticateToken, mensagemController.criar);
router.get('/mensagens/:id', authenticateToken, mensagemController.obter);
router.put('/mensagens/:id', authenticateToken, mensagemController.atualizar);
router.delete('/mensagens/:id', authenticateToken, mensagemController.deletar);
router.get('/grupos/:grupoId/mensagens', authenticateToken, mensagemController.listarPorGrupo);
router.get('/grupos/:grupoId/mensagens/buscar', authenticateToken, mensagemController.buscar);
router.post('/mensagens/:id/reacoes', authenticateToken, mensagemController.adicionarReacao);
router.delete('/mensagens/:id/reacoes/:tipoReacao', authenticateToken, mensagemController.removerReacao);
router.get('/mensagens/:id/reacoes', authenticateToken, mensagemController.listarReacoes);
router.get('/grupos/:grupoId/mensagens/nao-lidas', authenticateToken, mensagemController.obterNaoLidas);
router.put('/mensagens/:id/marcar-lida', authenticateToken, mensagemController.marcarComoLida);
router.put('/grupos/:grupoId/mensagens/marcar-todas-lidas', authenticateToken, mensagemController.marcarTodasComoLidas);
router.get('/grupos/:grupoId/mensagens/estatisticas', authenticateToken, mensagemController.obterEstatisticas);
router.get('/grupos/:grupoId/mensagens/recentes', authenticateToken, mensagemController.obterRecentes);

// ============================================
// ROTAS DE TAREFAS
// ============================================

router.post('/grupos/:grupoId/tarefas', authenticateToken, tarefaController.criar);
router.get('/tarefas/:id', authenticateToken, tarefaController.obter);
router.put('/tarefas/:id', authenticateToken, tarefaController.atualizar);
router.delete('/tarefas/:id', authenticateToken, tarefaController.deletar);
router.get('/grupos/:grupoId/tarefas', authenticateToken, tarefaController.listarPorGrupo);
router.get('/tarefas/:grupoId/minhas', authenticateToken, tarefaController.minhasTarefas);
router.get('/grupos/:grupoId/tarefas/buscar', authenticateToken, tarefaController.buscar);
router.put('/tarefas/:id/concluir', authenticateToken, tarefaController.concluir);
router.put('/tarefas/:id/iniciar', authenticateToken, tarefaController.iniciar);
router.put('/tarefas/:id/cancelar', authenticateToken, tarefaController.cancelar);
router.put('/tarefas/:id/atribuir', authenticateToken, tarefaController.atribuir);
router.post('/tarefas/:id/comentarios', authenticateToken, tarefaController.adicionarComentario);
router.get('/tarefas/:id/comentarios', authenticateToken, tarefaController.listarComentarios);
router.delete('/comentarios/:comentarioId', authenticateToken, tarefaController.deletarComentario);
router.post('/tarefas/:id/horas', authenticateToken, tarefaController.adicionarHoras);
router.get('/grupos/:grupoId/tarefas/estatisticas', authenticateToken, tarefaController.obterEstatisticas);
router.get('/tarefas/:id/historico', authenticateToken, tarefaController.obterHistorico);

// ============================================
// ROTAS DE ARQUIVOS
// ============================================

router.post('/grupos/:grupoId/arquivos/upload', authenticateToken, arquivoController.upload.single('arquivo'), arquivoController.fazer_upload);
router.post('/grupos/:grupoId/arquivos/pasta', authenticateToken, arquivoController.criar_pasta);
router.get('/arquivos/:id', authenticateToken, arquivoController.obter);
router.put('/arquivos/:id', authenticateToken, arquivoController.atualizar);
router.delete('/arquivos/:id', authenticateToken, arquivoController.deletar);
router.get('/arquivos/:id/download', authenticateToken, arquivoController.download);
router.get('/arquivos/:id/visualizar', authenticateToken, arquivoController.visualizar);
router.get('/grupos/:grupoId/arquivos', authenticateToken, arquivoController.listarPorGrupo);
router.get('/grupos/:grupoId/arquivos/pastas', authenticateToken, arquivoController.listarPastas);
router.get('/grupos/:grupoId/arquivos/buscar', authenticateToken, arquivoController.buscar);
router.get('/arquivos/:grupoId/recentes', authenticateToken, arquivoController.recentes);
router.post('/arquivos/:id/versoes', authenticateToken, arquivoController.upload.single('arquivo'), arquivoController.criarVersao);
router.get('/arquivos/:id/versoes', authenticateToken, arquivoController.listarVersoes);
router.post('/arquivos/:id/compartilhar', authenticateToken, arquivoController.compartilhar);
router.delete('/arquivos/:id/compartilhamento', authenticateToken, arquivoController.removerCompartilhamento);
router.get('/arquivos/:id/compartilhamentos', authenticateToken, arquivoController.listarCompartilhamentos);
router.get('/grupos/:grupoId/arquivos/estatisticas', authenticateToken, arquivoController.obterEstatisticas);

// ============================================
// ROTAS DE NOTIFICAÇÕES
// ============================================

router.get('/notificacoes', authenticateToken, notificacaoController.listarNotificacoes.bind(notificacaoController));
router.get('/notificacoes/nao-lidas', authenticateToken, notificacaoController.contarNaoLidas.bind(notificacaoController));
router.post('/notificacoes', authenticateToken, notificacaoController.criarNotificacao.bind(notificacaoController));
router.patch('/notificacoes/:notificacaoId/marcar-lida', authenticateToken, notificacaoController.marcarComoLida.bind(notificacaoController));
router.patch('/notificacoes/marcar-todas-lidas', authenticateToken, notificacaoController.marcarTodasComoLidas.bind(notificacaoController));
router.delete('/notificacoes/:notificacaoId', authenticateToken, notificacaoController.removerNotificacao.bind(notificacaoController));
router.get('/notificacoes/configuracoes', authenticateToken, notificacaoController.obterConfiguracoes.bind(notificacaoController));
router.put('/notificacoes/configuracoes', authenticateToken, notificacaoController.atualizarConfiguracoes.bind(notificacaoController));

// ============================================
// ROTAS DE EVENTOS
// ============================================

router.post('/grupos/:grupoId/eventos', authenticateToken, eventoController.criarEvento);
router.get('/eventos/:id', authenticateToken, eventoController.obterEvento);
router.put('/eventos/:id', authenticateToken, eventoController.atualizarEvento);
router.get('/grupos/:grupoId/eventos', authenticateToken, eventoController.listarEventosGrupo);
router.post('/eventos/:id/participantes', authenticateToken, eventoController.adicionarParticipante);
router.get('/eventos/meus', authenticateToken, eventoController.meusEventos);

// ============================================
// ROTAS DE HISTÓRICO DE ATIVIDADES
// ============================================

router.get('/historico/meu', authenticateToken, historicoAtividadeController.listarMeuHistorico);
router.get('/grupos/:grupoId/historico', authenticateToken, historicoAtividadeController.listarHistoricoGrupo);
router.get('/historico/estatisticas', authenticateToken, historicoAtividadeController.obterEstatisticasUsuario);
router.get('/grupos/:grupoId/historico/estatisticas', authenticateToken, historicoAtividadeController.obterEstatisticasGrupo);
router.get('/grupos/:grupoId/historico/top-usuarios', authenticateToken, historicoAtividadeController.obterTopUsuarios);

// ============================================
// ROTAS DE RELATÓRIOS
// ============================================

router.get('/grupos/:grupoId/relatorios/atividade', authenticateToken, relatorioController.relatorioAtividadeGrupo);
router.get('/usuarios/:usuarioId/relatorios/desempenho', authenticateToken, relatorioController.relatorioDesempenhoUsuario);
router.get('/relatorios/plataforma', authenticateToken, relatorioController.relatorioPlataforma);
router.get('/relatorios/exportar', authenticateToken, relatorioController.exportarRelatorio);

export default router;
