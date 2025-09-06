import { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';

interface RequestWithStartTime extends Request {
    startTime?: number;
}

export class LoggingMiddleware {
    public static logRequests = (req: RequestWithStartTime, res: Response, next: NextFunction): void => {
        const startTime = Date.now();
        req.startTime = startTime;

        // Log da requisição entrante
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const method = LoggingMiddleware.getMethodColor(req.method);
        const url = chalk.cyan(req.originalUrl);
        const ip = chalk.gray(req.ip || req.socket.remoteAddress || 'unknown');
        const userAgent = req.headers['user-agent'] ? chalk.gray(req.headers['user-agent'].substring(0, 50) + '...') : '';

        console.log(`\n${chalk.gray(timestamp)} ${chalk.blue('→')} ${method} ${url} ${chalk.gray('from')} ${ip}`);
        
        // Log dos headers importantes
        if (req.headers.authorization) {
            console.log(`  ${chalk.yellow('Auth:')} Bearer ${chalk.gray('***token***')}`);
        }
        
        if (req.headers['content-type']) {
            console.log(`  ${chalk.yellow('Content-Type:')} ${req.headers['content-type']}`);
        }

        // Log do body da requisição (exceto GET)
        if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
            const sanitizedBody = LoggingMiddleware.sanitizeRequestBody(req.body);
            console.log(`  ${chalk.yellow('Body:')} ${JSON.stringify(sanitizedBody, null, 2)}`);
        }

        // Log dos query parameters
        if (Object.keys(req.query).length > 0) {
            console.log(`  ${chalk.yellow('Query:')} ${JSON.stringify(req.query, null, 2)}`);
        }

        // Interceptar a resposta
        const originalSend = res.send;
        res.send = function(body: any): Response {
            const endTime = Date.now();
            const duration = endTime - startTime;
            const statusCode = res.statusCode;
            
            // Log da resposta
            LoggingMiddleware.logResponse(req, res, body, duration, statusCode);
            
            return originalSend.call(this, body);
        };

        // Capturar erros não tratados
        const originalJson = res.json;
        res.json = function(body: any): Response {
            const endTime = Date.now();
            const duration = endTime - startTime;
            const statusCode = res.statusCode;
            
            LoggingMiddleware.logResponse(req, res, body, duration, statusCode);
            
            return originalJson.call(this, body);
        };

        next();
    };

    private static logResponse(req: RequestWithStartTime, res: Response, body: any, duration: number, statusCode: number): void {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const method = LoggingMiddleware.getMethodColor(req.method);
        const { color: statusColor, symbol: statusSymbol } = LoggingMiddleware.getStatusColor(statusCode);
        const url = chalk.cyan(req.originalUrl);
        const time = LoggingMiddleware.getDurationColor(duration);

        // Log principal da resposta
        console.log(`${chalk.gray(timestamp)} ${chalk.blue('←')} ${method} ${statusColor(`${statusCode} ${statusSymbol}`)} ${url} ${time}`);

        // Log do corpo da resposta para erros
        if (statusCode >= 400) {
            LoggingMiddleware.logErrorResponse(body, req);
        } else if (statusCode >= 200 && statusCode < 300) {
            LoggingMiddleware.logSuccessResponse(body, duration);
        }

        // Separador visual
        console.log(chalk.gray('─'.repeat(80)));
    }

    private static logErrorResponse(body: any, req: RequestWithStartTime): void {
        try {
            const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
            
            if (responseBody) {
                if (responseBody.mensagem) {
                    console.log(`  ${chalk.red('❌ Error:')} ${responseBody.mensagem}`);
                }
                
                if (responseBody.erros && Array.isArray(responseBody.erros)) {
                    responseBody.erros.forEach((erro: string, index: number) => {
                        console.log(`  ${chalk.red(`   ${index + 1}.`)} ${erro}`);
                    });
                }

                if (responseBody.timestamp) {
                    console.log(`  ${chalk.red('⏰ Timestamp:')} ${responseBody.timestamp}`);
                }

                // Debug breakpoint marker - permite pausar aqui com F9
                debugger; // ← Ponto de breakpoint para erros
            }
        } catch (e) {
            console.log(`  ${chalk.red('❌ Response parse error:')} Could not parse response body`);
            console.log(`  ${chalk.red('Raw body:')} ${body}`);
            debugger; // ← Breakpoint para erros de parse
        }
    }

    private static logSuccessResponse(body: any, duration: number): void {
        try {
            const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
            
            if (responseBody && responseBody.sucesso) {
                console.log(`  ${chalk.green('✅ Success:')} ${responseBody.mensagem || 'Operation completed'}`);
                
                if (responseBody.dados && typeof responseBody.dados === 'object') {
                    // Log resumido dos dados retornados
                    if (responseBody.dados.usuario) {
                        console.log(`  ${chalk.green('👤 User:')} ${responseBody.dados.usuario.nome || responseBody.dados.usuario.email}`);
                    }
                    
                    if (responseBody.dados.accessToken) {
                        console.log(`  ${chalk.green('🔑 Token:')} Generated`);
                    }
                    
                    // Para arrays, mostrar apenas a quantidade
                    if (Array.isArray(responseBody.dados)) {
                        console.log(`  ${chalk.green('📋 Data:')} ${responseBody.dados.length} items`);
                    }
                }

                // Performance indicator
                if (duration < 100) {
                    console.log(`  ${chalk.green('⚡ Performance:')} Excellent (${duration}ms)`);
                } else if (duration < 500) {
                    console.log(`  ${chalk.yellow('⚡ Performance:')} Good (${duration}ms)`);
                } else {
                    console.log(`  ${chalk.red('⚡ Performance:')} Slow (${duration}ms) - Consider optimization`);
                }
            }
        } catch (e) {
            // Não fazer nada para erros de parse em respostas de sucesso
        }
    }

    private static getMethodColor(method: string): string {
        const methodColors = {
            'GET': chalk.blue,
            'POST': chalk.green,
            'PUT': chalk.yellow,
            'PATCH': chalk.yellow,
            'DELETE': chalk.red,
            'OPTIONS': chalk.gray
        };
        
        const colorFn = methodColors[method as keyof typeof methodColors] || chalk.white;
        return colorFn(method.padEnd(6));
    }

    private static getStatusColor(statusCode: number): { color: any, symbol: string } {
        if (statusCode >= 200 && statusCode < 300) {
            return { color: chalk.green, symbol: '✓' };
        } else if (statusCode >= 300 && statusCode < 400) {
            return { color: chalk.yellow, symbol: '→' };
        } else if (statusCode >= 400 && statusCode < 500) {
            return { color: chalk.red, symbol: '✗' };
        } else if (statusCode >= 500) {
            return { color: chalk.bgRed.white, symbol: '💀' };
        }
        return { color: chalk.white, symbol: '●' };
    }

    private static getDurationColor(duration: number): string {
        if (duration < 100) {
            return chalk.green(`${duration}ms`);
        } else if (duration < 500) {
            return chalk.yellow(`${duration}ms`);
        } else {
            return chalk.red(`${duration}ms`);
        }
    }

    private static sanitizeRequestBody(body: any): any {
        if (!body || typeof body !== 'object') return body;
        
        const sensitiveFields = ['senha', 'password', 'novaSenha', 'confirmarSenha', 'senhaAtual', 'accessToken', 'refreshToken', 'idToken'];
        const sanitized = { ...body };
        
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '***REDACTED***';
            }
        });
        
        return sanitized;
    }

    // Método para log de queries do banco de dados
    public static logDatabaseQuery = (query: string, parameters?: any[], executionTime?: number): void => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`\n${chalk.gray(timestamp)} ${chalk.magenta('🗄️  DATABASE')} ${chalk.cyan(query.replace(/\s+/g, ' ').trim())}`);
        
        if (parameters && parameters.length > 0) {
            console.log(`  ${chalk.yellow('📝 Params:')} ${JSON.stringify(parameters)}`);
        }
        
        if (executionTime !== undefined) {
            const timeColor = executionTime < 50 ? chalk.green : executionTime < 200 ? chalk.yellow : chalk.red;
            console.log(`  ${chalk.yellow('⏱️  Execution:')} ${timeColor(`${executionTime}ms`)}`);
        }
        
        // Debug breakpoint para queries lentas
        if (executionTime && executionTime > 1000) {
            console.log(`  ${chalk.red('⚠️  WARNING:')} Slow query detected!`);
            debugger; // ← Breakpoint para queries lentas
        }
    };

    // Método para log de erros gerais
    public static logError = (error: Error, context?: string, req?: Request): void => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        
        console.log(`\n${chalk.bgRed.white(' ❌ ERROR ')} ${chalk.gray(timestamp)}`);
        
        if (context) {
            console.log(`${chalk.red('📍 Context:')} ${context}`);
        }
        
        if (req) {
            console.log(`${chalk.red('🌐 Route:')} ${req.method} ${req.originalUrl}`);
            if (req.headers['user-agent']) {
                console.log(`${chalk.red('🔍 User-Agent:')} ${req.headers['user-agent']}`);
            }
        }
        
        console.log(`${chalk.red('💥 Message:')} ${error.message}`);
        
        if (error.stack) {
            console.log(`${chalk.red('📚 Stack Trace:')}`);
            const stackLines = error.stack.split('\n').slice(1, 6); // Primeiras 5 linhas
            stackLines.forEach(line => {
                console.log(`  ${chalk.gray(line.trim())}`);
            });
        }
        
        console.log(chalk.red('─'.repeat(80)));
        
        // Debug breakpoint para erros críticos
        debugger; // ← Breakpoint para todos os erros
    };

    // Método para logs informativos
    public static logInfo = (message: string, data?: any, emoji: string = 'ℹ️'): void => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`\n${chalk.gray(timestamp)} ${chalk.blue(emoji + ' INFO')} ${message}`);
        
        if (data) {
            console.log(`  ${chalk.blue('📊 Data:')} ${JSON.stringify(data, null, 2)}`);
        }
    };

    // Método para logs de sucesso
    public static logSuccess = (message: string, data?: any, emoji: string = '✅'): void => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`\n${chalk.gray(timestamp)} ${chalk.green(emoji + ' SUCCESS')} ${message}`);
        
        if (data) {
            console.log(`  ${chalk.green('📊 Data:')} ${JSON.stringify(data, null, 2)}`);
        }
    };

    // Método para logs de warning
    public static logWarning = (message: string, data?: any): void => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`\n${chalk.gray(timestamp)} ${chalk.yellow('⚠️  WARNING')} ${message}`);
        
        if (data) {
            console.log(`  ${chalk.yellow('📊 Data:')} ${JSON.stringify(data, null, 2)}`);
        }
    };

    // Método para debug - sempre ativa breakpoint
    public static debug = (message: string, data?: any, forceBreakpoint: boolean = true): void => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`\n${chalk.magenta('🐛 DEBUG')} ${chalk.gray(timestamp)} ${message}`);
        
        if (data) {
            console.log(`  ${chalk.magenta('📊 Debug Data:')} ${JSON.stringify(data, null, 2)}`);
        }
        
        if (forceBreakpoint) {
            debugger; // ← Breakpoint forçado para debug
        }
    };
}

export default LoggingMiddleware;
