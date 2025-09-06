import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import { config } from './config';
import { DatabaseConfig } from './config/database';
import routes from './routes';
import { ErrorMiddleware } from './middlewares/ErrorMiddleware';
import { RateLimitMiddleware } from './middlewares/RateLimitMiddleware';
import { LoggingMiddleware } from './middlewares/LoggingMiddleware';
import { ApiInterceptorMiddleware } from './middlewares/ApiInterceptorMiddleware';
import { WebSocketService } from './services/WebSocketService';
import { Logger } from './utils/Logger';
import './types/socket'; // Importar extensão de tipos do Socket

// Carregar variáveis de ambiente
dotenv.config();

export class App {
    public app: Application;
    public server: any;
    public io!: SocketIOServer;
    private db: DatabaseConfig;
    private webSocketService: WebSocketService;

    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.db = DatabaseConfig.getInstance();
        this.webSocketService = WebSocketService.getInstance();
        
        this.initializeSocketIO();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    // ============================================
    // CONFIGURAR MIDDLEWARES
    // ============================================
    
    private initializeMiddlewares(): void {
        // Segurança com Helmet
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                }
            }
        }));

        // CORS
        this.app.use(cors({
            origin: config.frontend.allowedOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
            exposedHeaders: ['X-Total-Count', 'X-Page-Count']
        }));

        // Compressão gzip
        this.app.use(compression());

        // Rate limiting global
        this.app.use(RateLimitMiddleware.global);

        // Middleware de interceptação de API (só em desenvolvimento)
        if (config.NODE_ENV === 'development') {
            this.app.use(ApiInterceptorMiddleware.intercept);
        }

        // Middleware de logging personalizado (só em desenvolvimento)
        if (config.NODE_ENV === 'development') {
            this.app.use(LoggingMiddleware.logRequests);
        }

        // Parse JSON
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Log de requisições
        if (config.NODE_ENV === 'development') {
            this.app.use(morgan('dev'));
        } else {
            this.app.use(morgan('combined'));
        }

        // Headers de resposta customizados
        this.app.use((req, res, next) => {
            res.header('X-API-Version', '1.0.0');
            res.header('X-Powered-By', 'FatecTeams API');
            next();
        });
    }

    // ============================================
    // CONFIGURAR ROTAS
    // ============================================
    
    private initializeRoutes(): void {
        // Rota de health check
        this.app.get('/', (req, res) => {
            res.json({
                sucesso: true,
                mensagem: 'FatecTeams API está funcionando!',
                versao: '1.0.0',
                timestamp: new Date().toISOString(),
                ambiente: config.NODE_ENV
            });
        });

        // Rota de status do banco
        this.app.get('/health', async (req, res) => {
            try {
                await this.db.query('SELECT 1');
                res.json({
                    sucesso: true,
                    mensagem: 'API e banco de dados funcionando',
                    database: 'conectado',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    sucesso: false,
                    mensagem: 'Erro na conexão com o banco de dados',
                    database: 'erro',
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Rotas da API
        this.app.use('/api', routes);

        // Middleware de rota não encontrada (comentado temporariamente)
        // this.app.all('*', ErrorMiddleware.notFound);
    }

    // ============================================
    // CONFIGURAR WEBSOCKETS
    // ============================================
    
    private initializeSocketIO(): void {
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: config.frontend.allowedOrigins,
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000
        });

        // Configurar WebSocketService
        this.webSocketService.setIO(this.io);

        // Middleware de autenticação para Socket.IO
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    Logger.websocket('Conexão rejeitada: Token não fornecido');
                    return next(new Error('Token não fornecido'));
                }

                // TODO: Implementar validação JWT
                // const user = await validateSocketToken(token);
                // socket.userId = user.id;
                
                Logger.websocket('Conexão WebSocket autenticada');
                next();
            } catch (error) {
                Logger.websocket('Erro de autenticação WebSocket:', error);
                next(new Error('Token inválido'));
            }
        });

        // Eventos do Socket.IO
        this.io.on('connection', (socket) => {
            Logger.websocket(`Cliente conectado: ${socket.id}`);

            // Evento de identificação do usuário
            socket.on('identify-user', (data) => {
                const { usuarioId } = data;
                if (usuarioId) {
                    socket.userId = usuarioId;
                    this.webSocketService.adicionarUsuarioASala(socket.id, usuarioId);
                    Logger.websocket(`Usuário ${usuarioId} identificado no socket ${socket.id}`);
                }
            });

            // Entrar em sala de grupo
            socket.on('join-group', (grupoId: string) => {
                socket.join(`grupo-${grupoId}`);
                Logger.websocket(`Cliente ${socket.id} entrou no grupo ${grupoId}`);
                
                // Emitir para outros membros que usuário entrou
                if (socket.userId) {
                    socket.to(`grupo-${grupoId}`).emit('user-joined-group', {
                        usuarioId: socket.userId,
                        grupoId
                    });
                }
            });

            // Sair da sala de grupo
            socket.on('leave-group', (grupoId: string) => {
                socket.leave(`grupo-${grupoId}`);
                Logger.websocket(`Cliente ${socket.id} saiu do grupo ${grupoId}`);
                
                // Emitir para outros membros que usuário saiu
                if (socket.userId) {
                    socket.to(`grupo-${grupoId}`).emit('user-left-group', {
                        usuarioId: socket.userId,
                        grupoId
                    });
                }
            });

            // Usuario digitando
            socket.on('user-typing', (data) => {
                const { grupoId, typing, nomeUsuario } = data;
                if (socket.userId) {
                    socket.to(`grupo-${grupoId}`).emit('user-typing', {
                        usuarioId: socket.userId,
                        nomeUsuario: nomeUsuario || 'Usuário',
                        grupoId,
                        typing
                    });
                }
            });

            // Solicitar status online
            socket.on('request-online-users', (grupoId: string) => {
                this.webSocketService.obterUsuariosConectados(grupoId)
                    .then(usuarios => {
                        socket.emit('online-users', {
                            grupoId,
                            usuarios
                        });
                    });
            });

            // Marcar mensagem como lida
            socket.on('mark-message-read', (data) => {
                const { grupoId, mensagemId } = data;
                if (socket.userId) {
                    socket.to(`grupo-${grupoId}`).emit('message-read', {
                        usuarioId: socket.userId,
                        mensagemId,
                        grupoId
                    });
                }
            });

            // Desconexão
            socket.on('disconnect', (reason) => {
                Logger.websocket(`Cliente ${socket.id} desconectado: ${reason}`);
                
                // Notificar grupos sobre usuário offline
                if (socket.userId) {
                    // TODO: Buscar grupos do usuário e emitir status offline
                    Logger.websocket(`Usuário ${socket.userId} desconectado`);
                }
            });

            // Tratamento de erros do socket
            socket.on('error', (error) => {
                Logger.error('Erro no socket:', error);
            });
        });
    }

    // ============================================
    // TRATAMENTO DE ERROS
    // ============================================
    
    private initializeErrorHandling(): void {
        // Middleware de tratamento de erros do ApiInterceptor (para erros não tratados)
        if (config.NODE_ENV === 'development') {
            this.app.use(ApiInterceptorMiddleware.errorHandler);
        }
        
        // Middleware de tratamento de erros padrão
        this.app.use(ErrorMiddleware.handleError);

        // Tratar erros não capturados
        process.on('uncaughtException', (error) => {
            console.error('Erro não capturado:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Promise rejeitada não tratada:', reason);
            // Não sair do processo em desenvolvimento
            if (config.NODE_ENV === 'production') {
                process.exit(1);
            }
        });
    }

    // ============================================
    // INICIAR SERVIDOR
    // ============================================
    
    public async start(): Promise<void> {
        try {
            // Testar conexão com banco
            await this.testDatabaseConnection();

            // Iniciar servidor
            this.server.listen(config.PORT, config.HOST, () => {
                console.log('=================================');
                console.log('🚀 FatecTeams API Iniciada!');
                console.log('=================================');
                console.log(`🌐 URL: http://${config.HOST}:${config.PORT}`);
                console.log(`📝 Ambiente: ${config.NODE_ENV}`);
                console.log(`🗄️  Banco: ${config.database.host}:${config.database.port}`);
                console.log(`📚 Documentação: http://${config.HOST}:${config.PORT}/api`);
                console.log('=================================');
            });

        } catch (error) {
            console.error('Erro ao iniciar servidor:', error);
            process.exit(1);
        }
    }

    // ============================================
    // TESTAR CONEXÃO COM BANCO
    // ============================================
    
    private async testDatabaseConnection(): Promise<void> {
        try {
            await this.db.query('SELECT NOW()');
            console.log('✅ Conexão com PostgreSQL estabelecida');
        } catch (error) {
            console.error('❌ Erro ao conectar com PostgreSQL:', error);
            throw error;
        }
    }

    // ============================================
    // PARAR SERVIDOR GRACIOSAMENTE
    // ============================================
    
    public async shutdown(): Promise<void> {
        console.log('\n⏳ Encerrando servidor graciosamente...');
        
        return new Promise((resolve) => {
            this.server.close(async () => {
                console.log('✅ Servidor HTTP encerrado');
                
                try {
                    await this.db.close();
                    console.log('✅ Conexão com banco de dados encerrada');
                } catch (error) {
                    console.error('❌ Erro ao fechar conexão com banco:', error);
                }
                
                console.log('✅ Encerramento concluído');
                resolve();
            });
        });
    }
}
