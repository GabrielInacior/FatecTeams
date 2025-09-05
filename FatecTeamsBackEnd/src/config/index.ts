import dotenv from 'dotenv';

dotenv.config();

export const config = {
    // Servidor
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3001'),
    HOST: process.env.HOST || 'localhost',

    // Banco de dados
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        name: process.env.DB_NAME || 'fatecteams_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'sua_chave_secreta_jwt',
        expiresIn: process.env.JWT_EXPIRE_TIME || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'sua_chave_refresh_jwt',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE_TIME || '30d',
    },

    // AWS S3
    aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        bucketName: process.env.AWS_S3_BUCKET_NAME || 'fatecteams-uploads',
    },

    // Email SMTP
    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },

    // OAuth Google
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },

    // OAuth Microsoft
    microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID || '',
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    },

    // Rate Limiting
    rateLimit: {
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        windowMinutes: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15'),
    },

    // Upload
    upload: {
        maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '50'),
        allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,rar').split(','),
    },

    // Frontend
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:8081',
        allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:8081,http://localhost:19006,http://localhost:3000').split(','),
    },

    // Logs
    logLevel: process.env.LOG_LEVEL || 'info',

    // WebSocket
    socketIO: {
        corsOrigin: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:8081',
    },

    // Criptografia
    bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
    },

    // Convites
    convite: {
        expiracaoHoras: parseInt(process.env.CONVITE_EXPIRACAO_HORAS || '168'),
    },
};
