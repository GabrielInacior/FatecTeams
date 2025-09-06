#!/usr/bin/env ts-node

import { Pool } from 'pg';
import { config } from '../src/config';

async function resetMigrationState() {
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
  });

  try {
    console.log('🔄 Resetando estado das migrations...');
    
    // Primeiro, verificar se a tabela existe
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);

    if (checkTable.rows[0].exists) {
      // Limpar tabela de migrations
      await pool.query('DELETE FROM migrations');
      console.log('✅ Estado das migrations resetado com sucesso!');
    } else {
      console.log('ℹ️  Tabela de migrations não existe ainda.');
    }

    // Opcionalmente, você pode adicionar aqui comandos para limpar dados específicos
    // se necessário para um reset completo do banco
    
  } catch (error) {
    console.error('❌ Erro ao resetar estado das migrations:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function dropAllObjects() {
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
  });

  try {
    console.log('🗑️  Removendo todos os objetos do banco...');
    
    // Drop todas as tabelas em cascata
    const tables = [
      'arquivos',
      'historico_atividades', 
      'notificacoes',
      'convites',
      'mensagens',
      'eventos',
      'tarefas',
      'grupo_membros',
      'grupos',
      'usuarios',
      'migrations'
    ];

    for (const table of tables) {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
    }

    // Drop todos os tipos enum
    const enums = [
      'enum_status_geral',
      'enum_provedor_oauth',
      'enum_tipo_grupo',
      'enum_privacidade_grupo',
      'enum_papel_usuario_grupo',
      'enum_prioridade_tarefa',
      'enum_status_tarefa',
      'enum_status_convite',
      'enum_tipo_notificacao',
      'enum_tipo_atividade'
    ];

    for (const enumType of enums) {
      await pool.query(`DROP TYPE IF EXISTS ${enumType} CASCADE;`);
    }

    console.log('✅ Todos os objetos removidos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao remover objetos:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Verificar argumentos da linha de comando
const command = process.argv[2];

if (command === '--reset-only') {
  resetMigrationState().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else if (command === '--drop-all') {
  dropAllObjects().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else if (command === '--full-reset') {
  (async () => {
    await dropAllObjects();
    await resetMigrationState();
  })().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  console.log(`
Uso: ts-node scripts/reset-migrations.ts [opção]

Opções:
  --reset-only  : Apenas limpa a tabela de migrations (mantém dados)
  --drop-all    : Remove todas as tabelas e tipos do banco
  --full-reset  : Remove tudo e reseta migrations (reset completo)

Sem argumentos: mostra esta ajuda
  `);
}
