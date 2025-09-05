import { DatabaseConfig } from '../config/database';

export interface IHistoricoAtividade {
    id?: string;
    usuario_id: string;
    grupo_id?: string;
    acao: string;
    entidade_tipo?: string;
    entidade_id?: string;
    detalhes?: any;
    ip_origem?: string;
    user_agent?: string;
    data_acao?: Date;
}

export class HistoricoAtividadeRepository {
    private db: DatabaseConfig;

    constructor() {
        this.db = DatabaseConfig.getInstance();
    }

    // ============================================
    // CRIAR REGISTRO DE ATIVIDADE
    // ============================================

    async registrar(atividade: IHistoricoAtividade): Promise<string> {
        const query = `
            INSERT INTO historico_atividades (
                usuario_id, grupo_id, acao, entidade_tipo, entidade_id,
                detalhes, ip_origem, user_agent
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `;
        
        const result = await this.db.query(query, [
            atividade.usuario_id,
            atividade.grupo_id || null,
            atividade.acao,
            atividade.entidade_tipo || null,
            atividade.entidade_id || null,
            JSON.stringify(atividade.detalhes || {}),
            atividade.ip_origem || null,
            atividade.user_agent || null
        ]);

        return result.rows[0].id;
    }

    // ============================================
    // LISTAR ATIVIDADES
    // ============================================

    async listarPorUsuario(
        usuarioId: string,
        filtros: {
            limite?: number;
            offset?: number;
            data_inicio?: Date;
            data_fim?: Date;
            grupo_id?: string;
            acao?: string;
        } = {}
    ): Promise<{ atividades: any[]; total: number }> {
        let query = `
            SELECT ha.*, u.nome as usuario_nome, g.nome as grupo_nome
            FROM historico_atividades ha
            LEFT JOIN usuarios u ON ha.usuario_id = u.id
            LEFT JOIN grupos g ON ha.grupo_id = g.id
            WHERE ha.usuario_id = $1
        `;
        const params: any[] = [usuarioId];
        let paramCount = 1;

        if (filtros.data_inicio) {
            paramCount++;
            query += ` AND ha.data_acao >= $${paramCount}`;
            params.push(filtros.data_inicio);
        }

        if (filtros.data_fim) {
            paramCount++;
            query += ` AND ha.data_acao <= $${paramCount}`;
            params.push(filtros.data_fim);
        }

        if (filtros.grupo_id) {
            paramCount++;
            query += ` AND ha.grupo_id = $${paramCount}`;
            params.push(filtros.grupo_id);
        }

        if (filtros.acao) {
            paramCount++;
            query += ` AND ha.acao = $${paramCount}`;
            params.push(filtros.acao);
        }

        // Contar total
        const countQuery = query.replace(
            'SELECT ha.*, u.nome as usuario_nome, g.nome as grupo_nome',
            'SELECT COUNT(*)'
        );
        const countResult = await this.db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Aplicar ordenação e paginação
        query += ` ORDER BY ha.data_acao DESC`;
        
        if (filtros.limite) {
            paramCount++;
            query += ` LIMIT $${paramCount}`;
            params.push(filtros.limite);
        }

        if (filtros.offset) {
            paramCount++;
            query += ` OFFSET $${paramCount}`;
            params.push(filtros.offset);
        }

        const result = await this.db.query(query, params);
        
        const atividades = result.rows.map((ativ: any) => ({
            id: ativ.id,
            usuario_id: ativ.usuario_id,
            grupo_id: ativ.grupo_id,
            acao: ativ.acao,
            entidade_tipo: ativ.entidade_tipo,
            entidade_id: ativ.entidade_id,
            detalhes: ativ.detalhes,
            ip_origem: ativ.ip_origem,
            user_agent: ativ.user_agent,
            data_acao: ativ.data_acao,
            usuario_nome: ativ.usuario_nome,
            grupo_nome: ativ.grupo_nome
        }));

        return { atividades, total };
    }

    async listarPorGrupo(
        grupoId: string,
        filtros: {
            limite?: number;
            offset?: number;
            data_inicio?: Date;
            data_fim?: Date;
            usuario_id?: string;
            acao?: string;
        } = {}
    ): Promise<{ atividades: any[]; total: number }> {
        let query = `
            SELECT ha.*, u.nome as usuario_nome, u.email as usuario_email
            FROM historico_atividades ha
            LEFT JOIN usuarios u ON ha.usuario_id = u.id
            WHERE ha.grupo_id = $1
        `;
        const params: any[] = [grupoId];
        let paramCount = 1;

        if (filtros.data_inicio) {
            paramCount++;
            query += ` AND ha.data_acao >= $${paramCount}`;
            params.push(filtros.data_inicio);
        }

        if (filtros.data_fim) {
            paramCount++;
            query += ` AND ha.data_acao <= $${paramCount}`;
            params.push(filtros.data_fim);
        }

        if (filtros.usuario_id) {
            paramCount++;
            query += ` AND ha.usuario_id = $${paramCount}`;
            params.push(filtros.usuario_id);
        }

        if (filtros.acao) {
            paramCount++;
            query += ` AND ha.acao = $${paramCount}`;
            params.push(filtros.acao);
        }

        // Contar total
        const countQuery = query.replace(
            'SELECT ha.*, u.nome as usuario_nome, u.email as usuario_email',
            'SELECT COUNT(*)'
        );
        const countResult = await this.db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Aplicar ordenação e paginação
        query += ` ORDER BY ha.data_acao DESC`;
        
        if (filtros.limite) {
            paramCount++;
            query += ` LIMIT $${paramCount}`;
            params.push(filtros.limite);
        }

        if (filtros.offset) {
            paramCount++;
            query += ` OFFSET $${paramCount}`;
            params.push(filtros.offset);
        }

        const result = await this.db.query(query, params);
        
        const atividades = result.rows.map((ativ: any) => ({
            id: ativ.id,
            usuario_id: ativ.usuario_id,
            grupo_id: ativ.grupo_id,
            acao: ativ.acao,
            entidade_tipo: ativ.entidade_tipo,
            entidade_id: ativ.entidade_id,
            detalhes: ativ.detalhes,
            ip_origem: ativ.ip_origem,
            user_agent: ativ.user_agent,
            data_acao: ativ.data_acao,
            usuario_nome: ativ.usuario_nome,
            usuario_email: ativ.usuario_email
        }));

        return { atividades, total };
    }

    // ============================================
    // RELATÓRIOS E ESTATÍSTICAS
    // ============================================

    async obterEstatisticasUsuario(usuarioId: string, dias: number = 30): Promise<any> {
        const query = `
            SELECT 
                COUNT(*) as total_atividades,
                COUNT(DISTINCT grupo_id) as grupos_ativos,
                COUNT(CASE WHEN acao LIKE '%criar%' THEN 1 END) as acoes_criar,
                COUNT(CASE WHEN acao LIKE '%atualizar%' THEN 1 END) as acoes_atualizar,
                COUNT(CASE WHEN acao LIKE '%deletar%' THEN 1 END) as acoes_deletar,
                COUNT(CASE WHEN acao LIKE '%mensagem%' THEN 1 END) as mensagens,
                COUNT(CASE WHEN acao LIKE '%tarefa%' THEN 1 END) as tarefas,
                COUNT(CASE WHEN acao LIKE '%arquivo%' THEN 1 END) as arquivos
            FROM historico_atividades 
            WHERE usuario_id = $1 
            AND data_acao >= NOW() - INTERVAL '${dias} days'
        `;
        
        const result = await this.db.query(query, [usuarioId]);
        const stats = result.rows[0];

        return {
            total_atividades: parseInt(stats.total_atividades),
            grupos_ativos: parseInt(stats.grupos_ativos),
            acoes: {
                criar: parseInt(stats.acoes_criar),
                atualizar: parseInt(stats.acoes_atualizar),
                deletar: parseInt(stats.acoes_deletar)
            },
            por_tipo: {
                mensagens: parseInt(stats.mensagens),
                tarefas: parseInt(stats.tarefas),
                arquivos: parseInt(stats.arquivos)
            }
        };
    }

    async obterEstatisticasGrupo(grupoId: string, dias: number = 30): Promise<any> {
        const query = `
            SELECT 
                COUNT(*) as total_atividades,
                COUNT(DISTINCT usuario_id) as usuarios_ativos,
                COUNT(CASE WHEN acao LIKE '%mensagem%' THEN 1 END) as mensagens,
                COUNT(CASE WHEN acao LIKE '%tarefa%' THEN 1 END) as tarefas,
                COUNT(CASE WHEN acao LIKE '%arquivo%' THEN 1 END) as arquivos,
                COUNT(CASE WHEN acao LIKE '%evento%' THEN 1 END) as eventos
            FROM historico_atividades 
            WHERE grupo_id = $1 
            AND data_acao >= NOW() - INTERVAL '${dias} days'
        `;
        
        const result = await this.db.query(query, [grupoId]);
        const stats = result.rows[0];

        return {
            total_atividades: parseInt(stats.total_atividades),
            usuarios_ativos: parseInt(stats.usuarios_ativos),
            por_tipo: {
                mensagens: parseInt(stats.mensagens),
                tarefas: parseInt(stats.tarefas),
                arquivos: parseInt(stats.arquivos),
                eventos: parseInt(stats.eventos)
            }
        };
    }

    async obterAtividadePorDia(
        filtros: {
            usuario_id?: string;
            grupo_id?: string;
            data_inicio?: Date;
            data_fim?: Date;
        } = {}
    ): Promise<any[]> {
        let query = `
            SELECT 
                DATE(data_acao) as data,
                COUNT(*) as total,
                COUNT(CASE WHEN acao LIKE '%mensagem%' THEN 1 END) as mensagens,
                COUNT(CASE WHEN acao LIKE '%tarefa%' THEN 1 END) as tarefas,
                COUNT(CASE WHEN acao LIKE '%arquivo%' THEN 1 END) as arquivos
            FROM historico_atividades 
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramCount = 0;

        if (filtros.usuario_id) {
            paramCount++;
            query += ` AND usuario_id = $${paramCount}`;
            params.push(filtros.usuario_id);
        }

        if (filtros.grupo_id) {
            paramCount++;
            query += ` AND grupo_id = $${paramCount}`;
            params.push(filtros.grupo_id);
        }

        if (filtros.data_inicio) {
            paramCount++;
            query += ` AND data_acao >= $${paramCount}`;
            params.push(filtros.data_inicio);
        }

        if (filtros.data_fim) {
            paramCount++;
            query += ` AND data_acao <= $${paramCount}`;
            params.push(filtros.data_fim);
        }

        query += ` GROUP BY DATE(data_acao) ORDER BY DATE(data_acao) ASC`;

        const result = await this.db.query(query, params);
        
        return result.rows.map((row: any) => ({
            data: row.data,
            total: parseInt(row.total),
            mensagens: parseInt(row.mensagens),
            tarefas: parseInt(row.tarefas),
            arquivos: parseInt(row.arquivos)
        }));
    }

    // ============================================
    // LIMPEZA E MANUTENÇÃO
    // ============================================

    async limparAtividadesAntigas(meses: number = 6): Promise<number> {
        const query = `
            DELETE FROM historico_atividades 
            WHERE data_acao < NOW() - INTERVAL '${meses} months'
        `;
        
        const result = await this.db.query(query);
        return result.rowCount;
    }

    async obterTop10UsuariosMaisAtivos(grupoId?: string, dias: number = 30): Promise<any[]> {
        let query = `
            SELECT 
                ha.usuario_id,
                u.nome,
                u.email,
                COUNT(*) as total_atividades,
                MAX(ha.data_acao) as ultima_atividade
            FROM historico_atividades ha
            JOIN usuarios u ON ha.usuario_id = u.id
            WHERE ha.data_acao >= NOW() - INTERVAL '${dias} days'
        `;
        const params: any[] = [];

        if (grupoId) {
            query += ` AND ha.grupo_id = $1`;
            params.push(grupoId);
        }

        query += `
            GROUP BY ha.usuario_id, u.nome, u.email
            ORDER BY total_atividades DESC
            LIMIT 10
        `;

        const result = await this.db.query(query, params);
        
        return result.rows.map((row: any) => ({
            usuario_id: row.usuario_id,
            nome: row.nome,
            email: row.email,
            total_atividades: parseInt(row.total_atividades),
            ultima_atividade: row.ultima_atividade
        }));
    }
}
