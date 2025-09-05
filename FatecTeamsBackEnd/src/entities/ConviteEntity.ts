import { ConviteRepository, IConvite } from '../repositories/ConviteRepository';
import { GrupoRepository } from '../repositories/GrupoRepository';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { v4 as uuidv4 } from 'uuid';

export interface IConviteCreate {
    grupo_id: string;
    email_convidado: string;
    convidado_por: string;
    mensagem_personalizada?: string;
    data_expiracao?: Date;
}

export interface IConviteUpdate {
    status?: 'pendente' | 'aceito' | 'recusado' | 'expirado';
    mensagem_personalizada?: string;
    data_expiracao?: Date;
}

export class ConviteEntity {
    private conviteRepository: ConviteRepository;
    private grupoRepository: GrupoRepository;
    private usuarioRepository: UsuarioRepository;
    private dados: IConvite;

    constructor(dados?: IConvite) {
        this.conviteRepository = new ConviteRepository();
        this.grupoRepository = new GrupoRepository();
        this.usuarioRepository = new UsuarioRepository();
        this.dados = dados || {} as IConvite;
    }

    // ============================================
    // REGRAS DE NEGÓCIO PRÉ-VALIDAÇÃO
    // ============================================

    private async preRules(dadosConvite: IConviteCreate): Promise<{ valido: boolean; erros: string[] }> {
        const erros: string[] = [];

        try {
            // Validar se grupo existe
            const grupo = await this.grupoRepository.buscarPorId(dadosConvite.grupo_id);
            if (!grupo) {
                erros.push('Grupo não encontrado');
                return { valido: false, erros };
            }

            // Validar se usuário que está convidando é membro do grupo
            const membro = await this.grupoRepository.verificarPermissao(dadosConvite.grupo_id, dadosConvite.convidado_por);
            if (!membro) {
                erros.push('Apenas membros do grupo podem enviar convites');
                return { valido: false, erros };
            }

            // Validar se usuário que está convidando tem permissão para convidar
            if (!membro.pode_convidar) {
                erros.push('Você não tem permissão para enviar convites');
                return { valido: false, erros };
            }

            // Validar se email não é do próprio usuário
            const usuarioConvidador = await this.usuarioRepository.buscarPorId(dadosConvite.convidado_por);
            if (usuarioConvidador && usuarioConvidador.email.toLowerCase() === dadosConvite.email_convidado.toLowerCase()) {
                erros.push('Você não pode convidar a si mesmo');
                return { valido: false, erros };
            }

            // Validar se email já é membro do grupo
            const usuarioConvidado = await this.usuarioRepository.buscarPorEmail(dadosConvite.email_convidado);
            if (usuarioConvidado) {
                const jaEhMembro = await this.grupoRepository.verificarPermissao(dadosConvite.grupo_id, usuarioConvidado.id!);
                if (jaEhMembro) {
                    erros.push('Este usuário já é membro do grupo');
                    return { valido: false, erros };
                }
            }

            // Validar se já existe convite pendente para este email neste grupo
            const conviteExistente = await this.conviteRepository.verificarConviteExistente(dadosConvite.grupo_id, dadosConvite.email_convidado);
            if (conviteExistente && conviteExistente.status === 'pendente') {
                erros.push('Já existe um convite pendente para este email neste grupo');
                return { valido: false, erros };
            }

        } catch (error) {
            console.error('Erro nas pré-regras do convite:', error);
            erros.push('Erro interno do servidor');
        }

        return { valido: erros.length === 0, erros };
    }

    // ============================================
    // REGRAS DE VALIDAÇÃO
    // ============================================

    private async rules(dadosConvite: IConviteCreate): Promise<{ valido: boolean; erros: string[] }> {
        const erros: string[] = [];

        // Validar dados obrigatórios
        if (!dadosConvite.grupo_id?.trim()) {
            erros.push('ID do grupo é obrigatório');
        }

        if (!dadosConvite.email_convidado?.trim()) {
            erros.push('Email do convidado é obrigatório');
        } else {
            // Validar formato do email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(dadosConvite.email_convidado)) {
                erros.push('Formato de email inválido');
            }
        }

        if (!dadosConvite.convidado_por?.trim()) {
            erros.push('ID do usuário que está convidando é obrigatório');
        }

        // Validar data de expiração se fornecida
        if (dadosConvite.data_expiracao) {
            if (dadosConvite.data_expiracao <= new Date()) {
                erros.push('Data de expiração deve ser no futuro');
            }
        }

        // Validar tamanho da mensagem personalizada se fornecida
        if (dadosConvite.mensagem_personalizada && dadosConvite.mensagem_personalizada.length > 500) {
            erros.push('Mensagem personalizada não pode exceder 500 caracteres');
        }

        return { valido: erros.length === 0, erros };
    }

    // ============================================
    // MÉTODOS PRINCIPAIS
    // ============================================

    public async create(dadosConvite: IConviteCreate): Promise<{ sucesso: boolean; convite?: IConvite; erros?: string[] }> {
        try {
            // Validações básicas
            const validacaoRegras = await this.rules(dadosConvite);
            if (!validacaoRegras.valido) {
                return {
                    sucesso: false,
                    erros: validacaoRegras.erros
                };
            }

            // Pré-regras de negócio
            const validacaoPreRegras = await this.preRules(dadosConvite);
            if (!validacaoPreRegras.valido) {
                return {
                    sucesso: false,
                    erros: validacaoPreRegras.erros
                };
            }

            // Preparar dados do convite
            const convite: IConvite = {
                id: uuidv4(),
                grupo_id: dadosConvite.grupo_id,
                email_convidado: dadosConvite.email_convidado.toLowerCase(),
                convidado_por: dadosConvite.convidado_por,
                codigo_convite: uuidv4().replace(/-/g, '').substring(0, 10).toUpperCase(),
                status: 'pendente',
                mensagem_personalizada: dadosConvite.mensagem_personalizada,
                data_criacao: new Date(),
                data_expiracao: dadosConvite.data_expiracao || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
            };

            // Verificar se usuário convidado já existe na plataforma
            const usuarioConvidado = await this.usuarioRepository.buscarPorEmail(convite.email_convidado);
            if (usuarioConvidado) {
                convite.usuario_convidado_id = usuarioConvidado.id;
            }

            // Salvar convite
            const conviteId = await this.conviteRepository.criar(convite);
            const conviteCriado = await this.conviteRepository.buscarPorId(conviteId);

            // TODO: Enviar email de convite
            // await this.emailService.enviarConvite(conviteCriado);

            this.dados = conviteCriado!;

            return {
                sucesso: true,
                convite: conviteCriado!
            };

        } catch (error) {
            console.error('Erro ao criar convite:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async buscarPorCodigo(codigo: string): Promise<{ sucesso: boolean; convite?: IConvite; erros?: string[] }> {
        try {
            if (!codigo?.trim()) {
                return {
                    sucesso: false,
                    erros: ['Código do convite é obrigatório']
                };
            }

            const convite = await this.conviteRepository.buscarPorCodigo(codigo.toUpperCase());

            if (!convite) {
                return {
                    sucesso: false,
                    erros: ['Convite não encontrado']
                };
            }

            return {
                sucesso: true,
                convite
            };

        } catch (error) {
            console.error('Erro ao buscar convite por código:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async aceitar(codigo: string, usuarioId: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            const convite = await this.conviteRepository.buscarPorCodigo(codigo.toUpperCase());

            if (!convite) {
                return {
                    sucesso: false,
                    erros: ['Convite não encontrado']
                };
            }

            if (convite.status !== 'pendente') {
                return {
                    sucesso: false,
                    erros: ['Convite já foi respondido']
                };
            }

            if (new Date() > convite.data_expiracao) {
                // Marcar como expirado
                await this.conviteRepository.atualizarStatus(convite.codigo_convite, 'recusado'); // Usar recusado como expirado
                return {
                    sucesso: false,
                    erros: ['Convite expirado']
                };
            }

            // Verificar se usuário já é membro do grupo
            const jaEhMembro = await this.grupoRepository.verificarPermissao(convite.grupo_id, usuarioId);
            if (jaEhMembro) {
                return {
                    sucesso: false,
                    erros: ['Você já é membro deste grupo']
                };
            }

            // Adicionar usuário ao grupo
            const adicionado = await this.grupoRepository.adicionarMembro({
                grupo_id: convite.grupo_id,
                usuario_id: usuarioId,
                nivel_permissao: 'membro',
                pode_convidar: false,
                pode_remover: false,
                pode_configurar: false
            });

            if (!adicionado) {
                return {
                    sucesso: false,
                    erros: ['Erro ao adicionar usuário ao grupo']
                };
            }

            // Atualizar status do convite
            await this.conviteRepository.atualizarStatus(convite.codigo_convite, 'aceito');

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao aceitar convite:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async recusar(codigo: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            const convite = await this.conviteRepository.buscarPorCodigo(codigo.toUpperCase());

            if (!convite) {
                return {
                    sucesso: false,
                    erros: ['Convite não encontrado']
                };
            }

            if (convite.status !== 'pendente') {
                return {
                    sucesso: false,
                    erros: ['Convite já foi respondido']
                };
            }

            // Atualizar status do convite
            await this.conviteRepository.atualizarStatus(convite.codigo_convite, 'recusado');

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao recusar convite:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async listarPorEmail(email: string): Promise<{ sucesso: boolean; convites?: IConvite[]; erros?: string[] }> {
        try {
            if (!email?.trim()) {
                return {
                    sucesso: false,
                    erros: ['Email é obrigatório']
                };
            }

            const convites = await this.conviteRepository.listarPorEmail(email.toLowerCase(), 'pendente');

            return {
                sucesso: true,
                convites
            };

        } catch (error) {
            console.error('Erro ao listar convites por email:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async expirarConvitesAntigos(): Promise<{ sucesso: boolean; expirados?: number; erros?: string[] }> {
        try {
            const expirados = await this.conviteRepository.expirarConvitesAntigos();

            return {
                sucesso: true,
                expirados
            };

        } catch (error) {
            console.error('Erro ao expirar convites antigos:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }
}
