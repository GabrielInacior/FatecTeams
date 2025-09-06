import { DatabaseConfig } from '../config/database';

export interface IGrupo {
    id?: string;
    nome: string;
    descricao?: string;
    tipo: 'publico' | 'privado' | 'fechado' | 'secreto';
    configuracoes: any;
    criador_id: string;
    criado_em?: Date;
    atualizado_em?: Date;
    total_membros?: number;
    criador_nome?: string;
    membros_count?: number;
    mensagens_nao_lidas?: number;
    ultima_atividade?: Date | string;
    membro_admin?: boolean;
}

export interface IGrupoMembro {
    grupo_id: string;
    usuario_id: string;
    nivel_permissao: 'admin' | 'moderador' | 'membro' | 'visitante';
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
            INSERT INTO grupos (nome, descricao, tipo_grupo, criador_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `;
        
        const result = await this.db.query(query, [
            grupo.nome,
            grupo.descricao || null,
            grupo.tipo,
            grupo.criador_id
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
            tipo: row.tipo_grupo,
            configuracoes: {},
            criador_id: row.criador_id,
            criado_em: row.data_criacao,
            atualizado_em: row.data_atualizacao,
            total_membros: parseInt(row.total_membros) || 0,
            criador_nome: row.criador_nome
        };
    }

    async listarPorUsuario(usuarioId: string, limite: number = 20, offset: number = 0): Promise<IGrupo[]> {
        const query = `
            SELECT DISTINCT g.*, 
                   u.nome as criador_nome,
                   mg.nivel_permissao,
                   (SELECT COUNT(*) FROM membros_grupo WHERE grupo_id = g.id AND ativo = true) as membros_count,
                   (SELECT COUNT(*) FROM mensagens m WHERE m.grupo_id = g.id) as total_mensagens
            FROM grupos g
            LEFT JOIN usuarios u ON g.criador_id = u.id
            LEFT JOIN membros_grupo mg ON g.id = mg.grupo_id AND mg.usuario_id = $1
            WHERE (g.criador_id = $1 OR (mg.usuario_id = $1 AND mg.ativo = true))
            ORDER BY g.data_atualizacao DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await this.db.query(query, [usuarioId, limite, offset]);
        
        return result.rows.map((row: any) => ({
            id: row.id,
            nome: row.nome,
            descricao: row.descricao,
            tipo: row.tipo_grupo, // Mapear tipo_grupo para tipo
            configuracoes: {},
            criador_id: row.criador_id,
            criado_em: row.data_criacao,
            atualizado_em: row.data_atualizacao,
            membros_count: parseInt(row.membros_count) || 0,
            mensagens_nao_lidas: 0, // Remover leituras_mensagem por enquanto
            ultima_atividade: row.data_atualizacao,
            membro_admin: row.nivel_permissao === 'admin'
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
        
        if (dados.tipo) {
            campos.push(`tipo_grupo = $${contador++}`);
            valores.push(dados.tipo);
        }
        
        if (dados.configuracoes) {
            campos.push(`configuracoes = $${contador++}`);
            valores.push(JSON.stringify(dados.configuracoes));
        }

        if (campos.length === 0) {
            return false;
        }

        campos.push(`data_atualizacao = NOW()`);
        valores.push(id);

        const query = `
            UPDATE grupos 
            SET ${campos.join(', ')}
            WHERE id = $${contador} AND deletado_em IS NULL
        `;

        const result = await this.db.query(query, valores);
        return result.rowCount > 0;
    }

    async deletar(id: string): Promise<boolean> {
        const query = `
            UPDATE grupos 
            SET deletado_em = NOW(), atualizado_em = NOW()
            WHERE id = $1 AND deletado_em IS NULL
        `;
        
        const result = await this.db.query(query, [id]);
        return result.rowCount > 0;
    }

    // ============================================
    // GESTÃO DE MEMBROS
    // ============================================

    async adicionarMembro(grupoMembro: IGrupoMembro): Promise<boolean> {
        const query = `
            INSERT INTO membros_grupo (grupo_id, usuario_id, nivel_permissao)
            VALUES ($1, $2, $3)
            ON CONFLICT (grupo_id, usuario_id) DO UPDATE SET
                nivel_permissao = EXCLUDED.nivel_permissao,
                ativo = true
        `;
        
        const result = await this.db.query(query, [
            grupoMembro.grupo_id,
            grupoMembro.usuario_id,
            grupoMembro.nivel_permissao || 'membro'
        ]);

        return result.rowCount > 0;
    }

    async entrarGrupoPublico(grupoId: string, usuarioId: string): Promise<boolean> {
        // Verificar se o grupo existe e é público
        const verificarQuery = `
            SELECT tipo_grupo FROM grupos 
            WHERE id = $1 AND tipo_grupo = 'publico' AND deletado_em IS NULL
        `;
        
        const verificacao = await this.db.query(verificarQuery, [grupoId]);
        
        if (verificacao.rows.length === 0) {
            return false; // Grupo não existe ou não é público
        }

        // Adicionar como membro
        return await this.adicionarMembro({
            grupo_id: grupoId,
            usuario_id: usuarioId,
            nivel_permissao: 'membro'
        });
    }

    async removerMembro(grupoId: string, usuarioId: string): Promise<boolean> {
        const query = `
            DELETE FROM membros_grupo 
            WHERE grupo_id = $1 AND usuario_id = $2
        `;
        
        const result = await this.db.query(query, [grupoId, usuarioId]);
        return result.rowCount > 0;
    }

    async alterarNivelMembro(grupoId: string, usuarioId: string, novoNivel: string): Promise<boolean> {
        const query = `
            UPDATE membros_grupo 
            SET nivel_permissao = $3
            WHERE grupo_id = $1 AND usuario_id = $2
        `;
        
        const result = await this.db.query(query, [grupoId, usuarioId, novoNivel]);
        return result.rowCount > 0;
    }

    async listarMembros(grupoId: string): Promise<any[]> {
        const query = `
            SELECT mg.*, 
                   u.nome, u.email, u.foto_perfil, u.status_ativo,
                   mg.data_entrada as membro_desde
            FROM membros_grupo mg
            JOIN usuarios u ON mg.usuario_id = u.id
            WHERE mg.grupo_id = $1 AND mg.ativo = true AND u.status_ativo = true
            ORDER BY 
                CASE mg.nivel_permissao 
                    WHEN 'admin' THEN 1
                    WHEN 'moderador' THEN 2
                    ELSE 3
                END,
                mg.data_entrada ASC
        `;
        
        const result = await this.db.query(query, [grupoId]);
        
        return result.rows.map((row: any) => ({
            id: row.id,
            usuario_id: row.usuario_id,
            grupo_id: row.grupo_id,
            papel: row.nivel_permissao,
            data_entrada: row.data_entrada,
            membro_desde: row.membro_desde,
            usuario: {
                id: row.usuario_id,
                nome: row.nome,
                email: row.email,
                foto_perfil: row.foto_perfil,
                status_ativo: row.status_ativo
            }
        }));
    }

    async verificarPermissao(grupoId: string, usuarioId: string): Promise<IGrupoMembro | null> {
        const query = `
            SELECT *, nivel_permissao as papel,
                   CASE WHEN nivel_permissao IN ('admin', 'moderador') THEN true ELSE false END as pode_convidar,
                   CASE WHEN nivel_permissao IN ('admin', 'moderador') THEN true ELSE false END as pode_remover,
                   CASE WHEN nivel_permissao = 'admin' THEN true ELSE false END as pode_configurar
            FROM membros_grupo
            WHERE grupo_id = $1 AND usuario_id = $2
        `;
        
        const result = await this.db.query(query, [grupoId, usuarioId]);
        
        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    }

    // ============================================
    // BUSCA E FILTROS
    // ============================================

    async buscarPublicos(termo: string = '', limite: number = 20, offset: number = 0, usuarioId?: string): Promise<IGrupo[]> {
        let query = `
            SELECT g.*, 
                   u.nome as criador_nome,
                   (SELECT COUNT(*) FROM membros_grupo WHERE grupo_id = g.id) as total_membros
            FROM grupos g
            LEFT JOIN usuarios u ON g.criador_id = u.id
            WHERE g.tipo_grupo = 'publico' 
              AND g.deletado_em IS NULL
              AND (g.nome ILIKE $1 OR g.descricao ILIKE $1)
        `;
        
        const valores = [`%${termo}%`];
        
        // Se usuário fornecido, excluir grupos onde ele já é membro
        if (usuarioId) {
            query += ` AND g.id NOT IN (
                SELECT DISTINCT mg.grupo_id 
                FROM membros_grupo mg 
                WHERE mg.usuario_id = $${valores.length + 1} AND mg.ativo = true
            )`;
            valores.push(usuarioId);
        }
        
        query += ` ORDER BY total_membros DESC, g.data_criacao DESC
            LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`;
        
        valores.push(limite.toString(), offset.toString());
        
        const result = await this.db.query(query, valores);
        
        return result.rows.map((row: any) => ({
            id: row.id,
            nome: row.nome,
            descricao: row.descricao,
            tipo: row.tipo_grupo,
            configuracoes: {},
            criador_id: row.criador_id,
            criado_em: row.data_criacao,
            atualizado_em: row.data_atualizacao,
            total_membros: parseInt(row.total_membros) || 0,
            criador_nome: row.criador_nome
        }));
    }

    // ============================================
    // ESTATÍSTICAS
    // ============================================

    async obterEstatisticas(grupoId: string): Promise<any> {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM membros_grupo WHERE grupo_id = $1) as total_membros,
                (SELECT COUNT(*) FROM mensagens WHERE grupo_id = $1) as total_mensagens,
                (SELECT COUNT(*) FROM tarefas WHERE grupo_id = $1) as total_tarefas,
                (SELECT COUNT(*) FROM arquivos WHERE grupo_id = $1) as total_arquivos
        `;
        
        const result = await this.db.query(query, [grupoId]);
        return result.rows[0];
    }
}
