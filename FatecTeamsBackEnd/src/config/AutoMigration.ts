import { MigrationRunner } from '../migrations/migration-runner';
import { Logger } from '../utils/Logger';

/**
 * Hook de inicialização que roda migrations automaticamente
 * quando a aplicação inicia
 */
export class AutoMigration {
  private migrationRunner: MigrationRunner;

  constructor() {
    this.migrationRunner = new MigrationRunner();
  }

  /**
   * Executa migrations automaticamente no startup
   * Pode ser configurado via variável de ambiente AUTO_MIGRATE
   */
  public async runOnStartup(): Promise<void> {
    // Verificar se auto-migration está habilitado
    const autoMigrate = process.env.AUTO_MIGRATE?.toLowerCase();
    
    if (autoMigrate !== 'true' && autoMigrate !== '1') {
      Logger.info('🚫 Auto-migration desabilitado (AUTO_MIGRATE != true)');
      return;
    }

    try {
      Logger.info('🔄 Auto-migration habilitado, executando...');
      
      // Verificar migrations pendentes primeiro
      const pendingMigrations = await this.migrationRunner.checkPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        Logger.info('✅ Nenhuma migration pendente');
        return;
      }
      
      Logger.info(`🔄 Encontradas ${pendingMigrations.length} migrations pendentes:`);
      pendingMigrations.forEach((migration: string) => {
        Logger.info(`   - ${migration}`);
      });
      
      // Executar migrations
      await this.migrationRunner.runMigrations();
      
      Logger.info('🎉 Auto-migration concluído com sucesso!');
      
    } catch (error) {
      Logger.error('💥 Erro crítico durante auto-migration:', error);
      
      // Em produção, pode ser que você queira interromper a aplicação
      // se as migrations falharem
      if (process.env.NODE_ENV === 'production') {
        Logger.error('🚨 Aplicação será interrompida devido a falha nas migrations');
        process.exit(1);
      }
      
      throw error;
    } finally {
      await this.migrationRunner.close();
    }
  }

  /**
   * Executa migrations de forma manual (útil para CI/CD)
   */
  public async runManually(): Promise<void> {
    try {
      await this.migrationRunner.runMigrations();
    } finally {
      await this.migrationRunner.close();
    }
  }

  /**
   * Apenas verifica se há migrations pendentes sem executá-las
   */
  public async checkOnly(): Promise<string[]> {
    try {
      return await this.migrationRunner.checkPendingMigrations();
    } finally {
      await this.migrationRunner.close();
    }
  }
}

export default AutoMigration;
