// Configurações do ambiente
interface EnvironmentConfig {
  API_BASE_URL: string;
  WEBSOCKET_URL: string;
  AWS_S3_BASE_URL?: string;
  DEBUG_MODE: boolean;
  TIMEOUT_REQUEST: number;
  MAX_RETRY_ATTEMPTS: number;
  CACHE_ENABLED: boolean;
}

// Detectar ambiente
const isDevelopment = __DEV__;
const isWeb = typeof window !== 'undefined';

// Configurações por ambiente
const environments: Record<string, EnvironmentConfig> = {
  development: {
    API_BASE_URL: 'http://localhost:3000/api',
    WEBSOCKET_URL: 'ws://localhost:3000',
    DEBUG_MODE: true,
    TIMEOUT_REQUEST: 10000,
    MAX_RETRY_ATTEMPTS: 3,
    CACHE_ENABLED: false,
  },
  
  production: {
    API_BASE_URL: 'http://18.216.17.158:3000/api',
    WEBSOCKET_URL: 'ws://18.216.17.158:3000',
    AWS_S3_BASE_URL: 'https://inaciobucket.s3.us-east-2.amazonaws.com',
    DEBUG_MODE: false,
    TIMEOUT_REQUEST: 15000,
    MAX_RETRY_ATTEMPTS: 5,
    CACHE_ENABLED: true,
  },

  // Para testes locais com servidor remoto
  staging: {
    API_BASE_URL: 'http://18.216.17.158:3000/api',
    WEBSOCKET_URL: 'ws://18.216.17.158:3000',
    AWS_S3_BASE_URL: 'https://inaciobucket.s3.us-east-2.amazonaws.com',
    DEBUG_MODE: true,
    TIMEOUT_REQUEST: 12000,
    MAX_RETRY_ATTEMPTS: 4,
    CACHE_ENABLED: false,
  },
};

// Determinar ambiente atual
function getCurrentEnvironment(): string {
  // Primeiro, verificar se há uma variável de ambiente específica
  if (typeof process !== 'undefined' && process.env.REACT_NATIVE_ENV) {
    return process.env.REACT_NATIVE_ENV;
  }
  
  // Em seguida, usar lógica padrão
  if (isDevelopment) {
    return 'development';
  } else {
    return 'production';
  }
}

// Obter configuração do ambiente atual
const currentEnvironment = getCurrentEnvironment();
const config = environments[currentEnvironment] || environments.development;

// Log da configuração em desenvolvimento
if (config.DEBUG_MODE) {
  console.log('🔧 [Config] Ambiente atual:', currentEnvironment);
  console.log('🔧 [Config] Configurações:', config);
}

// Validar URLs críticas
if (!config.API_BASE_URL) {
  throw new Error('[Config] API_BASE_URL é obrigatória');
}

// Exportar configuração
export const appConfig = {
  ...config,
  ENVIRONMENT: currentEnvironment,
  IS_DEVELOPMENT: isDevelopment,
  IS_WEB: isWeb,
  
  // Funções auxiliares
  getApiUrl: (endpoint: string) => {
    const url = `${config.API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    if (config.DEBUG_MODE) {
      console.log('🌐 [API] URL:', url);
    }
    return url;
  },
  
  getWebSocketUrl: () => {
    if (config.DEBUG_MODE) {
      console.log('🔌 [WebSocket] URL:', config.WEBSOCKET_URL);
    }
    return config.WEBSOCKET_URL;
  },
  
  getS3Url: (key: string) => {
    if (!config.AWS_S3_BASE_URL) {
      return null;
    }
    const url = `${config.AWS_S3_BASE_URL}/${key}`;
    if (config.DEBUG_MODE) {
      console.log('☁️ [S3] URL:', url);
    }
    return url;
  },
};

export default appConfig;
