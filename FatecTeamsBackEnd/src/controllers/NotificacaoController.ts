import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { NotificacaoRepository } from '../repositories/NotificacaoRepository';

export class NotificacaoController {
    private usuarioRepository: UsuarioRepository;
    private notificacaoRepository: NotificacaoRepository;

    constructor() {
        this.usuarioRepository = new UsuarioRepository();
        this.notificacaoRepository = new NotificacaoRepository();
    }

    async listarNotificacoes(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            const notificacoes = await this.notificacaoRepository.listarPorUsuario(usuarioId);

            res.status(200).json({ notificacoes });
        } catch (error) {
            console.error('Erro ao listar notificações:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    async contarNaoLidas(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            const estatisticas = await this.notificacaoRepository.obterEstatisticas(usuarioId);

            res.status(200).json({ count: estatisticas.nao_lidas || 0 });
        } catch (error) {
            console.error('Erro ao contar notificações:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    async marcarComoLida(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { notificacaoId } = req.params;
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            const sucesso = await this.notificacaoRepository.marcarComoLida(notificacaoId, usuarioId);

            if (!sucesso) {
                res.status(404).json({ erro: 'Notificação não encontrada' });
                return;
            }

            res.status(200).json({ mensagem: 'Notificação marcada como lida' });
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    async marcarTodasComoLidas(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            const count = await this.notificacaoRepository.marcarTodasComoLidas(usuarioId);

            res.status(200).json({ 
                mensagem: 'Todas as notificações foram marcadas como lidas',
                count
            });
        } catch (error) {
            console.error('Erro ao marcar todas como lidas:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    async criarNotificacao(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const {
                usuario_id,
                titulo,
                mensagem,
                tipo,
                importante = false
            } = req.body;

            if (!usuario_id || !titulo || !mensagem || !tipo) {
                res.status(400).json({
                    erro: 'usuario_id, titulo, mensagem e tipo são obrigatórios'
                });
                return;
            }

            const notificacaoId = await this.notificacaoRepository.criar({
                usuario_id,
                titulo,
                mensagem,
                tipo,
                importante
            });

            res.status(201).json({
                mensagem: 'Notificação criada com sucesso',
                id: notificacaoId
            });
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    async removerNotificacao(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { notificacaoId } = req.params;
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            const sucesso = await this.notificacaoRepository.deletar(notificacaoId, usuarioId);

            if (!sucesso) {
                res.status(404).json({ erro: 'Notificação não encontrada' });
                return;
            }

            res.status(200).json({ mensagem: 'Notificação removida com sucesso' });
        } catch (error) {
            console.error('Erro ao remover notificação:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    async obterConfiguracoes(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            const configuracoes = await this.notificacaoRepository.obterConfiguracoes(usuarioId);

            res.status(200).json({ configuracoes });
        } catch (error) {
            console.error('Erro ao obter configurações:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    async atualizarConfiguracoes(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            await this.notificacaoRepository.atualizarConfiguracoes(usuarioId, req.body);

            res.status(200).json({ mensagem: 'Configurações atualizadas com sucesso' });
        } catch (error) {
            console.error('Erro ao atualizar configurações:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }
}
