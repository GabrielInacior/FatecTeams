import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { GrupoRepository } from '../repositories/GrupoRepository';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { EventoRepository } from '../repositories/EventoRepository';

export class EventoController {
    private grupoRepository: GrupoRepository;
    private usuarioRepository: UsuarioRepository;
    private eventoRepository: EventoRepository;

    constructor() {
        this.grupoRepository = new GrupoRepository();
        this.usuarioRepository = new UsuarioRepository();
        this.eventoRepository = new EventoRepository();
    }

    async criarEvento(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const {
                grupo_id,
                titulo,
                descricao,
                data_inicio,
                data_fim,
                local,
                link_virtual,
                tipo = 'reuniao'
            } = req.body;
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            if (!grupo_id || !titulo || !data_inicio || !data_fim) {
                res.status(400).json({
                    erro: 'grupo_id, titulo, data_inicio e data_fim são obrigatórios'
                });
                return;
            }

            // Validar se o grupo existe
            const grupo = await this.grupoRepository.buscarPorId(grupo_id);
            if (!grupo) {
                res.status(404).json({ erro: 'Grupo não encontrado' });
                return;
            }

            // Verificar se o usuário tem permissão
            const membro = await this.grupoRepository.verificarPermissao(grupo_id, usuarioId);
            if (!membro) {
                res.status(403).json({ erro: 'Usuário não é membro do grupo' });
                return;
            }

            // Criar evento
            const eventoId = await this.eventoRepository.criar({
                grupo_id,
                criado_por: usuarioId,
                titulo,
                descricao: descricao || null,
                data_inicio: new Date(data_inicio),
                data_fim: new Date(data_fim),
                local: local || null,
                link_virtual: link_virtual || null,
                tipo_evento: tipo || 'reuniao',
                status: 'agendado'
            });

            const evento = await this.eventoRepository.buscarPorId(eventoId);

            res.status(201).json({
                mensagem: 'Evento criado com sucesso',
                evento
            });
        } catch (error) {
            console.error('Erro ao criar evento:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    async listarEventosGrupo(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { grupoId } = req.params;
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            // Verificar se o usuário tem permissão
            const membro = await this.grupoRepository.verificarPermissao(grupoId, usuarioId);
            if (!membro) {
                res.status(403).json({ erro: 'Usuário não é membro do grupo' });
                return;
            }

            const eventos = await this.eventoRepository.listarPorGrupo(grupoId);

            res.status(200).json({ eventos });
        } catch (error) {
            console.error('Erro ao listar eventos:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    async obterEvento(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { eventoId } = req.params;
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            const evento = await this.eventoRepository.buscarPorId(eventoId);
            if (!evento) {
                res.status(404).json({ erro: 'Evento não encontrado' });
                return;
            }

            // Verificar se o usuário tem permissão para ver o evento
            const membro = await this.grupoRepository.verificarPermissao(evento.grupo_id, usuarioId);
            if (!membro) {
                res.status(403).json({ erro: 'Sem permissão para acessar este evento' });
                return;
            }

            // Buscar participantes
            const participantes = await this.eventoRepository.listarParticipantes(eventoId);

            res.status(200).json({
                evento,
                participantes
            });
        } catch (error) {
            console.error('Erro ao obter evento:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    async atualizarEvento(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { eventoId } = req.params;
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            const evento = await this.eventoRepository.buscarPorId(eventoId);
            if (!evento) {
                res.status(404).json({ erro: 'Evento não encontrado' });
                return;
            }

            // Verificar permissão (criador ou admin/moderador do grupo)
            const membro = await this.grupoRepository.verificarPermissao(evento.grupo_id, usuarioId);
            const podeEditar = evento.criado_por === usuarioId ||
                             (membro && (membro.nivel_permissao === 'admin' || membro.nivel_permissao === 'moderador'));

            if (!podeEditar) {
                res.status(403).json({ erro: 'Sem permissão para editar este evento' });
                return;
            }

            await this.eventoRepository.atualizar(eventoId, req.body);
            const eventoAtualizado = await this.eventoRepository.buscarPorId(eventoId);

            res.status(200).json({
                mensagem: 'Evento atualizado com sucesso',
                evento: eventoAtualizado
            });
        } catch (error) {
            console.error('Erro ao atualizar evento:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    async adicionarParticipante(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { eventoId } = req.params;
            const { usuario_id } = req.body;
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            if (!usuario_id) {
                res.status(400).json({ erro: 'usuario_id é obrigatório' });
                return;
            }

            const evento = await this.eventoRepository.buscarPorId(eventoId);
            if (!evento) {
                res.status(404).json({ erro: 'Evento não encontrado' });
                return;
            }

            // Verificar permissão
            const membro = await this.grupoRepository.verificarPermissao(evento.grupo_id, usuarioId);
            const podeAdicionar = evento.criado_por === usuarioId ||
                                 (membro && (membro.nivel_permissao === 'admin' || membro.nivel_permissao === 'moderador'));

            if (!podeAdicionar) {
                res.status(403).json({ erro: 'Sem permissão para adicionar participantes' });
                return;
            }

            await this.eventoRepository.adicionarParticipante({
                evento_id: eventoId,
                usuario_id: usuario_id,
                status: 'pendente'
            });

            res.status(200).json({
                mensagem: 'Participante adicionado com sucesso'
            });
        } catch (error) {
            console.error('Erro ao adicionar participante:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }

    async meusEventos(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.id;

            if (!usuarioId) {
                res.status(401).json({ erro: 'Token inválido' });
                return;
            }

            const eventos = await this.eventoRepository.buscarEventosUsuario(usuarioId);

            res.status(200).json({ eventos });
        } catch (error) {
            console.error('Erro ao buscar meus eventos:', error);
            res.status(500).json({ erro: 'Erro interno do servidor' });
        }
    }
}
