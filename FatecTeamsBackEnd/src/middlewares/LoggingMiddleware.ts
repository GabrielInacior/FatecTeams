import { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';

export class LoggingMiddleware {
    public static logRequests = (req: Request, res: Response, next: NextFunction): void => {
        const startTime = Date.now();
        const originalSend = res.send;

        // Interceptar a resposta para capturar o status
        res.send = function(body: any): Response {
            const endTime = Date.now();
            const duration = endTime - startTime;
            const statusCode = res.statusCode;
            
            // Determinar a cor baseada no status
            let statusColor = chalk.white;
            let statusSymbol = '●';
            
            if (statusCode >= 200 && statusCode < 300) {
                statusColor = chalk.green;
                statusSymbol = '✓';
            } else if (statusCode >= 300 && statusCode < 400) {
                statusColor = chalk.yellow;
                statusSymbol = '→';
            } else if (statusCode >= 400 && statusCode < 500) {
                statusColor = chalk.red;
                statusSymbol = '✗';
            } else if (statusCode >= 500) {
                statusColor = chalk.bgRed.white;
                statusSymbol = '💀';
            }

            // Formatação do método
            let methodColor = chalk.white;
            switch (req.method) {
                case 'GET':
                    methodColor = chalk.blue;
                    break;
                case 'POST':
                    methodColor = chalk.green;
                    break;
                case 'PUT':
                    methodColor = chalk.yellow;
                    break;
                case 'PATCH':
                    methodColor = chalk. yellow;
                    break;
                case 'DELETE':
                    methodColor = chalk.red;
                    break;
            }

            // Formatação da duração
            let durationColor = chalk.white;
            if (duration < 100) {
                durationColor = chalk.green;
            } else if (duration < 500) {
                durationColor = chalk.yellow;
            } else {
                durationColor = chalk.red;
            }

            // Log formatado
            const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
            const method = methodColor(`${req.method.padEnd(6)}`);
            const status = statusColor(`${statusCode} ${statusSymbol}`);
            const url = chalk.cyan(req.originalUrl);
            const time = durationColor(`${duration}ms`);
            const ip = chalk.gray(req.ip || req.connection.remoteAddress);

            console.log(`${chalk.gray(timestamp)} ${method} ${status} ${url} ${time} ${ip}`);

            // Se houve erro (4xx ou 5xx), mostrar detalhes adicionais
            if (statusCode >= 400) {
                try {
                    const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
                    if (responseBody && responseBody.mensagem) {
                        console.log(`  ${chalk.red('Error:')} ${responseBody.mensagem}`);
                    }
                    
                    // Log dos dados da requisição para debug
                    if (req.method !== 'GET' && Object.keys(req.body || {}).length > 0) {
                        const sanitizedBody = { ...req.body };
                        // Remover senhas do log
                        if (sanitizedBody.senha) sanitizedBody.senha = '***';
                        if (sanitizedBody.novaSenha) sanitizedBody.novaSenha = '***';
                        if (sanitizedBody.confirmarSenha) sanitizedBody.confirmarSenha = '***';
                        
                        console.log(`  ${chalk.yellow('Body:')} ${JSON.stringify(sanitizedBody, null, 2)}`);
                    }
                } catch (e) {
                    // Ignorar erros de parse
                }
            }

            return originalSend.call(this, body);
        };

        next();
    };

    public static logDatabaseQueries = (query: string, parameters?: any[]): void => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`${chalk.gray(timestamp)} ${chalk.magenta('DB')} ${chalk.cyan(query)}`);
        
        if (parameters && parameters.length > 0) {
            console.log(`  ${chalk.yellow('Params:')} ${JSON.stringify(parameters)}`);
        }
    };

    public static logError = (error: Error, context?: string): void => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`${chalk.gray(timestamp)} ${chalk.bgRed.white(' ERROR ')} ${context ? chalk.red(context) : ''}`);
        console.log(chalk.red(error.message));
        
        if (error.stack) {
            // Mostrar apenas as primeiras linhas do stack trace
            const stackLines = error.stack.split('\n').slice(1, 4);
            stackLines.forEach(line => {
                console.log(`  ${chalk.gray(line.trim())}`);
            });
        }
    };

    public static logInfo = (message: string, data?: any): void => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`${chalk.gray(timestamp)} ${chalk.blue('INFO')} ${message}`);
        
        if (data) {
            console.log(`  ${chalk.blue('Data:')} ${JSON.stringify(data, null, 2)}`);
        }
    };

    public static logSuccess = (message: string, data?: any): void => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`${chalk.gray(timestamp)} ${chalk.green('SUCCESS')} ${message}`);
        
        if (data) {
            console.log(`  ${chalk.green('Data:')} ${JSON.stringify(data, null, 2)}`);
        }
    };
}

export default LoggingMiddleware;
