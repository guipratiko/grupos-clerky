/**
 * Rotas para processar webhooks de grupos
 */

import { Router } from 'express';
import { processGroupParticipantsUpdate } from '../controllers/webhookController';

const router = Router();

// Webhook de movimentação de participantes (não requer autenticação - vem da Evolution API)
router.post('/group-participants/:instanceName', processGroupParticipantsUpdate);

export default router;
