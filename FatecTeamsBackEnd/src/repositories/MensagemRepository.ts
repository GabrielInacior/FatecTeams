import { DatabaseConfig } from '../config/database';

export interface IMensagem {
    id?: string;
    conteudo?: string;
    tipo_mensagem: 'texto' | 'arquivo' | 'imagem' | 'sistema';
    arquivo_id?: string;
    grupo_id: string;
    remetente_id: string;
    mensagem_pai_id?: string;
    mencionados?: string[];
    editado?: boolean;
    data_envio?: Date;
    data_edicao?: Date;
    deletado_em?: Date;
}

export interface IReacao {
    mensagem_id: string;
    usuario_id: string;
    emoji: string;
}

export class MensagemRepository {
    private db: DatabaseConfig;

    constructor() {
        this.db = DatabaseConfig.getInstance();
    }

    // ============================================
    // CRUD BÁSICO DE MENSAGENS
    // ============================================

    async criar(mensagem: IMensagem): Promise<string> {
        const query = `
            INSERT INTO mensagens (
                conteudo, tipo_mensagem, arquivo_id, 
                grupo_id, remetente_id, mensagem_pai_id, mencionados
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;
        
        const result = await this.db.query(query, [
            mensagem.conteudo || null,
            mensagem.tipo_mensagem,
            mensagem.arquivo_id || null,
            mensagem.grupo_id,
            mensagem.remetente_id,
            mensagem.mensagem_pai_id || null,
            JSON.stringify(mensagem.mencionados || [])
        ]);

        return result.rows[0].id;
    }

    async buscarPorId(id: string): Promise<IMensagem | null> {
        const query = `
            SELECT m.*, 
                   u.nome as remetente_nome,
                   u.foto_perfil as remetente_foto,
                   pm.conteudo as mensagem_pai_conteudo,
                   pm.remetente_id as mensagem_pai_remetente_id,
                   pu.nome as mensagem_pai_remetente_nome
            FROM mensagens m
            LEFT JOIN usuarios u ON m.remetente_id = u.id
            LEFT JOIN mensagens pm ON m.mensagem_pai_id = pm.id
            LEFT JOIN usuarios pu ON pm.remetente_id = pu.id
            WHERE m.id = $1 AND m.deletado_em IS NULL
        `;
        
        const result = await this.db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            id: row.id,
            conteudo: row.conteudo,
            tipo_mensagem: row.tipo_mensagem,
            arquivo_id: row.arquivo_id,
            grupo_id: row.grupo_id,
            remetente_id: row.remetente_id,
            mensagem_pai_id: row.mensagem_pai_id,
            mencionados: JSON.parse(row.mencionados || '[]'),
            editado: row.editado,
            data_envio: row.data_envio,
            data_edicao: row.data_edicao
        };
    }

    async listarPorGrupo(grupoId: string, limite: number = 50, offset: number = 0): Promise<any[]> {
        const query = `
            SELECT m.*, 
                   u.nome as remetente_nome,
                   u.foto_perfil as remetente_foto,
                   pm.conteudo as mensagem_pai_conteudo,
                   pm.remetente_id as mensagem_pai_remetente_id,
                   pu.nome as mensagem_pai_remetente_nome,
                   COALESCE(r.reacoes, '[]'::json) as reacoes
            FROM mensagens m
            LEFT JOIN usuarios u ON m.remetente_id = u.id
            LEFT JOIN mensagens pm ON m.mensagem_pai_id = pm.id
            LEFT JOIN usuarios pu ON pm.remetente_id = pu.id
            LEFT JOIN (
                SELECT mensagem_id, 
                       json_agg(json_build_object('emoji', emoji, 'usuario_id', usuario_id, 'usuario_nome', usuarios.nome)) as reacoes
                FROM reacoes_mensagens 
                LEFT JOIN usuarios ON reacoes_mensagens.usuario_id = usuarios.id
                GROUP BY mensagem_id
            ) r ON m.id = r.mensagem_id
            WHERE m.grupo_id = $1 AND m.deletado_em IS NULL
            ORDER BY m.data_envio DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await this.db.query(query, [grupoId, limite, offset]);
        return result.rows;
    }

    async atualizar(id: string, conteudo: string, usuarioId: string): Promise<boolean> {
        const query = `
            UPDATE mensagens 
            SET conteudo = $1, 
                editado = true,
                data_edicao = NOW()
            WHERE id = $2 
              AND remetente_id = $3 
              AND deletado_em IS NULL
              AND data_envio > NOW() - INTERVAL '5 minutes'
        `;
        
        const result = await this.db.query(query, [conteudo, id, usuarioId]);
        return result.rowCount > 0;
    }

    async deletar(id: string, usuarioId: string): Promise<boolean> {
        const query = `
            UPDATE mensagens 
            SET deletado_em = NOW()
            WHERE id = $1 
              AND remetente_id = $2 
              AND deletado_em IS NULL
        `;
        
        const result = await this.db.query(query, [id, usuarioId]);
        return result.rowCount > 0;
    }

    // ============================================
    // REAÇÕES
    // ============================================

    async adicionarReacao(reacao: IReacao): Promise<boolean> {
        const query = `
            INSERT INTO reacoes_mensagens (mensagem_id, usuario_id, emoji)
            VALUES ($1, $2, $3)
            ON CONFLICT (mensagem_id, usuario_id, emoji) DO NOTHING
        `;
        
        const result = await this.db.query(query, [
            reacao.mensagem_id,
            reacao.usuario_id,
            reacao.emoji
        ]);

        return result.rowCount > 0;
    }

    async removerReacao(mensagemId: string, usuarioId: string, emoji: string): Promise<boolean> {
        const query = `
            DELETE FROM reacoes_mensagens 
            WHERE mensagem_id = $1 AND usuario_id = $2 AND emoji = $3
        `;
        
        const result = await this.db.query(query, [mensagemId, usuarioId, emoji]);
        return result.rowCount > 0;
    }

    async listarReacoes(mensagemId: string): Promise<any[]> {
        const query = `
            SELECT rm.*, u.nome as usuario_nome, u.foto_perfil
            FROM reacoes_mensagens rm
            LEFT JOIN usuarios u ON rm.usuario_id = u.id
            WHERE rm.mensagem_id = $1
            ORDER BY rm.data_criacao ASC
        `;
        
        const result = await this.db.query(query, [mensagemId]);
        return result.rows;
    }

    // ============================================
    // BUSCA E FILTROS
    // ============================================

    async buscarMensagens(grupoId: string, termo: string, limite: number = 20): Promise<any[]> {
        const query = `
            SELECT m.*, 
                   u.nome as remetente_nome,
                   u.foto_perfil as remetente_foto,
                   ts_headline('portuguese', m.conteudo, to_tsquery('portuguese', $2), 
                              'MaxWords=20, MinWords=5') as conteudo_destacado
            FROM mensagens m
            LEFT JOIN usuarios u ON m.remetente_id = u.id
            WHERE m.grupo_id = $1 
              AND m.deletado_em IS NULL
              AND to_tsvector('portuguese', m.conteudo) @@ to_tsquery('portuguese', $2)
            ORDER BY ts_rank(to_tsvector('portuguese', m.conteudo), to_tsquery('portuguese', $2)) DESC,
                     m.data_envio DESC
            LIMIT $3
        `;
        
        const result = await this.db.query(query, [grupoId, termo, limite]);
        return result.rows;
    }

    async obterMensagensRecentes(grupoId: string, dataReferencia: Date, limite: number = 50): Promise<any[]> {
        const query = `
            SELECT m.*, 
                   u.nome as remetente_nome,
                   u.foto_perfil as remetente_foto
            FROM mensagens m
            LEFT JOIN usuarios u ON m.remetente_id = u.id
            WHERE m.grupo_id = $1 
              AND m.data_envio > $2
              AND m.deletado_em IS NULL
            ORDER BY m.data_envio DESC
            LIMIT $3
        `;
        
        const result = await this.db.query(query, [grupoId, dataReferencia, limite]);
        return result.rows;
    }

    // ============================================
    // ESTATÍSTICAS
    // ============================================

    async obterEstatisticas(grupoId: string, dataInicio?: Date): Promise<any> {
        const whereClause = dataInicio ? 'AND m.data_envio >= $2' : '';
        const params = dataInicio ? [grupoId, dataInicio] : [grupoId];

        const query = `
            SELECT 
                COUNT(*) as total_mensagens,
                COUNT(DISTINCT m.remetente_id) as usuarios_ativos,
                COUNT(CASE WHEN m.tipo_mensagem != 'texto' THEN 1 END) as mensagens_com_arquivo,
                COUNT(CASE WHEN m.mensagem_pai_id IS NOT NULL THEN 1 END) as respostas,
                AVG(LENGTH(m.conteudo)) as tamanho_medio_mensagem
            FROM mensagens m
            WHERE m.grupo_id = $1 
              AND m.deletado_em IS NULL
              ${whereClause}
        `;
        
        const result = await this.db.query(query, params);
        return result.rows[0];
    }

    async obterMensagensNaoLidas(usuarioId: string, grupoId: string): Promise<number> {
        const query = `
            SELECT COUNT(*)
            FROM mensagens m
            LEFT JOIN leituras_mensagem ml ON m.id = ml.mensagem_id AND ml.usuario_id = $1
            WHERE m.grupo_id = $2 
              AND m.remetente_id != $1
              AND m.deletado_em IS NULL
              AND ml.mensagem_id IS NULL
        `;
        
        const result = await this.db.query(query, [usuarioId, grupoId]);
        return parseInt(result.rows[0].count);
    }

    async marcarComoLida(mensagemId: string, usuarioId: string): Promise<boolean> {
        const query = `
            INSERT INTO leituras_mensagem (mensagem_id, usuario_id)
            VALUES ($1, $2)
            ON CONFLICT (mensagem_id, usuario_id) DO UPDATE SET
                data_leitura = NOW()
        `;
        
        const result = await this.db.query(query, [mensagemId, usuarioId]);
        return result.rowCount > 0;
    }

    async marcarTodasComoLidas(grupoId: string, usuarioId: string): Promise<boolean> {
        const query = `
            INSERT INTO leituras_mensagem (mensagem_id, usuario_id)
            SELECT m.id, $2
            FROM mensagens m
            LEFT JOIN leituras_mensagem ml ON m.id = ml.mensagem_id AND ml.usuario_id = $2
            WHERE m.grupo_id = $1 
              AND m.remetente_id != $2
              AND m.deletado_em IS NULL
              AND ml.mensagem_id IS NULL
            ON CONFLICT (mensagem_id, usuario_id) DO UPDATE SET
                data_leitura = NOW()
        `;
        
        const result = await this.db.query(query, [grupoId, usuarioId]);
        return result.rowCount >= 0;
    }
}
