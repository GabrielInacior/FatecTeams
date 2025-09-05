import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export class DatabaseConfig {
    private static instance: DatabaseConfig;
    private pool: Pool;

    private constructor() {
        this.pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'fatecteams_db',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.pool.on('error', (err) => {
            console.error('Erro na pool de conexões PostgreSQL:', err);
        });
    }

    public static getInstance(): DatabaseConfig {
        if (!DatabaseConfig.instance) {
            DatabaseConfig.instance = new DatabaseConfig();
        }
        return DatabaseConfig.instance;
    }

    public async getConnection(): Promise<PoolClient> {
        try {
            const client = await this.pool.connect();
            return client;
        } catch (error) {
            console.error('Erro ao obter conexão do pool:', error);
            throw error;
        }
    }

    public async query(text: string, params?: any[]): Promise<any> {
        const client = await this.getConnection();
        try {
            const result = await client.query(text, params);
            return result;
        } catch (error) {
            console.error('Erro ao executar query:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    public async close(): Promise<void> {
        await this.pool.end();
    }

    public getPool(): Pool {
        return this.pool;
    }
}
