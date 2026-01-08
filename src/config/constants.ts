/**
 * Configurações centralizadas do microserviço de Grupos
 */

import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Server Configuration
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || '4334', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

// JWT Configuration (mesmo secret do backend principal)
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  EXPIRE: process.env.JWT_EXPIRE || '7d',
};

// MongoDB Configuration (para buscar instâncias)
export const MONGODB_CONFIG = {
  URI: process.env.MONGODB_URI || 'mongodb://clerky:qGfdSCz1bDTuHD5o@easy.clerky.com.br:27017/?tls=false',
};

// Redis Configuration (cache de grupos - mesmo do backend principal)
export const REDIS_CONFIG = {
  URI: process.env.REDIS_URI || 'redis://default:Gd4562Vbfs341le@easy.clerky.com.br:6378',
};

// Socket.io Configuration (backend principal)
export const SOCKET_CONFIG = {
  URL: process.env.SOCKET_URL || process.env.BACKEND_URL || 'http://localhost:4331',
};

// Evolution API Configuration
export const EVOLUTION_CONFIG = {
  HOST: process.env.EVOLUTION_HOST || 'evo.clerky.com.br',
  API_KEY: process.env.EVOLUTION_APIKEY || process.env.EVOLUTION_API_KEY || '',
  URL: process.env.EVOLUTION_API_URL || 'https://evo.clerky.com.br',
};

// Media Service Configuration
export const MEDIA_SERVICE_CONFIG = {
  URL: process.env.MEDIA_SERVICE_URL || 'https://midiaservice-midiaservice.o31xjg.easypanel.host',
  TOKEN: process.env.MEDIA_SERVICE_TOKEN || 'Fg34Dsew5783gTy',
};

