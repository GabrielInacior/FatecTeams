import { DatabaseConfig } from '../config/database';

export interface IConvite {
    id?: string;
    grupo_id: string;
    convidado_por: string;
    email_convidado: string;
    usuario_convidado_id?: string;
    codigo_convite: string;
    status?: 'pendente' | 'aceito' | 'recusado' | 'expirado';
    mensagem_personalizada?: string;
    data_criacao?: Date;
    data_expiracao: Date;
    data_resposta?: Date;
}

export class ConviteRepository {
    private db: DatabaseConfig;

    constructor() {
        this.db = DatabaseConfig.getInstance();
    }

    // ============================================
    // CRUD BÁSICO DE CONVITES
    // ============================================

    async criar(convite: IConvite): Promise<string> {
        const query = `
            INSERT INTO convites_grupo (
                grupo_id, convidado_por, email_convidado, usuario_convidado_id,
                codigo_convite, status, mensagem_personalizada, data_expiracao
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `;
        
        const result = await this.db.query(query, [
            convite.grupo_id,
            convite.convidado_por,
            convite.email_convidado,
            convite.usuario_convidado_id || null,
            convite.codigo_convite,
            convite.status || 'pendente',
            convite.mensagem_personalizada || null,
            convite.data_expiracao
        ]);

        return result.rows[0].id;
    }

    async buscarPorId(id: string): Promise<IConvite | null> {
        const query = `
            SELECT * FROM convites_grupo 
            WHERE id = $1
        `;
        
        const result = await this.db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const convite = result.rows[0];
        return {
            id: convite.id,
            grupo_id: convite.grupo_id,
            convidado_por: convite.convidado_por,
            email_convidado: convite.email_convidado,
            usuario_convidado_id: convite.usuario_convidado_id,
            codigo_convite: convite.codigo_convite,
            status: convite.status,
            mensagem_personalizada: convite.mensagem_personalizada,
            data_criacao: convite.data_criacao,
            data_expiracao: convite.data_expiracao,
            data_resposta: convite.data_resposta
        };
    }

    async buscarPorCodigo(codigo: string): Promise<IConvite | null> {
        const query = `
            SELECT * FROM convites_grupo 
            WHERE codigo_convite = $1
        `;
        
        const result = await this.db.query(query, [codigo]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const convite = result.rows[0];
        return {
            id: convite.id,
            grupo_id: convite.grupo_id,
            convidado_por: convite.convidado_por,
            email_convidado: convite.email_convidado,
            usuario_convidado_id: convite.usuario_convidado_id,
            codigo_convite: convite.codigo_convite,
            status: convite.status,
            mensagem_personalizada: convite.mensagem_personalizada,
            data_criacao: convite.data_criacao,
            data_expiracao: convite.data_expiracao,
            data_resposta: convite.data_resposta
        };
    }

    async listarPorEmail(email: string, status?: string): Promise<IConvite[]> {
        let query = `
            SELECT cg.*, g.nome as grupo_nome, u.nome as convidado_por_nome
            FROM convites_grupo cg
            JOIN grupos g ON cg.grupo_id = g.id
            JOIN usuarios u ON cg.convidado_por = u.id
            WHERE cg.email_convidado = $1
        `;
        const params: any[] = [email];

        if (status) {
            query += ` AND cg.status = $2`;
            params.push(status);
        }

        query += ` ORDER BY cg.data_criacao DESC`;

        const result = await this.db.query(query, params);
        
        return result.rows.map((convite: any) => ({
            id: convite.id,
            grupo_id: convite.grupo_id,
            convidado_por: convite.convidado_por,
            email_convidado: convite.email_convidado,
            usuario_convidado_id: convite.usuario_convidado_id,
            codigo_convite: convite.codigo_convite,
            status: convite.status,
            mensagem_personalizada: convite.mensagem_personalizada,
            data_criacao: convite.data_criacao,
            data_expiracao: convite.data_expiracao,
            data_resposta: convite.data_resposta,
            // Dados extras
            grupo_nome: convite.grupo_nome,
            convidado_por_nome: convite.convidado_por_nome
        }));
    }

    async listarPorGrupo(grupoId: string): Promise<any[]> {
        const query = `
            SELECT cg.*, u.nome as convidado_por_nome, u.email as convidado_por_email
            FROM convites_grupo cg
            JOIN usuarios u ON cg.convidado_por = u.id
            WHERE cg.grupo_id = $1
            ORDER BY cg.data_criacao DESC
        `;
        
        const result = await this.db.query(query, [grupoId]);
        
        return result.rows.map((convite: any) => ({
            id: convite.id,
            codigo_convite: convite.codigo_convite,
            email_convidado: convite.email_convidado,
            status: convite.status,
            mensagem_personalizada: convite.mensagem_personalizada,
            data_criacao: convite.data_criacao,
            data_expiracao: convite.data_expiracao,
            data_resposta: convite.data_resposta,
            convidado_por: {
                id: convite.convidado_por,
                nome: convite.convidado_por_nome,
                email: convite.convidado_por_email
            }
        }));
    }

    async verificarConviteExistente(grupoId: string, email: string): Promise<IConvite | null> {
        const query = `
            SELECT * FROM convites_grupo 
            WHERE grupo_id = $1 AND email_convidado = $2 AND status = 'pendente'
            AND data_expiracao > NOW()
        `;
        
        const result = await this.db.query(query, [grupoId, email]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const convite = result.rows[0];
        return {
            id: convite.id,
            grupo_id: convite.grupo_id,
            convidado_por: convite.convidado_por,
            email_convidado: convite.email_convidado,
            usuario_convidado_id: convite.usuario_convidado_id,
            codigo_convite: convite.codigo_convite,
            status: convite.status,
            mensagem_personalizada: convite.mensagem_personalizada,
            data_criacao: convite.data_criacao,
            data_expiracao: convite.data_expiracao,
            data_resposta: convite.data_resposta
        };
    }

    async atualizarStatus(codigo: string, status: 'aceito' | 'recusado', usuarioId?: string): Promise<boolean> {
        let query = `
            UPDATE convites_grupo 
            SET status = $2, data_resposta = NOW()
        `;
        const params: any[] = [codigo, status];

        if (usuarioId) {
            query += `, usuario_convidado_id = $3`;
            params.push(usuarioId);
        }

        query += ` WHERE codigo_convite = $1 AND status = 'pendente'`;

        const result = await this.db.query(query, params);
        return result.rowCount > 0;
    }

    async deletar(id: string): Promise<boolean> {
        const query = `
            DELETE FROM convites_grupo 
            WHERE id = $1
        `;
        
        const result = await this.db.query(query, [id]);
        return result.rowCount > 0;
    }

    async deletarPorCodigo(codigo: string): Promise<boolean> {
        const query = `
            DELETE FROM convites_grupo 
            WHERE codigo_convite = $1
        `;
        
        const result = await this.db.query(query, [codigo]);
        return result.rowCount > 0;
    }

    // ============================================
    // MÉTODOS UTILITÁRIOS
    // ============================================

    async expirarConvitesAntigos(): Promise<number> {
        const query = `
            UPDATE convites_grupo 
            SET status = 'expirado'
            WHERE status = 'pendente' AND data_expiracao < NOW()
        `;
        
        const result = await this.db.query(query);
        return result.rowCount;
    }

    async obterEstatisticasGrupo(grupoId: string): Promise<any> {
        const query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
                COUNT(CASE WHEN status = 'aceito' THEN 1 END) as aceitos,
                COUNT(CASE WHEN status = 'recusado' THEN 1 END) as recusados,
                COUNT(CASE WHEN status = 'expirado' THEN 1 END) as expirados
            FROM convites_grupo 
            WHERE grupo_id = $1
        `;
        
        const result = await this.db.query(query, [grupoId]);
        const stats = result.rows[0];

        return {
            total: parseInt(stats.total),
            pendentes: parseInt(stats.pendentes),
            aceitos: parseInt(stats.aceitos),
            recusados: parseInt(stats.recusados),
            expirados: parseInt(stats.expirados)
        };
    }

    async buscarConvitesExpirandoEm24h(): Promise<IConvite[]> {
        const query = `
            SELECT * FROM convites_grupo 
            WHERE status = 'pendente' 
            AND data_expiracao BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
            ORDER BY data_expiracao ASC
        `;
        
        const result = await this.db.query(query);
        
        return result.rows.map((convite: any) => ({
            id: convite.id,
            grupo_id: convite.grupo_id,
            convidado_por: convite.convidado_por,
            email_convidado: convite.email_convidado,
            usuario_convidado_id: convite.usuario_convidado_id,
            codigo_convite: convite.codigo_convite,
            status: convite.status,
            mensagem_personalizada: convite.mensagem_personalizada,
            data_criacao: convite.data_criacao,
            data_expiracao: convite.data_expiracao,
            data_resposta: convite.data_resposta
        }));
    }

    async vincularUsuario(codigo: string, usuarioId: string): Promise<boolean> {
        const query = `
            UPDATE convites_grupo 
            SET usuario_convidado_id = $2
            WHERE codigo_convite = $1
        `;
        
        const result = await this.db.query(query, [codigo, usuarioId]);
        return result.rowCount > 0;
    }

    async listarPorUsuario(usuarioId: string, email: string): Promise<IConvite[]> {
        const query = `
            SELECT cg.*, 
                   g.nome as grupo_nome,
                   g.descricao as grupo_descricao,
                   u.nome as convidado_por_nome
            FROM convites_grupo cg
            LEFT JOIN grupos g ON cg.grupo_id = g.id
            LEFT JOIN usuarios u ON cg.convidado_por = u.id
            WHERE (cg.usuario_convidado_id = $1 OR cg.email_convidado = $2)
              AND cg.status = 'pendente' 
              AND cg.data_expiracao > NOW()
            ORDER BY cg.data_criacao DESC
        `;
        
        const result = await this.db.query(query, [usuarioId, email]);
        
        return result.rows.map((row: any) => ({
            id: row.id,
            grupo_id: row.grupo_id,
            convidado_por: row.convidado_por,
            email_convidado: row.email_convidado,
            usuario_convidado_id: row.usuario_convidado_id,
            codigo_convite: row.codigo_convite,
            status: row.status,
            mensagem_personalizada: row.mensagem_personalizada,
            data_criacao: row.data_criacao,
            data_expiracao: row.data_expiracao,
            data_resposta: row.data_resposta,
            grupo_nome: row.grupo_nome,
            grupo_descricao: row.grupo_descricao,
            convidado_por_nome: row.convidado_por_nome
        }));
    }

    async verificarConvitePendente(grupoId: string, email: string): Promise<boolean> {
        const query = `
            SELECT id FROM convites_grupo 
            WHERE grupo_id = $1 AND email_convidado = $2 
              AND status = 'pendente' AND data_expiracao > NOW()
        `;
        
        const result = await this.db.query(query, [grupoId, email]);
        return result.rows.length > 0;
    }

    async cancelarConvite(codigo: string, usuarioId: string): Promise<boolean> {
        const query = `
            UPDATE convites_grupo 
            SET status = 'expirado'
            WHERE codigo_convite = $1 AND convidado_por = $2 AND status = 'pendente'
        `;
        
        const result = await this.db.query(query, [codigo, usuarioId]);
        return result.rowCount > 0;
    }
}
