/**
 * Controller para gerenciar mensagens automáticas de grupos
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  upsertAutoMessageConfig,
  listAutoMessageConfigs,
  deleteAutoMessageConfig,
  getAutoMessageConfig,
} from '../services/autoMessageService';
import { createAppError, createValidationError, createNotFoundError } from '../utils/errorHelpers';

/**
 * Criar ou atualizar configuração de mensagens automáticas
 */
export const upsertAutoMessageController = async (
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
      group_id,
      welcome_enabled,
      welcome_message,
      welcome_delay_seconds,
      goodbye_enabled,
      goodbye_message,
      goodbye_delay_seconds,
    } = req.body;

    const config = await upsertAutoMessageConfig({
      user_id: userId,
      group_id,
      welcome_enabled,
      welcome_message,
      welcome_delay_seconds,
      goodbye_enabled,
      goodbye_message,
      goodbye_delay_seconds,
    });

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar todas as configurações de mensagens automáticas do usuário
 */
export const listAutoMessagesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createAppError('Usuário não autenticado', 401);
    }

    const configs = await listAutoMessageConfigs(userId);

    res.status(200).json({
      success: true,
      data: configs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar configuração de um grupo específico (global + override)
 */
export const getAutoMessageController = async (
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

    if (!group_id) {
      throw createValidationError('ID do grupo é obrigatório');
    }

    const configs = await getAutoMessageConfig(userId, group_id);

    res.status(200).json({
      success: true,
      data: configs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletar configuração de mensagens automáticas
 */
export const deleteAutoMessageController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createAppError('Usuário não autenticado', 401);
    }

    const { id } = req.params;

    if (!id) {
      throw createValidationError('ID da configuração é obrigatório');
    }

    const deleted = await deleteAutoMessageConfig(id, userId);

    if (!deleted) {
      throw createNotFoundError('Configuração');
    }

    res.status(200).json({
      success: true,
      message: 'Configuração deletada com sucesso',
    });
  } catch (error) {
    next(error);
  }
};
