import { Router } from 'express';
import groupRoutes from './group.routes';

const router = Router();

router.use('/groups', groupRoutes);

export default router;

