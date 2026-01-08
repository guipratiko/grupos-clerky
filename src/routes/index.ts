import { Router } from 'express';
import groupRoutes from './group.routes';
import movementRoutes from './movement.routes';
import autoMessageRoutes from './autoMessage.routes';
import webhookRoutes from './webhook.routes';

const router = Router();

router.use('/groups', groupRoutes);
router.use('/movements', movementRoutes);
router.use('/auto-messages', autoMessageRoutes);
router.use('/webhook', webhookRoutes);

export default router;

