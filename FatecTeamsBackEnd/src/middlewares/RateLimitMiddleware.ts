import rateLimit from 'express-rate-limit';
import { config } from '../config';

export class RateLimitMiddleware {
    // ============================================
    // RATE LIMIT GLOBAL SIMPLIFICADO
    // ============================================
    
    public static global = rateLimit({
        windowMs: config.rateLimit.windowMinutes * 60 * 1000,
        max: config.rateLimit.maxRequests,
        message: {
            sucesso: false,
            mensagem: 'Muitas requisições. Tente novamente mais tarde.',
            timestamp: new Date().toISOString()
        },
        standardHeaders: true,
        legacyHeaders: false
    });

    // ============================================
    // RATE LIMIT PARA LOGIN
    // ============================================
    
    public static login = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: {
            sucesso: false,
            mensagem: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
            timestamp: new Date().toISOString()
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true
    });

    // ============================================
    // RATE LIMIT PARA REGISTRO
    // ============================================
    
    public static register = rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 3,
        message: {
            sucesso: false,
            mensagem: 'Limite de registros por hora atingido. Tente novamente mais tarde.',
            timestamp: new Date().toISOString()
        },
        standardHeaders: true,
        legacyHeaders: false
    });
}
