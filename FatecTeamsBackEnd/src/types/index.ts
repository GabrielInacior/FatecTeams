// ============================================
// TIPOS PRINCIPAIS DO SISTEMA
// ============================================

export interface IUsuario {
    id: string;
    nome: string;
    email: string;
    senha_hash?: string;
    foto_perfil?: string;
    telefone?: string;
    status_ativo: boolean;
    data_criacao: Date;
    data_atualizacao: Date;
}

export interface IGrupo {
    id: string;
    nome: string;
    descricao?: string;
    foto_capa?: string;
    codigo_acesso: string;
    tipo_grupo: TipoGrupo;
    criador_id: string;
    data_criacao: Date;
    data_atualizacao: Date;
}

export interface IMembroGrupo {
    id: string;
    grupo_id: string;
    usuario_id: string;
    nivel_permissao: NivelPermissao;
    data_entrada: Date;
    ativo: boolean;
}

export interface IMensagem {
    id: string;
    grupo_id: string;
    remetente_id: string;
    conteudo?: string;
    tipo_mensagem: TipoMensagem;
    arquivo_id?: string;
    mensagem_pai_id?: string;
    data_envio: Date;
    data_edicao?: Date;
}

export interface IArquivo {
    id: string;
    nome_original: string;
    nome_arquivo: string;
    url_s3: string;
    tamanho_bytes: number;
    tipo_mime: string;
    enviado_por: string;
    grupo_id?: string;
    data_upload: Date;
}

export interface ITarefa {
    id: string;
    grupo_id: string;
    criador_id: string;
    titulo: string;
    descricao?: string;
    data_vencimento?: Date;
    status: StatusTarefa;
    prioridade: PrioridadeTarefa;
    data_criacao: Date;
}

export interface IEventoCalendario {
    id: string;
    grupo_id: string;
    criador_id: string;
    titulo: string;
    descricao?: string;
    data_inicio: Date;
    data_fim: Date;
    local?: string;
    tipo_evento: TipoEvento;
    data_criacao: Date;
}

export interface IConviteGrupo {
    id: string;
    grupo_id: string;
    convidado_por: string;
    email_convidado: string;
    usuario_convidado_id?: string;
    codigo_convite: string;
    status: StatusConvite;
    data_criacao: Date;
    data_expiracao: Date;
}

export interface INotificacao {
    id: string;
    usuario_id: string;
    titulo: string;
    mensagem: string;
    tipo: TipoNotificacao;
    referencia_id?: string;
    lida: boolean;
    data_criacao: Date;
}

// ============================================
// ENUMS
// ============================================

export enum TipoGrupo {
    PUBLICO = 'publico',
    PRIVADO = 'privado',
    SECRETO = 'secreto'
}

export enum NivelPermissao {
    ADMIN = 'admin',
    MODERADOR = 'moderador',
    MEMBRO = 'membro',
    VISITANTE = 'visitante'
}

export enum TipoMensagem {
    TEXTO = 'texto',
    ARQUIVO = 'arquivo',
    IMAGEM = 'imagem',
    SISTEMA = 'sistema'
}

export enum StatusTarefa {
    PENDENTE = 'pendente',
    EM_ANDAMENTO = 'em_andamento',
    CONCLUIDA = 'concluida',
    CANCELADA = 'cancelada'
}

export enum PrioridadeTarefa {
    BAIXA = 'baixa',
    MEDIA = 'media',
    ALTA = 'alta'
}

export enum TipoEvento {
    REUNIAO = 'reuniao',
    ESTUDO = 'estudo',
    PROVA = 'prova',
    APRESENTACAO = 'apresentacao',
    OUTRO = 'outro'
}

export enum StatusConvite {
    PENDENTE = 'pendente',
    ACEITO = 'aceito',
    RECUSADO = 'recusado',
    EXPIRADO = 'expirado'
}

export enum TipoNotificacao {
    MENSAGEM = 'mensagem',
    CONVITE = 'convite',
    TAREFA = 'tarefa',
    EVENTO = 'evento',
    SISTEMA = 'sistema'
}

export enum ProvedorOAuth {
    GOOGLE = 'google',
    MICROSOFT = 'microsoft'
}

// ============================================
// TIPOS DE REQUEST/RESPONSE
// ============================================

export interface ApiResponse<T = any> {
    sucesso: boolean;
    mensagem: string;
    dados?: T;
    erro?: string;
    timestamp: string;
}

export interface PaginationRequest {
    pagina?: number;
    limite?: number;
    ordenacao?: string;
    direcao?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
    dados: T[];
    pagina_atual: number;
    total_paginas: number;
    total_itens: number;
    itens_por_pagina: number;
}

// Requests específicos
export interface CriarUsuarioRequest {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
}

export interface LoginRequest {
    email: string;
    senha: string;
}

export interface CriarGrupoRequest {
    nome: string;
    descricao?: string;
    tipo_grupo: TipoGrupo;
    codigo_acesso?: string;
}

export interface EnviarMensagemRequest {
    conteudo?: string;
    tipo_mensagem: TipoMensagem;
    arquivo_id?: string;
    mensagem_pai_id?: string;
}

export interface CriarTarefaRequest {
    titulo: string;
    descricao?: string;
    data_vencimento?: string;
    prioridade: PrioridadeTarefa;
    usuarios_atribuidos?: string[];
}

export interface CriarEventoRequest {
    titulo: string;
    descricao?: string;
    data_inicio: string;
    data_fim: string;
    local?: string;
    tipo_evento: TipoEvento;
}

import { Request } from 'express';

// ============================================
// TIPOS DE MIDDLEWARE
// ============================================

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        nome: string;
        email: string;
        nivel_permissao?: NivelPermissao;
    };
}

export interface JWTPayload {
    id: string;
    email: string;
    nome: string;
    iat?: number;
    exp?: number;
}

// ============================================
// TIPOS DE WEBSOCKET
// ============================================

export interface SocketUser {
    id: string;
    nome: string;
    email: string;
    grupos: string[];
}

export interface SocketMensagem {
    grupo_id: string;
    remetente_id: string;
    conteudo: string;
    tipo_mensagem: TipoMensagem;
    arquivo_id?: string;
    mensagem_pai_id?: string;
}

// ============================================
// TIPOS DE UPLOAD
// ============================================

export interface UploadResult {
    id: string;
    nome_original: string;
    nome_arquivo: string;
    url: string;
    tamanho_bytes: number;
    tipo_mime: string;
}

// ============================================
// TIPOS DE EMAIL
// ============================================

export interface EmailTemplate {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export interface ConviteEmailData {
    nome_convidado: string;
    nome_grupo: string;
    nome_remetente: string;
    codigo_convite: string;
    url_convite: string;
}
