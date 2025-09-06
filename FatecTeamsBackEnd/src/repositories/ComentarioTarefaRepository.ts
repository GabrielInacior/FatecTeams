import { DatabaseConfig } from '../config/database';

export interface IComentarioTarefa {
    id?: string;
    tarefa_id: string;
    usuario_id: string;
    conteudo: string;
    data_criacao?: Date;
    data_atualizacao?: Date;
    deletado_em?: Date;
}

export class ComentarioTarefaRepository {
    private db: DatabaseConfig;

    constructor() {
        this.db = DatabaseConfig.getInstance();
    }

    async criar(comentario: IComentarioTarefa): Promise<string> {
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

    async listarPorTarefa(tarefaId: string): Promise<any[]> {
        const query = `
            SELECT ct.*, u.nome as usuario_nome, u.foto_perfil as usuario_foto
            FROM comentarios_tarefas ct
            LEFT JOIN usuarios u ON ct.usuario_id = u.id
            WHERE ct.tarefa_id = $1 AND ct.deletado_em IS NULL
            ORDER BY ct.data_criacao ASC
        `;
        
        const result = await this.db.query(query, [tarefaId]);
        return result.rows;
    }

    async atualizar(id: string, conteudo: string, usuarioId: string): Promise<boolean> {
        const query = `
            UPDATE comentarios_tarefas 
            SET conteudo = $1, data_atualizacao = NOW()
            WHERE id = $2 AND usuario_id = $3 AND deletado_em IS NULL
        `;
        
        const result = await this.db.query(query, [conteudo, id, usuarioId]);
        return result.rowCount > 0;
    }

    async deletar(id: string, usuarioId: string): Promise<boolean> {
        const query = `
            UPDATE comentarios_tarefas 
            SET deletado_em = NOW()
            WHERE id = $1 AND usuario_id = $2 AND deletado_em IS NULL
        `;
        
        const result = await this.db.query(query, [id, usuarioId]);
        return result.rowCount > 0;
    }

    async contarPorTarefa(tarefaId: string): Promise<number> {
        const query = `
            SELECT COUNT(*) as total
            FROM comentarios_tarefas
            WHERE tarefa_id = $1 AND deletado_em IS NULL
        `;
        
        const result = await this.db.query(query, [tarefaId]);
        return parseInt(result.rows[0].total) || 0;
    }
}
