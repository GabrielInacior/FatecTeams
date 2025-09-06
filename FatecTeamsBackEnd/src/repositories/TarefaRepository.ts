import { DatabaseConfig } from '../config/database';

export interface ITarefa {
    id?: string;
    titulo: string;
    descricao?: string;
    status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
    prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
    data_vencimento?: Date;
    grupo_id: string;
    criador_id: string;  // Alinhar com migration
    assignado_para?: string;
    etiquetas?: string[];
    estimativa_horas?: number;
    horas_trabalhadas?: number;
    anexos?: string[];
    data_criacao?: Date;
    deletado_em?: Date;
}

export interface IComentarioTarefa {
    id?: string;
    tarefa_id: string;
    usuario_id: string;
    conteudo: string;
    criado_em?: Date;
}

export class TarefaRepository {
    private db: DatabaseConfig;

    constructor() {
        this.db = DatabaseConfig.getInstance();
    }

    // ============================================
    // CRUD BÁSICO DE TAREFAS
    // ============================================

    async criar(tarefa: ITarefa): Promise<string> {
        const query = `
            INSERT INTO tarefas (
                titulo, descricao, status, prioridade, data_vencimento,
                grupo_id, criador_id, assignado_para, etiquetas, 
                estimativa_horas, anexos
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
        `;
        
        const result = await this.db.query(query, [
            tarefa.titulo,
            tarefa.descricao || null,
            tarefa.status,
            tarefa.prioridade,
            tarefa.data_vencimento || null,
            tarefa.grupo_id,
            tarefa.criador_id,
            tarefa.assignado_para || null,
            JSON.stringify(tarefa.etiquetas || []),
            tarefa.estimativa_horas || null,
            JSON.stringify(tarefa.anexos || [])
        ]);

        return result.rows[0].id;
    }

    async buscarPorId(id: string): Promise<any | null> {
        const query = `
            SELECT t.*, 
                   uc.nome as criador_nome,
                   uc.foto_perfil as criador_foto,
                   ua.nome as assignado_nome,
                   ua.foto_perfil as assignado_foto,
                   ua.email as assignado_email,
                   g.nome as grupo_nome
            FROM tarefas t
            LEFT JOIN usuarios uc ON t.criador_id = uc.id
            LEFT JOIN usuarios ua ON t.assignado_para = ua.id
            LEFT JOIN grupos g ON t.grupo_id = g.id
            WHERE t.id = $1 AND t.deletado_em IS NULL
        `;
        
        const result = await this.db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            ...row,
            etiquetas: JSON.parse(row.etiquetas || '[]'),
            anexos: JSON.parse(row.anexos || '[]')
        };
    }

    async listarPorGrupo(
        grupoId: string, 
        filtros: {
            status?: string;
            prioridade?: string;
            assignado_para?: string;
            vencimento?: 'vencidas' | 'hoje' | 'semana' | 'mes';
        } = {},
        limite: number = 20, 
        offset: number = 0
    ): Promise<any[]> {
        let whereConditions = ['t.grupo_id = $1', 't.deletado_em IS NULL'];
        let params: any[] = [grupoId];
        let paramCount = 1;

        if (filtros.status) {
            whereConditions.push(`t.status = $${++paramCount}`);
            params.push(filtros.status);
        }

        if (filtros.prioridade) {
            whereConditions.push(`t.prioridade = $${++paramCount}`);
            params.push(filtros.prioridade);
        }

        if (filtros.assignado_para) {
            whereConditions.push(`t.assignado_para = $${++paramCount}`);
            params.push(filtros.assignado_para);
        }

        if (filtros.vencimento) {
            switch (filtros.vencimento) {
                case 'vencidas':
                    whereConditions.push('t.data_vencimento < CURRENT_DATE');
                    break;
                case 'hoje':
                    whereConditions.push('DATE(t.data_vencimento) = CURRENT_DATE');
                    break;
                case 'semana':
                    whereConditions.push('t.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL \'7 days\'');
                    break;
                case 'mes':
                    whereConditions.push('t.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL \'30 days\'');
                    break;
            }
        }

        params.push(limite, offset);

        const query = `
            SELECT t.*, 
                   uc.nome as criador_nome,
                   uc.foto_perfil as criador_avatar,
                   ua.nome as assignado_nome,
                   ua.foto_perfil as assignado_avatar,
                   (SELECT COUNT(*) FROM comentarios_tarefas WHERE tarefa_id = t.id) as total_comentarios
            FROM tarefas t
            LEFT JOIN usuarios uc ON t.criado_por = uc.id
            LEFT JOIN usuarios ua ON t.assignado_para = ua.id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY 
                CASE t.prioridade 
                    WHEN 'urgente' THEN 1
                    WHEN 'alta' THEN 2
                    WHEN 'media' THEN 3
                    ELSE 4
                END,
                CASE t.status
                    WHEN 'em_andamento' THEN 1
                    WHEN 'pendente' THEN 2
                    WHEN 'concluida' THEN 3
                    ELSE 4
                END,
                t.data_vencimento ASC NULLS LAST,
                t.criado_em DESC
            LIMIT $${++paramCount} OFFSET $${++paramCount}
        `;
        
        const result = await this.db.query(query, params);
        
        return result.rows.map((row: any) => ({
            ...row,
            etiquetas: JSON.parse(row.etiquetas || '[]'),
            anexos: JSON.parse(row.anexos || '[]')
        }));
    }

    async atualizar(id: string, dados: Partial<ITarefa>): Promise<boolean> {
        const campos = [];
        const valores = [];
        let contador = 1;

        if (dados.titulo) {
            campos.push(`titulo = $${contador++}`);
            valores.push(dados.titulo);
        }
        
        if (dados.descricao !== undefined) {
            campos.push(`descricao = $${contador++}`);
            valores.push(dados.descricao);
        }
        
        if (dados.status) {
            campos.push(`status = $${contador++}`);
            valores.push(dados.status);
        }
        
        if (dados.prioridade) {
            campos.push(`prioridade = $${contador++}`);
            valores.push(dados.prioridade);
        }
        
        if (dados.data_vencimento !== undefined) {
            campos.push(`data_vencimento = $${contador++}`);
            valores.push(dados.data_vencimento);
        }
        
        if (dados.assignado_para !== undefined) {
            campos.push(`assignado_para = $${contador++}`);
            valores.push(dados.assignado_para);
        }
        
        if (dados.etiquetas) {
            campos.push(`etiquetas = $${contador++}`);
            valores.push(JSON.stringify(dados.etiquetas));
        }
        
        if (dados.estimativa_horas !== undefined) {
            campos.push(`estimativa_horas = $${contador++}`);
            valores.push(dados.estimativa_horas);
        }
        
        if (dados.horas_trabalhadas !== undefined) {
            campos.push(`horas_trabalhadas = $${contador++}`);
            valores.push(dados.horas_trabalhadas);
        }
        
        if (dados.anexos) {
            campos.push(`anexos = $${contador++}`);
            valores.push(JSON.stringify(dados.anexos));
        }

        if (campos.length === 0) {
            return false;
        }

        campos.push(`atualizado_em = NOW()`);
        valores.push(id);

        const query = `
            UPDATE tarefas 
            SET ${campos.join(', ')}
            WHERE id = $${contador} AND deletado_em IS NULL
        `;

        const result = await this.db.query(query, valores);
        return result.rowCount > 0;
    }

    async deletar(id: string): Promise<boolean> {
        const query = `
            UPDATE tarefas 
            SET deletado_em = NOW(), atualizado_em = NOW()
            WHERE id = $1 AND deletado_em IS NULL
        `;
        
        const result = await this.db.query(query, [id]);
        return result.rowCount > 0;
    }

    // ============================================
    // COMENTÁRIOS
    // ============================================

    async adicionarComentario(comentario: IComentarioTarefa): Promise<string> {
        const query = `
            INSERT INTO comentarios_tarefas (tarefa_id, usuario_id, conteudo)
            VALUES ($1, $2, $3)
            RETURNING id
        `;
        
        const result = await this.db.query(query, [
            comentario.tarefa_id,
            comentario.usuario_id,
            comentario.conteudo
        ]);

        return result.rows[0].id;
    }

    async listarComentarios(tarefaId: string): Promise<any[]> {
        const query = `
            SELECT ct.*, 
                   u.nome as usuario_nome,
                   u.foto_perfil as usuario_avatar
            FROM comentarios_tarefas ct
            LEFT JOIN usuarios u ON ct.usuario_id = u.id
            WHERE ct.tarefa_id = $1
            ORDER BY ct.criado_em ASC
        `;
        
        const result = await this.db.query(query, [tarefaId]);
        return result.rows;
    }

    async deletarComentario(id: string, usuarioId: string): Promise<boolean> {
        const query = `
            DELETE FROM comentarios_tarefas 
            WHERE id = $1 AND usuario_id = $2
        `;
        
        const result = await this.db.query(query, [id, usuarioId]);
        return result.rowCount > 0;
    }

    // ============================================
    // BUSCA E RELATÓRIOS
    // ============================================

    async buscarTarefas(grupoId: string, termo: string, limite: number = 20): Promise<any[]> {
        const query = `
            SELECT t.*, 
                   uc.nome as criador_nome,
                   ua.nome as assignado_nome,
                   ts_headline('portuguese', t.titulo || ' ' || COALESCE(t.descricao, ''), 
                              to_tsquery('portuguese', $2), 'MaxWords=10') as titulo_destacado
            FROM tarefas t
            LEFT JOIN usuarios uc ON t.criado_por = uc.id
            LEFT JOIN usuarios ua ON t.assignado_para = ua.id
            WHERE t.grupo_id = $1 
              AND t.deletado_em IS NULL
              AND (to_tsvector('portuguese', t.titulo || ' ' || COALESCE(t.descricao, '')) 
                   @@ to_tsquery('portuguese', $2)
                   OR t.etiquetas::text ILIKE '%' || $3 || '%')
            ORDER BY ts_rank(to_tsvector('portuguese', t.titulo || ' ' || COALESCE(t.descricao, '')), 
                            to_tsquery('portuguese', $2)) DESC,
                     t.criado_em DESC
            LIMIT $4
        `;
        
        const result = await this.db.query(query, [grupoId, termo, termo, limite]);
        
        return result.rows.map((row: any) => ({
            ...row,
            etiquetas: JSON.parse(row.etiquetas || '[]'),
            anexos: JSON.parse(row.anexos || '[]')
        }));
    }

    async obterEstatisticas(grupoId: string, periodo: number = 30): Promise<any> {
        const query = `
            SELECT 
                COUNT(*) as total_tarefas,
                COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
                COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as em_andamento,
                COUNT(CASE WHEN status = 'concluida' THEN 1 END) as concluidas,
                COUNT(CASE WHEN status = 'cancelada' THEN 1 END) as canceladas,
                COUNT(CASE WHEN data_vencimento < CURRENT_DATE AND status NOT IN ('concluida', 'cancelada') THEN 1 END) as vencidas,
                COUNT(DISTINCT assignado_para) as usuarios_com_tarefas,
                AVG(CASE WHEN status = 'concluida' THEN EXTRACT(EPOCH FROM (atualizado_em - criado_em))/86400 END) as tempo_medio_conclusao_dias,
                SUM(COALESCE(estimativa_horas, 0)) as total_horas_estimadas,
                SUM(COALESCE(horas_trabalhadas, 0)) as total_horas_trabalhadas
            FROM tarefas
            WHERE grupo_id = $1 
              AND deletado_em IS NULL
              AND criado_em >= CURRENT_DATE - INTERVAL '${periodo} days'
        `;
        
        const result = await this.db.query(query, [grupoId]);
        return result.rows[0];
    }

    async obterTarefasPorUsuario(grupoId: string, usuarioId: string, limite: number = 20): Promise<any[]> {
        const query = `
            SELECT t.*, 
                   uc.nome as criador_nome,
                   g.nome as grupo_nome
            FROM tarefas t
            LEFT JOIN usuarios uc ON t.criador_id = uc.id
            LEFT JOIN grupos g ON t.grupo_id = g.id
            WHERE (t.grupo_id = $1 OR $1 IS NULL)
              AND t.assignado_para = $2
              AND t.deletado_em IS NULL
            ORDER BY 
                CASE t.prioridade 
                    WHEN 'urgente' THEN 1
                    WHEN 'alta' THEN 2
                    WHEN 'media' THEN 3
                    ELSE 4
                END,
                t.data_vencimento ASC NULLS LAST
            LIMIT $3
        `;
        
        const result = await this.db.query(query, [grupoId, usuarioId, limite]);
        
        return result.rows.map((row: any) => ({
            ...row,
            etiquetas: JSON.parse(row.etiquetas || '[]'),
            anexos: JSON.parse(row.anexos || '[]')
        }));
    }

    async obterHistoricoStatus(tarefaId: string): Promise<any[]> {
        const query = `
            SELECT ht.*,
                   u.nome as usuario_nome
            FROM historico_tarefas ht
            LEFT JOIN usuarios u ON ht.usuario_id = u.id
            WHERE ht.tarefa_id = $1
            ORDER BY ht.criado_em DESC
        `;
        
        const result = await this.db.query(query, [tarefaId]);
        return result.rows;
    }

    async registrarMudancaStatus(tarefaId: string, usuarioId: string, statusAnterior: string, statusNovo: string): Promise<void> {
        const query = `
            INSERT INTO historico_tarefas (tarefa_id, usuario_id, status_anterior, status_novo)
            VALUES ($1, $2, $3, $4)
        `;
        
        await this.db.query(query, [tarefaId, usuarioId, statusAnterior, statusNovo]);
    }
}
