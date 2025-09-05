import { GrupoRepository, IGrupo, IGrupoMembro } from '../repositories/GrupoRepository';
import { v4 as uuidv4 } from 'uuid';

export interface IGrupoCreate {
    nome: string;
    descricao?: string;
    tipo: 'publico' | 'privado' | 'fechado';
    configuracoes?: any;
    criado_por: string;
}

export interface IGrupoUpdate {
    nome?: string;
    descricao?: string;
    tipo?: 'publico' | 'privado' | 'fechado';
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
                requer_aprovacao_membros: this.dados.tipo === 'privado' || this.dados.tipo === 'fechado'
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

        // Validação do tipo
        const tiposValidos = ['publico', 'privado', 'fechado'];
        if (!this.dados.tipo || !tiposValidos.includes(this.dados.tipo)) {
            erros.push('Tipo de grupo inválido. Use: publico, privado ou fechado');
        }

        // Validação do criador
        if (!this.dados.criado_por) {
            erros.push('Criador do grupo é obrigatório');
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
                criado_em: new Date(),
                atualizado_em: new Date(),
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
                usuario_id: this.dados.criado_por,
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
            const grupoExistente = await this.grupoRepository.buscarPorId(id);
            
            if (!grupoExistente) {
                return {
                    sucesso: false,
                    erros: ['Grupo não encontrado']
                };
            }

            this.dados = {
                ...grupoExistente,
                ...dadosAtualizacao,
                atualizado_em: new Date()
            };

            this.preRules();
            const validacao = await this.rules();

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    erros: validacao.erros
                };
            }

            const atualizado = await this.grupoRepository.atualizar(id, dadosAtualizacao);

            if (!atualizado) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível atualizar o grupo']
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

    public async delete(id: string, usuarioId: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            // Verificar se o usuário tem permissão para deletar
            const permissao = await this.grupoRepository.verificarPermissao(id, usuarioId);
            
            if (!permissao || permissao.nivel_permissao !== 'admin') {
                return {
                    sucesso: false,
                    erros: ['Você não tem permissão para deletar este grupo']
                };
            }

            const deletado = await this.grupoRepository.deletar(id);

            if (!deletado) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível deletar o grupo']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao deletar grupo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    // ============================================
    // GESTÃO DE MEMBROS
    // ============================================

    public async adicionarMembro(
        grupoId: string, 
        usuarioIdAdmin: string, 
        usuarioIdNovo: string, 
        papel: 'admin' | 'moderador' | 'membro' = 'membro'
    ): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            // Verificar se quem está adicionando tem permissão
            const permissaoAdmin = await this.grupoRepository.verificarPermissao(grupoId, usuarioIdAdmin);
            
            if (!permissaoAdmin || (!permissaoAdmin.pode_convidar && permissaoAdmin.nivel_permissao !== 'admin')) {
                return {
                    sucesso: false,
                    erros: ['Você não tem permissão para adicionar membros']
                };
            }

            // Verificar se o usuário já é membro
            const jaEMembro = await this.grupoRepository.verificarPermissao(grupoId, usuarioIdNovo);
            if (jaEMembro) {
                return {
                    sucesso: false,
                    erros: ['Usuário já é membro do grupo']
                };
            }

            const adicionado = await this.grupoRepository.adicionarMembro({
                grupo_id: grupoId,
                usuario_id: usuarioIdNovo,
                nivel_permissao: papel,
                pode_convidar: papel === 'admin' || papel === 'moderador',
                pode_remover: papel === 'admin' || papel === 'moderador',
                pode_configurar: papel === 'admin'
            });

            if (!adicionado) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível adicionar o membro']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao adicionar membro:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async removerMembro(grupoId: string, usuarioIdAdmin: string, usuarioIdRemover: string): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            // Verificar permissões
            const permissaoAdmin = await this.grupoRepository.verificarPermissao(grupoId, usuarioIdAdmin);
            const permissaoRemover = await this.grupoRepository.verificarPermissao(grupoId, usuarioIdRemover);
            
            if (!permissaoAdmin || !permissaoRemover) {
                return {
                    sucesso: false,
                    erros: ['Usuário não encontrado no grupo']
                };
            }

            // Admin não pode se remover se for o único admin
            if (usuarioIdAdmin === usuarioIdRemover && permissaoAdmin.nivel_permissao === 'admin') {
                // Verificar se há outros admins
                const membros = await this.grupoRepository.listarMembros(grupoId);
                const outrosAdmins = membros.filter((m: any) => m.papel === 'admin' && m.usuario_id !== usuarioIdAdmin);
                
                if (outrosAdmins.length === 0) {
                    return {
                        sucesso: false,
                        erros: ['Você não pode sair do grupo sendo o único administrador. Adicione outro administrador primeiro.']
                    };
                }
            }

            // Verificar se tem permissão para remover
            if (usuarioIdAdmin !== usuarioIdRemover && !permissaoAdmin.pode_remover) {
                return {
                    sucesso: false,
                    erros: ['Você não tem permissão para remover membros']
                };
            }

            const removido = await this.grupoRepository.removerMembro(grupoId, usuarioIdRemover);

            if (!removido) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível remover o membro']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao remover membro:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async alterarPapel(
        grupoId: string, 
        usuarioIdAdmin: string, 
        usuarioIdTarget: string, 
        novoPapel: 'admin' | 'moderador' | 'membro'
    ): Promise<{ sucesso: boolean; erros?: string[] }> {
        try {
            // Verificar se quem está alterando tem permissão (só admin pode alterar papéis)
            const permissaoAdmin = await this.grupoRepository.verificarPermissao(grupoId, usuarioIdAdmin);
            
            if (!permissaoAdmin || permissaoAdmin.nivel_permissao !== 'admin') {
                return {
                    sucesso: false,
                    erros: ['Apenas administradores podem alterar papéis de membros']
                };
            }

            // Verificar se o usuário alvo existe no grupo
            const permissaoTarget = await this.grupoRepository.verificarPermissao(grupoId, usuarioIdTarget);
            if (!permissaoTarget) {
                return {
                    sucesso: false,
                    erros: ['Usuário não encontrado no grupo']
                };
            }

            const alterado = await this.grupoRepository.adicionarMembro({
                grupo_id: grupoId,
                usuario_id: usuarioIdTarget,
                nivel_permissao: novoPapel,
                pode_convidar: novoPapel === 'admin' || novoPapel === 'moderador',
                pode_remover: novoPapel === 'admin' || novoPapel === 'moderador',
                pode_configurar: novoPapel === 'admin'
            });

            if (!alterado) {
                return {
                    sucesso: false,
                    erros: ['Não foi possível alterar o papel do membro']
                };
            }

            return { sucesso: true };

        } catch (error) {
            console.error('Erro ao alterar papel do membro:', error);
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
            console.error('Erro ao listar grupos do usuário:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async buscarPublicos(termo?: string, limite?: number, offset?: number): Promise<{ sucesso: boolean; grupos?: IGrupo[]; erros?: string[] }> {
        try {
            const grupos = await this.grupoRepository.buscarPublicos(termo, limite, offset);

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

    public async obterMembros(grupoId: string): Promise<{ sucesso: boolean; membros?: any[]; erros?: string[] }> {
        try {
            const membros = await this.grupoRepository.listarMembros(grupoId);

            return {
                sucesso: true,
                membros
            };

        } catch (error) {
            console.error('Erro ao obter membros do grupo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }

    public async obterEstatisticas(grupoId: string): Promise<{ sucesso: boolean; estatisticas?: any; erros?: string[] }> {
        try {
            const estatisticas = await this.grupoRepository.obterEstatisticas(grupoId);

            return {
                sucesso: true,
                estatisticas
            };

        } catch (error) {
            console.error('Erro ao obter estatísticas do grupo:', error);
            return {
                sucesso: false,
                erros: ['Erro interno do servidor']
            };
        }
    }
}
