/**
 * Rotas para gerenciar movimentações de participantes em grupos
 */

import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  listMovementsController,
  getGroupMovementsController,
} from '../controllers/movementController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(protect);

// Listar movimentações com filtros
router.get('/', listMovementsController);

// Buscar movimentações de um grupo específico
router.get('/group/:group_id', getGroupMovementsController);

export default router;
