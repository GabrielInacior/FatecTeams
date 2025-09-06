import { DatabaseConfig } from '../config/database';

export interface IEvento {
    id?: string;
    grupo_id: string;
    criador_id: string;  // Mudança de criado_por para criador_id para alinhar com migration
    titulo: string;
    descricao?: string;
    data_inicio: Date;
    data_fim: Date;
    local?: string;
    link_virtual?: string;
    tipo_evento: 'reuniao' | 'estudo' | 'prova' | 'apresentacao' | 'outro' | 'aula' | 'deadline';
    status?: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
    recorrencia?: any;
    configuracoes?: any;
    data_criacao?: Date;
    data_atualizacao?: Date;
}

export interface IEventoParticipante {
    id?: string;
    evento_id: string;
    usuario_id: string;
    status: 'pendente' | 'confirmado' | 'recusado';
    data_resposta?: Date;
    criado_em?: Date;
}

export class EventoRepository {
    private db: DatabaseConfig;

    constructor() {
        this.db = DatabaseConfig.getInstance();
    }

    // ============================================
    // CRUD BÁSICO DE EVENTOS
    // ============================================

    async criar(evento: IEvento): Promise<string> {
        const query = `
            INSERT INTO eventos_calendario (
                grupo_id, criador_id, titulo, descricao, data_inicio, data_fim, 
                local, link_virtual, tipo_evento, status, recorrencia, configuracoes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
        `;
        
        const result = await this.db.query(query, [
            evento.grupo_id,
            evento.criador_id,
            evento.titulo,
            evento.descricao || null,
            evento.data_inicio,
            evento.data_fim,
            evento.local || null,
            evento.link_virtual || null,
            evento.tipo_evento,
            evento.status || 'agendado',
            evento.recorrencia ? JSON.stringify(evento.recorrencia) : null,
            JSON.stringify(evento.configuracoes || {})
        ]);

        return result.rows[0].id;
    }

    async buscarPorId(id: string): Promise<IEvento | null> {
        const query = `
            SELECT * FROM eventos_calendario 
            WHERE id = $1
        `;
        
        const result = await this.db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const evento = result.rows[0];
        return {
            id: evento.id,
            grupo_id: evento.grupo_id,
            criador_id: evento.criador_id,
            titulo: evento.titulo,
            descricao: evento.descricao,
            data_inicio: evento.data_inicio,
            data_fim: evento.data_fim,
            local: evento.local,
            link_virtual: evento.link_virtual,
            tipo_evento: evento.tipo_evento,
            status: evento.status,
            recorrencia: evento.recorrencia,
            configuracoes: evento.configuracoes,
            data_criacao: evento.data_criacao,
            data_atualizacao: evento.data_atualizacao
        };
    }

    async listarPorGrupo(
        grupoId: string, 
        filtros: {
            dataInicio?: Date;
            dataFim?: Date;
            tipo?: string;
            status?: string[];
        } = {}
    ): Promise<IEvento[]> {
        let query = `
            SELECT * FROM eventos_calendario 
            WHERE grupo_id = $1
        `;
        const params: any[] = [grupoId];
        let paramCount = 1;

        if (filtros.dataInicio) {
            paramCount++;
            query += ` AND data_inicio >= $${paramCount}`;
            params.push(filtros.dataInicio);
        }

        if (filtros.dataFim) {
            paramCount++;
            query += ` AND data_fim <= $${paramCount}`;
            params.push(filtros.dataFim);
        }

        if (filtros.tipo) {
            paramCount++;
            query += ` AND tipo_evento = $${paramCount}`;
            params.push(filtros.tipo);
        }

        if (filtros.status && filtros.status.length > 0) {
            paramCount++;
            query += ` AND status = ANY($${paramCount})`;
            params.push(filtros.status);
        }

        query += ` ORDER BY data_inicio ASC`;

        const result = await this.db.query(query, params);
        
        return result.rows.map((evento: any) => ({
            id: evento.id,
            grupo_id: evento.grupo_id,
            criado_por: evento.criador_id,
            titulo: evento.titulo,
            descricao: evento.descricao,
            data_inicio: evento.data_inicio,
            data_fim: evento.data_fim,
            local: evento.local,
            link_virtual: evento.link_virtual,
            tipo_evento: evento.tipo_evento,
            status: evento.status,
            recorrencia: evento.recorrencia,
            configuracoes: evento.configuracoes,
            criado_em: evento.data_criacao,
            atualizado_em: evento.data_atualizacao
        }));
    }

    async atualizar(id: string, dados: Partial<IEvento>): Promise<boolean> {
        const campos = [];
        const valores = [];
        let paramCount = 0;

        if (dados.titulo !== undefined) {
            paramCount++;
            campos.push(`titulo = $${paramCount}`);
            valores.push(dados.titulo);
        }

        if (dados.descricao !== undefined) {
            paramCount++;
            campos.push(`descricao = $${paramCount}`);
            valores.push(dados.descricao);
        }

        if (dados.data_inicio !== undefined) {
            paramCount++;
            campos.push(`data_inicio = $${paramCount}`);
            valores.push(dados.data_inicio);
        }

        if (dados.data_fim !== undefined) {
            paramCount++;
            campos.push(`data_fim = $${paramCount}`);
            valores.push(dados.data_fim);
        }

        if (dados.local !== undefined) {
            paramCount++;
            campos.push(`local = $${paramCount}`);
            valores.push(dados.local);
        }

        if (dados.link_virtual !== undefined) {
            paramCount++;
            campos.push(`link_virtual = $${paramCount}`);
            valores.push(dados.link_virtual);
        }

        if (dados.tipo_evento !== undefined) {
            paramCount++;
            campos.push(`tipo_evento = $${paramCount}`);
            valores.push(dados.tipo_evento);
        }

        if (dados.status !== undefined) {
            paramCount++;
            campos.push(`status = $${paramCount}`);
            valores.push(dados.status);
        }

        if (dados.recorrencia !== undefined) {
            paramCount++;
            campos.push(`recorrencia = $${paramCount}`);
            valores.push(JSON.stringify(dados.recorrencia));
        }

        if (dados.configuracoes !== undefined) {
            paramCount++;
            campos.push(`configuracoes = $${paramCount}`);
            valores.push(JSON.stringify(dados.configuracoes));
        }

        if (campos.length === 0) {
            return false;
        }

        paramCount++;
        valores.push(id);

        const query = `
            UPDATE eventos_calendario 
            SET ${campos.join(', ')}, data_atualizacao = NOW()
            WHERE id = $${paramCount}
        `;

        const result = await this.db.query(query, valores);
        return result.rowCount > 0;
    }

    async deletar(id: string): Promise<boolean> {
        const query = `
            DELETE FROM eventos_calendario 
            WHERE id = $1
        `;
        
        const result = await this.db.query(query, [id]);
        return result.rowCount > 0;
    }

    // ============================================
    // GESTÃO DE PARTICIPANTES
    // ============================================

    async adicionarParticipante(participante: IEventoParticipante): Promise<boolean> {
        const query = `
            INSERT INTO eventos_participantes (evento_id, usuario_id, status)
            VALUES ($1, $2, $3)
            ON CONFLICT (evento_id, usuario_id) DO UPDATE SET
                status = EXCLUDED.status,
                data_resposta = CASE 
                    WHEN EXCLUDED.status IN ('confirmado', 'recusado') THEN NOW()
                    ELSE NULL
                END
        `;
        
        const result = await this.db.query(query, [
            participante.evento_id,
            participante.usuario_id,
            participante.status
        ]);

        return result.rowCount > 0;
    }

    async listarParticipantes(eventoId: string): Promise<any[]> {
        const query = `
            SELECT ep.*, u.nome, u.email, u.foto_perfil
            FROM eventos_participantes ep
            JOIN usuarios u ON ep.usuario_id = u.id
            WHERE ep.evento_id = $1 AND u.deletado_em IS NULL
            ORDER BY 
                CASE ep.status 
                    WHEN 'confirmado' THEN 1
                    WHEN 'pendente' THEN 2
                    ELSE 3
                END,
                u.nome ASC
        `;
        
        const result = await this.db.query(query, [eventoId]);
        return result.rows;
    }

    async atualizarStatusParticipante(eventoId: string, usuarioId: string, status: 'confirmado' | 'recusado'): Promise<boolean> {
        const query = `
            UPDATE eventos_participantes 
            SET status = $3, data_resposta = NOW()
            WHERE evento_id = $1 AND usuario_id = $2
        `;
        
        const result = await this.db.query(query, [eventoId, usuarioId, status]);
        return result.rowCount > 0;
    }

    async buscarEventosUsuario(
        usuarioId: string,
        filtros: {
            dataInicio?: Date;
            dataFim?: Date;
            status?: string[];
            apenasConfirmados?: boolean;
        } = {}
    ): Promise<IEvento[]> {
        let query = `
            SELECT DISTINCT ec.*
            FROM eventos_calendario ec
            JOIN eventos_participantes ep ON ec.id = ep.evento_id
            WHERE ep.usuario_id = $1
        `;
        const params: any[] = [usuarioId];
        let paramCount = 1;

        if (filtros.apenasConfirmados) {
            query += ` AND ep.status = 'confirmado'`;
        }

        if (filtros.dataInicio) {
            paramCount++;
            query += ` AND ec.data_inicio >= $${paramCount}`;
            params.push(filtros.dataInicio);
        }

        if (filtros.dataFim) {
            paramCount++;
            query += ` AND ec.data_fim <= $${paramCount}`;
            params.push(filtros.dataFim);
        }

        if (filtros.status && filtros.status.length > 0) {
            paramCount++;
            query += ` AND ec.status = ANY($${paramCount})`;
            params.push(filtros.status);
        }

        query += ` ORDER BY ec.data_inicio ASC`;

        const result = await this.db.query(query, params);
        
        return result.rows.map((evento: any) => ({
            id: evento.id,
            grupo_id: evento.grupo_id,
            criado_por: evento.criador_id,
            titulo: evento.titulo,
            descricao: evento.descricao,
            data_inicio: evento.data_inicio,
            data_fim: evento.data_fim,
            local: evento.local,
            link_virtual: evento.link_virtual,
            tipo_evento: evento.tipo_evento,
            status: evento.status,
            recorrencia: evento.recorrencia,
            configuracoes: evento.configuracoes,
            criado_em: evento.data_criacao,
            atualizado_em: evento.data_atualizacao
        }));
    }
}
