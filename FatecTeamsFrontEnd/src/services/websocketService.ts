import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMensagemWebSocket, removeMensagemWebSocket, updateMensagemWebSocket } from '../store/chatSlice';

// ============================================
// INTERFACES
// ============================================

interface SocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onNewMessage?: (data: any) => void;
  onMessageEdited?: (data: any) => void;
  onMessageDeleted?: (data: any) => void;
  onUserTyping?: (data: any) => void;
  onUserStatusChanged?: (data: any) => void;
}

interface UserTypingData {
  grupoId: string;
  typing: boolean;
  nomeUsuario: string;
}

// ============================================
// WEBSOCKET SERVICE
// ============================================

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private typingTimeout: NodeJS.Timeout | null = null;
  private isTyping = false;
  private currentGrupoId: string | null = null;

  // ============================================
  // CONEXÃO E CONFIGURAÇÃO
  // ============================================

  /**
   * Conectar ao servidor WebSocket
   */
  connect(token: string, handlers?: SocketEventHandlers): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Obter URL do WebSocket do ambiente
        const socketUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';
        
        this.socket = io(socketUrl, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        });

        // Configurar event listeners
        this.setupEventListeners(handlers);
        
        // Aguardar conexão
        this.socket.on('connect', () => {
          console.log('✅ WebSocket conectado:', this.socket?.id);
          this.reconnectAttempts = 0;
          handlers?.onConnect?.();
          resolve();
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('❌ Erro de conexão WebSocket:', error);
          handlers?.onError?.(error);
          reject(error);
        });

      } catch (error) {
        console.error('❌ Erro ao inicializar WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Desconectar do WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Desconectando WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.currentGrupoId = null;
    }
  }

  /**
   * Verificar se está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  private setupEventListeners(handlers?: SocketEventHandlers): void {
    if (!this.socket) return;

    // Eventos de conexão
    this.socket.on('disconnect', (reason: any) => {
      console.log('🔌 WebSocket desconectado:', reason);
      handlers?.onDisconnect?.();
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ Erro WebSocket:', error);
      handlers?.onError?.(error);
    });

    // Eventos de mensagens
    this.socket.on('new-message', (data: any) => {
      console.log('📨 Nova mensagem recebida:', data);
      store.dispatch(addMensagemWebSocket({
        grupoId: data.grupo_id,
        mensagem: {
          id: data.id,
          conteudo: data.conteudo,
          tipo_mensagem: data.tipo_mensagem,
          autor_id: data.remetente.id,
          grupo_id: data.grupo_id,
          data_criacao: data.data_criacao,
          data_envio: data.data_envio,
          arquivo_id: data.arquivo_id,
          mensagem_pai_id: data.mensagem_pai_id,
          mencionados: data.mencionados,
          editado: data.editado || false,
          autor: {
            id: data.remetente.id,
            nome: data.remetente.nome,
            email: '',
            foto_perfil: undefined
          }
        }
      }));
      handlers?.onNewMessage?.(data);
    });

    this.socket.on('message-edited', (data: any) => {
      console.log('✏️ Mensagem editada:', data);
      store.dispatch(updateMensagemWebSocket({
        mensagemId: data.id,
        conteudo: data.conteudo,
        data_atualizacao: data.data_atualizacao
      }));
      handlers?.onMessageEdited?.(data);
    });

    this.socket.on('message-deleted', (data: any) => {
      console.log('🗑️ Mensagem deletada:', data);
      store.dispatch(removeMensagemWebSocket({
        grupoId: data.grupoId,
        mensagemId: data.mensagemId
      }));
      handlers?.onMessageDeleted?.(data);
    });

    // Eventos de usuário
    this.socket.on('user-typing', (data: any) => {
      console.log('⌨️ Usuário digitando:', data);
      handlers?.onUserTyping?.(data);
    });

    this.socket.on('user-status-changed', (data: any) => {
      console.log('👤 Status do usuário alterado:', data);
      handlers?.onUserStatusChanged?.(data);
    });

    // Eventos de notificação
    this.socket.on('nova-notificacao', (data: any) => {
      console.log('🔔 Nova notificação:', data);
      // TODO: Integrar com slice de notificações
    });
  }

  // ============================================
  // OPERAÇÕES DE GRUPO
  // ============================================

  /**
   * Entrar em uma sala de grupo
   */
  joinGroup(grupoId: string): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket não conectado, não é possível entrar no grupo');
      return;
    }

    console.log(`🏠 Entrando no grupo: ${grupoId}`);
    this.currentGrupoId = grupoId;
    this.socket.emit('join-group', grupoId);
  }

  /**
   * Sair de uma sala de grupo
   */
  leaveGroup(grupoId: string): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket não conectado, não é possível sair do grupo');
      return;
    }

    console.log(`🚪 Saindo do grupo: ${grupoId}`);
    this.socket.emit('leave-group', grupoId);
    
    if (this.currentGrupoId === grupoId) {
      this.currentGrupoId = null;
    }
  }

  /**
   * Identificar usuário no socket
   */
  identifyUser(usuarioId: string): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket não conectado, não é possível identificar usuário');
      return;
    }

    console.log(`👤 Identificando usuário: ${usuarioId}`);
    this.socket.emit('identify-user', { usuarioId });
  }

  // ============================================
  // INDICADORES DE DIGITAÇÃO
  // ============================================

  /**
   * Indicar que o usuário está digitando
   */
  startTyping(grupoId: string, nomeUsuario: string): void {
    if (!this.socket?.connected || this.isTyping) return;

    this.isTyping = true;
    this.socket.emit('user-typing', {
      grupoId,
      typing: true,
      nomeUsuario
    });

    // Auto-parar após 3 segundos
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.typingTimeout = setTimeout(() => {
      this.stopTyping(grupoId, nomeUsuario);
    }, 3000);
  }

  /**
   * Parar indicador de digitação
   */
  stopTyping(grupoId: string, nomeUsuario: string): void {
    if (!this.socket?.connected || !this.isTyping) return;

    this.isTyping = false;
    this.socket.emit('user-typing', {
      grupoId,
      typing: false,
      nomeUsuario
    });

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  // ============================================
  // MARCAÇÃO DE LEITURA
  // ============================================

  /**
   * Marcar mensagem como lida
   */
  markMessageAsRead(grupoId: string, mensagemId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('mark-message-read', {
      grupoId,
      mensagemId
    });
  }

  /**
   * Solicitar usuários online do grupo
   */
  requestOnlineUsers(grupoId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('request-online-users', grupoId);
  }

  // ============================================
  // UTILITÁRIOS
  // ============================================

  /**
   * Obter ID do socket atual
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Obter grupo ativo atual
   */
  getCurrentGroup(): string | null {
    return this.currentGrupoId;
  }

  /**
   * Reemitir evento personalizado
   */
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.warn(`⚠️ Socket não conectado, não é possível emitir evento: ${event}`);
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Escutar evento personalizado
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      console.warn(`⚠️ Socket não inicializado, não é possível escutar evento: ${event}`);
      return;
    }

    this.socket.on(event, callback);
  }

  /**
   * Parar de escutar evento
   */
  off(event: string, callback?: (data: any) => void): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }
}

// Instância singleton
export default new WebSocketService();
