/**
 * Servidor principal do microserviço de Grupos
 */

// Configurar timezone
process.env.TZ = 'America/Sao_Paulo';

import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { connectAllDatabases } from './config/databases';
import { SERVER_CONFIG } from './config/constants';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { connectSocket } from './socket/socketClient';

const app: Express = express();
const httpServer = createServer(app);
const PORT = SERVER_CONFIG.PORT;

// Middlewares
app.use(cors({
  origin: SERVER_CONFIG.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Conectar a bancos de dados
connectAllDatabases();

// Rota raiz
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Grupo-Clerky API está funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      groups: '/api/groups',
    },
  });
});

// Rotas da API
app.use('/api', routes);

// Middleware de erro 404
app.use(notFoundHandler);

// Middleware de tratamento de erros
app.use(errorHandler);

// Conectar ao Socket.io do backend principal
connectSocket();

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor de Grupos rodando na porta ${PORT}`);
  console.log(`📡 Ambiente: ${SERVER_CONFIG.NODE_ENV}`);
  console.log(`🌐 API disponível em http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  httpServer.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  httpServer.close();
  process.exit(0);
});

export default app;

