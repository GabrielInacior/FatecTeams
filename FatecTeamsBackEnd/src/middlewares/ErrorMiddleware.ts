import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export class ErrorMiddleware {
    // ============================================
    // MIDDLEWARE DE TRATAMENTO DE ERROS GLOBAIS
    // ============================================
    
    public static handleError(
        error: any,
        req: Request,
        res: Response,
        next: NextFunction
    ): void {
        console.error('Erro não tratado:', error);

        let statusCode = 500;
        let mensagem = 'Erro interno do servidor';

        // Identificar tipos específicos de erro
        if (error.name === 'ValidationError') {
            statusCode = 400;
            mensagem = 'Dados inválidos fornecidos';
        } else if (error.name === 'UnauthorizedError') {
            statusCode = 401;
            mensagem = 'Acesso não autorizado';
        } else if (error.name === 'ForbiddenError') {
            statusCode = 403;
            mensagem = 'Acesso proibido';
        } else if (error.name === 'NotFoundError') {
            statusCode = 404;
            mensagem = 'Recurso não encontrado';
        } else if (error.name === 'ConflictError') {
            statusCode = 409;
            mensagem = 'Conflito de dados';
        }

        const response: ApiResponse = {
            sucesso: false,
            mensagem,
            erro: error.message || mensagem,
            timestamp: new Date().toISOString()
        };

        res.status(statusCode).json(response);
    }

    // ============================================
    // MIDDLEWARE DE ROTA NÃO ENCONTRADA
    // ============================================
    
    public static notFound(req: Request, res: Response): void {
        const response: ApiResponse = {
            sucesso: false,
            mensagem: `Rota ${req.originalUrl} não encontrada`,
            timestamp: new Date().toISOString()
        };

        res.status(404).json(response);
    }

    // ============================================
    // WRAPPER PARA FUNÇÕES ASYNC
    // ============================================
    
    public static asyncWrapper(fn: Function) {
        return (req: Request, res: Response, next: NextFunction) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
}
