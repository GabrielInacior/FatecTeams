import { v4 as uuidv4 } from 'uuid';
import { GrupoRepository, IGrupo } from '../repositories/GrupoRepository';

export interface IGrupoCreate {
    nome: string;
    descricao?: string;
    categoria: 'projeto' | 'estudo' | 'trabalho';
    privacidade: 'publico' | 'privado';
    max_membros?: number;
    configuracoes?: any;
    criador_id: string;
}

export interface IGrupoUpdate {
    nome?: string;
    descricao?: string;
    categoria?: 'projeto' | 'estudo' | 'trabalho';
    privacidade?: 'publico' | 'privado';
    max_membros?: number;
    configuracoes?: any;
}

export class GrupoEntity {
    private grupoRepository: GrupoRepository;
    private dados: IGrupo;

    constructor(dados?: IGrupo) {
        this.grupoRepository = new GrupoRepository();
        this.dados = dados || {} as IGrupo;
    }

    // ============================================
    // REGRAS DE NEGÓCIO PRÉ-VALIDAÇÃO
    // ============================================

    private preRules(): void {
        if (!this.dados.id) {
            this.dados.id = uuidv4();
        }

        if (this.dados.nome) {
            this.dados.nome = this.dados.nome.trim();
        }

        if (this.dados.descricao) {
            this.dados.descricao = this.dados.descricao.trim();
        }

        if (!this.dados.configuracoes) {
            this.dados.configuracoes = {
                permite_convites: true,
                permite_arquivos: true,
                permite_tarefas: true,
                tamanho_max_arquivo_mb: 50,
                requer_aprovacao_membros: this.dados.privacidade === 'privado'
            };
        }
    }

    // ============================================
    // REGRAS DE VALIDAÇÃO
    // ============================================

    private async rules(): Promise<{ valido: boolean; erros: string[] }> {
        const erros: string[] = [];

        // Validação do nome
        if (!this.dados.nome || this.dados.nome.length === 0) {
            erros.push('Nome do grupo é obrigatório');
        } else if (this.dados.nome.length < 2) {
            erros.push('Nome do grupo deve ter pelo menos 2 caracteres');
        } else if (this.dados.nome.length > 100) {
            erros.push('Nome do grupo deve ter no máximo 100 caracteres');
        }

        // Validação da descrição
        if (this.dados.descricao && this.dados.descricao.length > 500) {
            erros.push('Descrição deve ter no máximo 500 caracteres');
        }

        // Validação da categoria
        const categoriasValidas = ['projeto', 'estudo', 'trabalho'];
        if (!this.dados.categoria || !categoriasValidas.includes(this.dados.categoria)) {
            erros.push('Categoria de grupo inválida. Use: projeto, estudo ou trabalho');
        }

        // Validação da privacidade
        const privacidadesValidas = ['publico', 'privado'];
        if (!this.dados.privacidade || !privacidadesValidas.includes(this.dados.privacidade)) {
            erros.push('Privacidade de grupo inválida. Use: publico ou privado');
        }

        // Validação do criador
        if (!this.dados.criador_id) {
            erros.push('Criador do grupo é obrigatório');
        }

        // Validação do max_membros
        if (this.dados.max_membros && this.dados.max_membros < 2) {
            erros.push('Número máximo de membros deve ser pelo menos 2');
        }

        return {
            valido: erros.length === 0,
            erros
        };
    }

    // ============================================
    // MÉTODOS PRINCIPAIS
    // ============================================

    public async create(dadosGrupo: IGrupoCreate): Promise<{ sucesso: boolean; grupo?: IGrupo; erros?: string[] }> {
        try {
            this.dados = {
                ...dadosGrupo,
                data_criacao: new Date(),
                data_atualizacao: new Date(),
                ativo: true,
                configuracoes: dadosGrupo.configuracoes || {}
            };

            this.preRules();
            const validacao = await this.rules();

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    erros: validacao.erros
                };
            }

            const grupoId = await this.grupoRepository.criar(this.dados);
            
            // Adicionar o criador como admin do grupo
            await this.grupoRepository.adicionarMembro({
                grupo_id: grupoId,
                usuario_id: this.dados.criador_id,
                nivel_permissao: 'admin',
                pode_convidar: true,
                pode_remover: true,
                pode_configurar: true
            });

            const grupoSalvo = await this.grupoRepository.buscarPorId(grupoId);

            return {
                sucesso: true,
                grupo: grupoSalvo || undefined
            };

        } catch (error) {
            console.error('Erro ao criar grupo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async update(id: string, dadosAtualizacao: IGrupoUpdate): Promise<{ sucesso: boolean; grupo?: IGrupo; erros?: string[] }> {
        try {
            const atualizado = await this.grupoRepository.atualizar(id, dadosAtualizacao);

            if (!atualizado) {
                return {
                    sucesso: false,
                    erros: ['Grupo não encontrado ou erro ao atualizar']
                };
            }

            const grupoAtualizado = await this.grupoRepository.buscarPorId(id);

            return {
                sucesso: true,
                grupo: grupoAtualizado || undefined
            };

        } catch (error) {
            console.error('Erro ao atualizar grupo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async delete(id: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            const deletado = await this.grupoRepository.deletar(id);

            if (!deletado) {
                return {
                    sucesso: false,
                    erros: ['Grupo não encontrado']
                };
            }

            return {
                sucesso: true
            };

        } catch (error) {
            console.error('Erro ao deletar grupo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // MÉTODOS DE CONSULTA
    // ============================================

    public async buscarPorId(id: string): Promise<{ sucesso: boolean; grupo?: IGrupo; erros?: string[] }> {
        try {
            const grupo = await this.grupoRepository.buscarPorId(id);

            if (!grupo) {
                return {
                    sucesso: false,
                    erros: ['Grupo não encontrado']
                };
            }

            return {
                sucesso: true,
                grupo
            };

        } catch (error) {
            console.error('Erro ao buscar grupo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async listarPorUsuario(usuarioId: string, limite?: number, offset?: number): Promise<{ sucesso: boolean; grupos?: IGrupo[]; erros?: string[] }> {
        try {
            const grupos = await this.grupoRepository.listarPorUsuario(usuarioId, limite, offset);

            return {
                sucesso: true,
                grupos
            };

        } catch (error) {
            console.error('Erro ao listar grupos:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async buscarPublicos(termo?: string, limite?: number, offset?: number, usuarioId?: string): Promise<{ sucesso: boolean; grupos?: IGrupo[]; erros?: string[] }> {
        try {
            const grupos = await this.grupoRepository.buscarPublicos(termo, limite, offset, usuarioId);

            return {
                sucesso: true,
                grupos
            };

        } catch (error) {
            console.error('Erro ao buscar grupos públicos:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }
}
