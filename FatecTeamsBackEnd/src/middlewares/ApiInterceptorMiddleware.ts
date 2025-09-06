import { Request, Response, NextFunction } from 'express';
import { LoggingMiddleware } from './LoggingMiddleware';

interface ApiRequest extends Request {
    startTime?: number;
    requestId?: string;
}

export class ApiInterceptorMiddleware {
    
    /**
     * Middleware principal que intercepta todas as chamadas da API
     */
    public static intercept = (req: ApiRequest, res: Response, next: NextFunction): void => {
        // Gerar ID único para a requisição
        req.requestId = ApiInterceptorMiddleware.generateRequestId();
        req.startTime = Date.now();
        
        // Log detalhado da requisição
        ApiInterceptorMiddleware.logIncomingRequest(req);
        
        // Interceptar a resposta
        const originalJson = res.json;
        const originalSend = res.send;
        
        // Sobrescrever res.json
        res.json = function(body: any): Response {
            ApiInterceptorMiddleware.logOutgoingResponse(req, res, body, 'json');
            return originalJson.call(this, body);
        };
        
        // Sobrescrever res.send
        res.send = function(body: any): Response {
            ApiInterceptorMiddleware.logOutgoingResponse(req, res, body, 'send');
            return originalSend.call(this, body);
        };
        
        // Capturar erros não tratados
        res.on('finish', () => {
            if (res.statusCode >= 400) {
                // Possível ponto de breakpoint para depuração
                debugger; // ← F9 aqui para pausar em todas as respostas de erro
            }
        });
        
        next();
    };
    
    /**
     * Log detalhado da requisição entrante
     */
    private static logIncomingRequest(req: ApiRequest): void {
        console.log('\n' + '='.repeat(100));
        console.log(`🚀 INCOMING REQUEST [${req.requestId}]`);
        console.log('='.repeat(100));
        
        // Informações básicas
        LoggingMiddleware.logInfo(`${req.method} ${req.originalUrl}`, {
            requestId: req.requestId,
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']?.substring(0, 100),
            timestamp: new Date().toISOString()
        }, '📥');
        
        // Headers importantes
        const importantHeaders = [
            'authorization',
            'content-type',
            'accept',
            'origin',
            'referer',
            'x-forwarded-for'
        ];
        
        const headers: any = {};
        importantHeaders.forEach(header => {
            if (req.headers[header]) {
                if (header === 'authorization') {
                    headers[header] = req.headers[header]?.toString().substring(0, 20) + '...***';
                } else {
                    headers[header] = req.headers[header];
                }
            }
        });
        
        if (Object.keys(headers).length > 0) {
            LoggingMiddleware.logInfo('Request Headers', headers, '📋');
        }
        
        // Body da requisição
        if (req.body && Object.keys(req.body).length > 0) {
            const sanitizedBody = ApiInterceptorMiddleware.sanitizeBody(req.body);
            LoggingMiddleware.logInfo('Request Body', sanitizedBody, '📝');
        }
        
        // Query Parameters
        if (Object.keys(req.query).length > 0) {
            LoggingMiddleware.logInfo('Query Parameters', req.query, '🔍');
        }
        
        // Route Parameters
        if (Object.keys(req.params).length > 0) {
            LoggingMiddleware.logInfo('Route Parameters', req.params, '🎯');
        }
        
        console.log('─'.repeat(100));
    }
    
    /**
     * Log detalhado da resposta
     */
    private static logOutgoingResponse(req: ApiRequest, res: Response, body: any, method: string): void {
        const duration = Date.now() - (req.startTime || 0);
        const statusCode = res.statusCode;
        const isError = statusCode >= 400;
        const isSuccess = statusCode >= 200 && statusCode < 300;
        
        console.log('\n' + '='.repeat(100));
        
        if (isError) {
            console.log(`❌ ERROR RESPONSE [${req.requestId}] - ${statusCode}`);
            console.log('='.repeat(100));
            
            // Log do erro
            ApiInterceptorMiddleware.logErrorDetails(req, res, body, duration);
            
            // Breakpoint automático para erros
            console.log(`\n🔴 DEBUG BREAKPOINT TRIGGERED - Status: ${statusCode}`);
            console.log('💡 Use F10/F11 para step debugging, F5 para continuar');
            debugger; // ← Breakpoint automático para erros
            
        } else if (isSuccess) {
            console.log(`✅ SUCCESS RESPONSE [${req.requestId}] - ${statusCode}`);
            console.log('='.repeat(100));
            
            ApiInterceptorMiddleware.logSuccessDetails(req, res, body, duration);
        } else {
            console.log(`ℹ️ RESPONSE [${req.requestId}] - ${statusCode}`);
            console.log('='.repeat(100));
        }
        
        // Performance warning
        if (duration > 1000) {
            LoggingMiddleware.logWarning(`Slow response detected! ${duration}ms`, {
                route: `${req.method} ${req.originalUrl}`,
                duration: `${duration}ms`,
                threshold: '1000ms'
            });
            
            // Breakpoint para respostas lentas
            console.log(`\n🐌 SLOW RESPONSE BREAKPOINT - ${duration}ms`);
            debugger; // ← Breakpoint para respostas lentas
        }
        
        console.log('='.repeat(100) + '\n');
    }
    
    /**
     * Log detalhado para erros
     */
    private static logErrorDetails(req: ApiRequest, res: Response, body: any, duration: number): void {
        try {
            const errorData = typeof body === 'string' ? JSON.parse(body) : body;
            
            // Informações do erro
            LoggingMiddleware.logError(new Error(errorData?.mensagem || 'Unknown error'), 
                `API Error on ${req.method} ${req.originalUrl}`, req);
            
            // Detalhes adicionais
            const errorInfo: any = {
                requestId: req.requestId,
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString(),
                userAgent: req.headers['user-agent'],
                ip: req.ip || req.socket.remoteAddress
            };
            
            if (errorData?.erros) {
                errorInfo.validationErrors = errorData.erros;
            }
            
            LoggingMiddleware.logInfo('Error Context', errorInfo, '🔍');
            
            // Log do body da requisição que causou o erro
            if (req.body && Object.keys(req.body).length > 0) {
                const sanitizedBody = ApiInterceptorMiddleware.sanitizeBody(req.body);
                LoggingMiddleware.logInfo('Request Body that caused error', sanitizedBody, '📝');
            }
            
        } catch (parseError) {
            LoggingMiddleware.logError(parseError as Error, 'Error parsing response body');
            console.log('Raw response body:', body);
        }
    }
    
    /**
     * Log detalhado para sucessos
     */
    private static logSuccessDetails(req: ApiRequest, res: Response, body: any, duration: number): void {
        try {
            const successData = typeof body === 'string' ? JSON.parse(body) : body;
            
            // Informações de sucesso
            const successInfo = {
                requestId: req.requestId,
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                message: successData?.mensagem || 'Success',
                timestamp: new Date().toISOString()
            };
            
            LoggingMiddleware.logSuccess('API Call Successful', successInfo, '🎉');
            
            // Resumo dos dados retornados (sem dados sensíveis)
            if (successData?.dados) {
                const datasSummary = ApiInterceptorMiddleware.createDataSummary(successData.dados);
                if (datasSummary) {
                    LoggingMiddleware.logInfo('Response Data Summary', datasSummary, '📊');
                }
            }
            
            // Performance metrics
            const performanceLevel = duration < 100 ? 'Excellent' : 
                                   duration < 300 ? 'Good' : 
                                   duration < 1000 ? 'Average' : 'Poor';
            
            LoggingMiddleware.logInfo(`Performance: ${performanceLevel}`, {
                duration: `${duration}ms`,
                level: performanceLevel
            }, '⚡');
            
        } catch (parseError) {
            LoggingMiddleware.logWarning('Could not parse success response body');
        }
    }
    
    /**
     * Sanitizar dados sensíveis do body
     */
    private static sanitizeBody(body: any): any {
        if (!body || typeof body !== 'object') return body;
        
        const sensitiveFields = [
            'senha', 'password', 'novaSenha', 'confirmarSenha', 'senhaAtual',
            'accessToken', 'refreshToken', 'idToken', 'token', 'secret',
            'key', 'apiKey', 'clientSecret'
        ];
        
        const sanitized = JSON.parse(JSON.stringify(body)); // Deep clone
        
        const sanitizeRecursive = (obj: any): any => {
            if (Array.isArray(obj)) {
                return obj.map(sanitizeRecursive);
            } else if (obj && typeof obj === 'object') {
                const result: any = {};
                Object.keys(obj).forEach(key => {
                    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                        result[key] = '***REDACTED***';
                    } else {
                        result[key] = sanitizeRecursive(obj[key]);
                    }
                });
                return result;
            }
            return obj;
        };
        
        return sanitizeRecursive(sanitized);
    }
    
    /**
     * Criar resumo dos dados de resposta
     */
    private static createDataSummary(data: any): any {
        if (!data) return null;
        
        if (Array.isArray(data)) {
            return {
                type: 'array',
                length: data.length,
                firstItemType: data.length > 0 ? typeof data[0] : 'empty'
            };
        }
        
        if (typeof data === 'object') {
            const summary: any = {
                type: 'object',
                keys: Object.keys(data).length
            };
            
            // Adicionar informações específicas baseadas nas chaves
            if (data.usuario) {
                summary.hasUser = true;
                summary.userName = data.usuario.nome || data.usuario.email;
            }
            
            if (data.accessToken) {
                summary.hasAccessToken = true;
            }
            
            if (data.refreshToken) {
                summary.hasRefreshToken = true;
            }
            
            return summary;
        }
        
        return {
            type: typeof data,
            value: typeof data === 'string' ? data.substring(0, 100) + '...' : data
        };
    }
    
    /**
     * Gerar ID único para a requisição
     */
    private static generateRequestId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    /**
     * Middleware para capturar erros não tratados
     */
    public static errorHandler = (error: Error, req: ApiRequest, res: Response, next: NextFunction): void => {
        console.log('\n' + '🚨'.repeat(50));
        console.log('💥 UNHANDLED ERROR CAUGHT BY MIDDLEWARE');
        console.log('🚨'.repeat(50));
        
        LoggingMiddleware.logError(error, `Unhandled error in ${req.method} ${req.originalUrl}`, req);
        
        // Informações detalhadas do erro
        const errorDetails = {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            timestamp: new Date().toISOString(),
            stack: error.stack?.split('\n').slice(0, 10), // Primeiras 10 linhas do stack
            body: ApiInterceptorMiddleware.sanitizeBody(req.body),
            query: req.query,
            params: req.params
        };
        
        LoggingMiddleware.logInfo('Unhandled Error Context', errorDetails, '🔍');
        
        // Breakpoint crítico para erros não tratados
        console.log('\n🔴 CRITICAL ERROR BREAKPOINT');
        console.log('💡 Error não tratado detectado. Use o debugger para investigar.');
        debugger; // ← Breakpoint crítico para erros não tratados
        
        // Responder com erro genérico se ainda não foi enviada resposta
        if (!res.headersSent) {
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno do servidor',
                requestId: req.requestId,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log('🚨'.repeat(50) + '\n');
    };
}

export default ApiInterceptorMiddleware;
