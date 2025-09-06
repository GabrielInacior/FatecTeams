import bcrypt from 'bcrypt';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { config } from '../config';

export interface ILoginTradicional {
    email: string;
    senha: string;
}

export interface IRegistroTradicional {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
}

export interface ILoginResult {
    sucesso: boolean;
    usuario?: {
        id: string;
        nome: string;
        email: string;
        foto_perfil?: string;
        telefone?: string;
    };
    accessToken?: string;
    refreshToken?: string;
    erros?: string[];
}

export class AuthTradicionalService {
    private usuarioRepository: UsuarioRepository;

    constructor() {
        this.usuarioRepository = new UsuarioRepository();
    }

    // ============================================
    // LOGIN TRADICIONAL
    // ============================================

    public async login(dadosLogin: ILoginTradicional): Promise<ILoginResult> {
        try {
            const { email, senha } = dadosLogin;

            // Validações básicas
            if (!email || !senha) {
                return {
                    sucesso: false,
                    erros: ['Email e senha são obrigatórios']
                };
            }

            // Buscar usuário por email
            const usuario = await this.usuarioRepository.buscarPorEmailComSenhaCompleto(email);

            if (!usuario) {
                return {
                    sucesso: false,
                    erros: ['Email ou senha incorretos']
                };
            }

            // Verificar se o usuário está ativo
            if (!usuario.status_ativo) {
                return {
                    sucesso: false,
                    erros: ['Conta desativada. Entre em contato com o suporte.']
                };
            }

            // Verificar senha (assumindo que há senha_hash no banco)
            const senhaValida = await bcrypt.compare(senha, usuario.senha_hash || '');

            if (!senhaValida) {
                return {
                    sucesso: false,
                    erros: ['Email ou senha incorretos']
                };
            }

            // Gerar tokens JWT
            const payload = {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            };

            const accessToken = AuthMiddleware.gerarToken(payload);
            const refreshToken = AuthMiddleware.gerarRefreshToken(payload);

            // Atualizar último acesso
            await this.usuarioRepository.atualizarUltimoAcesso(usuario.id);

            return {
                sucesso: true,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    foto_perfil: usuario.foto_perfil,
                    telefone: usuario.telefone
                },
                accessToken,
                refreshToken
            };

        } catch (error) {
            console.error('Erro no login tradicional:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // REGISTRO TRADICIONAL
    // ============================================

    public async registro(dadosRegistro: IRegistroTradicional): Promise<ILoginResult> {
        try {
            const { nome, email, senha, telefone } = dadosRegistro;

            // Validações
            const erros = await this.validarDadosRegistro(dadosRegistro);
            if (erros.length > 0) {
                return {
                    sucesso: false,
                    erros
                };
            }

            // Verificar se usuário já existe
            const usuarioExistente = await this.usuarioRepository.buscarPorEmail(email);
            if (usuarioExistente) {
                return {
                    sucesso: false,
                    erros: ['Este email já está em uso']
                };
            }

            // Hash da senha
            const hashSenha = await bcrypt.hash(senha, config.bcrypt.saltRounds);

            // Criar usuário
            const novoUsuario = await this.usuarioRepository.criar({
                nome,
                email,
                telefone,
                hash_senha: hashSenha,
                status_ativo: true,
                data_criacao: new Date()
            });

            if (!novoUsuario) {
                return {
                    sucesso: false,
                    erros: ['Erro ao criar usuário']
                };
            }

            // Gerar tokens JWT
            const payload = {
                id: novoUsuario.id,
                nome: novoUsuario.nome,
                email: novoUsuario.email
            };

            const accessToken = AuthMiddleware.gerarToken(payload);
            const refreshToken = AuthMiddleware.gerarRefreshToken(payload);

            return {
                sucesso: true,
                usuario: {
                    id: novoUsuario.id,
                    nome: novoUsuario.nome,
                    email: novoUsuario.email,
                    foto_perfil: novoUsuario.foto_perfil,
                    telefone: novoUsuario.telefone
                },
                accessToken,
                refreshToken
            };

        } catch (error) {
            console.error('Erro no registro tradicional:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // ALTERAR SENHA
    // ============================================

    public async alterarSenha(usuarioId: string, senhaAtual: string, novaSenha: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            // Buscar usuário
            const usuario = await this.usuarioRepository.buscarPorId(usuarioId);

            if (!usuario) {
                return {
                    sucesso: false,
                    erros: ['Usuário não encontrado']
                };
            }

            // Verificar senha atual
            const senhaAtualValida = await bcrypt.compare(senhaAtual, usuario.senha_hash || '');

            if (!senhaAtualValida) {
                return {
                    sucesso: false,
                    erros: ['Senha atual incorreta']
                };
            }

            // Validar nova senha
            const erroValidacao = this.validarSenha(novaSenha);
            if (erroValidacao) {
                return {
                    sucesso: false,
                    erros: [erroValidacao]
                };
            }

            // Hash da nova senha
            const novoHashSenha = await bcrypt.hash(novaSenha, config.bcrypt.saltRounds);

            // Atualizar senha
            const sucesso = await this.usuarioRepository.atualizarSenha(usuarioId, novoHashSenha);

            if (!sucesso) {
                return {
                    sucesso: false,
                    erros: ['Erro ao atualizar senha']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // VALIDAÇÕES PRIVADAS
    // ============================================

    private async validarDadosRegistro(dados: IRegistroTradicional): Promise<string[]> {
        const erros: string[] = [];

        // Nome
        if (!dados.nome || dados.nome.trim().length < 2) {
            erros.push('Nome deve ter pelo menos 2 caracteres');
        }

        if (dados.nome && dados.nome.length > 100) {
            erros.push('Nome deve ter no máximo 100 caracteres');
        }

        // Email
        if (!dados.email || !this.validarEmail(dados.email)) {
            erros.push('Email inválido');
        }

        // Senha
        const erroSenha = this.validarSenha(dados.senha);
        if (erroSenha) {
            erros.push(erroSenha);
        }

        // Telefone (opcional)
        if (dados.telefone && !this.validarTelefone(dados.telefone)) {
            erros.push('Telefone inválido');
        }

        return erros;
    }

    private validarEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private validarSenha(senha: string): string | null {
        if (!senha || senha.length < 6) {
            return 'Senha deve ter pelo menos 6 caracteres';
        }

        if (senha.length > 100) {
            return 'Senha deve ter no máximo 100 caracteres';
        }

        // Senha deve ter pelo menos uma letra e um número
        if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(senha)) {
            return 'Senha deve conter pelo menos uma letra e um número';
        }

        return null;
    }

    private validarTelefone(telefone: string): boolean {
        // Remove caracteres não numéricos
        const telefoneNumerico = telefone.replace(/\D/g, '');
        
        // Deve ter entre 10 e 15 dígitos
        return telefoneNumerico.length >= 10 && telefoneNumerico.length <= 15;
    }
}
