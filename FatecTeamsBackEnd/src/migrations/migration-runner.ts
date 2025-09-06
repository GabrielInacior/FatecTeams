import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { Logger } from '../utils/Logger';

interface Migration {
  id: string;
  filename: string;
  sql: string;
  applied_at?: Date;
}

class MigrationRunner {
  private pool: Pool;
  private migrationsPath: string;

  constructor() {
    // Configuração do banco baseada no ambiente
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'FatecTeams',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };

    this.pool = new Pool(dbConfig);
    this.migrationsPath = path.join(__dirname, '../../migrations');
  }

  /**
   * Cria a tabela de controle de migrations se não existir
   */
  private async createMigrationsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64)
      );
    `;

    try {
      await this.pool.query(createTableSQL);
      Logger.info('🗄️  Tabela de migrations criada/verificada com sucesso');
    } catch (error) {
      Logger.error('❌ Erro ao criar tabela de migrations:', error);
      throw error;
    }
  }

  /**
   * Obtém migrations já aplicadas
   */
  private async getAppliedMigrations(): Promise<string[]> {
    try {
      const result = await this.pool.query(
        'SELECT filename FROM migrations ORDER BY applied_at ASC'
      );
      return result.rows.map(row => row.filename);
    } catch (error) {
      Logger.error('❌ Erro ao buscar migrations aplicadas:', error);
      throw error;
    }
  }

  /**
   * Lê arquivos de migration do diretório
   */
  private async getMigrationFiles(): Promise<Migration[]> {
    try {
      const files = fs.readdirSync(this.migrationsPath);
      const sqlFiles = files.filter(file => file.endsWith('.sql'));
      
      const migrations: Migration[] = [];
      
      for (const filename of sqlFiles) {
        const filePath = path.join(this.migrationsPath, filename);
        const sql = fs.readFileSync(filePath, 'utf8');
        const id = filename.replace('.sql', '');
        
        migrations.push({
          id,
          filename,
          sql: sql.trim()
        });
      }
      
      // Ordenar por nome do arquivo (assumindo formato 001_nome.sql)
      migrations.sort((a, b) => a.filename.localeCompare(b.filename));
      
      return migrations;
    } catch (error) {
      Logger.error('❌ Erro ao ler arquivos de migration:', error);
      throw error;
    }
  }

  /**
   * Calcula checksum do conteúdo da migration
   */
  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Aplica uma migration individual
   */
  private async applyMigration(migration: Migration): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      Logger.info(`🔄 Aplicando migration: ${migration.filename}`);
      
      // Executar SQL da migration
      await client.query(migration.sql);
      
      // Registrar migration como aplicada
      const checksum = this.calculateChecksum(migration.sql);
      await client.query(
        'INSERT INTO migrations (filename, checksum) VALUES ($1, $2)',
        [migration.filename, checksum]
      );
      
      await client.query('COMMIT');
      Logger.info(`✅ Migration aplicada com sucesso: ${migration.filename}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      Logger.error(`❌ Erro ao aplicar migration ${migration.filename}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Executa todas as migrations pendentes
   */
  public async runMigrations(): Promise<void> {
    try {
      Logger.info('🚀 Iniciando processo de migrations...');
      
      // Criar tabela de controle
      await this.createMigrationsTable();
      
      // Obter migrations já aplicadas
      const appliedMigrations = await this.getAppliedMigrations();
      Logger.info(`📋 Migrations já aplicadas: ${appliedMigrations.length}`);
      
      // Obter arquivos de migration
      const allMigrations = await this.getMigrationFiles();
      Logger.info(`📁 Arquivos de migration encontrados: ${allMigrations.length}`);
      
      // Filtrar migrations pendentes
      const pendingMigrations = allMigrations.filter(
        migration => !appliedMigrations.includes(migration.filename)
      );
      
      if (pendingMigrations.length === 0) {
        Logger.info('✨ Todas as migrations já foram aplicadas!');
        return;
      }
      
      Logger.info(`🔄 Aplicando ${pendingMigrations.length} migrations pendentes...`);
      
      // Aplicar migrations uma por vez
      for (const migration of pendingMigrations) {
        await this.applyMigration(migration);
      }
      
      Logger.info('🎉 Todas as migrations foram aplicadas com sucesso!');
      
    } catch (error) {
      Logger.error('💥 Erro fatal no processo de migrations:', error);
      throw error;
    }
  }

  /**
   * Verifica se há migrations pendentes sem aplicá-las
   */
  public async checkPendingMigrations(): Promise<string[]> {
    try {
      await this.createMigrationsTable();
      
      const appliedMigrations = await this.getAppliedMigrations();
      const allMigrations = await this.getMigrationFiles();
      
      const pendingMigrations = allMigrations
        .filter(migration => !appliedMigrations.includes(migration.filename))
        .map(migration => migration.filename);
      
      return pendingMigrations;
    } catch (error) {
      Logger.error('❌ Erro ao verificar migrations pendentes:', error);
      throw error;
    }
  }

  /**
   * Fecha conexão com o banco
   */
  public async close(): Promise<void> {
    await this.pool.end();
  }
}

// Função para executar migrations via CLI
async function runMigrationsFromCLI(): Promise<void> {
  const migrationRunner = new MigrationRunner();
  
  try {
    await migrationRunner.runMigrations();
    process.exit(0);
  } catch (error) {
    console.error('Erro ao executar migrations:', error);
    process.exit(1);
  } finally {
    await migrationRunner.close();
  }
}

// Se executado diretamente via CLI
if (require.main === module) {
  runMigrationsFromCLI();
}

export { MigrationRunner };
export default MigrationRunner;
