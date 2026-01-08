/**
 * Configuração e gerenciamento de todas as conexões de banco de dados
 * - MongoDB: Instâncias (para buscar instanceName)
 * - Redis: Cache de grupos
 */

import mongoose from 'mongoose';
import Redis from 'ioredis';
import { MONGODB_CONFIG, REDIS_CONFIG } from './constants';

// ============================================
// MongoDB (Instâncias)
// ============================================
export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_CONFIG.URI);
    console.log('✅ Conectado ao MongoDB com sucesso');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

// Event listeners para MongoDB
mongoose.connection.on('disconnected', () => {
  // MongoDB desconectado (log removido para reduzir verbosidade)
});

mongoose.connection.on('error', (error: any) => {
  console.error('❌ Erro na conexão MongoDB:', error);
});

// ============================================
// Redis (Cache de grupos)
// ============================================
export const redisClient = new Redis(REDIS_CONFIG.URI, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: any) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err: any) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

// Event listeners para Redis
redisClient.on('error', (err: any) => {
  console.error('❌ Erro no Redis:', err);
});

redisClient.on('close', () => {
  // Conexão Redis fechada (log removido)
});

redisClient.on('reconnecting', () => {
  // Reconectando ao Redis (log removido)
});

// Função para testar conexão Redis
export const testRedis = async (): Promise<boolean> => {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão Redis:', error);
    return false;
  }
};

// ============================================
// Função para conectar todos os bancos
// ============================================
export const connectAllDatabases = async (): Promise<void> => {
  try {
    // Conectar MongoDB
    await connectMongoDB();

    // Testar Redis
    const redisConnected = await testRedis();
    if (redisConnected) {
      console.log('✅ Redis conectado e testado');
    } else {
      console.warn('⚠️  Redis não conectado, mas continuando...');
    }
  } catch (error) {
    console.error('❌ Erro ao conectar bancos de dados:', error);
    throw error;
  }
};

// ============================================
// Função para fechar todas as conexões
// ============================================
export const closeAllDatabases = async (): Promise<void> => {
  try {
    // Fechar MongoDB
    await mongoose.connection.close();
    console.log('✅ MongoDB desconectado');

    // Fechar Redis
    redisClient.disconnect();
    console.log('✅ Redis desconectado');
  } catch (error) {
    console.error('❌ Erro ao fechar conexões:', error);
  }
};

