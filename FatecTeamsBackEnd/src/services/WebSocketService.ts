import { Server as SocketIOServer } from 'socket.io';
import { Logger } from '../utils/Logger';

/**
 * Serviço para gerenciar emissões WebSocket
 * Centraliza todas as operações de tempo real do sistema
 */
export class WebSocketService {
    private static instance: WebSocketService;
    private io: SocketIOServer | null = null;

    private constructor() {}

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    /**
     * Configura a instância do Socket.IO
     */
    public setIO(io: SocketIOServer): void {
        this.io = io;
        Logger.websocket('WebSocketService inicializado');
    }

    /**
     * Verifica se o Socket.IO está configurado
     */
    private ensureIO(): SocketIOServer {
        if (!this.io) {
            throw new Error('Socket.IO não foi configurado. Chame setIO() primeiro.');
        }
        return this.io;
    }

    // ============================================
    // EVENTOS DE MENSAGENS
    // ============================================

    /**
     * Emite nova mensagem para todos os membros do grupo
     */
    public emitirNovaMensagem(grupoId: string, mensagem: any): void {
        try {
            const io = this.ensureIO();
            io.to(`grupo-${grupoId}`).emit('new-message', {
                id: mensagem.id,
                conteudo: mensagem.conteudo,
                tipo_mensagem: mensagem.tipo_mensagem,
                remetente: {
                    id: mensagem.remetente_id,
                    nome: mensagem.remetente_nome || 'Usuário'
                },
                grupo_id: grupoId,
                data_criacao: mensagem.data_criacao,
                arquivo_id: mensagem.arquivo_id,
                mensagem_pai_id: mensagem.mensagem_pai_id,
                mencionados: mensagem.mencionados
            });

            Logger.websocket(`Nova mensagem emitida para grupo ${grupoId}`, { mensagemId: mensagem.id });
        } catch (error) {
            Logger.error('Erro ao emitir nova mensagem', error);
        }
    }

    /**
     * Emite mensagem editada para o grupo
     */
    public emitirMensagemEditada(grupoId: string, mensagem: any): void {
        try {
            const io = this.ensureIO();
            io.to(`grupo-${grupoId}`).emit('message-edited', {
                id: mensagem.id,
                conteudo: mensagem.conteudo,
                data_atualizacao: mensagem.data_atualizacao
            });

            Logger.websocket(`Mensagem editada emitida para grupo ${grupoId}`, { mensagemId: mensagem.id });
        } catch (error) {
            Logger.error('Erro ao emitir mensagem editada', error);
        }
    }

    /**
     * Emite mensagem deletada para o grupo
     */
    public emitirMensagemDeletada(grupoId: string, mensagemId: string): void {
        try {
            const io = this.ensureIO();
            io.to(`grupo-${grupoId}`).emit('message-deleted', {
                mensagemId,
                grupoId
            });

            Logger.websocket(`Mensagem deletada emitida para grupo ${grupoId}`, { mensagemId });
        } catch (error) {
            Logger.error('Erro ao emitir mensagem deletada', error);
        }
    }

    // ============================================
    // EVENTOS DE NOTIFICAÇÕES
    // ============================================

    /**
     * Emite notificação para um usuário específico
     */
    public emitirNotificacao(usuarioId: string, notificacao: any): void {
        try {
            const io = this.ensureIO();
            io.to(`user-${usuarioId}`).emit('nova-notificacao', {
                id: notificacao.id,
                titulo: notificacao.titulo,
                mensagem: notificacao.mensagem,
                tipo: notificacao.tipo,
                importante: notificacao.importante,
                data_criacao: notificacao.data_criacao,
                referencia_id: notificacao.referencia_id
            });

            Logger.websocket(`Notificação emitida para usuário ${usuarioId}`, { notificacaoId: notificacao.id });
        } catch (error) {
            Logger.error('Erro ao emitir notificação', error);
        }
    }

    /**
     * Emite atualização de contador de notificações não lidas
     */
    public emitirContadorNotificacoes(usuarioId: string, contador: number): void {
        try {
            const io = this.ensureIO();
            io.to(`user-${usuarioId}`).emit('contador-notificacoes', {
                contador,
                timestamp: new Date().toISOString()
            });

            Logger.websocket(`Contador de notificações atualizado para usuário ${usuarioId}`, { contador });
        } catch (error) {
            Logger.error('Erro ao emitir contador de notificações', error);
        }
    }

    // ============================================
    // EVENTOS DE TAREFAS
    // ============================================

    /**
     * Emite atualização de tarefa para membros do grupo
     */
    public emitirTarefaAtualizada(grupoId: string, tarefa: any): void {
        try {
            const io = this.ensureIO();
            io.to(`grupo-${grupoId}`).emit('tarefa-atualizada', {
                id: tarefa.id,
                titulo: tarefa.titulo,
                status: tarefa.status,
                prioridade: tarefa.prioridade,
                assignado_para: tarefa.assignado_para,
                data_vencimento: tarefa.data_vencimento,
                data_atualizacao: tarefa.data_atualizacao
            });

            Logger.websocket(`Tarefa atualizada emitida para grupo ${grupoId}`, { tarefaId: tarefa.id });
        } catch (error) {
            Logger.error('Erro ao emitir tarefa atualizada', error);
        }
    }

    /**
     * Emite nova tarefa para membros do grupo
     */
    public emitirNovaTarefa(grupoId: string, tarefa: any): void {
        try {
            const io = this.ensureIO();
            io.to(`grupo-${grupoId}`).emit('nova-tarefa', {
                id: tarefa.id,
                titulo: tarefa.titulo,
                descricao: tarefa.descricao,
                status: tarefa.status,
                prioridade: tarefa.prioridade,
                assignado_para: tarefa.assignado_para,
                data_vencimento: tarefa.data_vencimento,
                data_criacao: tarefa.data_criacao
            });

            Logger.websocket(`Nova tarefa emitida para grupo ${grupoId}`, { tarefaId: tarefa.id });
        } catch (error) {
            Logger.error('Erro ao emitir nova tarefa', error);
        }
    }

    // ============================================
    // EVENTOS DE GRUPOS
    // ============================================

    /**
     * Emite quando um novo membro é adicionado ao grupo
     */
    public emitirMembroAdicionado(grupoId: string, membro: any): void {
        try {
            const io = this.ensureIO();
            io.to(`grupo-${grupoId}`).emit('membro-adicionado', {
                usuario_id: membro.usuario_id,
                nome: membro.nome,
                email: membro.email,
                papel: membro.papel,
                data_entrada: membro.data_entrada
            });

            Logger.websocket(`Membro adicionado emitido para grupo ${grupoId}`, { usuarioId: membro.usuario_id });
        } catch (error) {
            Logger.error('Erro ao emitir membro adicionado', error);
        }
    }

    /**
     * Emite quando um membro sai do grupo
     */
    public emitirMembroRemovido(grupoId: string, usuarioId: string): void {
        try {
            const io = this.ensureIO();
            io.to(`grupo-${grupoId}`).emit('membro-removido', {
                usuario_id: usuarioId,
                timestamp: new Date().toISOString()
            });

            Logger.websocket(`Membro removido emitido para grupo ${grupoId}`, { usuarioId });
        } catch (error) {
            Logger.error('Erro ao emitir membro removido', error);
        }
    }

    // ============================================
    // EVENTOS DE STATUS DE USUÁRIO
    // ============================================

    /**
     * Emite status online/offline para os grupos do usuário
     */
    public emitirStatusUsuario(usuarioId: string, status: 'online' | 'offline', gruposIds: string[]): void {
        try {
            const io = this.ensureIO();
            
            gruposIds.forEach(grupoId => {
                io.to(`grupo-${grupoId}`).emit('user-status-changed', {
                    usuarioId,
                    status,
                    timestamp: new Date().toISOString()
                });
            });

            Logger.websocket(`Status ${status} emitido para usuário ${usuarioId} em ${gruposIds.length} grupos`);
        } catch (error) {
            Logger.error('Erro ao emitir status de usuário', error);
        }
    }

    // ============================================
    // EVENTOS DE SISTEMA
    // ============================================

    /**
     * Emite evento de manutenção para todos os usuários conectados
     */
    public emitirManutencaoSistema(mensagem: string, tipo: 'info' | 'warning' | 'error' = 'info'): void {
        try {
            const io = this.ensureIO();
            io.emit('sistema-manutencao', {
                mensagem,
                tipo,
                timestamp: new Date().toISOString()
            });

            Logger.websocket('Evento de manutenção emitido para todos os usuários', { tipo, mensagem });
        } catch (error) {
            Logger.error('Erro ao emitir evento de manutenção', error);
        }
    }

    // ============================================
    // UTILITÁRIOS
    // ============================================

    /**
     * Adiciona usuário à sua sala pessoal
     */
    public adicionarUsuarioASala(socketId: string, usuarioId: string): void {
        try {
            const io = this.ensureIO();
            const socket = io.sockets.sockets.get(socketId);
            
            if (socket) {
                socket.join(`user-${usuarioId}`);
                Logger.websocket(`Usuário ${usuarioId} adicionado à sala pessoal`);
            }
        } catch (error) {
            Logger.error('Erro ao adicionar usuário à sala', error);
        }
    }

    /**
     * Remove usuário de sua sala pessoal
     */
    public removerUsuarioDaSala(socketId: string, usuarioId: string): void {
        try {
            const io = this.ensureIO();
            const socket = io.sockets.sockets.get(socketId);
            
            if (socket) {
                socket.leave(`user-${usuarioId}`);
                Logger.websocket(`Usuário ${usuarioId} removido da sala pessoal`);
            }
        } catch (error) {
            Logger.error('Erro ao remover usuário da sala', error);
        }
    }

    /**
     * Obtém lista de usuários conectados em um grupo
     */
    public async obterUsuariosConectados(grupoId: string): Promise<string[]> {
        try {
            const io = this.ensureIO();
            const sala = io.sockets.adapter.rooms.get(`grupo-${grupoId}`);
            
            if (!sala) return [];
            
            return Array.from(sala);
        } catch (error) {
            Logger.error('Erro ao obter usuários conectados', error);
            return [];
        }
    }
}
