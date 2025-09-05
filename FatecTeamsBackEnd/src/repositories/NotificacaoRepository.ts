import { DatabaseConfig } from '../config/database';

export interface INotificacao {
    id?: string;
    usuario_id: string;
    titulo: string;
    mensagem: string;
    tipo: 'mensagem' | 'convite' | 'tarefa' | 'evento' | 'sistema' | 'deadline' | 'mencao';
    origem_tipo?: 'grupo' | 'tarefa' | 'mensagem' | 'sistema' | 'evento';
    origem_id?: string;
    referencia_id?: string;
    lida?: boolean;
    importante?: boolean;
    metadados?: any;
    data_criacao?: Date;
    data_leitura?: Date;
}

export interface IConfiguracaoNotificacao {
    id?: string;
    usuario_id: string;
    notificacoes_email: boolean;
    notificacoes_push: boolean;
    tipos_ativados: {
        mensagem: boolean;
        tarefa: boolean;
        convite: boolean;
        sistema: boolean;
        deadline: boolean;
        mencao: boolean;
    };
    horario_silencioso: {
        ativado: boolean;
        inicio: string;
        fim: string;
    };
    frequencia_email: 'instantaneo' | 'diario' | 'semanal' | 'nunca';
    data_criacao?: Date;
    data_atualizacao?: Date;
}

export class NotificacaoRepository {
    private db: DatabaseConfig;

    constructor() {
        this.db = DatabaseConfig.getInstance();
    }

    // ============================================
    // CRUD BÁSICO DE NOTIFICAÇÕES
    // ============================================

    async criar(notificacao: INotificacao): Promise<string> {
        const query = `
            INSERT INTO notificacoes (
                usuario_id, titulo, mensagem, tipo, origem_tipo, origem_id, 
                referencia_id, lida, importante, metadados
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `;
        
        const result = await this.db.query(query, [
            notificacao.usuario_id,
            notificacao.titulo,
            notificacao.mensagem,
            notificacao.tipo,
            notificacao.origem_tipo || null,
            notificacao.origem_id || null,
            notificacao.referencia_id || null,
            notificacao.lida || false,
            notificacao.importante || false,
            JSON.stringify(notificacao.metadados || {})
        ]);

        return result.rows[0].id;
    }

    async buscarPorId(id: string): Promise<INotificacao | null> {
        const query = `
            SELECT * FROM notificacoes 
            WHERE id = $1
        `;
        
        const result = await this.db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const notif = result.rows[0];
        return {
            id: notif.id,
            usuario_id: notif.usuario_id,
            titulo: notif.titulo,
            mensagem: notif.mensagem,
            tipo: notif.tipo,
            origem_tipo: notif.origem_tipo,
            origem_id: notif.origem_id,
            referencia_id: notif.referencia_id,
            lida: notif.lida,
            importante: notif.importante,
            metadados: notif.metadados,
            data_criacao: notif.data_criacao,
            data_leitura: notif.data_leitura
        };
    }

    async listarPorUsuario(
        usuarioId: string,
        filtros: {
            limite?: number;
            offset?: number;
            apenas_nao_lidas?: boolean;
            tipo?: string;
        } = {}
    ): Promise<{ notificacoes: INotificacao[]; total: number }> {
        let query = `
            SELECT * FROM notificacoes 
            WHERE usuario_id = $1
        `;
        const params: any[] = [usuarioId];
        let paramCount = 1;

        if (filtros.apenas_nao_lidas) {
            query += ` AND lida = FALSE`;
        }

        if (filtros.tipo) {
            paramCount++;
            query += ` AND tipo = $${paramCount}`;
            params.push(filtros.tipo);
        }

        // Contar total
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
        const countResult = await this.db.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Aplicar paginação
        query += ` ORDER BY data_criacao DESC`;
        
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
        
        const notificacoes = result.rows.map((notif: any) => ({
            id: notif.id,
            usuario_id: notif.usuario_id,
            titulo: notif.titulo,
            mensagem: notif.mensagem,
            tipo: notif.tipo,
            origem_tipo: notif.origem_tipo,
            origem_id: notif.origem_id,
            referencia_id: notif.referencia_id,
            lida: notif.lida,
            importante: notif.importante,
            metadados: notif.metadados,
            data_criacao: notif.data_criacao,
            data_leitura: notif.data_leitura
        }));

        return { notificacoes, total };
    }

    async marcarComoLida(id: string, usuarioId: string): Promise<boolean> {
        const query = `
            UPDATE notificacoes 
            SET lida = TRUE, data_leitura = NOW()
            WHERE id = $1 AND usuario_id = $2 AND lida = FALSE
        `;
        
        const result = await this.db.query(query, [id, usuarioId]);
        return result.rowCount > 0;
    }

    async marcarTodasComoLidas(usuarioId: string): Promise<number> {
        const query = `
            UPDATE notificacoes 
            SET lida = TRUE, data_leitura = NOW()
            WHERE usuario_id = $1 AND lida = FALSE
        `;
        
        const result = await this.db.query(query, [usuarioId]);
        return result.rowCount;
    }

    async deletar(id: string, usuarioId: string): Promise<boolean> {
        const query = `
            DELETE FROM notificacoes 
            WHERE id = $1 AND usuario_id = $2
        `;
        
        const result = await this.db.query(query, [id, usuarioId]);
        return result.rowCount > 0;
    }

    async obterEstatisticas(usuarioId: string): Promise<any> {
        const query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN lida = FALSE THEN 1 END) as nao_lidas,
                COUNT(CASE WHEN importante = TRUE AND lida = FALSE THEN 1 END) as importantes,
                COUNT(CASE WHEN tipo = 'mensagem' AND lida = FALSE THEN 1 END) as mensagem,
                COUNT(CASE WHEN tipo = 'tarefa' AND lida = FALSE THEN 1 END) as tarefa,
                COUNT(CASE WHEN tipo = 'convite' AND lida = FALSE THEN 1 END) as convite,
                COUNT(CASE WHEN tipo = 'sistema' AND lida = FALSE THEN 1 END) as sistema,
                COUNT(CASE WHEN tipo = 'deadline' AND lida = FALSE THEN 1 END) as deadline,
                COUNT(CASE WHEN tipo = 'mencao' AND lida = FALSE THEN 1 END) as mencao,
                COUNT(CASE WHEN data_criacao > NOW() - INTERVAL '24 hours' THEN 1 END) as ultimas_24h
            FROM notificacoes 
            WHERE usuario_id = $1
        `;
        
        const result = await this.db.query(query, [usuarioId]);
        const stats = result.rows[0];

        return {
            total: parseInt(stats.total),
            nao_lidas: parseInt(stats.nao_lidas),
            importantes: parseInt(stats.importantes),
            por_tipo: {
                mensagem: parseInt(stats.mensagem),
                tarefa: parseInt(stats.tarefa),
                convite: parseInt(stats.convite),
                sistema: parseInt(stats.sistema),
                deadline: parseInt(stats.deadline),
                mencao: parseInt(stats.mencao)
            },
            ultimas_24h: parseInt(stats.ultimas_24h)
        };
    }

    // ============================================
    // CONFIGURAÇÕES DE NOTIFICAÇÃO
    // ============================================

    async obterConfiguracoes(usuarioId: string): Promise<IConfiguracaoNotificacao | null> {
        const query = `
            SELECT * FROM configuracoes_notificacao 
            WHERE usuario_id = $1
        `;
        
        const result = await this.db.query(query, [usuarioId]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const config = result.rows[0];
        return {
            id: config.id,
            usuario_id: config.usuario_id,
            notificacoes_email: config.notificacoes_email,
            notificacoes_push: config.notificacoes_push,
            tipos_ativados: config.tipos_ativados,
            horario_silencioso: config.horario_silencioso,
            frequencia_email: config.frequencia_email,
            data_criacao: config.data_criacao,
            data_atualizacao: config.data_atualizacao
        };
    }

    async criarConfiguracoesPadrao(usuarioId: string): Promise<string> {
        const query = `
            INSERT INTO configuracoes_notificacao (usuario_id)
            VALUES ($1)
            ON CONFLICT (usuario_id) DO NOTHING
            RETURNING id
        `;
        
        const result = await this.db.query(query, [usuarioId]);
        return result.rows[0]?.id || '';
    }

    async atualizarConfiguracoes(usuarioId: string, configuracoes: Partial<IConfiguracaoNotificacao>): Promise<boolean> {
        const campos = [];
        const valores = [];
        let paramCount = 0;

        if (configuracoes.notificacoes_email !== undefined) {
            paramCount++;
            campos.push(`notificacoes_email = $${paramCount}`);
            valores.push(configuracoes.notificacoes_email);
        }

        if (configuracoes.notificacoes_push !== undefined) {
            paramCount++;
            campos.push(`notificacoes_push = $${paramCount}`);
            valores.push(configuracoes.notificacoes_push);
        }

        if (configuracoes.tipos_ativados !== undefined) {
            paramCount++;
            campos.push(`tipos_ativados = $${paramCount}`);
            valores.push(JSON.stringify(configuracoes.tipos_ativados));
        }

        if (configuracoes.horario_silencioso !== undefined) {
            paramCount++;
            campos.push(`horario_silencioso = $${paramCount}`);
            valores.push(JSON.stringify(configuracoes.horario_silencioso));
        }

        if (configuracoes.frequencia_email !== undefined) {
            paramCount++;
            campos.push(`frequencia_email = $${paramCount}`);
            valores.push(configuracoes.frequencia_email);
        }

        if (campos.length === 0) {
            return false;
        }

        paramCount++;
        valores.push(usuarioId);

        const query = `
            UPDATE configuracoes_notificacao 
            SET ${campos.join(', ')}, data_atualizacao = NOW()
            WHERE usuario_id = $${paramCount}
        `;

        const result = await this.db.query(query, valores);
        return result.rowCount > 0;
    }

    // ============================================
    // MÉTODOS AUXILIARES
    // ============================================

    async criarNotificacaoEmLote(notificacoes: INotificacao[]): Promise<string[]> {
        if (notificacoes.length === 0) return [];

        const values = notificacoes.map((notif, index) => {
            const baseIndex = index * 10;
            return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10})`;
        }).join(', ');

        const query = `
            INSERT INTO notificacoes (
                usuario_id, titulo, mensagem, tipo, origem_tipo, origem_id,
                referencia_id, lida, importante, metadados
            )
            VALUES ${values}
            RETURNING id
        `;

        const params: any[] = [];
        notificacoes.forEach(notif => {
            params.push(
                notif.usuario_id,
                notif.titulo,
                notif.mensagem,
                notif.tipo,
                notif.origem_tipo || null,
                notif.origem_id || null,
                notif.referencia_id || null,
                notif.lida || false,
                notif.importante || false,
                JSON.stringify(notif.metadados || {})
            );
        });

        const result = await this.db.query(query, params);
        return result.rows.map((row: any) => row.id);
    }

    async limparNotificacoesAntigas(usuarioId: string, diasAntigos: number = 30): Promise<number> {
        const query = `
            DELETE FROM notificacoes 
            WHERE usuario_id = $1 
            AND lida = TRUE 
            AND data_criacao < NOW() - INTERVAL '${diasAntigos} days'
        `;
        
        const result = await this.db.query(query, [usuarioId]);
        return result.rowCount;
    }
}
