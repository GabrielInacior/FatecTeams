import { DatabaseConfig } from '../config/database';

export interface IArquivo {
    id?: string;
    nome: string;
    nome_original: string;
    tipo_mime: string;
    tamanho: number;
    url: string;
    pasta?: string;
    grupo_id: string;
    enviado_por: string;
    descricao?: string;
    tags?: string[];
    versao?: number;
    arquivo_pai_id?: string;
    publico?: boolean;
    downloads?: number;
    criado_em?: Date;
    atualizado_em?: Date;
}

export interface ICompartilhamentoArquivo {
    arquivo_id: string;
    usuario_id: string;
    pode_visualizar: boolean;
    pode_baixar: boolean;
    pode_editar: boolean;
    data_expiracao?: Date;
}

export class ArquivoRepository {
    private db: DatabaseConfig;

    constructor() {
        this.db = DatabaseConfig.getInstance();
    }

    // ============================================
    // CRUD BÁSICO DE ARQUIVOS
    // ============================================

    async criar(arquivo: IArquivo): Promise<string> {
        const query = `
            INSERT INTO arquivos (
                nome, nome_original, tipo_mime, tamanho, url, pasta,
                grupo_id, enviado_por, descricao, tags, versao, 
                arquivo_pai_id, publico
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id
        `;
        
        const result = await this.db.query(query, [
            arquivo.nome,
            arquivo.nome_original,
            arquivo.tipo_mime,
            arquivo.tamanho,
            arquivo.url,
            arquivo.pasta || null,
            arquivo.grupo_id,
            arquivo.enviado_por,
            arquivo.descricao || null,
            JSON.stringify(arquivo.tags || []),
            arquivo.versao || 1,
            arquivo.arquivo_pai_id || null,
            arquivo.publico || false
        ]);

        return result.rows[0].id;
    }

    async buscarPorId(id: string): Promise<any | null> {
        const query = `
            SELECT a.*, 
                   u.nome as enviado_por_nome,
                   u.avatar_url as enviado_por_avatar,
                   g.nome as grupo_nome,
                   ap.nome as arquivo_pai_nome
            FROM arquivos a
            LEFT JOIN usuarios u ON a.enviado_por = u.id
            LEFT JOIN grupos g ON a.grupo_id = g.id
            LEFT JOIN arquivos ap ON a.arquivo_pai_id = ap.id
            WHERE a.id = $1 AND a.deletado_em IS NULL
        `;
        
        const result = await this.db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            ...row,
            tags: JSON.parse(row.tags || '[]')
        };
    }

    async listarPorGrupo(
        grupoId: string, 
        filtros: {
            pasta?: string;
            tipo_mime?: string;
            enviado_por?: string;
            tags?: string[];
        } = {},
        ordenacao: 'nome' | 'data' | 'tamanho' | 'downloads' = 'data',
        direcao: 'ASC' | 'DESC' = 'DESC',
        limite: number = 20, 
        offset: number = 0
    ): Promise<any[]> {
        let whereConditions = ['a.grupo_id = $1', 'a.deletado_em IS NULL'];
        let params: any[] = [grupoId];
        let paramCount = 1;

        if (filtros.pasta !== undefined) {
            if (filtros.pasta === null) {
                whereConditions.push('a.pasta IS NULL');
            } else {
                whereConditions.push(`a.pasta = $${++paramCount}`);
                params.push(filtros.pasta);
            }
        }

        if (filtros.tipo_mime) {
            whereConditions.push(`a.tipo_mime LIKE $${++paramCount}`);
            params.push(`${filtros.tipo_mime}%`);
        }

        if (filtros.enviado_por) {
            whereConditions.push(`a.enviado_por = $${++paramCount}`);
            params.push(filtros.enviado_por);
        }

        if (filtros.tags && filtros.tags.length > 0) {
            whereConditions.push(`a.tags::jsonb @> $${++paramCount}`);
            params.push(JSON.stringify(filtros.tags));
        }

        params.push(limite, offset);

        let orderBy = 'a.criado_em';
        switch (ordenacao) {
            case 'nome':
                orderBy = 'a.nome_original';
                break;
            case 'tamanho':
                orderBy = 'a.tamanho';
                break;
            case 'downloads':
                orderBy = 'a.downloads';
                break;
        }

        const query = `
            SELECT a.*, 
                   u.nome as enviado_por_nome,
                   u.avatar_url as enviado_por_avatar,
                   (SELECT COUNT(*) FROM arquivos_versoes WHERE arquivo_pai_id = a.id) as total_versoes
            FROM arquivos a
            LEFT JOIN usuarios u ON a.enviado_por = u.id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY ${orderBy} ${direcao}
            LIMIT $${++paramCount} OFFSET $${++paramCount}
        `;
        
        const result = await this.db.query(query, params);
        
        return result.rows.map((row: any) => ({
            ...row,
            tags: JSON.parse(row.tags || '[]')
        }));
    }

    async atualizar(id: string, dados: Partial<IArquivo>): Promise<boolean> {
        const campos = [];
        const valores = [];
        let contador = 1;

        if (dados.nome) {
            campos.push(`nome = $${contador++}`);
            valores.push(dados.nome);
        }
        
        if (dados.nome_original) {
            campos.push(`nome_original = $${contador++}`);
            valores.push(dados.nome_original);
        }
        
        if (dados.pasta !== undefined) {
            campos.push(`pasta = $${contador++}`);
            valores.push(dados.pasta);
        }
        
        if (dados.descricao !== undefined) {
            campos.push(`descricao = $${contador++}`);
            valores.push(dados.descricao);
        }
        
        if (dados.tags) {
            campos.push(`tags = $${contador++}`);
            valores.push(JSON.stringify(dados.tags));
        }
        
        if (dados.publico !== undefined) {
            campos.push(`publico = $${contador++}`);
            valores.push(dados.publico);
        }

        if (campos.length === 0) {
            return false;
        }

        campos.push(`atualizado_em = NOW()`);
        valores.push(id);

        const query = `
            UPDATE arquivos 
            SET ${campos.join(', ')}
            WHERE id = $${contador} AND deletado_em IS NULL
        `;

        const result = await this.db.query(query, valores);
        return result.rowCount > 0;
    }

    async deletar(id: string): Promise<boolean> {
        const query = `
            UPDATE arquivos 
            SET deletado_em = NOW(), atualizado_em = NOW()
            WHERE id = $1 AND deletado_em IS NULL
        `;
        
        const result = await this.db.query(query, [id]);
        return result.rowCount > 0;
    }

    // ============================================
    // VERSÕES
    // ============================================

    async criarVersao(arquivoId: string, novoArquivo: Partial<IArquivo>): Promise<string> {
        // Primeiro, obter a versão atual
        const queryVersao = `
            SELECT COALESCE(MAX(versao), 0) + 1 as nova_versao
            FROM arquivos 
            WHERE arquivo_pai_id = $1 OR id = $1
        `;
        
        const resultVersao = await this.db.query(queryVersao, [arquivoId]);
        const novaVersao = resultVersao.rows[0].nova_versao;

        const query = `
            INSERT INTO arquivos (
                nome, nome_original, tipo_mime, tamanho, url,
                grupo_id, enviado_por, descricao, tags, versao, arquivo_pai_id
            )
            SELECT $1, $2, $3, $4, $5, grupo_id, $6, $7, $8, $9, 
                   CASE WHEN arquivo_pai_id IS NULL THEN $10 ELSE arquivo_pai_id END
            FROM arquivos 
            WHERE id = $10
            RETURNING id
        `;
        
        const result = await this.db.query(query, [
            novoArquivo.nome,
            novoArquivo.nome_original,
            novoArquivo.tipo_mime,
            novoArquivo.tamanho,
            novoArquivo.url,
            novoArquivo.enviado_por,
            novoArquivo.descricao || null,
            JSON.stringify(novoArquivo.tags || []),
            novaVersao,
            arquivoId
        ]);

        return result.rows[0].id;
    }

    async listarVersoes(arquivoId: string): Promise<any[]> {
        const query = `
            SELECT a.*, 
                   u.nome as enviado_por_nome,
                   u.avatar_url as enviado_por_avatar
            FROM arquivos a
            LEFT JOIN usuarios u ON a.enviado_por = u.id
            WHERE (a.id = $1 OR a.arquivo_pai_id = $1)
              AND a.deletado_em IS NULL
            ORDER BY a.versao DESC
        `;
        
        const result = await this.db.query(query, [arquivoId]);
        
        return result.rows.map((row: any) => ({
            ...row,
            tags: JSON.parse(row.tags || '[]')
        }));
    }

    // ============================================
    // COMPARTILHAMENTO
    // ============================================

    async compartilharArquivo(compartilhamento: ICompartilhamentoArquivo): Promise<boolean> {
        const query = `
            INSERT INTO compartilhamentos_arquivos (
                arquivo_id, usuario_id, pode_visualizar, pode_baixar, 
                pode_editar, data_expiracao
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (arquivo_id, usuario_id) DO UPDATE SET
                pode_visualizar = EXCLUDED.pode_visualizar,
                pode_baixar = EXCLUDED.pode_baixar,
                pode_editar = EXCLUDED.pode_editar,
                data_expiracao = EXCLUDED.data_expiracao,
                atualizado_em = NOW()
        `;
        
        const result = await this.db.query(query, [
            compartilhamento.arquivo_id,
            compartilhamento.usuario_id,
            compartilhamento.pode_visualizar,
            compartilhamento.pode_baixar,
            compartilhamento.pode_editar,
            compartilhamento.data_expiracao || null
        ]);

        return result.rowCount > 0;
    }

    async removerCompartilhamento(arquivoId: string, usuarioId: string): Promise<boolean> {
        const query = `
            DELETE FROM compartilhamentos_arquivos 
            WHERE arquivo_id = $1 AND usuario_id = $2
        `;
        
        const result = await this.db.query(query, [arquivoId, usuarioId]);
        return result.rowCount > 0;
    }

    async verificarPermissao(arquivoId: string, usuarioId: string): Promise<ICompartilhamentoArquivo | null> {
        const query = `
            SELECT ca.*
            FROM compartilhamentos_arquivos ca
            WHERE ca.arquivo_id = $1 
              AND ca.usuario_id = $2
              AND (ca.data_expiracao IS NULL OR ca.data_expiracao > NOW())
        `;
        
        const result = await this.db.query(query, [arquivoId, usuarioId]);
        
        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    }

    // ============================================
    // BUSCA E FILTROS
    // ============================================

    async buscarArquivos(grupoId: string, termo: string, limite: number = 20): Promise<any[]> {
        const query = `
            SELECT a.*, 
                   u.nome as enviado_por_nome,
                   u.avatar_url as enviado_por_avatar,
                   ts_headline('portuguese', a.nome_original || ' ' || COALESCE(a.descricao, ''), 
                              to_tsquery('portuguese', $2), 'MaxWords=10') as nome_destacado
            FROM arquivos a
            LEFT JOIN usuarios u ON a.enviado_por = u.id
            WHERE a.grupo_id = $1 
              AND a.deletado_em IS NULL
              AND (to_tsvector('portuguese', a.nome_original || ' ' || COALESCE(a.descricao, '')) 
                   @@ to_tsquery('portuguese', $2)
                   OR a.tags::text ILIKE '%' || $3 || '%')
            ORDER BY ts_rank(to_tsvector('portuguese', a.nome_original || ' ' || COALESCE(a.descricao, '')), 
                            to_tsquery('portuguese', $2)) DESC,
                     a.criado_em DESC
            LIMIT $4
        `;
        
        const result = await this.db.query(query, [grupoId, termo, termo, limite]);
        
        return result.rows.map((row: any) => ({
            ...row,
            tags: JSON.parse(row.tags || '[]')
        }));
    }

    async listarPastas(grupoId: string): Promise<string[]> {
        const query = `
            SELECT DISTINCT pasta
            FROM arquivos
            WHERE grupo_id = $1 
              AND pasta IS NOT NULL 
              AND deletado_em IS NULL
            ORDER BY pasta
        `;
        
        const result = await this.db.query(query, [grupoId]);
        return result.rows.map((row: any) => row.pasta);
    }

    async obterEstatisticas(grupoId: string): Promise<any> {
        const query = `
            SELECT 
                COUNT(*) as total_arquivos,
                SUM(tamanho) as tamanho_total,
                COUNT(DISTINCT enviado_por) as usuarios_contribuintes,
                COUNT(DISTINCT pasta) as total_pastas,
                SUM(COALESCE(downloads, 0)) as total_downloads,
                COUNT(CASE WHEN tipo_mime LIKE 'image/%' THEN 1 END) as imagens,
                COUNT(CASE WHEN tipo_mime LIKE 'video/%' THEN 1 END) as videos,
                COUNT(CASE WHEN tipo_mime LIKE 'audio/%' THEN 1 END) as audios,
                COUNT(CASE WHEN tipo_mime = 'application/pdf' THEN 1 END) as pdfs,
                COUNT(CASE WHEN tipo_mime LIKE 'application/vnd.ms-%' OR tipo_mime LIKE 'application/vnd.openxmlformats-%' THEN 1 END) as documentos_office
            FROM arquivos
            WHERE grupo_id = $1 AND deletado_em IS NULL
        `;
        
        const result = await this.db.query(query, [grupoId]);
        return result.rows[0];
    }

    async incrementarDownload(id: string): Promise<boolean> {
        const query = `
            UPDATE arquivos 
            SET downloads = COALESCE(downloads, 0) + 1,
                atualizado_em = NOW()
            WHERE id = $1 AND deletado_em IS NULL
        `;
        
        const result = await this.db.query(query, [id]);
        return result.rowCount > 0;
    }

    async obterArquivosRecentes(grupoId: string, limite: number = 10): Promise<any[]> {
        const query = `
            SELECT a.*, 
                   u.nome as enviado_por_nome,
                   u.avatar_url as enviado_por_avatar
            FROM arquivos a
            LEFT JOIN usuarios u ON a.enviado_por = u.id
            WHERE a.grupo_id = $1 
              AND a.deletado_em IS NULL
            ORDER BY a.criado_em DESC
            LIMIT $2
        `;
        
        const result = await this.db.query(query, [grupoId, limite]);
        
        return result.rows.map((row: any) => ({
            ...row,
            tags: JSON.parse(row.tags || '[]')
        }));
    }
}
