import { Socket as SocketIOSocket } from 'socket.io';

// Estender o tipo Socket para incluir propriedades customizadas
declare module 'socket.io' {
  interface Socket {
    userId?: string;
    userGroups?: string[];
    userName?: string;
  }
}

export interface AuthenticatedSocket extends SocketIOSocket {
  userId: string;
  userGroups: string[];
  userName: string;
}

export interface SocketUserData {
  usuarioId: string;
  nome: string;
  grupos: string[];
}

export interface WebSocketEventData {
  // Eventos de mensagem
  'new-message': {
    id: string;
    conteudo: string;
    tipo_mensagem: string;
    remetente: {
      id: string;
      nome: string;
    };
    grupo_id: string;
    data_criacao: Date;
    arquivo_id?: string;
    mensagem_pai_id?: string;
    mencionados?: string[];
  };
  
  'message-edited': {
    id: string;
    conteudo: string;
    data_atualizacao: Date;
  };
  
  'message-deleted': {
    mensagemId: string;
    grupoId: string;
  };
  
  // Eventos de usuário
  'user-typing': {
    usuarioId: string;
    nomeUsuario: string;
    grupoId: string;
    typing: boolean;
  };
  
  'user-joined-group': {
    usuarioId: string;
    grupoId: string;
  };
  
  'user-left-group': {
    usuarioId: string;
    grupoId: string;
  };
  
  'user-status-changed': {
    usuarioId: string;
    status: 'online' | 'offline';
    timestamp: string;
  };
  
  // Eventos de notificação
  'nova-notificacao': {
    id: string;
    titulo: string;
    mensagem: string;
    tipo: string;
    importante: boolean;
    data_criacao: Date;
    referencia_id?: string;
  };
  
  'contador-notificacoes': {
    contador: number;
    timestamp: string;
  };
  
  // Eventos de tarefa
  'nova-tarefa': {
    id: string;
    titulo: string;
    descricao?: string;
    status: string;
    prioridade: string;
    assignado_para?: string;
    data_vencimento?: Date;
    data_criacao: Date;
  };
  
  'tarefa-atualizada': {
    id: string;
    titulo: string;
    status: string;
    prioridade: string;
    assignado_para?: string;
    data_vencimento?: Date;
    data_atualizacao: Date;
  };
  
  // Eventos de grupo
  'membro-adicionado': {
    usuario_id: string;
    nome: string;
    email: string;
    papel: string;
    data_entrada: Date;
  };
  
  'membro-removido': {
    usuario_id: string;
    timestamp: string;
  };
  
  // Eventos do sistema
  'sistema-manutencao': {
    mensagem: string;
    tipo: 'info' | 'warning' | 'error';
    timestamp: string;
  };
}
