/**
 * Controller para gerenciar movimentações de participantes em grupos
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { listMovements, getGroupMovements } from '../services/groupMovementService';
import { createAppError, createValidationError } from '../utils/errorHelpers';

/**
 * Listar movimentações com filtros
 */
export const listMovementsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createAppError('Usuário não autenticado', 401);
    }

    const {
      instance_id,
      group_id,
      movement_type,
      start_date,
      end_date,
      page = '1',
      limit = '50',
    } = req.query;

    const filters = {
      user_id: userId,
      instance_id: instance_id as string | undefined,
      group_id: group_id as string | undefined,
      movement_type: movement_type as 'entered' | 'left' | undefined,
      start_date: start_date ? new Date(start_date as string) : undefined,
      end_date: end_date ? new Date(end_date as string) : undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    const result = await listMovements(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar movimentações de um grupo específico
 */
export const getGroupMovementsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createAppError('Usuário não autenticado', 401);
    }

    const { group_id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    if (!group_id) {
      throw createValidationError('ID do grupo é obrigatório');
    }

    const result = await getGroupMovements(
      userId,
      group_id,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
