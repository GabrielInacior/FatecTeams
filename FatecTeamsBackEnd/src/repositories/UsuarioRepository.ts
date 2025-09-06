import { DatabaseConfig } from '../config/database';
import { IUsuario } from '../types';

export class UsuarioRepository {
    private db: DatabaseConfig;

    constructor() {
        this.db = DatabaseConfig.getInstance();
    }

    // ============================================
    // MÉTODOS CRUD BÁSICOS
    // ============================================

    public async salvar(usuario: IUsuario): Promise<IUsuario> {
        const query = `
            INSERT INTO usuarios (
                id, nome, email, senha_hash, foto_perfil, telefone, 
                status_ativo, data_criacao, data_atualizacao
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;

        const values = [
            usuario.id,
            usuario.nome,
            usuario.email,
            usuario.senha_hash || null,
            usuario.foto_perfil || null,
            usuario.telefone || null,
            usuario.status_ativo !== false, // Default true
            new Date(),
            new Date()
        ];

        try {
            const result = await this.db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            throw new Error('Erro interno do servidor ao salvar usuário');
        }
    }

    public async atualizar(usuario: IUsuario): Promise<IUsuario> {
        const query = `
            UPDATE usuarios 
            SET nome = $2, email = $3, senha_hash = $4, foto_perfil = $5, 
                telefone = $6, status_ativo = $7, data_atualizacao = $8
            WHERE id = $1
            RETURNING *
        `;

        const values = [
            usuario.id,
            usuario.nome,
            usuario.email,
            usuario.senha_hash,
            usuario.foto_perfil,
            usuario.telefone,
            usuario.status_ativo,
            usuario.data_atualizacao
        ];

        try {
            const result = await this.db.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error('Usuário não encontrado');
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            throw new Error('Erro interno do servidor ao atualizar usuário');
        }
    }

    public async buscarPorId(id: string): Promise<IUsuario | null> {
        const query = `
            SELECT * FROM usuarios 
            WHERE id = $1 AND status_ativo = true
        `;

        try {
            const result = await this.db.query(query, [id]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('Erro ao buscar usuário por ID:', error);
            throw new Error('Erro interno do servidor ao buscar usuário');
        }
    }

    public async buscarPorEmail(email: string): Promise<IUsuario | null> {
        const query = `
            SELECT * FROM usuarios 
            WHERE LOWER(email) = LOWER($1)
        `;

        try {
            const result = await this.db.query(query, [email]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('Erro ao buscar usuário por email:', error);
            throw new Error('Erro interno do servidor ao buscar usuário');
        }
    }

    public async excluir(id: string): Promise<boolean> {
        const query = `
            UPDATE usuarios 
            SET status_ativo = false, data_atualizacao = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id
        `;

        try {
            const result = await this.db.query(query, [id]);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            throw new Error('Erro interno do servidor ao excluir usuário');
        }
    }

    // ============================================
    // MÉTODOS DE BUSCA ESPECÍFICOS
    // ============================================

    public async listarTodos(
        limite: number = 50, 
        offset: number = 0, 
        filtroNome?: string
    ): Promise<{ usuarios: IUsuario[], total: number }> {
        let query = `
            SELECT * FROM usuarios 
            WHERE status_ativo = true
        `;
        let countQuery = `
            SELECT COUNT(*) FROM usuarios 
            WHERE status_ativo = true
        `;
        
        const values: any[] = [];

        // Adicionar filtro por nome se fornecido
        if (filtroNome) {
            query += ` AND nome ILIKE $1`;
            countQuery += ` AND nome ILIKE $1`;
            values.push(`%${filtroNome}%`);
        }

        // Adicionar ordenação, limite e offset
        query += ` ORDER BY nome ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(limite, offset);

        try {
            // Buscar usuários
            const usuariosResult = await this.db.query(query, values);
            
            // Buscar total (sem limite/offset)
            const countValues = filtroNome ? [filtroNome] : [];
            const totalResult = await this.db.query(countQuery, countValues);
            
            return {
                usuarios: usuariosResult.rows,
                total: parseInt(totalResult.rows[0].count)
            };
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            throw new Error('Erro interno do servidor ao listar usuários');
        }
    }

    public async buscarPorEmailComSenha(email: string): Promise<IUsuario | null> {
        const query = `
            SELECT * FROM usuarios 
            WHERE LOWER(email) = LOWER($1) AND status_ativo = true
        `;

        try {
            const result = await this.db.query(query, [email]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('Erro ao buscar usuário para autenticação:', error);
            throw new Error('Erro interno do servidor ao autenticar usuário');
        }
    }

    public async existeEmail(email: string, excluirId?: string): Promise<boolean> {
        let query = `
            SELECT id FROM usuarios 
            WHERE LOWER(email) = LOWER($1)
        `;
        const values = [email];

        if (excluirId) {
            query += ` AND id != $2`;
            values.push(excluirId);
        }

        try {
            const result = await this.db.query(query, values);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Erro ao verificar existência de email:', error);
            throw new Error('Erro interno do servidor ao verificar email');
        }
    }

    // ============================================
    // MÉTODOS RELACIONADOS A GRUPOS
    // ============================================

    public async buscarGruposDoUsuario(usuarioId: string): Promise<any[]> {
        const query = `
            SELECT 
                g.id,
                g.nome,
                g.descricao,
                g.foto_capa,
                g.codigo_acesso,
                g.tipo_grupo,
                mg.nivel_permissao,
                mg.data_entrada,
                COUNT(mg2.id) as total_membros
            FROM grupos g
            INNER JOIN membros_grupo mg ON g.id = mg.grupo_id
            LEFT JOIN membros_grupo mg2 ON g.id = mg2.grupo_id AND mg2.ativo = true
            WHERE mg.usuario_id = $1 AND mg.ativo = true
            GROUP BY g.id, g.nome, g.descricao, g.foto_capa, g.codigo_acesso, 
                     g.tipo_grupo, mg.nivel_permissao, mg.data_entrada
            ORDER BY mg.data_entrada DESC
        `;

        try {
            const result = await this.db.query(query, [usuarioId]);
            return result.rows;
        } catch (error) {
            console.error('Erro ao buscar grupos do usuário:', error);
            throw new Error('Erro interno do servidor ao buscar grupos');
        }
    }

    // ============================================
    // MÉTODOS DE OAUTH
    // ============================================

    public async salvarProvedorOAuth(dados: {
        usuario_id: string;
        provedor: string;
        provedor_id: string;
        email_provedor: string;
    }): Promise<void> {
        const query = `
            INSERT INTO provedores_oauth (usuario_id, provedor, provedor_id, email_provedor)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (usuario_id, provedor) 
            DO UPDATE SET 
                provedor_id = $3,
                email_provedor = $4,
                data_vinculacao = CURRENT_TIMESTAMP
        `;

        try {
            await this.db.query(query, [
                dados.usuario_id,
                dados.provedor,
                dados.provedor_id,
                dados.email_provedor
            ]);
        } catch (error) {
            console.error('Erro ao salvar provedor OAuth:', error);
            throw new Error('Erro interno do servidor ao vincular conta');
        }
    }

    public async buscarPorProvedorOAuth(
        provedor: string, 
        provedorId: string
    ): Promise<IUsuario | null> {
        const query = `
            SELECT u.* FROM usuarios u
            INNER JOIN provedores_oauth po ON u.id = po.usuario_id
            WHERE po.provedor = $1 AND po.provedor_id = $2 AND u.status_ativo = true
        `;

        try {
            const result = await this.db.query(query, [provedor, provedorId]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('Erro ao buscar usuário por OAuth:', error);
            throw new Error('Erro interno do servidor ao autenticar via OAuth');
        }
    }

    // ============================================
    // MÉTODOS DE ESTATÍSTICAS
    // ============================================

    public async contarUsuariosAtivos(): Promise<number> {
        const query = `SELECT COUNT(*) FROM usuarios WHERE status_ativo = true`;

        try {
            const result = await this.db.query(query);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Erro ao contar usuários ativos:', error);
            throw new Error('Erro interno do servidor ao obter estatísticas');
        }
    }

    public async obterEstatisticasUsuario(usuarioId: string): Promise<any> {
        const query = `
            SELECT 
                COUNT(DISTINCT mg.grupo_id) as total_grupos,
                COUNT(DISTINCT m.id) as total_mensagens,
                COUNT(DISTINCT a.id) as total_arquivos,
                COUNT(DISTINCT t.id) as total_tarefas_criadas,
                COUNT(DISTINCT at.tarefa_id) as total_tarefas_atribuidas
            FROM usuarios u
            LEFT JOIN membros_grupo mg ON u.id = mg.usuario_id AND mg.ativo = true
            LEFT JOIN mensagens m ON u.id = m.remetente_id
            LEFT JOIN arquivos a ON u.id = a.enviado_por
            LEFT JOIN tarefas t ON u.id = t.criador_id
            LEFT JOIN atribuicoes_tarefa at ON u.id = at.usuario_id
            WHERE u.id = $1 AND u.status_ativo = true
            GROUP BY u.id
        `;

        try {
            const result = await this.db.query(query, [usuarioId]);
            return result.rows.length > 0 ? result.rows[0] : {
                total_grupos: 0,
                total_mensagens: 0,
                total_arquivos: 0,
                total_tarefas_criadas: 0,
                total_tarefas_atribuidas: 0
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas do usuário:', error);
            throw new Error('Erro interno do servidor ao obter estatísticas');
        }
    }

    public async atualizarFotoPerfil(id: string, fotoPerfil: string): Promise<IUsuario | null> {
        const query = `
            UPDATE usuarios 
            SET foto_perfil = $2, data_atualizacao = CURRENT_TIMESTAMP
            WHERE id = $1 AND status_ativo = true
            RETURNING *
        `;

        try {
            const result = await this.db.query(query, [id, fotoPerfil]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('Erro ao atualizar foto de perfil:', error);
            throw new Error('Erro interno do servidor ao atualizar foto');
        }
    }

    // ============================================
    // MÉTODOS PARA AUTENTICAÇÃO TRADICIONAL
    // ============================================

    public async criar(dados: {
        nome: string;
        email: string;
        telefone?: string;
        hash_senha: string;
        status_ativo: boolean;
        data_criacao: Date;
    }): Promise<IUsuario | null> {
        const query = `
            INSERT INTO usuarios (
                nome, email, telefone, senha_hash, status_ativo, data_criacao, data_atualizacao
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const values = [
            dados.nome,
            dados.email,
            dados.telefone || null,
            dados.hash_senha,
            dados.status_ativo,
            dados.data_criacao,
            new Date()
        ];

        try {
            const result = await this.db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            return null;
        }
    }

    public async atualizarUltimoAcesso(usuarioId: string): Promise<boolean> {
        const query = `
            UPDATE usuarios 
            SET ultimo_acesso = NOW(), data_atualizacao = NOW()
            WHERE id = $1
        `;

        try {
            const result = await this.db.query(query, [usuarioId]);
            return result.rowCount > 0;
        } catch (error) {
            console.error('Erro ao atualizar último acesso:', error);
            return false;
        }
    }

    public async atualizarSenha(usuarioId: string, novoHashSenha: string): Promise<boolean> {
        const query = `
            UPDATE usuarios 
            SET senha_hash = $1, data_atualizacao = NOW()
            WHERE id = $2 AND status_ativo = true
        `;

        try {
            const result = await this.db.query(query, [novoHashSenha, usuarioId]);
            return result.rowCount > 0;
        } catch (error) {
            console.error('Erro ao atualizar senha:', error);
            return false;
        }
    }

    public async buscarPorEmailComSenhaCompleto(email: string): Promise<IUsuario | null> {
        const query = `
            SELECT id, nome, email, senha_hash, foto_perfil, telefone, 
                   status_ativo, data_criacao, data_atualizacao, ultimo_acesso
            FROM usuarios 
            WHERE email = $1
        `;

        try {
            const result = await this.db.query(query, [email]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('Erro ao buscar usuário por email com senha:', error);
            return null;
        }
    }
}
