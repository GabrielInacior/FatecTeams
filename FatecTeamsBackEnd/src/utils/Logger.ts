import { config } from '../config';

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}

export class Logger {
    private static getLogLevel(level: string): LogLevel {
        switch (level.toLowerCase()) {
            case 'error': return LogLevel.ERROR;
            case 'warn': return LogLevel.WARN;
            case 'info': return LogLevel.INFO;
            case 'debug': return LogLevel.DEBUG;
            default: return LogLevel.INFO;
        }
    }

    private static getCurrentLevel(): LogLevel {
        return this.getLogLevel(config.logLevel);
    }

    private static formatMessage(level: string, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    }

    public static error(message: string, meta?: any): void {
        if (this.getCurrentLevel() >= LogLevel.ERROR) {
            console.error(this.formatMessage('error', message, meta));
        }
    }

    public static warn(message: string, meta?: any): void {
        if (this.getCurrentLevel() >= LogLevel.WARN) {
            console.warn(this.formatMessage('warn', message, meta));
        }
    }

    public static info(message: string, meta?: any): void {
        if (this.getCurrentLevel() >= LogLevel.INFO) {
            console.log(this.formatMessage('info', message, meta));
        }
    }

    public static debug(message: string, meta?: any): void {
        if (this.getCurrentLevel() >= LogLevel.DEBUG) {
            console.log(this.formatMessage('debug', message, meta));
        }
    }

    // Logs específicos para o sistema
    public static database(message: string, meta?: any): void {
        this.debug(`[DATABASE] ${message}`, meta);
    }

    public static auth(message: string, meta?: any): void {
        this.info(`[AUTH] ${message}`, meta);
    }

    public static websocket(message: string, meta?: any): void {
        this.debug(`[WEBSOCKET] ${message}`, meta);
    }

    public static upload(message: string, meta?: any): void {
        this.info(`[UPLOAD] ${message}`, meta);
    }

    public static email(message: string, meta?: any): void {
        this.info(`[EMAIL] ${message}`, meta);
    }
}
