import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { IUsuario } from '../types';

export class UsuarioEntity {
    private constructor(
        public readonly id: string,
        public nome: string,
        public email: string,
        private senha_hash?: string,
        public foto_perfil?: string,
        public telefone?: string,
        public status_ativo: boolean = true,
        public readonly data_criacao: Date = new Date(),
        public data_atualizacao: Date = new Date()
    ) {}

    // ============================================
    // PRE-RULES: Validações antes da criação
    // ============================================
    private static async preRules(dados: {
        nome: string;
        email: string;
        senha?: string;
        telefone?: string;
    }): Promise<void> {
        // Validar se email já existe
        const usuarioRepository = new UsuarioRepository();
        const usuarioExistente = await usuarioRepository.buscarPorEmail(dados.email);
        
        if (usuarioExistente) {
            throw new Error('Email já está sendo utilizado por outro usuário');
        }

        // Validar formato do email
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(dados.email)) {
            throw new Error('Formato de email inválido');
        }

        // Validar força da senha (se fornecida)
        if (dados.senha) {
            if (dados.senha.length < 8) {
                throw new Error('Senha deve ter pelo menos 8 caracteres');
            }
            
            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(dados.senha)) {
                throw new Error('Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número');
            }
        }

        // Validar telefone (se fornecido)
        if (dados.telefone) {
            const telefoneRegex = /^\+?[\d\s\-\(\)]{10,20}$/;
            if (!telefoneRegex.test(dados.telefone)) {
                throw new Error('Formato de telefone inválido');
            }
        }
    }

    // ============================================
    // RULES: Validações de negócio
    // ============================================
    private rules(): void {
        // Validar nome obrigatório
        if (!this.nome || this.nome.trim().length === 0) {
            throw new Error('Nome é obrigatório');
        }

        if (this.nome.trim().length > 100) {
            throw new Error('Nome deve ter no máximo 100 caracteres');
        }

        // Validar email obrigatório
        if (!this.email || this.email.trim().length === 0) {
            throw new Error('Email é obrigatório');
        }

        // Normalizar dados
        this.nome = this.nome.trim();
        this.email = this.email.toLowerCase().trim();
        if (this.telefone) {
            this.telefone = this.telefone.trim();
        }
    }

    // ============================================
    // PERSIST: Salvar no banco via repository
    // ============================================
    public async persist(): Promise<UsuarioEntity> {
        const usuarioRepository = new UsuarioRepository();
        
        // Aplicar regras de negócio
        this.rules();
        
        // Atualizar timestamp
        this.data_atualizacao = new Date();
        
        // Se tem ID, é uma atualização, senão é criação
        let usuarioSalvo;
        if (this.id) {
            usuarioSalvo = await usuarioRepository.atualizar(this.toDatabase());
        } else {
            usuarioSalvo = await usuarioRepository.salvar(this.toDatabase());
        }
        
        return UsuarioEntity.fromDatabase(usuarioSalvo);
    }

    // ============================================
    // CREATE: Factory method para criar instância
    // ============================================
    public static async create(dados: {
        nome: string;
        email: string;
        senha?: string;
        telefone?: string;
    }): Promise<UsuarioEntity> {
        // Executar pré-validações
        await this.preRules(dados);

        const id = uuidv4();
        let senhaHash: string | undefined;

        // Criptografar senha se fornecida
        if (dados.senha) {
            senhaHash = await bcrypt.hash(dados.senha, config.bcrypt.saltRounds);
        }

        const usuario = new UsuarioEntity(
            id,
            dados.nome,
            dados.email,
            senhaHash,
            undefined, // foto_perfil
            dados.telefone,
            true, // status_ativo
            new Date(),
            new Date()
        );

        return usuario;
    }

    // ============================================
    // MÉTODOS AUXILIARES
    // ============================================
    
    public static fromDatabase(dados: IUsuario): UsuarioEntity {
        return new UsuarioEntity(
            dados.id,
            dados.nome,
            dados.email,
            dados.senha_hash,
            dados.foto_perfil,
            dados.telefone,
            dados.status_ativo,
            dados.data_criacao,
            dados.data_atualizacao
        );
    }

    public toDatabase(): IUsuario {
        return {
            id: this.id,
            nome: this.nome,
            email: this.email,
            senha_hash: this.senha_hash,
            foto_perfil: this.foto_perfil,
            telefone: this.telefone,
            status_ativo: this.status_ativo,
            data_criacao: this.data_criacao,
            data_atualizacao: this.data_atualizacao
        };
    }

    public toResponse() {
        return {
            id: this.id,
            nome: this.nome,
            email: this.email,
            foto_perfil: this.foto_perfil,
            telefone: this.telefone,
            status_ativo: this.status_ativo,
            data_criacao: this.data_criacao,
            data_atualizacao: this.data_atualizacao
            // Não retornar senha_hash por segurança
        };
    }

    // ============================================
    // MÉTODOS DE NEGÓCIO
    // ============================================

    public async validarSenha(senha: string): Promise<boolean> {
        if (!this.senha_hash) {
            return false;
        }
        return bcrypt.compare(senha, this.senha_hash);
    }

    public async alterarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
        // Validar senha atual
        const senhaValida = await this.validarSenha(senhaAtual);
        if (!senhaValida) {
            throw new Error('Senha atual incorreta');
        }

        // Validar nova senha
        if (novaSenha.length < 8) {
            throw new Error('Nova senha deve ter pelo menos 8 caracteres');
        }
        
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(novaSenha)) {
            throw new Error('Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número');
        }

        // Criptografar nova senha
        this.senha_hash = await bcrypt.hash(novaSenha, config.bcrypt.saltRounds);
        this.data_atualizacao = new Date();
    }

    public atualizarPerfil(dados: {
        nome?: string;
        telefone?: string;
        foto_perfil?: string;
    }): void {
        if (dados.nome !== undefined) {
            if (!dados.nome || dados.nome.trim().length === 0) {
                throw new Error('Nome é obrigatório');
            }
            if (dados.nome.trim().length > 100) {
                throw new Error('Nome deve ter no máximo 100 caracteres');
            }
            this.nome = dados.nome.trim();
        }

        if (dados.telefone !== undefined) {
            if (dados.telefone && dados.telefone.trim().length > 0) {
                const telefoneRegex = /^\+?[\d\s\-\(\)]{10,20}$/;
                if (!telefoneRegex.test(dados.telefone)) {
                    throw new Error('Formato de telefone inválido');
                }
                this.telefone = dados.telefone.trim();
            } else {
                this.telefone = undefined;
            }
        }

        if (dados.foto_perfil !== undefined) {
            this.foto_perfil = dados.foto_perfil || undefined;
        }

        this.data_atualizacao = new Date();
    }

    public desativar(): void {
        this.status_ativo = false;
        this.data_atualizacao = new Date();
    }

    public ativar(): void {
        this.status_ativo = true;
        this.data_atualizacao = new Date();
    }
}
