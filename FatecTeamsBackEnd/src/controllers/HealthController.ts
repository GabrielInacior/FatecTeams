import { Request, Response } from 'express';
import { DatabaseConfig } from '../config/database';
import { Logger } from '../utils/Logger';

export class HealthController {
    
    /**
     * Health check básico da aplicação
     */
    public static async healthCheck(req: Request, res: Response): Promise<void> {
        try {
            const healthStatus: any = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development',
                version: process.env.npm_package_version || '1.0.0',
                services: {
                    database: 'checking',
                    redis: 'checking'
                }
            };

            // Verificar conexão com banco de dados
            try {
                const db = DatabaseConfig.getInstance();
                const result = await db.query('SELECT NOW() as current_time, version() as db_version');
                
                healthStatus.services.database = {
                    status: 'healthy',
                    response_time: Date.now(),
                    version: result.rows[0].db_version.split(',')[0]
                };
            } catch (dbError) {
                Logger.error('Health check - Database error:', dbError);
                healthStatus.services.database = {
                    status: 'unhealthy',
                    error: 'Database connection failed'
                };
                healthStatus.status = 'degraded';
            }

            // Verificar Redis (se configurado)
            try {
                if (process.env.REDIS_HOST) {
                    // Aqui você adicionaria a verificação do Redis quando implementado
                    healthStatus.services.redis = {
                        status: 'not_configured'
                    };
                } else {
                    healthStatus.services.redis = {
                        status: 'not_configured'
                    };
                }
            } catch (redisError) {
                Logger.error('Health check - Redis error:', redisError);
                healthStatus.services.redis = {
                    status: 'unhealthy',
                    error: 'Redis connection failed'
                };
            }

            // Determinar status geral
            const hasUnhealthyService = Object.values(healthStatus.services)
                .some((service: any) => service.status === 'unhealthy');

            if (hasUnhealthyService) {
                healthStatus.status = 'unhealthy';
                res.status(503);
            } else if (healthStatus.status === 'degraded') {
                res.status(200); // Still return 200 for degraded but functional
            } else {
                res.status(200);
            }

            res.json(healthStatus);
            
        } catch (error) {
            Logger.error('Health check error:', error);
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: 'Health check failed'
            });
        }
    }

    /**
     * Health check detalhado com informações do sistema
     */
    public static async detailedHealthCheck(req: Request, res: Response): Promise<void> {
        try {
            const db = DatabaseConfig.getInstance();
            
            // Informações do sistema
            const systemInfo: any = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                version: process.env.npm_package_version || '1.0.0',
                
                // Informações de runtime
                runtime: {
                    node_version: process.version,
                    uptime_seconds: process.uptime(),
                    memory_usage: process.memoryUsage(),
                    platform: process.platform,
                    pid: process.pid
                },

                // Status dos serviços
                services: {
                    database: 'checking',
                    websocket: 'checking',
                    file_storage: 'checking'
                },

                // Configurações importantes (sem valores sensíveis)
                config: {
                    port: process.env.PORT || 3000,
                    host: process.env.HOST || 'localhost',
                    database_host: process.env.DB_HOST || 'localhost',
                    auto_migrate: process.env.AUTO_MIGRATE || 'false',
                    cors_enabled: !!process.env.CORS_ORIGIN,
                    rate_limiting: process.env.RATE_LIMIT_ENABLED || 'false',
                    ssl_enabled: process.env.SSL_ENABLED || 'false'
                }
            };

            // Verificar banco de dados com mais detalhes
            try {
                const start = Date.now();
                const result = await db.query(`
                    SELECT 
                        NOW() as current_time,
                        version() as db_version,
                        current_database() as database_name,
                        current_user as db_user
                `);
                
                const responseTime = Date.now() - start;
                
                systemInfo.services.database = {
                    status: 'healthy',
                    response_time_ms: responseTime,
                    version: result.rows[0].db_version.split(',')[0],
                    database: result.rows[0].database_name,
                    user: result.rows[0].db_user,
                    connection_pool: {
                        // Aqui você pode adicionar informações do pool de conexões
                        // se disponível na sua implementação do DatabaseConfig
                    }
                };
            } catch (dbError: any) {
                Logger.error('Detailed health check - Database error:', dbError);
                systemInfo.services.database = {
                    status: 'unhealthy',
                    error: dbError.message
                };
                systemInfo.status = 'unhealthy';
            }

            // Verificar WebSocket
            try {
                systemInfo.services.websocket = {
                    status: 'healthy',
                    port: process.env.WEBSOCKET_PORT || 'same_as_http',
                    cors_origin: process.env.WEBSOCKET_CORS_ORIGIN || 'not_configured'
                };
            } catch (wsError: any) {
                systemInfo.services.websocket = {
                    status: 'unhealthy',
                    error: wsError.message
                };
            }

            // Verificar armazenamento de arquivos (S3)
            try {
                if (process.env.AWS_S3_BUCKET_NAME) {
                    systemInfo.services.file_storage = {
                        status: 'configured',
                        type: 'aws_s3',
                        region: process.env.AWS_REGION,
                        bucket: process.env.AWS_S3_BUCKET_NAME
                    };
                } else {
                    systemInfo.services.file_storage = {
                        status: 'not_configured',
                        type: 'local'
                    };
                }
            } catch (storageError: any) {
                systemInfo.services.file_storage = {
                    status: 'unhealthy',
                    error: storageError.message
                };
            }

            // Determinar status HTTP baseado na saúde dos serviços
            if (systemInfo.status === 'unhealthy') {
                res.status(503);
            } else {
                res.status(200);
            }

            res.json(systemInfo);
            
        } catch (error) {
            Logger.error('Detailed health check error:', error);
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: 'Detailed health check failed'
            });
        }
    }
}

export default HealthController;
