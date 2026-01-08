/**
 * Rotas para gerenciar mensagens automáticas de grupos
 */

import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  upsertAutoMessageController,
  listAutoMessagesController,
  getAutoMessageController,
  deleteAutoMessageController,
} from '../controllers/autoMessageController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(protect);

// Criar ou atualizar configuração
router.post('/', upsertAutoMessageController);
router.put('/:id', upsertAutoMessageController);

// Listar todas as configurações do usuário
router.get('/', listAutoMessagesController);

// Buscar configuração de um grupo específico
router.get('/group/:group_id', getAutoMessageController);

// Deletar configuração
router.delete('/:id', deleteAutoMessageController);

export default router;
