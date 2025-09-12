import { DatabaseConfig } from '../config/database';

export interface IGrupo {
    id?: string;
    nome: string;
    descricao?: string;
    categoria: 'projeto' | 'estudo' | 'trabalho';
    privacidade: 'publico' | 'privado';
    max_membros?: number;
    codigo_acesso?: string;
    configuracoes?: any;
    criador_id: string;
    data_criacao?: Date;
    data_atualizacao?: Date;
    ativo?: boolean;
    total_membros?: number;
    criador_nome?: string;
    membros_count?: number;
    mensagens_nao_lidas?: number;
    ultima_atividade?: Date | string;
    membro_admin?: boolean;
}

export interface IGrupoMembro {
    id?: string;
    grupo_id: string;
    usuario_id: string;
    nivel_permissao: 'admin' | 'moderador' | 'membro' | 'visitante';
    data_entrada?: Date;
    ativo?: boolean;
    pode_convidar?: boolean;
    pode_remover?: boolean;
    pode_configurar?: boolean;
    papel?: 'admin' | 'moderador' | 'membro' | 'visitante'; // For compatibility
}

export class GrupoRepository {
    private db: DatabaseConfig;

    constructor() {
        this.db = DatabaseConfig.getInstance();
    }

    // ============================================
    // CRUD BÁSICO DE GRUPOS
    // ============================================

    async criar(grupo: IGrupo): Promise<string> {
        const query = `
            INSERT INTO grupos (nome, descricao, categoria, privacidade, max_membros, criador_id, configuracoes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;
        
        const result = await this.db.query(query, [
            grupo.nome,
            grupo.descricao || null,
            grupo.categoria,
            grupo.privacidade,
            grupo.max_membros || null,
            grupo.criador_id,
            JSON.stringify(grupo.configuracoes || {})
        ]);

        return result.rows[0].id;
    }

    async buscarPorId(id: string): Promise<IGrupo | null> {
        const query = `
            SELECT g.*, 
                   u.nome as criador_nome,
                   u.email as criador_email,
                   (SELECT COUNT(*) FROM membros_grupo WHERE grupo_id = g.id AND ativo = true) as total_membros
            FROM grupos g
            LEFT JOIN usuarios u ON g.criador_id = u.id
            WHERE g.id = $1
        `;
        
        const result = await this.db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            id: row.id,
            nome: row.nome,
            descricao: row.descricao,
            categoria: row.categoria,
            privacidade: row.privacidade,
            max_membros: row.max_membros,
            codigo_acesso: row.codigo_acesso,
            configuracoes: row.configuracoes,
            criador_id: row.criador_id,
            data_criacao: row.data_criacao,
            data_atualizacao: row.data_atualizacao,
            ativo: row.ativo,
            total_membros: parseInt(row.total_membros) || 0,
            criador_nome: row.criador_nome
        };
    }

    async listarPorUsuario(usuarioId: string, limite: number = 20, offset: number = 0): Promise<IGrupo[]> {
        const query = `
            SELECT DISTINCT g.*, 
                   u.nome as criador_nome,
                   (SELECT COUNT(*) FROM membros_grupo WHERE grupo_id = g.id AND ativo = true) as membros_count,
                   CASE WHEN mg.nivel_permissao = 'admin' THEN true ELSE false END as membro_admin
            FROM grupos g
            LEFT JOIN usuarios u ON g.criador_id = u.id
            INNER JOIN membros_grupo mg ON g.id = mg.grupo_id
            WHERE mg.usuario_id = $1 AND mg.ativo = true AND g.ativo = true
            ORDER BY g.data_atualizacao DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await this.db.query(query, [usuarioId, limite, offset]);
        
        return result.rows.map((row: any) => ({
            id: row.id,
            nome: row.nome,
            descricao: row.descricao,
            categoria: row.categoria,
            privacidade: row.privacidade,
            max_membros: row.max_membros,
            codigo_acesso: row.codigo_acesso,
            configuracoes: row.configuracoes,
            criador_id: row.criador_id,
            data_criacao: row.data_criacao,
            data_atualizacao: row.data_atualizacao,
            ativo: row.ativo,
            criador_nome: row.criador_nome,
            membros_count: parseInt(row.membros_count) || 0,
            membro_admin: row.membro_admin
        }));
    }

    async atualizar(id: string, dados: Partial<IGrupo>): Promise<boolean> {
        const campos = [];
        const valores = [];
        let contador = 1;

        if (dados.nome) {
            campos.push(`nome = $${contador++}`);
            valores.push(dados.nome);
        }

        if (dados.descricao !== undefined) {
            campos.push(`descricao = $${contador++}`);
            valores.push(dados.descricao);
        }

        if (dados.categoria) {
            campos.push(`categoria = $${contador++}`);
            valores.push(dados.categoria);
        }

        if (dados.privacidade) {
            campos.push(`privacidade = $${contador++}`);
            valores.push(dados.privacidade);
        }

        if (dados.max_membros !== undefined) {
            campos.push(`max_membros = $${contador++}`);
            valores.push(dados.max_membros);
        }

        if (dados.configuracoes) {
            campos.push(`configuracoes = $${contador++}`);
            valores.push(JSON.stringify(dados.configuracoes));
        }

        if (campos.length === 0) {
            return false;
        }

        campos.push(`data_atualizacao = CURRENT_TIMESTAMP`);
        valores.push(id);

        const query = `
            UPDATE grupos 
            SET ${campos.join(', ')}
            WHERE id = $${contador}
        `;

        const result = await this.db.query(query, valores);
        return result.rowCount > 0;
    }

    async deletar(id: string): Promise<boolean> {
        const query = `UPDATE grupos SET ativo = false WHERE id = $1`;
        const result = await this.db.query(query, [id]);
        return result.rowCount > 0;
    }

    // ============================================
    // MÉTODOS DE BUSCA
    // ============================================

    async buscarPublicos(termo?: string, limite: number = 20, offset: number = 0, usuarioId?: string): Promise<IGrupo[]> {
        let query = `
            SELECT g.*, 
                   u.nome as criador_nome,
                   (SELECT COUNT(*) FROM membros_grupo WHERE grupo_id = g.id AND ativo = true) as membros_count
            FROM grupos g
            LEFT JOIN usuarios u ON g.criador_id = u.id
            WHERE g.privacidade = 'publico' AND g.ativo = true
        `;

        const params: any[] = [];
        let paramIndex = 1;

        if (termo) {
            query += ` AND (g.nome ILIKE $${paramIndex} OR g.descricao ILIKE $${paramIndex})`;
            params.push(`%${termo}%`);
            paramIndex++;
        }

        if (usuarioId) {
            query += ` AND g.id NOT IN (
                SELECT grupo_id FROM membros_grupo 
                WHERE usuario_id = $${paramIndex} AND ativo = true
            )`;
            params.push(usuarioId);
            paramIndex++;
        }

        query += ` ORDER BY g.data_criacao DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limite, offset);

        const result = await this.db.query(query, params);
        
        return result.rows.map((row: any)=> ({
            id: row.id,
            nome: row.nome,
            descricao: row.descricao,
            categoria: row.categoria,
            privacidade: row.privacidade,
            max_membros: row.max_membros,
            codigo_acesso: row.codigo_acesso,
            configuracoes: row.configuracoes,
            criador_id: row.criador_id,
            data_criacao: row.data_criacao,
            data_atualizacao: row.data_atualizacao,
            ativo: row.ativo,
            criador_nome: row.criador_nome,
            membros_count: parseInt(row.membros_count) || 0
        }));
    }

    // ============================================
    // MÉTODOS DE MEMBROS
    // ============================================

    async adicionarMembro(dadosMembro: IGrupoMembro): Promise<string> {
        const query = `
            INSERT INTO membros_grupo (grupo_id, usuario_id, nivel_permissao)
            VALUES ($1, $2, $3)
            RETURNING id
        `;
        
        const result = await this.db.query(query, [
            dadosMembro.grupo_id,
            dadosMembro.usuario_id,
            dadosMembro.nivel_permissao
        ]);

        return result.rows[0].id;
    }

    async removerMembro(grupoId: string, usuarioId: string): Promise<boolean> {
        const query = `UPDATE membros_grupo SET ativo = false WHERE grupo_id = $1 AND usuario_id = $2`;
        const result = await this.db.query(query, [grupoId, usuarioId]);
        return result.rowCount > 0;
    }

    async obterMembros(grupoId: string): Promise<any[]> {
        const query = `
            SELECT mg.*, u.nome, u.email, u.foto_perfil
            FROM membros_grupo mg
            INNER JOIN usuarios u ON mg.usuario_id = u.id
            WHERE mg.grupo_id = $1 AND mg.ativo = true
            ORDER BY mg.nivel_permissao, u.nome
        `;
        
        const result = await this.db.query(query, [grupoId]);
        return result.rows;
    }

    // Alias para compatibilidade
    async listarMembros(grupoId: string): Promise<any[]> {
        return this.obterMembros(grupoId);
    }

    async entrarGrupoPublico(grupoId: string, usuarioId: string): Promise<boolean> {
        try {
            // Verificar se o grupo existe e é público
            const grupo = await this.buscarPorId(grupoId);
            if (!grupo || grupo.privacidade !== 'publico') {
                return false;
            }

            // Verificar se o usuário já é membro
            const membro = await this.verificarMembro(grupoId, usuarioId);
            if (membro) {
                return false; // Já é membro
            }

            // Adicionar como membro
            await this.adicionarMembro({
                grupo_id: grupoId,
                usuario_id: usuarioId,
                nivel_permissao: 'membro'
            });

            return true;
        } catch (error) {
            console.error('Erro ao entrar no grupo público:', error);
            return false;
        }
    }

    async obterEstatisticas(grupoId: string): Promise<any> {
        try {
            const query = `
                SELECT 
                    g.id,
                    g.nome,
                    g.data_criacao,
                    COUNT(DISTINCT mg.usuario_id) as total_membros,
                    COUNT(DISTINCT CASE WHEN mg.nivel_permissao = 'admin' THEN mg.usuario_id END) as total_admins,
                    COUNT(DISTINCT CASE WHEN mg.nivel_permissao = 'moderador' THEN mg.usuario_id END) as total_moderadores,
                    COUNT(DISTINCT CASE WHEN mg.nivel_permissao = 'membro' THEN mg.usuario_id END) as total_membros_basicos,
                    COALESCE(COUNT(DISTINCT t.id), 0) as total_tarefas,
                    COALESCE(COUNT(DISTINCT CASE WHEN t.status = 'concluida' THEN t.id END), 0) as tarefas_concluidas,
                    COALESCE(COUNT(DISTINCT m.id), 0) as total_mensagens,
                    COALESCE(COUNT(DISTINCT a.id), 0) as total_arquivos
                FROM grupos g
                LEFT JOIN membros_grupo mg ON g.id = mg.grupo_id AND mg.ativo = true
                LEFT JOIN tarefas t ON g.id = t.grupo_id AND t.ativo = true
                LEFT JOIN mensagens m ON g.id = m.grupo_id AND m.ativo = true
                LEFT JOIN arquivos a ON g.id = a.grupo_id AND a.ativo = true
                WHERE g.id = $1 AND g.ativo = true
                GROUP BY g.id, g.nome, g.data_criacao
            `;

            const result = await this.db.query(query, [grupoId]);
            
            if (result.rows.length === 0) {
                return null;
            }

            const stats = result.rows[0];
            return {
                id: stats.id,
                nome: stats.nome,
                data_criacao: stats.data_criacao,
                membros: {
                    total: parseInt(stats.total_membros) || 0,
                    admins: parseInt(stats.total_admins) || 0,
                    moderadores: parseInt(stats.total_moderadores) || 0,
                    membros_basicos: parseInt(stats.total_membros_basicos) || 0
                },
                atividade: {
                    total_tarefas: parseInt(stats.total_tarefas) || 0,
                    tarefas_concluidas: parseInt(stats.tarefas_concluidas) || 0,
                    total_mensagens: parseInt(stats.total_mensagens) || 0,
                    total_arquivos: parseInt(stats.total_arquivos) || 0
                }
            };

        } catch (error) {
            console.error('Erro ao obter estatísticas do grupo:', error);
            return null;
        }
    }

    async alterarPapelMembro(grupoId: string, usuarioId: string, novoNivel: 'admin' | 'moderador' | 'membro'): Promise<boolean> {
        const query = `
            UPDATE membros_grupo 
            SET nivel_permissao = $1
            WHERE grupo_id = $2 AND usuario_id = $3
        `;
        
        const result = await this.db.query(query, [
            novoNivel,
            grupoId,
            usuarioId
        ]);

        return result.rowCount > 0;
    }

    // Alias para compatibilidade
    async alterarNivelMembro(grupoId: string, usuarioId: string, novoNivel: 'admin' | 'moderador' | 'membro'): Promise<boolean> {
        return this.alterarPapelMembro(grupoId, usuarioId, novoNivel);
    }

    async verificarMembro(grupoId: string, usuarioId: string): Promise<IGrupoMembro | null> {
        const query = `
            SELECT * FROM membros_grupo 
            WHERE grupo_id = $1 AND usuario_id = $2 AND ativo = true
        `;
        
        const result = await this.db.query(query, [grupoId, usuarioId]);
        
        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    }

    // Método de compatibilidade - usado por várias entidades
    async verificarPermissao(grupoId: string, usuarioId: string): Promise<IGrupoMembro | null> {
        return this.verificarMembro(grupoId, usuarioId);
    }

    async contarMembros(grupoId: string): Promise<number> {
        const query = `SELECT COUNT(*) as total FROM membros_grupo WHERE grupo_id = $1 AND ativo = true`;
        const result = await this.db.query(query, [grupoId]);
        return parseInt(result.rows[0].total) || 0;
    }

    // ============================================
    // MÉTODOS AUXILIARES
    // ============================================

    async existeGrupo(id: string): Promise<boolean> {
        const query = `SELECT id FROM grupos WHERE id = $1 AND ativo = true`;
        const result = await this.db.query(query, [id]);
        return result.rows.length > 0;
    }

    async buscarPorCodigo(codigo: string): Promise<IGrupo | null> {
        const query = `
            SELECT g.*, u.nome as criador_nome
            FROM grupos g
            LEFT JOIN usuarios u ON g.criador_id = u.id
            WHERE g.codigo_acesso = $1 AND g.ativo = true
        `;
        
        const result = await this.db.query(query, [codigo]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            id: row.id,
            nome: row.nome,
            descricao: row.descricao,
            categoria: row.categoria,
            privacidade: row.privacidade,
            max_membros: row.max_membros,
            codigo_acesso: row.codigo_acesso,
            configuracoes: row.configuracoes,
            criador_id: row.criador_id,
            data_criacao: row.data_criacao,
            data_atualizacao: row.data_atualizacao,
            ativo: row.ativo,
            criador_nome: row.criador_nome
        };
    }
}
