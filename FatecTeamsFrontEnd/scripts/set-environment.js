#!/usr/bin/env node

/**
 * Script para configurar ambiente do frontend
 * Uso: node scripts/set-environment.js [development|production|staging]
 */

const fs = require('fs');
const path = require('path');

const environments = {
  development: {
    REACT_NATIVE_ENV: 'development',
    API_URL: 'http://localhost:3000/api',
    WEBSOCKET_URL: 'ws://localhost:3000',
    DEBUG: 'true'
  },
  production: {
    REACT_NATIVE_ENV: 'production', 
    API_URL: 'http://18.216.17.158:3000/api',
    WEBSOCKET_URL: 'ws://18.216.17.158:3000',
    DEBUG: 'false'
  },
  staging: {
    REACT_NATIVE_ENV: 'staging',
    API_URL: 'http://18.216.17.158:3000/api', 
    WEBSOCKET_URL: 'ws://18.216.17.158:3000',
    DEBUG: 'true'
  }
};

function setEnvironment(env) {
  const envConfig = environments[env];
  
  if (!envConfig) {
    console.error(`❌ Ambiente '${env}' não encontrado. Ambientes disponíveis: ${Object.keys(environments).join(', ')}`);
    process.exit(1);
  }

  // Criar arquivo .env se não existir
  const envPath = path.join(__dirname, '..', '.env');
  
  let envContent = '';
  for (const [key, value] of Object.entries(envConfig)) {
    envContent += `${key}=${value}\n`;
  }
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Ambiente configurado para: ${env}`);
    console.log(`📁 Arquivo criado: ${envPath}`);
    console.log('📋 Configurações:');
    Object.entries(envConfig).forEach(([key, value]) => {
      console.log(`   ${key}=${value}`);
    });
    
    console.log('\n🔄 Reinicie o servidor Expo para aplicar as mudanças.');
  } catch (error) {
    console.error('❌ Erro ao criar arquivo .env:', error.message);
    process.exit(1);
  }
}

// Obter ambiente da linha de comando
const targetEnv = process.argv[2];

if (!targetEnv) {
  console.log('📋 Uso: node scripts/set-environment.js [ambiente]');
  console.log('🌍 Ambientes disponíveis:');
  Object.keys(environments).forEach(env => {
    console.log(`   - ${env}`);
  });
  process.exit(1);
}

setEnvironment(targetEnv);
