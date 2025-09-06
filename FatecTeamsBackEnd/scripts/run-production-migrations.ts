#!/usr/bin/env ts-node

import { MigrationRunner } from '../src/migrations/migration-runner';
import { Logger } from '../src/utils/Logger';

/**
 * Script para executar migrations em produção
 * Deve ser executado antes de iniciar o servidor
 */
async function runProductionMigrations() {
  let runner: MigrationRunner | null = null;
  
  try {
    Logger.info('🚀 [PRODUÇÃO] Iniciando processo de migrations...');
    
    runner = new MigrationRunner();
    
    // Verificar migrations pendentes
    const pendingMigrations = await runner.checkPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      Logger.info('✅ [PRODUÇÃO] Nenhuma migration pendente. Sistema atualizado!');
      return;
    }
    
    Logger.info(`📊 [PRODUÇÃO] Encontradas ${pendingMigrations.length} migrations pendentes:`);
    pendingMigrations.forEach(migration => {
      Logger.info(`   - ${migration}`);
    });
    
    // Executar migrations
    await runner.runMigrations();
    
    Logger.info('🎉 [PRODUÇÃO] Todas as migrations foram aplicadas com sucesso!');
    
  } catch (error) {
    Logger.error('💥 [PRODUÇÃO] Erro fatal no processo de migrations:', error);
    
    // Em produção, falhar se migrations não executarem
    process.exit(1);
    
  } finally {
    if (runner) {
      await runner.close();
    }
  }
}

// Verificar se está sendo executado diretamente
if (require.main === module) {
  runProductionMigrations()
    .then(() => {
      Logger.info('✅ [PRODUÇÃO] Script de migrations concluído com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      Logger.error('❌ [PRODUÇÃO] Falha no script de migrations:', error);
      process.exit(1);
    });
}

export { runProductionMigrations };

