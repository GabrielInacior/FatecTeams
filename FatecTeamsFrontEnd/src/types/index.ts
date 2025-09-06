// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  foto_perfil?: string;
  data_criacao: string;
  ultimo_acesso: string;
  status_ativo: boolean;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
}

export interface AuthResponse {
  sucesso: boolean;
  mensagem: string;
  dados?: {
    usuario: User;
    accessToken: string;
    refreshToken: string;
  };
  timestamp: string;
}

// ============================================
// GROUP TYPES
// ============================================

export interface Group {
  id: string;
  nome: string;
  descricao?: string;
  tipo_grupo: 'publico' | 'privado';
  criador_id: string;
  data_criacao: string;
  configuracoes?: Record<string, any>;
}

export interface GroupMember {
  id: string;
  usuario_id: string;
  grupo_id: string;
  papel: 'membro' | 'admin' | 'moderador';
  data_ingresso: string;
  usuario?: User;
}

// ============================================
// MESSAGE TYPES
// ============================================

export interface Message {
  id: string;
  conteudo: string;
  tipo_mensagem: 'texto' | 'arquivo' | 'imagem';
  autor_id: string;
  grupo_id: string;
  data_criacao: string;
  data_atualizacao?: string;
  arquivo_id?: string;
  mensagem_pai_id?: string;
  mencionados?: string[];
  autor?: User;
}

// ============================================
// TASK TYPES
// ============================================

export interface Task {
  id: string;
  titulo: string;
  descricao?: string;
  status: 'pendente' | 'em_progresso' | 'concluida' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  data_criacao: string;
  data_vencimento?: string;
  criador_id: string;
  grupo_id: string;
  assignado_para?: string[];
  etiquetas?: string[];
  estimativa_horas?: number;
  anexos?: string[];
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'sucesso' | 'aviso' | 'erro';
  usuario_id: string;
  lida: boolean;
  importante?: boolean;
  data_criacao: string;
}

// ============================================
// FILE TYPES
// ============================================

export interface File {
  id: string;
  nome: string;
  nome_original: string;
  tipo_mime: string;
  tamanho: number;
  caminho: string;
  grupo_id: string;
  uploader_id: string;
  pasta_id?: string;
  descricao?: string;
  publico?: boolean;
  etiquetas?: string[];
  data_upload: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  sucesso: boolean;
  mensagem: string;
  dados?: T;
  erros?: string[];
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  sucesso: boolean;
  dados: T[];
  paginacao: {
    total: number;
    pagina_atual: number;
    total_paginas: number;
    limite: number;
  };
  timestamp: string;
}

// ============================================
// NAVIGATION TYPES
// ============================================

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Groups: undefined;
  GroupDetail: { groupId: string };
  Chat: { groupId: string; groupName: string };
  Tasks: { groupId: string };
  TaskDetail: { taskId: string };
  Profile: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Groups: undefined;
  Tasks: undefined;
  Notifications: undefined;
  Profile: undefined;
};

// ============================================
// THEME TYPES
// ============================================

export type ThemeMode = 'light' | 'dark';

// ============================================
// REDUX STORE TYPES
// ============================================

export interface RootState {
  auth: AuthState;
  groups: GroupState;
  messages: MessageState;
  tasks: TaskState;
  notifications: NotificationState;
  theme: ThemeState;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  members: GroupMember[];
  isLoading: boolean;
  error: string | null;
}

export interface MessageState {
  messages: Record<string, Message[]>; // Key is groupId
  isLoading: boolean;
  error: string | null;
}

export interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

export interface ThemeState {
  mode: ThemeMode;
  colors: Record<string, string>;
}
