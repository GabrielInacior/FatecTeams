#!/usr/bin/env node

/**
 * Script de verificação do banco de dados
 * Testa se todas as tabelas e colunas estão corretas conforme as migrations
 */

import { DatabaseConfig } from '../src/config/database';
import dotenv from 'dotenv';

dotenv.config();

async function verificarBanco() {
    console.log('🔍 Iniciando verificação do banco de dados...\n');
    
    const db = DatabaseConfig.getInstance();
    
    try {
        // Testar conexão
        console.log('📡 Testando conexão com o banco...');
        await db.query('SELECT 1');
        console.log('✅ Conexão estabelecida com sucesso\n');
        
        // Verificar tabelas principais
        console.log('🗂️ Verificando tabelas principais...');
        const tabelas = [
            'usuarios', 'grupos', 'membros_grupo', 'mensagens', 
            'tarefas', 'eventos_calendario', 'arquivos', 'convites_grupo',
            'notificacoes', 'historico_atividades', 'reacoes_mensagens',
            'leituras_mensagem', 'comentarios_tarefas', 'provedores_oauth'
        ];
        
        for (const tabela of tabelas) {
            const result = await db.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_name = $1
            `, [tabela]);
            
            if (result.rows[0].count > 0) {
                console.log(`✅ ${tabela}`);
            } else {
                console.log(`❌ ${tabela} - NÃO ENCONTRADA`);
            }
        }
        
        console.log('\n🔧 Verificando colunas críticas...');
        
        // Verificar colunas específicas
        const verificacoes = [
            { tabela: 'mensagens', coluna: 'remetente_id' },
            { tabela: 'mensagens', coluna: 'tipo_mensagem' },
            { tabela: 'mensagens', coluna: 'mencionados' },
            { tabela: 'tarefas', coluna: 'criador_id' },
            { tabela: 'tarefas', coluna: 'assignado_para' },
            { tabela: 'tarefas', coluna: 'etiquetas' },
            { tabela: 'grupos', coluna: 'codigo_acesso' },
            { tabela: 'grupos', coluna: 'configuracoes' },
            { tabela: 'eventos_calendario', coluna: 'link_virtual' },
            { tabela: 'eventos_calendario', coluna: 'status' },
            { tabela: 'notificacoes', coluna: 'metadados' },
            { tabela: 'usuarios', coluna: 'foto_perfil' }
        ];
        
        for (const { tabela, coluna } of verificacoes) {
            try {
                const result = await db.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = $1 AND column_name = $2
                `, [tabela, coluna]);
                
                if (result.rows.length > 0) {
                    console.log(`✅ ${tabela}.${coluna}`);
                } else {
                    console.log(`❌ ${tabela}.${coluna} - COLUNA NÃO ENCONTRADA`);
                }
            } catch (error) {
                console.log(`❌ ${tabela}.${coluna} - ERRO: ${error.message}`);
            }
        }
        
        console.log('\n📊 Estatísticas do banco:');
        
        // Contar registros em cada tabela
        for (const tabela of tabelas.slice(0, 5)) { // Apenas principais
            try {
                const result = await db.query(`SELECT COUNT(*) as count FROM ${tabela}`);
                console.log(`📈 ${tabela}: ${result.rows[0].count} registros`);
            } catch (error) {
                console.log(`❌ Erro ao contar ${tabela}: ${error.message}`);
            }
        }
        
        console.log('\n✅ Verificação concluída!');
        
    } catch (error) {
        console.error('❌ Erro durante a verificação:', error.message);
        process.exit(1);
    }
}

// Executar verificação se for chamado diretamente
if (require.main === module) {
    verificarBanco()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Erro fatal:', error);
            process.exit(1);
        });
}

export { verificarBanco };
