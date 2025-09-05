import { App } from './app';

// Criar instância da aplicação
const app = new App();

// Configurar graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n📡 SIGTERM recebido');
    await app.shutdown();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\n📡 SIGINT recebido (Ctrl+C)');
    await app.shutdown();
    process.exit(0);
});

// Iniciar servidor
app.start().catch((error) => {
    console.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
});

export default app;
