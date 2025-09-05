import { DatabaseConfig } from '../config/database';

export interface IGrupo {
    id?: string;
    nome: string;
    descricao?: string;
    tipo: 'publico' | 'privado' | 'fechado';
    configuracoes: any;
    criado_por: string;
    criado_em?: Date;
    atualizado_em?: Date;
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
            INSERT INTO grupos (nome, descricao, tipo, configuracoes, criado_por)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `;
        
        const result = await this.db.query(query, [
            grupo.nome,
            grupo.descricao || null,
            grupo.tipo,
            JSON.stringify(grupo.configuracoes || {}),
            grupo.criado_por
        ]);

        return result.rows[0].id;
    }

    async buscarPorId(id: string): Promise<IGrupo | null> {
        const query = `
            SELECT g.*, 
                   u.nome as criador_nome,
                   u.email as criador_email,
                   (SELECT COUNT(*) FROM grupos_membros WHERE grupo_id = g.id) as total_membros
            FROM grupos g
            LEFT JOIN usuarios u ON g.criado_por = u.id
            WHERE g.id = $1 AND g.deletado_em IS NULL
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
            tipo: row.tipo,
            configuracoes: JSON.parse(row.configuracoes || '{}'),
            criado_por: row.criado_por,
            criado_em: row.criado_em,
            atualizado_em: row.atualizado_em
        };
    }

    async listarPorUsuario(usuarioId: string, limite: number = 20, offset: number = 0): Promise<IGrupo[]> {
        const query = `
            SELECT DISTINCT g.*, 
                   u.nome as criador_nome,
                   gm.papel,
                   (SELECT COUNT(*) FROM grupos_membros WHERE grupo_id = g.id) as total_membros
            FROM grupos g
            LEFT JOIN usuarios u ON g.criado_por = u.id
            LEFT JOIN grupos_membros gm ON g.id = gm.grupo_id AND gm.usuario_id = $1
            WHERE (g.criado_por = $1 OR gm.usuario_id = $1) 
              AND g.deletado_em IS NULL
            ORDER BY g.atualizado_em DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await this.db.query(query, [usuarioId, limite, offset]);
        
        return result.rows.map((row: any) => ({
            id: row.id,
            nome: row.nome,
            descricao: row.descricao,
            tipo: row.tipo,
            configuracoes: JSON.parse(row.configuracoes || '{}'),
            criado_por: row.criado_por,
            criado_em: row.criado_em,
            atualizado_em: row.atualizado_em
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
            campos.push(`tipo = $${contador++}`);
            valores.push(dados.tipo);
        }
        
        if (dados.configuracoes) {
            campos.push(`configuracoes = $${contador++}`);
            valores.push(JSON.stringify(dados.configuracoes));
        }

        if (campos.length === 0) {
            return false;
        }

        campos.push(`atualizado_em = NOW()`);
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
                nivel_permissao = EXCLUDED.nivel_permissao
        `;
        
        const result = await this.db.query(query, [
            grupoMembro.grupo_id,
            grupoMembro.usuario_id,
            grupoMembro.nivel_permissao || 'membro'
        ]);

        return result.rowCount > 0;
    }

    async removerMembro(grupoId: string, usuarioId: string): Promise<boolean> {
        const query = `
            DELETE FROM membros_grupo 
            WHERE grupo_id = $1 AND usuario_id = $2
        `;
        
        const result = await this.db.query(query, [grupoId, usuarioId]);
        return result.rowCount > 0;
    }

    async listarMembros(grupoId: string): Promise<any[]> {
        const query = `
            SELECT gm.*, 
                   u.nome, u.email, u.avatar_url, u.status,
                   u.ultimo_acesso, gm.criado_em as membro_desde
            FROM grupos_membros gm
            JOIN usuarios u ON gm.usuario_id = u.id
            WHERE gm.grupo_id = $1 AND u.deletado_em IS NULL
            ORDER BY 
                CASE gm.papel 
                    WHEN 'admin' THEN 1
                    WHEN 'moderador' THEN 2
                    ELSE 3
                END,
                gm.criado_em ASC
        `;
        
        const result = await this.db.query(query, [grupoId]);
        return result.rows;
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

    async buscarPublicos(termo: string = '', limite: number = 20, offset: number = 0): Promise<IGrupo[]> {
        const query = `
            SELECT g.*, 
                   u.nome as criador_nome,
                   (SELECT COUNT(*) FROM grupos_membros WHERE grupo_id = g.id) as total_membros
            FROM grupos g
            LEFT JOIN usuarios u ON g.criado_por = u.id
            WHERE g.tipo = 'publico' 
              AND g.deletado_em IS NULL
              AND (g.nome ILIKE $1 OR g.descricao ILIKE $1)
            ORDER BY total_membros DESC, g.criado_em DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await this.db.query(query, [`%${termo}%`, limite, offset]);
        
        return result.rows.map((row: any) => ({
            id: row.id,
            nome: row.nome,
            descricao: row.descricao,
            tipo: row.tipo,
            configuracoes: JSON.parse(row.configuracoes || '{}'),
            criado_por: row.criado_por,
            criado_em: row.criado_em,
            atualizado_em: row.atualizado_em
        }));
    }

    // ============================================
    // ESTATÍSTICAS
    // ============================================

    async obterEstatisticas(grupoId: string): Promise<any> {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM grupos_membros WHERE grupo_id = $1) as total_membros,
                (SELECT COUNT(*) FROM mensagens WHERE grupo_id = $1 AND deletado_em IS NULL) as total_mensagens,
                (SELECT COUNT(*) FROM tarefas WHERE grupo_id = $1 AND deletado_em IS NULL) as total_tarefas,
                (SELECT COUNT(*) FROM arquivos WHERE grupo_id = $1 AND deletado_em IS NULL) as total_arquivos
        `;
        
        const result = await this.db.query(query, [grupoId]);
        return result.rows[0];
    }
}
