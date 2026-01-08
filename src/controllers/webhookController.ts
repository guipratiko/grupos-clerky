/**
 * Controller para processar webhooks de movimentação de grupos
 */

import { Request, Response, NextFunction } from 'express';
import { createMovement } from '../services/groupMovementService';
import { sendWelcomeMessage, sendGoodbyeMessage } from '../services/autoMessageService';
import { getInstance } from '../utils/instanceHelper';
import { extractPhoneFromJid, normalizePhone } from '../utils/numberNormalizer';
import { requestEvolutionAPI } from '../utils/evolutionAPI';
import { createAppError } from '../utils/errorHelpers';

/**
 * Processar webhook de movimentação de participantes
 * Evento: group-participants.update
 */
export const processGroupParticipantsUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { instanceName } = req.params;
    const eventData = req.body;

    // Validar estrutura do evento
    if (!eventData.event || eventData.event !== 'group-participants.update') {
      res.status(200).json({ status: 'ok', message: 'Evento não processado' });
      return;
    }

    const { data } = eventData;
    if (!data || !data.id || !data.participants || !Array.isArray(data.participants)) {
      res.status(200).json({ status: 'ok', message: 'Dados inválidos' });
      return;
    }

    const groupId = data.id;
    const authorJid = data.author || '';
    const authorPhone = extractPhoneFromJid(authorJid);
    const instance = await getInstance(instanceName);

    if (!instance) {
      res.status(200).json({ status: 'ok', message: 'Instância não encontrada' });
      return;
    }

    // Buscar informações do grupo (nome e descrição)
    let groupName: string | undefined;
    let groupDescription: string | undefined;

    try {
      const groupInfo = await requestEvolutionAPI(
        'GET',
        `/group/fetchGroupInfo/${encodeURIComponent(instanceName)}?groupJid=${encodeURIComponent(groupId)}`
      );
      groupName = groupInfo?.data?.subject;
      groupDescription = groupInfo?.data?.description;
    } catch (error) {
      console.warn('Erro ao buscar informações do grupo:', error);
    }

    // Processar cada participante
    for (const participant of data.participants) {
      const participantJid = participant.id || participant.jid;
      if (!participantJid) continue;

      const participantPhone = extractPhoneFromJid(participantJid);
      const normalizedPhone = normalizePhone(participantPhone) || participantPhone;
      const participantName = participant.phoneNumber?.pushName || participant.name || undefined;
      const action = participant.action; // 'add' ou 'remove'

      if (!action || (action !== 'add' && action !== 'remove')) {
        continue;
      }

      const movementType = action === 'add' ? 'entered' : 'left';
      const timestamp = data.date_time ? new Date(data.date_time) : new Date();

      // Registrar movimentação no banco
      try {
        await createMovement({
          user_id: instance.userId.toString(),
          instance_id: instance._id.toString(),
          group_id: groupId,
          group_name: groupName,
          contact_phone: normalizedPhone,
          contact_name: participantName,
          movement_type: movementType,
          author_phone: authorPhone || undefined,
          timestamp,
        });
      } catch (error) {
        console.error('Erro ao registrar movimentação:', error);
      }

      // Enviar mensagens automáticas
      if (action === 'add') {
        // Mensagem de boas-vindas
        sendWelcomeMessage(
          instanceName,
          groupId,
          participantJid,
          participantName,
          groupName,
          groupDescription
        ).catch((error) => {
          console.error('Erro ao enviar mensagem de boas-vindas:', error);
        });
      } else if (action === 'remove') {
        // Mensagem de despedida
        sendGoodbyeMessage(
          instanceName,
          groupId,
          participantJid,
          participantName,
          groupName,
          groupDescription
        ).catch((error) => {
          console.error('Erro ao enviar mensagem de despedida:', error);
        });
      }
    }

    res.status(200).json({ status: 'ok', message: 'Webhook processado' });
  } catch (error) {
    console.error('Erro ao processar webhook de movimentação:', error);
    // Sempre retornar 200 para evitar retentativas
    res.status(200).json({ status: 'ok', message: 'Erro processado' });
  }
};
